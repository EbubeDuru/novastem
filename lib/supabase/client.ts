import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Client-side Supabase instance — uses the anon key, subject to RLS.
// Never import this file into agents/ or any script using the service role key.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
