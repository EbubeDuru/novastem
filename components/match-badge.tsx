import { clsx } from "clsx";

/**
 * Renders match quality as "luminosity" — the core signature element of the
 * design (opportunities are stars; a stronger match glows brighter/warmer).
 * Deliberately not a generic progress bar: the glow intensity itself is the
 * information, matching how the rest of the app treats discovery as
 * navigating a night sky.
 */
export function MatchBadge({ score }: { score: number }) {
  const tier = score >= 85 ? "high" : score >= 60 ? "medium" : "low";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tier === "high" && "bg-nova-500/15 text-nova-400 shadow-glow",
        tier === "medium" && "bg-aurora-500/15 text-aurora-400",
        tier === "low" && "bg-white/[0.06] text-slate-400"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          tier === "high" && "bg-nova-400 animate-twinkle",
          tier === "medium" && "bg-aurora-400",
          tier === "low" && "bg-slate-500"
        )}
      />
      {score}% match
    </div>
  );
}
