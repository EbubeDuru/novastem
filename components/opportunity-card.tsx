import { clsx } from "clsx";
import { Bookmark, ExternalLink, ShieldCheck } from "lucide-react";
import { MatchBadge } from "./match-badge";
import type { EligibilityVerdict } from "@/lib/eligibility";

export interface OpportunityCardData {
  id: string;
  title: string;
  organizationName: string;
  location: string; // "Remote" | "Ontario, Canada" | "Global"
  category: string;
  deadline: string | null;
  difficulty: string | null;
  fundingLabel: string | null; // "$5,000" | "Unpaid" | "Stipend"
  isVerified: boolean;
  matchScore: number | null;
  eligibilityVerdict: EligibilityVerdict | null;
}

const eligibilityStyles: Record<EligibilityVerdict, { label: string; dot: string; text: string }> = {
  eligible: { label: "Eligible", dot: "bg-eligible", text: "text-eligible" },
  almost_eligible: { label: "Almost eligible", dot: "bg-almost", text: "text-almost" },
  not_eligible: { label: "Not eligible", dot: "bg-ineligible", text: "text-ineligible" },
};

export function OpportunityCard({ opportunity }: { opportunity: OpportunityCardData }) {
  const eligibility = opportunity.eligibilityVerdict ? eligibilityStyles[opportunity.eligibilityVerdict] : null;

  return (
    <article className="glass glass-hover animate-fade-up group flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
            {opportunity.category}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-50 font-display">
            {opportunity.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
            {opportunity.organizationName}
            {opportunity.isVerified && (
              <ShieldCheck className="h-3.5 w-3.5 text-aurora-400" aria-label="Verified organization" />
            )}
          </p>
        </div>
        {opportunity.matchScore !== null && <MatchBadge score={opportunity.matchScore} />}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-400">
        <span>{opportunity.location}</span>
        {opportunity.deadline && (
          <span>
            Deadline <span className="text-slate-300">{opportunity.deadline}</span>
          </span>
        )}
        {opportunity.fundingLabel && <span>{opportunity.fundingLabel}</span>}
        {opportunity.difficulty && <span className="capitalize">{opportunity.difficulty}</span>}
      </div>

      {eligibility && (
        <div className={clsx("flex items-center gap-1.5 text-xs font-medium", eligibility.text)}>
          <span className={clsx("h-1.5 w-1.5 rounded-full", eligibility.dot)} />
          {eligibility.label}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        <button
          type="button"
          className="flex-1 rounded-xl bg-nova-500/90 px-4 py-2 text-sm font-semibold text-void-950 transition hover:bg-nova-400"
        >
          View
        </button>
        <button
          type="button"
          aria-label="Save opportunity"
          className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5"
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <a
          href={`/opportunities/${opportunity.id}/apply`}
          className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5"
          aria-label="Open application link"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
