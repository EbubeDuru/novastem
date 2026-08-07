import { OpportunityCard, type OpportunityCardData } from "@/components/opportunity-card";
import type { Tables } from "@/types/database";
import type { EligibilityCheck } from "@/lib/eligibility";
import { headers } from "next/headers";

async function getOpportunities(): Promise<Array<Tables<"opportunities"> & { eligibility: EligibilityCheck }>> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${protocol}://${host}` : null);

  if (!appUrl) return [];

  // Forward the session cookie so the route can calculate eligibility and
  // apply the signed-in student's opportunity preferences. This response is
  // user-specific, so it must never be shared through ISR.
  const cookie = requestHeaders.get("cookie");
  const res = await fetch(new URL("/api/opportunities", appUrl), {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return [];
  const { data } = await res.json();
  return data;
}

export default async function DiscoverPage() {
  const opportunities = await getOpportunities();

  const cards: OpportunityCardData[] = opportunities.map((opp) => ({
    id: opp.id,
    title: opp.title,
    organizationName: "Organization", // TODO: join organization_profiles.org_name
    location: opp.is_remote ? "Remote" : "Location TBD",
    category: opp.type,
    deadline: opp.application_deadline,
    difficulty: opp.difficulty,
    fundingLabel: opp.funding_type,
    isVerified: opp.review_status === "approved",
    matchScore: null, // TODO: join recommendations table for signed-in users
    eligibilityVerdict: opp.eligibility?.verdict ?? null,
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-nova-500">Discover</p>
        <h1 className="mt-2 text-4xl font-display font-semibold text-slate-50">
          Your map of the sky
        </h1>
        <p className="mt-2 max-w-xl text-slate-400">
          {cards.length} opportunities, verified and matched to you.
        </p>
      </header>

      {/* TODO: <FiltersBar /> — search, type, location, funding, deadline, difficulty */}

      {cards.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-slate-400">
          No opportunities published yet. Run the discovery agent or add one from the admin dashboard.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <OpportunityCard key={card.id} opportunity={card} />
          ))}
        </div>
      )}
    </main>
  );
}
