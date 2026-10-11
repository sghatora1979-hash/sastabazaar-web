import { NextResponse } from 'next/server';
import { getRates } from '@/lib/fx';

// This route calls a live FX provider — never pre-render it at build time.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/rates → { ok, base, rates, timestamp, provider, stale, source }
// Live rates from a no-key provider, cached in exchange_rate_cache.
// Rates are NEVER hardcoded; every response carries provider + timestamp.
export async function GET() {
  const quote = await getRates();
  if (!quote.ok) {
    return NextResponse.json(quote, { status: 503 });
  }
  return NextResponse.json(quote);
}
