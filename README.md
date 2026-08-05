# NovaSTEM

An AI-populated, eligibility-aware discovery platform for STEM opportunities: scholarships, internships, research, competitions, fellowships, events, volunteering, certifications, and mentorship.

## Stack

- **Next.js 15** (App Router) + TypeScript — frontend + API routes, single deployable
- **Supabase** — Postgres, Auth, Storage, RLS
- **Tailwind CSS** + **shadcn/ui** — styling
- **Anthropic API** (Claude, with the `web_search` tool) — the Discovery Agent
- **Vercel** — hosting + cron

See the bottom of this file for why this stack and not microservices/Elasticsearch/a separate Python service — short version: right architecture for a solo founder validating demand in weeks, with clean seams to grow out of it later.

## Getting started (zero prior Supabase/Vercel experience assumed)

This all uses free tiers except the Anthropic API, which has no permanent
free tier — new accounts get a one-time ~$5 trial credit, then it's
pay-as-you-go. Since you're running the discovery agent manually rather than
on a schedule, expect this to stay very cheap (a run typically costs cents,
not dollars, on Haiku).

**1. Get the code running locally**
```bash
npm install
cp .env.example .env.local
```

**2. Create your free Supabase project**
- Go to [supabase.com](https://supabase.com) → Sign up (free) → "New project"
- Name it anything (e.g. `novastem`), pick a database password (save it somewhere), pick the region closest to you
- Wait ~2 minutes for it to provision
- In the left sidebar: **Project Settings → API** — copy the "Project URL" and the "anon public" key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Same page → copy the "service_role" key into `SUPABASE_SERVICE_ROLE_KEY` (this one is secret — never put it in frontend code or commit it)

**3. Create the database tables**
- In Supabase: left sidebar → **SQL Editor → New query**
- Open `supabase/migrations/0001_init.sql` from this repo, copy the whole file, paste it in, click **Run**
- That's it — all 14 tables, indexes, and security rules now exist

**4. Get an Anthropic API key**
- Go to [console.anthropic.com](https://console.anthropic.com) → sign up → **API Keys → Create Key**
- Paste it into `.env.local` as `ANTHROPIC_API_KEY`

**5. Run it locally**
```bash
npm run dev
```
→ open http://localhost:3000 — it'll be empty until you run the discovery agent (next step).

**6. Deploy for free**
- Push this code to a GitHub repo
- Go to [vercel.com](https://vercel.com) → sign up (free) → **Add New Project** → import your GitHub repo
- Paste in the same environment variables from `.env.local` under the project's Settings → Environment Variables
- Click Deploy — you'll get a live URL

## Running the Discovery Agent

```bash
npm run agent:discover
```

This searches the web for STEM opportunities, extracts structured data via Claude, and **publishes automatically** — no manual approval step. The only thing standing between the model's output and your live site is fully automated: each candidate has to (a) clear a confidence floor and (b) have a working application link that Claude actually checks by requesting it, or it's silently discarded rather than published. See the comment block at the top of `agents/discovery-agent.ts` for the exact logic and how to tune it.

Run this manually whenever you want fresh opportunities — it is **not** scheduled by default, so you control exactly when you're spending API credits. If you later want it automatic on a timer, `app/api/cron/discover/route.ts` is ready to go — just add a `crons` entry to `vercel.json` and set a `CRON_SECRET` env var, and it'll run on schedule instead of manually.

## Architecture notes

- **Eligibility is data, not code.** `opportunities.eligibility_rules` is a structured JSONB column; `lib/eligibility.ts` evaluates it. A future AI eligibility agent reads/writes the exact same shape — no migration needed when you upgrade from rule-based to AI-assisted eligibility parsing.
- **Every AI-written row carries provenance**, even with auto-publish on. `source`, `source_url`, `extraction_confidence` — you can always trace where a listing came from and how confident the model was, and `review_status = 'approved'` means "cleared the automated checks," not "a human looked at this." If you ever add a real admin queue, that distinction is already in the schema.
- **Auto-publish has one automated gate, not zero.** `verifyBeforePublish()` in `agents/discovery-agent.ts` requires a confidence floor and a live link check before anything goes public — this is the tradeoff for running with no human review: it costs nothing and stops the most obviously broken results (dead links, low-confidence guesses), though it can't catch everything a human would (e.g. subtly wrong details on an otherwise real, working page). Worth revisiting once you have real users relying on the data.
- **RLS does the access control**, not application code — students can only touch their own rows, organizations can only touch opportunities they own, and admin/agent operations go through the service-role client (`lib/supabase/server.ts`), never through the browser client.
- **The discovery agent is intentionally isolated** in `agents/` with a single `run()` export. When you outgrow a cron-triggered script, this becomes its own worker service (e.g., on Railway/Fly with a real queue) without touching the rest of the app.

## What's scaffolded vs. what's next

**Built:**
- Full DB schema (14 tables) with RLS
- Eligibility evaluation engine (rule-based, explainable)
- Discovery Agent (web search → extraction → dedupe → review queue)
- Opportunities API with filtering + eligibility annotation
- Discover page + Opportunity Card UI

**Not yet built (recommended order):**
1. **Auth flows** — signup/login/email verification pages using Supabase Auth UI or custom forms
2. **Student profile onboarding** — the form that populates `student_profiles`, which the eligibility engine and future recommendation engine both depend on
3. **Admin review queue** — approve/reject AI-discovered opportunities; without this, the discovery agent produces data nobody can publish
4. **Filters bar** on Discover (type, location, funding, deadline, difficulty) — schema and API already support all of these
5. **Recommendation Agent v1** — rule-based scoring using `student_profiles` × `opportunities`, writing to the `recommendations` table (schema is ready)
6. **Organization dashboard** — post/manage opportunities, view applicants
7. **Deadline Agent** — weekly cron marking expired opportunities, checking link health (writes to `verification_log`)

## Opportunity Preferences (onboarding enhancement)

A new onboarding step — "Where would you like to discover opportunities?" — lets a student choose **Anywhere**, a **Specific Country**, or **Multiple Countries** to focus recommendations on. This is layered on top of everything above, not merged into it:

- **Storage is fully separate** from `student_profiles`: see `opportunity_preferences` + `opportunity_preference_countries` in `supabase/migrations/0004_opportunity_preferences.sql`. Citizenship, residency, education level, age, and every other eligibility field are untouched by this feature — they still live only in `student_profiles`, and the eligibility engine (`lib/eligibility.ts`) still reads only from there.
- **Combining eligibility + preference**: `app/api/opportunities/route.ts` computes eligibility exactly as before, then applies an additive re-sort that prioritizes (never filters out) opportunities in a student's preferred countries. An opportunity a student isn't eligible for doesn't become eligible just because it's in a preferred country — preference affects ranking, not eligibility.
- **UI**: `components/opportunity-preferences-form.tsx` is the shared editor, used both as the new onboarding step in `components/profile-form.tsx` (step 5, appended after the existing steps — nothing before it changed) and standalone on `/settings` (`app/settings/page.tsx` + `components/settings-opportunity-preferences.tsx`) for editing anytime without re-running onboarding.
- **Known caveat**: the Discover page's server fetch uses a 60-second Next.js data cache (`next: { revalidate: 60 }` in `app/discover/page.tsx`, unchanged from before this feature). A preference change made in Settings calls `router.refresh()` to reflect immediately for that user's session, but the underlying cached fetch is not yet scoped per-user — worth revisiting (e.g. `cache: 'no-store'` for signed-in requests) once this is under real load, since it was an existing tradeoff, not something introduced by this feature.

## Why this stack (not the "obvious" scaled-up version)

The original brief calls for 6 independent AI agents, a full admin analytics suite, community/mentorship features, and career pathway roadmaps — all correct *destinations*, wrong *starting point* for one person shipping in weeks. Two decisions worth flagging explicitly:

- **One agent, not six, in v1.** Verification, deadline-monitoring, and pathway agents are valuable but each is a maintenance surface. Discovery is the one that's existentially necessary (no opportunities = no product) — the rest can be simple cron jobs or manual admin actions until the product has users worth automating for.
- **Monolith, not microservices.** A single Next.js app deployed to Vercel means zero DevOps for a solo founder. The codebase is structured (agents/ isolated, service-role vs. anon Supabase clients separated) so you can extract services later without a rewrite — but you don't pay that complexity tax on day one.
