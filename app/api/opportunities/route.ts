import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { evaluateEligibility, type EligibilityRules } from "@/lib/eligibility";
import { z } from "zod";

const OPPORTUNITY_TYPES = [
  "scholarship", "internship", "research", "competition", "fellowship",
  "event", "volunteer", "certification", "mentorship",
] as const;

const FUNDING_TYPES = ["paid", "unpaid", "stipend", "scholarship_award", "reimbursed"] as const;

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "competitive"] as const;

const QuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  country_id: z.coerce.number().optional(),
  is_remote: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  funding_type: z.enum(FUNDING_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(24),
});

const EligibilityRulesSchema = z.object({
  min_grade: z.string().optional(),
  max_grade: z.string().optional(),
  min_age: z.number().optional(),
  max_age: z.number().optional(),
  citizenship: z.array(z.enum(["citizen", "permanent_resident", "visa_holder", "international"])).optional(),
  countries: z.array(z.number()).optional(),
  gpa_min: z.number().optional(),
  requires_financial_need: z.boolean().optional(),
});

function parseEligibilityRules(value: unknown): EligibilityRules {
  return EligibilityRulesSchema.parse(value);
}

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 });
  }
  const { q, type, country_id, is_remote, funding_type, difficulty, page, pageSize } = parsed.data;

  const supabase = await createServerSupabase();

  let query = supabase
    .from("opportunities")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("application_deadline", { ascending: true, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (q) query = query.ilike("title", `%${q}%`);
  if (type) query = query.eq("type", type);
  if (country_id) query = query.eq("country_id", country_id);
  if (is_remote !== undefined) query = query.eq("is_remote", is_remote);
  if (funding_type) query = query.eq("funding_type", funding_type);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data: opportunities, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Annotate with eligibility if a signed-in student is asking.
  // (Unchanged from before — eligibility still comes solely from
  // student_profiles, never from Opportunity Preferences below.)
  const { data: { user } } = await supabase.auth.getUser();
  let studentContext: any = null;
  if (user) {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    studentContext = profile;
  }

  const annotated = (opportunities ?? []).map((opp) => ({
    ...opp,
    eligibility: studentContext
      ? evaluateEligibility(parseEligibilityRules(opp.eligibility_rules), {
          grade: studentContext.grade ?? undefined,
          citizenshipStatus: studentContext.citizenship_status ?? undefined,
          countryId: studentContext.country_id ?? undefined,
        })
      : null,
  }));

  // ---------------------------------------------------------------------
  // Opportunity Preferences — additive prioritization only, layered on top
  // of the existing eligibility-based results above. Never filters out an
  // eligible opportunity; never substitutes for eligibility (a preferred
  // country an opp isn't eligible in still won't rank as "eligible"). If the
  // caller passed an explicit `country_id` filter, that filter already wins
  // (query above), so preference reordering is skipped to respect it.
  // ---------------------------------------------------------------------
  let prioritized = annotated;
  if (user && country_id === undefined) {
    const { data: prefRow }: { data: any } = await supabase
  .from("opportunity_preferences")
  .select("mode")
  .eq("user_id", user.id)
  .maybeSingle();

    if (prefRow && prefRow.mode !== "anywhere") {
      const { data: prefCountries }: { data: any[] | null } = await supabase
  .from("opportunity_preference_countries")
  .select("country_id")
  .eq("user_id", user.id);
      const preferredIds = new Set((prefCountries ?? []).map((r) => r.country_id));

      if (preferredIds.size > 0) {
        prioritized = [...annotated].sort((a, b) => {
          const aPreferred = a.country_id !== null && preferredIds.has(a.country_id);
          const bPreferred = b.country_id !== null && preferredIds.has(b.country_id);
          if (aPreferred === bPreferred) return 0; // preserve existing relative order (stable sort)
          return aPreferred ? -1 : 1;
        });
      }
    }
  }

  return NextResponse.json({
    data: prioritized,
    pagination: { page, pageSize, total: count ?? 0 },
  });
}
