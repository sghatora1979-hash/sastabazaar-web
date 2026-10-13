export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { PAIRS } from '@/lib/pairs';
import { krakenGet, resultKey, jsonError } from '../_lib';

type TickerEntry = {
  a: [string, string, string];
  b: [string, string, string];
  c: [string, string];
  v: [string, string];
  p: [string, string];
  t: [number, number];
  l: [string, string];
  h: [string, string];
  o: string;
};

// GET /api/ticker?pair=XBTUSD,ETHUSD  (Kraken alt names; defaults to all 20)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('pair');
  const wanted = q
    ? PAIRS.filter((p) => q.split(',').map((s) => s.trim().toUpperCase()).includes(p.kraken))
    : PAIRS;
  const list = wanted.length ? wanted : PAIRS;

  const env = await krakenGet<Record<string, TickerEntry>>('/Ticker', {
    pair: list.map((p) => p.kraken).join(','),
  });
  if (env.error.length || !env.result) return jsonError(env.error[0] ?? 'Ticker unavailable');

  const out = list.map((p) => {
    const e = env.result![resultKey(p.kraken)] ?? env.result![p.kraken];
    if (!e) return null;
    const price = parseFloat(e.c[0]);
    const open = parseFloat(e.o);
    const changePct = open > 0 ? ((price - open) / open) * 100 : 0;
    return {
      symbol: p.symbol,
      name: p.name,
      kraken: p.kraken,
      price,
      open,
      changePct,
      high24: parseFloat(e.h[1]),
      low24: parseFloat(e.l[1]),
      volume24: parseFloat(e.v[1]),
      vwap24: parseFloat(e.p[1]),
      bid: parseFloat(e.b[0]),
      ask: parseFloat(e.a[0]),
    };
  }).filter(Boolean);

  return Response.json({ ok: true, data: out });
}
