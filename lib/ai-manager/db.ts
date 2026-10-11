// AI Marketplace Manager — privileged DB access (Update 24).
// The cron run needs to write across RLS boundaries, so it uses the
// service-role key when available. Falls back to the publishable client
// (writes will then fail closed under RLS — the run reports this honestly).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getServiceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || (!serviceKey && !pubKey)) {
    cached = null;
    return cached;
  }
  cached = createClient(url, (serviceKey || pubKey) as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
