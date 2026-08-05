/**
 * Discovery Agent
 * ----------------------------------------------------------------------
 * Run manually via `npm run agent:discover` whenever you want new
 * opportunities. Not scheduled by default — you're running this on-demand
 * to keep AI spend near $0. (A cron version exists at
 * app/api/cron/discover/route.ts if you want to automate the schedule
 * later — it's disabled unless you configure it.)
 *
 * What it does:
 *   1. For each seed query (STEM opportunity categories), search the web.
 *   2. For each promising result, fetch the page and ask Claude to extract
 *      a structured opportunity record (or null if it's not a real,
 *      currently-open opportunity).
 *   3. De-duplicate against existing rows (by application URL).
 *   4. Runs each candidate through an AUTOMATED verification check
 *      (see `verifyBeforePublish` below) — no human in the loop, but also
 *      not a raw, unchecked insert.
 *   5. Publishes automatically if verification passes; otherwise discards.
 *
 * Automated verification, not human review:
 *   This project intentionally auto-publishes with no manual approval step.
 *   The one safeguard kept in is fully automatic: before anything goes
 *   live, the agent (a) confirms the application URL actually resolves
 *   (not a dead link) and (b) requires the model's own extraction
 *   confidence to clear a floor. Anything that fails either check is
 *   silently discarded rather than published — this costs zero manual
 *   effort and just stops obviously broken data from reaching students.
 *   Raise/lower MIN_CONFIDENCE_TO_PUBLISH below if you want it stricter
 *   or looser.
 *
 * Extending this later: this file is intentionally the *only* place that
 * talks to the Anthropic API for discovery. When you outgrow a single
 * script, this becomes its own worker service with the same interface —
 * nothing else in the codebase needs to change.
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

// Cost note: Haiku is meaningfully cheaper than Sonnet/Opus per run, which
// matters since you're running this manually to control spend rather than
// on a schedule. Bump to a Sonnet-class model later if extraction quality
// on tricky pages isn't good enough — that's a one-line change.
const DISCOVERY_MODEL = "claude-haiku-4-5-20251001";
const MIN_CONFIDENCE_TO_PUBLISH = 0.55;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Seed queries — expand this list as you learn what sources are fruitful.
// v1 intentionally keeps this a short, curated list rather than fully open-
// ended crawling: broad+unscoped web search burns tokens fast and returns
// far more noise (blog posts, aggregator spam) than signal.
const SEED_QUERIES = [
  "high school STEM summer research program 2026 apply",
  "undergraduate engineering scholarship international students 2026",
  "STEM competition high school students 2026 deadline",
  "AI research internship high school students 2026",
  "NSF funded undergraduate research program 2026",
];

const ExtractedOpportunity = z.object({
  is_real_opportunity: z.boolean(),
  title: z.string().optional(),
  organization_name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum([
    "scholarship", "internship", "research", "competition",
    "fellowship", "event", "volunteer", "certification", "mentorship",
  ]).optional(),
  application_url: z.string().url().optional(),
  application_deadline: z.string().optional(), // ISO date or null
  is_remote: z.boolean().optional(),
  funding_type: z.enum(["paid", "unpaid", "stipend", "scholarship_award", "reimbursed"]).optional(),
  eligibility_summary: z.string().optional(),
  eligibility_rules: z
    .object({
      min_grade: z.string().optional(),
      max_grade: z.string().optional(),
      min_age: z.number().optional(),
      max_age: z.number().optional(),
      citizenship: z.array(z.string()).optional(),
      gpa_min: z.number().optional(),
    })
    .optional(),
  confidence: z.number().min(0).max(1),
  rejection_reason: z.string().optional(), // populated when is_real_opportunity is false
});

const EXTRACTION_SYSTEM_PROMPT = `You are the extraction stage of NovaSTEM's opportunity discovery pipeline.
Given the text content of a web page, determine whether it describes a real,
currently open STEM opportunity for students (scholarship, internship,
research program, competition, fellowship, event, volunteer role, or
certification).

Be conservative: if the page is a listicle/aggregator with no single clear
opportunity, an expired program with no current cycle, or a page you cannot
confidently extract structured facts from, set is_real_opportunity to false
and explain why in rejection_reason. It is far better to skip an ambiguous
page than to hallucinate a deadline or URL — a wrong deadline actively harms
a student.

Only extract facts that are explicitly present in the page text. Never
invent an application URL — use the page's own canonical apply link if
present, otherwise omit it and lower your confidence score.

Respond only with JSON matching the provided schema. No prose, no markdown fences.`;

interface DiscoveryResult {
  published: number;
  skippedDuplicate: number;
  rejectedByModel: number;
  rejectedByVerification: number;
  errors: number;
}

/**
 * The only safety net between "Claude said this is a scholarship" and it
 * being live on the site. No human sees this — it's a plain function.
 *   1. Confidence floor: refuses to publish anything the model itself
 *      wasn't fairly sure about.
 *   2. Live link check: actually requests the application URL and confirms
 *      it resolves (2xx/3xx), so a dead or typo'd link never goes public.
 */
