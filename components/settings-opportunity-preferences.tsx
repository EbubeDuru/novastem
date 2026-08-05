"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  OpportunityPreferencesForm,
  type OpportunityPreferencesValue,
} from "./opportunity-preferences-form";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Country {
  id: number;
  name: string;
}

/**
 * Settings-page version of the same preference editor used in onboarding.
 * Saves immediately on its own — this never reads or writes student_profiles,
 * so editing it here cannot affect citizenship/residency/education/age or
 * any other personal profile field.
 */
export function SettingsOpportunityPreferences({
  userId,
  countries,
  initialValue,
}: {
  userId: string;
  countries: Country[];
  initialValue: OpportunityPreferencesValue;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave() {
    setSaveState("saving");
    setErrorMsg("");
    const supabase = createClient();

    const { error: prefError } = await supabase.from("opportunity_preferences").upsert(
      { user_id: userId, mode: value.mode },
      { onConflict: "user_id" }
    );
    if (prefError) {
      setSaveState("error");
      setErrorMsg(prefError.message);
      return;
    }

    await supabase.from("opportunity_preference_countries").delete().eq("user_id", userId);
    if (value.mode !== "anywhere" && value.countryIds.length > 0) {
      const { error: countriesError } = await supabase.from("opportunity_preference_countries").insert(
        value.countryIds.map((countryId) => ({ user_id: userId, country_id: countryId }))
      );
      if (countriesError) {
        setSaveState("error");
        setErrorMsg(countriesError.message);
        return;
      }
    }

    setSaveState("saved");
    // Recommendations on /discover are refreshed on next load — router.refresh()
    // re-runs the server component so the change reflects immediately without
    // touching any other part of the profile/eligibility system.
    router.refresh();
    setTimeout(() => setSaveState("idle"), 2000);
  }

  return (
    <div className="glass rounded-2xl p-6">
      <OpportunityPreferencesForm countries={countries} value={value} onChange={setValue} />

      {saveState === "error" && <p className="mt-4 text-sm text-ineligible">{errorMsg}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saveState === "saving"}
        className="mt-5 flex items-center gap-2 rounded-xl bg-nova-500/90 px-5 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-nova-400 disabled:opacity-70"
      >
        {saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
        {saveState === "saved" && <CheckCircle2 className="h-4 w-4" />}
        {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save Preferences"}
      </button>
    </div>
  );
}
