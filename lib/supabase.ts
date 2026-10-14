// Supabase client for SastaBazaar (Phase 0).
// Uses only the PUBLIC publishable key — Row-Level Security protects the data.
// Returns null when env vars are missing so callers can fall back to demo data.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    cached = null;
    return cached;
  }
  cached = createClient(url, key);
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
