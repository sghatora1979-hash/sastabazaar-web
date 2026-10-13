export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { PAIRS, pairBySymbol } from '@/lib/pairs';
import { krakenGet, resultKey, jsonError } from '../_lib';

type OhlcRow = [number, string, string, string, string, string, string, number];

// GET /api/ohlc?pair=BTCUSD&interval=60  (pair = display symbol or Kraken alt)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = (sp.get('pair') ?? 'BTCUSD').toUpperCase().replace(/USD$/, '');
  const info = pairBySymbol(raw) ?? PAIRS.find((p) => p.kraken === raw + 'USD');
  if (!info) return jsonError('Unknown pair', 400);
  const interval = sp.get('interval') ?? '60';

  const env = await krakenGet<Record<string, OhlcRow[]>>('/OHLC', {
    pair: info.kraken,
    interval,
  });
  if (env.error.length || !env.result) return jsonError(env.error[0] ?? 'OHLC unavailable');
  const rows = env.result[resultKey(info.kraken)] ?? env.result[info.kraken] ?? [];
  const closes = rows.map((r) => parseFloat(r[4]));
  return Response.json({ ok: true, symbol: info.symbol, closes, count: closes.length });
}
