"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TagInput } from "./tag-input";
import { SchoolPicker, type SchoolOption } from "./school-picker";
import { SkillsPicker, type SelectedSkill } from "./skills-picker";
import {
  OpportunityPreferencesForm,
  type OpportunityPreferencesValue,
} from "./opportunity-preferences-form";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

const GRADE_OPTIONS = [
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
  { value: "freshman", label: "College Freshman" },
  { value: "sophomore", label: "College Sophomore" },
  { value: "junior", label: "College Junior" },
  { value: "senior", label: "College Senior" },
  { value: "graduate", label: "Graduate Student" },
];

const CITIZENSHIP_OPTIONS = [
  { value: "citizen", label: "Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_holder", label: "Visa Holder" },
  { value: "international", label: "International Student" },
];

interface Country {
  id: number;
  name: string;
}

interface Province {
  id: number;
  name: string;
}

export interface ExistingProfile {
  school_id: string | null;
  school_name: string | null;
  country_id: number | null;
  province_id: number | null;
  grade: string | null;
  date_of_birth: string | null;
  citizenship_status: string | null;
  residency_country_id: number | null;
  career_goals: string[] | null;
  interests: string[] | null;
  languages: string[] | null;
  bio: string | null;
  skills: SelectedSkill[];
}

// Opportunity Preferences is intentionally NOT part of ExistingProfile —
// it lives in its own table (opportunity_preferences), separate from
// eligibility/profile data, and is passed in as its own prop below.
const DEFAULT_PREFERENCES: OpportunityPreferencesValue = { mode: "anywhere", countryIds: [] };

const STEPS = ["Basics", "Eligibility", "Goals & Skills", "Bio & Review", "Opportunity Preferences"] as const;

