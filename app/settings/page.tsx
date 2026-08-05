import { createServerSupabase } from "@/lib/supabase/server";
import { AuthGate } from "@/components/auth-gate";
import { SettingsOpportunityPreferences } from "@/components/settings-opportunity-preferences";
import type { OpportunityPreferencesValue } from "@/components/opportunity-preferences-form";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <AuthGate />;
  }

  const { data: countries } = await supabase.from("countries").select("id, name").order("name");

  const { data: prefRow } = await supabase
    .from("opportunity_preferences")
    .select("mode")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: prefCountryRows } = await supabase
    .from("opportunity_preference_countries")
    .select("country_id")
    .eq("user_id", user.id);

  const initialValue: OpportunityPreferencesValue = {
    mode: prefRow?.mode ?? "anywhere",
    countryIds: (prefCountryRows ?? []).map((r) => r.country_id),
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-nova-500">Settings</p>
        <h1 className="mt-2 text-3xl font-display font-semibold text-slate-50">
          Opportunity Preferences
        </h1>
        <p className="mt-2 text-slate-400">
          Change where you'd like recommendations drawn from. This never affects your citizenship,
          residency, or other eligibility details in your profile.
        </p>
      </header>

      <SettingsOpportunityPreferences
        userId={user.id}
        countries={countries ?? []}
        initialValue={initialValue}
      />
    </main>
  );
}
