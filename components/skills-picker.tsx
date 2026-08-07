"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";
import { clsx } from "clsx";

export interface SelectedSkill {
  id: number;
  name: string;
  proficiency: number; // 1-5
}

export function SkillsPicker({
  values,
  onChange,
}: {
  values: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: number; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("skills")
        .select("id, name")
        .ilike("name", `%${query.trim()}%`)
        .limit(8);
      setResults((data ?? []).filter((s) => !values.some((v) => v.id === s.id)));
    }, 200);
  }, [query, values]);

  function addSkill(skill: { id: number; name: string }) {
    onChange([...values, { ...skill, proficiency: 3 }]);
    setQuery("");
    setOpen(false);
  }

  async function createAndAddSkill() {
    const name = query.trim();
    if (!name) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("skills").insert({ name }).select("id, name").single();
    if (!error && data) addSkill(data);
  }

  function updateProficiency(id: number, proficiency: number) {
    onChange(values.map((v) => (v.id === id ? { ...v, proficiency } : v)));
  }

  function removeSkill(id: number) {
    onChange(values.filter((v) => v.id !== id));
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div>
      <label className="text-sm font-medium text-slate-300">Skills</label>
      <p className="mt-0.5 text-xs text-slate-500">Add skills and rate your proficiency — this sharpens your match %.</p>

      <div className="relative mt-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search or add a skill..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-nova-500/50 focus:outline-none"
        />
        {open && query.trim().length >= 1 && (
          <div className="glass absolute z-10 mt-1 w-full overflow-hidden rounded-xl">
            {results.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => addSkill(skill)}
                className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
              >
                {skill.name}
              </button>
            ))}
            {!exactMatch && (
              <button
                type="button"
                onClick={createAndAddSkill}
                className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2.5 text-left text-sm text-nova-400 hover:bg-white/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add &quot;{query.trim()}&quot;
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {values.map((skill) => (
          <div key={skill.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex-1 text-sm text-slate-200">{skill.name}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateProficiency(skill.id, level)}
                  aria-label={`Set proficiency to ${level}`}
                  className={clsx(
                    "h-2 w-4 rounded-full transition",
                    level <= skill.proficiency ? "bg-nova-500" : "bg-white/10"
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => removeSkill(skill.id)}
              aria-label={`Remove ${skill.name}`}
              className="rounded-full p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