async function verifyBeforePublish(
  item: z.infer<typeof ExtractedOpportunity>
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (item.confidence < MIN_CONFIDENCE_TO_PUBLISH) {
    return { ok: false, reason: `confidence ${item.confidence} below floor ${MIN_CONFIDENCE_TO_PUBLISH}` };
  }
  if (!item.application_url) {
    return { ok: false, reason: "no application_url" };
  }

  try {
    const res = await fetch(item.application_url, { method: "GET", redirect: "follow" });
    if (!res.ok) {
      return { ok: false, reason: `link returned HTTP ${res.status}` };
    }
  } catch (err) {
    return { ok: false, reason: `link unreachable: ${(err as Error).message}` };
  }

  return { ok: true };
}

async function searchAndExtract(query: string): Promise<Array<z.infer<typeof ExtractedOpportunity> & { source_url: string }>> {
  // Uses Claude's native web_search tool so the agent can browse broadly
  // rather than being limited to a fixed source list.
  const searchResponse = await anthropic.messages.create({
    model: DISCOVERY_MODEL,
    max_tokens: 2048,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [
      {
        role: "user",
        content: `Search for: "${query}". Return the 5 most relevant, currently-active program pages (official program pages, not aggregator/listicle articles). For each, give the URL and a 2-3 sentence summary of what you found.`,
      },
    ],
  });

  const urls = extractUrlsFromSearchResponse(searchResponse);
  const results: Array<z.infer<typeof ExtractedOpportunity> & { source_url: string }> = [];

  for (const url of urls) {
    try {
      const pageResponse = await anthropic.messages.create({
        model: DISCOVERY_MODEL,
        max_tokens: 1024,
        system: EXTRACTION_SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          { role: "user", content: `Extract the opportunity data from this page: ${url}` },
        ],
      });

      const textBlock = pageResponse.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") continue;

      const parsed = ExtractedOpportunity.safeParse(JSON.parse(textBlock.text));
      if (parsed.success) {
        results.push({ ...parsed.data, source_url: url });
      }
    } catch (err) {
      console.error(`[discovery-agent] extraction failed for ${url}:`, err);
    }
  }

  return results;
}

function extractUrlsFromSearchResponse(response: Anthropic.Messages.Message): string[] {
  const urls = new Set<string>();
  for (const block of response.content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const item of block.content) {
        if ("url" in item && typeof item.url === "string") urls.add(item.url);
      }
    }
  }
  return Array.from(urls).slice(0, 5);
}

export async function run(): Promise<DiscoveryResult> {
  const supabase = createServiceRoleClient();
  const result: DiscoveryResult = {
    published: 0,
    skippedDuplicate: 0,
    rejectedByModel: 0,
    rejectedByVerification: 0,
    errors: 0,
  };

  for (const query of SEED_QUERIES) {
    const extracted = await searchAndExtract(query);

    for (const item of extracted) {
      if (!item.is_real_opportunity || !item.title || !item.application_url) {
        result.rejectedByModel++;
        continue;
      }

      // De-dupe: same application URL already in the database.
      const { data: existing } = await supabase
        .from("opportunities")
        .select("id")
        .eq("application_url", item.application_url)
        .maybeSingle();

      if (existing) {
        result.skippedDuplicate++;
        continue;
      }

      const verification = await verifyBeforePublish(item);
      if (!verification.ok) {
        console.log(`[discovery-agent] discarded "${item.title}": ${verification.reason}`);
        result.rejectedByVerification++;
        continue;
      }

      // No human review step — this goes straight to `published`.
      // It only reaches this line after clearing the automated checks above.
      const { error } = await supabase.from("opportunities").insert({
        title: item.title,
        description: item.description ?? "",
        type: item.type ?? "internship",
        application_url: item.application_url,
        application_deadline: item.application_deadline ?? null,
        is_remote: item.is_remote ?? false,
        funding_type: item.funding_type ?? null,
        eligibility_rules: item.eligibility_rules ?? {},
        source: "ai_discovery",
        source_url: item.source_url,
        review_status: "approved", // approved by automated verification, not a human
        status: "published",
        extraction_confidence: item.confidence,
      });

      if (error) {
        console.error("[discovery-agent] insert failed:", error);
        result.errors++;
      } else {
        result.published++;
      }
    }
  }

  return result;
}

// Allow direct execution: `pnpm agent:discover`
if (require.main === module) {
  run().then((result) => {
    console.log("[discovery-agent] run complete:", result);
    process.exit(0);
  });
}
