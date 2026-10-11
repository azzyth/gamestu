import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for background jobs (cron) and public share pages.
 * Bypasses RLS — only use in server contexts that have already verified
 * the request (CRON_SECRET check) or that only read non-sensitive aggregates.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function serviceClientConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
