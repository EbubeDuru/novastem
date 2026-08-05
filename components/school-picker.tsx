"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, Check } from "lucide-react";

export interface SchoolOption {
  id: string;
  name: string;
}

export function SchoolPicker({
  value,
  onChange,
}: {
  value: SchoolOption | null;
  onChange: (school: SchoolOption | null) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<SchoolOption[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) return; // don't re-search once a school is selected
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("schools")
        .select("id, name")
        .ilike("name", `%${query.trim()}%`)
        .limit(6);
      setResults(data ?? []);
    }, 250);
  }, [query, value]);

  async function handleCreate() {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("schools")
      .insert({ name })
      .select("id, name")
      .single();
    setCreating(false);
    if (!error && data) {
      onChange(data);
      setOpen(false);
    }
  }

  function handleSelect(school: SchoolOption) {
    onChange(school);
    setQuery(school.name);
    setOpen(false);
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="relative">
      <label className="text-sm font-medium text-slate-300">School</label>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Start typing your school's name..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-nova-500/50 focus:outline-none"
        />
        {value && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-eligible" />}
      </div>

      {open && !value && query.trim().length >= 2 && (
        <div className="glass absolute z-10 mt-1 w-full overflow-hidden rounded-xl">
          {results.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => handleSelect(school)}
              className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
            >
              {school.name}
            </button>
          ))}
          {!exactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2.5 text-left text-sm text-nova-400 hover:bg-white/5 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {creating ? "Adding..." : `Add "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
