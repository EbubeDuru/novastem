"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

/**
 * This is a deliberately minimal stopgap, not the full auth system from the
 * roadmap. Magic-link sign-in needs no password UI, no confirmation-flow
 * screens, and Supabase handles the email sending — it's the fastest way to
 * get a real signed-in user so the profile form (and everything downstream
 * of it) is actually testable. Replace/extend with a full signup flow
 * (role selection, org vs. student, password option) when you get there.
 */
export function AuthGate() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="glass w-full rounded-2xl p-8">
        <Sparkles className="mx-auto h-6 w-6 text-nova-400" />
        <h1 className="mt-4 text-2xl font-display font-semibold text-slate-50">
          Sign in to build your profile
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          We&apos;ll email you a link — no password needed.
        </p>

        {status === "sent" ? (
          <div className="mt-6 rounded-xl bg-aurora-500/10 p-4 text-sm text-aurora-400">
            Check <span className="font-medium">{email}</span> for a sign-in link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-nova-500/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-xl bg-nova-500/90 px-4 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-nova-400 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send sign-in link"}
            </button>
            {status === "error" && <p className="text-sm text-ineligible">{errorMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
