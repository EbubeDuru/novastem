import { createServerSupabase } from "@/lib/supabase/server";
import { AuthGate } from "@/components/auth-gate";
import { ProfileForm, type ExistingProfile } from "@/components/profile-form";
import type { OpportunityPreferencesValue } from "@/components/opportunity-preferences-form";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <AuthGate />;
  }

  const { data: countries } = await supabase.from("countries").select("id, name").order("name");

  const { data: profileRow }: { data: any } = await supabase
  .from("student_profiles")
  .select("*, schools(name)")
  .eq("user_id", user.id)
  .maybeSingle();

  const { data: skillRows }: { data: any[] | null } = await supabase
  .from("student_skills")
  .select("skill_id, proficiency, skills(name)")
  .eq("user_id", user.id);

  // Opportunity Preferences — fetched from its own table. Deliberately
  // separate from the profile/skills queries above.
  const { data: prefRow }: { data: any } = await supabase
  .from("opportunity_preferences")
  .select("mode")
  .eq("user_id", user.id)
  .maybeSingle();

  const { data: prefCountryRows }: { data: any[] | null } = await supabase
  .from("opportunity_preference_countries")
  .select("country_id")
  .eq("user_id", user.id);

  const existingPreferences: OpportunityPreferencesValue | undefined = prefRow
    ? {
        mode: prefRow.mode,
        countryIds: (prefCountryRows ?? []).map((r) => r.country_id),
      }
    : undefined;

  const existingProfile: ExistingProfile | null = profileRow
    ? {
        school_id: profileRow.school_id,
        school_name: (profileRow.schools as { name: string } | null)?.name ?? null,
        country_id: profileRow.country_id,
        province_id: profileRow.province_id,
        grade: profileRow.grade,
        date_of_birth: profileRow.date_of_birth,
        citizenship_status: profileRow.citizenship_status,
        residency_country_id: profileRow.residency_country_id,
        career_goals: profileRow.career_goals,
        interests: profileRow.interests,
        languages: profileRow.languages,
        bio: profileRow.bio,
        skills: (skillRows ?? []).map((r) => ({
          id: r.skill_id,
          name: (r.skills as unknown as { name: string })?.name ?? "",
          proficiency: r.proficiency ?? 3,
        })),
      }
    : null;

  return (
    <ProfileForm
      userId={user.id}
      countries={countries ?? []}
      existingProfile={existingProfile}
      existingPreferences={existingPreferences}
    />
  );
}
