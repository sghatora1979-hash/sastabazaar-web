// Server-side exchange-rate helper (Update 22).
// Uses the no-key provider open.er-api.com, caches results in
// public.exchange_rate_cache, and NEVER hardcodes a rate.
// Rates are always returned with provider + timestamp + staleness.
import { getSupabase, isSupabaseConfigured } from './supabase';

export const FX_PROVIDER = 'open.er-api.com';
export const FX_BASE = 'INR';
const CACHE_TTL_MS = 12 * 3600 * 1000;
const CACHE_TARGETS = ['CAD', 'CNY', 'USD', 'AED'];

export type RateQuote =
  | {
      ok: true;
      base: string;
      rates: Record<string, number>;
      timestamp: string;
      provider: string;
      stale: boolean;
      source: 'live' | 'cache' | 'live-unstored';
    }
  | { ok: false; reason: string; provider: string };

export async function getRates(): Promise<RateQuote> {
  let live: { rates: Record<string, number>; timestamp: string } | null = null;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${FX_BASE}`);
    if (res.ok) {
      const j = await res.json();
      if (j?.result === 'success' && j?.rates && typeof j.rates === 'object') {
        live = {
          rates: j.rates as Record<string, number>,
          timestamp: j.time_last_update_utc ?? new Date().toUTCString(),
        };
      }
    }
  } catch {
    live = null; // provider unreachable — fall through to cache
  }

  const sb = isSupabaseConfigured() ? getSupabase() : null;

  if (live && sb) {
    for (const t of CACHE_TARGETS) {
      const r = live.rates[t];
      if (typeof r === 'number' && r > 0) {
        await sb.from('exchange_rate_cache').upsert(
          {
            base_currency: FX_BASE,
            target_currency: t,
            rate: r,
            fetched_at: new Date().toISOString(),
            provider: FX_PROVIDER,
          },
          { onConflict: 'base_currency,target_currency' }
        );
      }
    }
    return {
      ok: true, base: FX_BASE, rates: live.rates, timestamp: live.timestamp,
      provider: FX_PROVIDER, stale: false, source: 'live',
    };
  }

  if (sb) {
    const { data } = await sb
      .from('exchange_rate_cache')
      .select('target_currency, rate, fetched_at, provider')
      .eq('base_currency', FX_BASE);
    if (data && data.length > 0) {
      const rates: Record<string, number> = {};
      let newest = 0;
      let provider = FX_PROVIDER;
      for (const row of data as Array<{ target_currency: string; rate: number; fetched_at: string; provider: string }>) {
        rates[row.target_currency] = Number(row.rate);
        newest = Math.max(newest, new Date(row.fetched_at).getTime());
        provider = row.provider;
      }
      return {
        ok: true, base: FX_BASE, rates,
        timestamp: new Date(newest).toUTCString(), provider,
        stale: Date.now() - newest > CACHE_TTL_MS, source: 'cache',
      };
    }
  }

  if (live) {
    return {
      ok: true, base: FX_BASE, rates: live.rates, timestamp: live.timestamp,
      provider: FX_PROVIDER, stale: false, source: 'live-unstored',
    };
  }

  return {
    ok: false,
    reason: 'Exchange-rate provider unreachable and no cached rates available. Rates are never hardcoded.',
    provider: FX_PROVIDER,
  };
}

/** Convert an amount FROM `from` currency TO `to`, given INR-based rates. */
export function convert(amount: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount;
  // rates are quoted as: 1 INR = rates[X] units of X
  const toInr = (v: number, cur: string) => (cur === 'INR' ? v : v / (rates[cur] || 0));
  const fromInr = (v: number, cur: string) => (cur === 'INR' ? v : v * (rates[cur] || 0));
  const inr = toInr(amount, from);
  if (!isFinite(inr)) return NaN;
  return fromInr(inr, to);
}