export function ProfileForm({
  userId,
  countries,
  existingProfile,
  existingPreferences,
}: {
  userId: string;
  countries: Country[];
  existingProfile: ExistingProfile | null;
  existingPreferences?: OpportunityPreferencesValue;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [school, setSchool] = useState<SchoolOption | null>(
    existingProfile?.school_id
      ? { id: existingProfile.school_id, name: existingProfile.school_name ?? "" }
      : null
  );
  const [countryId, setCountryId] = useState<number | null>(existingProfile?.country_id ?? null);
  const [provinceId, setProvinceId] = useState<number | null>(existingProfile?.province_id ?? null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [grade, setGrade] = useState(existingProfile?.grade ?? "");
  const [dob, setDob] = useState(existingProfile?.date_of_birth ?? "");
  const [citizenshipStatus, setCitizenshipStatus] = useState(existingProfile?.citizenship_status ?? "");
  const [residencyCountryId, setResidencyCountryId] = useState<number | null>(
    existingProfile?.residency_country_id ?? null
  );
  const [careerGoals, setCareerGoals] = useState<string[]>(existingProfile?.career_goals ?? []);
  const [interests, setInterests] = useState<string[]>(existingProfile?.interests ?? []);
  const [languages, setLanguages] = useState<string[]>(existingProfile?.languages ?? []);
  const [skills, setSkills] = useState<SelectedSkill[]>(existingProfile?.skills ?? []);
  const [bio, setBio] = useState(existingProfile?.bio ?? "");

  // Separate state tree from the profile/eligibility fields above — this is
  // a search preference, not eligibility data, and is saved to its own table.
  const [preferences, setPreferences] = useState<OpportunityPreferencesValue>(
    existingPreferences ?? DEFAULT_PREFERENCES
  );

  async function handleCountryChange(id: number | null) {
    setCountryId(id);
    setProvinceId(null);
    if (!id) {
      setProvinces([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.from("provinces").select("id, name").eq("country_id", id).order("name");
    setProvinces(data ?? []);
  }

  const canProceed = (() => {
    if (step === 0) return school !== null && countryId !== null && grade !== "";
    return true;
  })();

  async function handleSubmit() {
    setSaveState("saving");
    setErrorMsg("");
    const supabase = createClient();

    const { error: profileError } = await supabase.from("student_profiles").upsert(
      {
        user_id: userId,
        school_id: school?.id ?? null,
        country_id: countryId,
        province_id: provinceId,
        grade,
        date_of_birth: dob || null,
        citizenship_status: citizenshipStatus || null,
        residency_country_id: residencyCountryId ?? countryId,
        career_goals: careerGoals,
        interests,
        languages,
        bio: bio || null,
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      setSaveState("error");
      setErrorMsg(profileError.message);
      return;
    }

    // Replace skill set: simplest correct approach for a form save (not a
    // high-frequency operation, so delete+reinsert is fine over a diff).
    await supabase.from("student_skills").delete().eq("user_id", userId);
    if (skills.length > 0) {
      const { error: skillsError } = await supabase.from("student_skills").insert(
        skills.map((s) => ({ user_id: userId, skill_id: s.id, proficiency: s.proficiency }))
      );
      if (skillsError) {
        setSaveState("error");
        setErrorMsg(skillsError.message);
        return;
      }
    }

    // Opportunity Preferences — separate table, separate write. This never
    // touches student_profiles or student_skills above; it can fail
    // independently without affecting the profile save that already succeeded.
    const { error: prefError } = await supabase.from("opportunity_preferences").upsert(
      { user_id: userId, mode: preferences.mode },
      { onConflict: "user_id" }
    );
    if (prefError) {
      setSaveState("error");
      setErrorMsg(prefError.message);
      return;
    }

    await supabase.from("opportunity_preference_countries").delete().eq("user_id", userId);
    if (preferences.mode !== "anywhere" && preferences.countryIds.length > 0) {
      const { error: prefCountriesError } = await supabase.from("opportunity_preference_countries").insert(
        preferences.countryIds.map((countryId) => ({ user_id: userId, country_id: countryId }))
      );
      if (prefCountriesError) {
        setSaveState("error");
        setErrorMsg(prefCountriesError.message);
        return;
      }
    }

    setSaveState("saved");
    setTimeout(() => router.push("/discover"), 1200);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-nova-500">Your Profile</p>
        <h1 className="mt-2 text-3xl font-display font-semibold text-slate-50">
          Tell us who you are
        </h1>
        <p className="mt-2 text-slate-400">
          This powers your eligibility checks and match %. Nothing here is shared publicly.
        </p>
      </header>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition",
                i < step && "bg-eligible text-void-950",
                i === step && "bg-nova-500 text-void-950 shadow-glow",
                i > step && "bg-white/10 text-slate-500"
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx("h-px flex-1", i < step ? "bg-eligible/50" : "bg-white/10")} />
            )}
          </div>
        ))}
      </div>
      <p className="mb-6 text-sm font-medium text-slate-400">{STEPS[step]}</p>

      <div className="glass rounded-2xl p-6">
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <SchoolPicker value={school} onChange={setSchool} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Country</label>
                <select
                  value={countryId ?? ""}
                  onChange={(e) => handleCountryChange(e.target.value ? Number(e.target.value) : null)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-nova-500/50 focus:outline-none"
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Province / State</label>
                <select
                  value={provinceId ?? ""}
                  onChange={(e) => setProvinceId(e.target.value ? Number(e.target.value) : null)}
                  disabled={provinces.length === 0}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-nova-500/50 focus:outline-none disabled:opacity-40"
                >
                  <option value="">{provinces.length === 0 ? "N/A" : "Select"}</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Grade Level</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-nova-500/50 focus:outline-none"
              >
                <option value="">Select grade level</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-slate-400">
              This determines which opportunities you're eligible for — many scholarships and
              programs restrict by citizenship, residency, or age. We never share this publicly.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-300">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-nova-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Citizenship / Residency Status</label>
              <select
                value={citizenshipStatus}
                onChange={(e) => setCitizenshipStatus(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-nova-500/50 focus:outline-none"
              >
                <option value="">Select status</option>
                {CITIZENSHIP_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Country of Residency</label>
              <select
                value={residencyCountryId ?? ""}
                onChange={(e) => setResidencyCountryId(e.target.value ? Number(e.target.value) : null)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-nova-500/50 focus:outline-none"
              >
                <option value="">Same as country above</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <TagInput
              label="Career Goals"
              hint="e.g. Mechanical Engineer, AI Researcher, Doctor"
              placeholder="Type a career goal and press Enter"
              values={careerGoals}
              onChange={setCareerGoals}
            />
            <TagInput
              label="Interests"
              hint="Topics or fields you're drawn to"
              placeholder="Type an interest and press Enter"
              values={interests}
              onChange={setInterests}
            />
            <TagInput
              label="Languages"
              placeholder="Type a language and press Enter"
              values={languages}
              onChange={setLanguages}
            />
            <SkillsPicker values={skills} onChange={setSkills} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-slate-300">Bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="A couple sentences about you — shown on your public profile later."
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-nova-500/50 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              <p className="mb-2 font-medium text-slate-300">Review</p>
              <ul className="flex flex-col gap-1">
                <li>School: <span className="text-slate-200">{school?.name || "—"}</span></li>
                <li>Grade: <span className="text-slate-200">{GRADE_OPTIONS.find((g) => g.value === grade)?.label || "—"}</span></li>
                <li>Career goals: <span className="text-slate-200">{careerGoals.join(", ") || "—"}</span></li>
                <li>Skills: <span className="text-slate-200">{skills.map((s) => s.name).join(", ") || "—"}</span></li>
              </ul>
            </div>

            {saveState === "error" && (
              <p className="text-sm text-ineligible">{errorMsg}</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <OpportunityPreferencesForm
              countries={countries}
              value={preferences}
              onChange={setPreferences}
            />
            {saveState === "error" && (
              <p className="text-sm text-ineligible">{errorMsg}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200 disabled:opacity-0"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canProceed}
            className="flex items-center gap-1 rounded-xl bg-nova-500/90 px-5 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-nova-400 disabled:opacity-40"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveState === "saving" || saveState === "saved"}
            className="flex items-center gap-2 rounded-xl bg-nova-500/90 px-5 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-nova-400 disabled:opacity-70"
          >
            {saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveState === "saved" && <CheckCircle2 className="h-4 w-4" />}
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : "Save Profile"}
          </button>
        )}
      </div>
    </div>
  );
}
