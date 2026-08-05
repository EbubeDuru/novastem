"use client";

import { useMemo, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { clsx } from "clsx";

export type RegionMode = "anywhere" | "single" | "multiple";

export interface OpportunityPreferencesValue {
  mode: RegionMode;
  countryIds: number[];
}

interface Country {
  id: number;
  name: string;
}

const MODE_OPTIONS: Array<{ value: RegionMode; emoji: string; title: string; description: string }> = [
  {
    value: "anywhere",
    emoji: "🌍",
    title: "Anywhere (Recommended)",
    description: "Show the best opportunities worldwide.",
  },
  {
    value: "single",
    emoji: "🌎",
    title: "Specific Country",
    description: "Focus recommendations on one country.",
  },
  {
    value: "multiple",
    emoji: "🌐",
    title: "Multiple Countries",
    description: "Focus recommendations on a shortlist of countries.",
  },
];

/**
 * This component only ever reads/writes opportunity_preferences +
 * opportunity_preference_countries. It never touches student_profiles —
 * eligibility fields (citizenship, residency, education level, age) are
 * out of scope here by design. See migration 0004 for the rationale.
 */
export function OpportunityPreferencesForm({
  countries,
  value,
  onChange,
}: {
  countries: Country[];
  value: OpportunityPreferencesValue;
  onChange: (value: OpportunityPreferencesValue) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.trim().toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, search]);

  function selectMode(mode: RegionMode) {
    // Switching mode resets the country list rather than carrying stale
    // selections across an "anywhere" <-> "single" <-> "multiple" toggle.
    if (mode === "anywhere") {
      onChange({ mode, countryIds: [] });
    } else if (mode === "single") {
      onChange({ mode, countryIds: value.countryIds.slice(0, 1) });
    } else {
      onChange({ mode, countryIds: value.countryIds });
    }
  }

  function toggleCountry(id: number) {
    if (value.mode === "single") {
      onChange({ ...value, countryIds: [id] });
      return;
    }
    const isSelected = value.countryIds.includes(id);
    onChange({
      ...value,
      countryIds: isSelected ? value.countryIds.filter((c) => c !== id) : [...value.countryIds, id],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-50 font-display">
          Where would you like to discover opportunities?
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          We'll personalize your recommendations based on your selection. You can change this anytime in Settings.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => selectMode(opt.value)}
            className={clsx(
              "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition",
              value.mode === opt.value
                ? "border-nova-500/50 bg-nova-500/10"
                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <span className="text-xl leading-none">{opt.emoji}</span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                {opt.title}
                {value.mode === opt.value && <Check className="h-4 w-4 text-nova-400" />}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">{opt.description}</span>
            </span>
          </button>
        ))}
      </div>

      {(value.mode === "single" || value.mode === "multiple") && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-nova-500/50 focus:outline-none"
            />
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto">
            {filteredCountries.map((country) => {
              const selected = value.countryIds.includes(country.id);
              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => toggleCountry(country.id)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                    selected ? "bg-aurora-500/10 text-aurora-400" : "text-slate-300 hover:bg-white/5"
                  )}
                >
                  {country.name}
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
            {filteredCountries.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">No countries match "{search}".</p>
            )}
          </div>

          {value.mode === "multiple" && value.countryIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {value.countryIds.map((id) => {
                const country = countries.find((c) => c.id === id);
                if (!country) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-aurora-500/15 px-2.5 py-1 text-xs font-medium text-aurora-400"
                  >
                    <Globe className="h-3 w-3" /> {country.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
