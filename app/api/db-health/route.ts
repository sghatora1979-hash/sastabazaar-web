import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Proof endpoint: GET /api/db-health → { ok, configured, products, categories }
// Proves the app can actually reach the Supabase database — no pretending.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      reason: 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set',
    });
  }
  const sb = getSupabase()!;
  try {
    const [products, categories] = await Promise.all([
      sb.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      sb.from('categories').select('*', { count: 'exact', head: true }),
    ]);
    if (products.error || categories.error) {
      return NextResponse.json({
        ok: false,
        configured: true,
        reason: products.error?.message ?? categories.error?.message ?? 'query failed',
        hint: 'Have the Phase 0 SQL migrations been run in the Supabase SQL Editor?',
      });
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      products: products.count ?? 0,
      categories: categories.count ?? 0,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      configured: true,
      reason: e instanceof Error ? e.message : 'unreachable',
    });
  }
}
