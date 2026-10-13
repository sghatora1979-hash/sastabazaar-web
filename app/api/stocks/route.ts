// GET /api/stocks — daily stock closes via Yahoo Finance chart API (free, no key).
// Covers India (NSE .NS), USA, Europe (Xetra/Euronext/LSE/SIX/Copenhagen).
// Also returns priceUSD (converted via Frankfurter ECB rates) so the paper
// engine can keep USD-consistent accounting. Cached 15 min server-side.
// Honest label: daily closes — indicative, not live ticks.

import { STOCKS } from '@/lib/stocks';

export const dynamic = 'force-dynamic';

type StockQuote = {
  symbol: string;
  name: string;
  region: string;
  exchange: string;
  currency: string;
  price: number;
  priceUSD: number;
  changePct: number | null;
  volume: number;
};

type Cache = { t: number; payload: unknown };
let cache: Cache | null = null;
const TTL = 900_000;

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuasarDemo/1.0' };

async function fetchQuote(yahoo: string): Promise<{
  price: number;
  changePct: number | null;
  volume: number;
} | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahoo}?interval=1d&range=5d`, {
      headers: UA,
    });
    if (!r.ok) return null;
    const j = await r.json();
    const meta = j?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (!(price > 0)) return null;
    let changePct: number | null =
      typeof meta?.regularMarketChangePercent === 'number' ? meta.regularMarketChangePercent : null;
    if (changePct === null) {
      const prev = meta?.chartPreviousClose ?? meta?.previousClose;
      if (prev > 0) changePct = ((price - prev) / prev) * 100;
    }
    let volume = 0;
    try {
      const vols: (number | null)[] = j.chart.result[0].indicators.quote[0].volume ?? [];
      for (let i = vols.length - 1; i >= 0; i--) {
        if (vols[i] && vols[i]! > 0) {
          volume = vols[i]!;
          break;
        }
      }
    } catch {
      /* volume optional */
    }
    return { price, changePct, volume };
  } catch {
    return null;
  }
}

async function usdRates(): Promise<Record<string, number>> {
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=USD', { headers: UA });
    if (!r.ok) return {};
    const j = await r.json();
    return (j?.rates ?? {}) as Record<string, number>;
  } catch {
    return {};
  }
}

// Fallback FX via Yahoo for currencies Frankfurter lacks (e.g. RUB —
// ECB suspended the rouble reference rate). Returns units of `cur` per 1 USD.
async function yahooFxPerUsd(cur: string): Promise<number> {
  try {
    // e.g. RUBUSD=X = USD per 1 RUB → invert to get RUB per USD
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${cur}USD=X?interval=1d&range=5d`,
      { headers: UA }
    );
    if (!r.ok) return 0;
    const j = await r.json();
    const px = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return px > 0 ? 1 / px : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  if (cache && Date.now() - cache.t < TTL) {
    return Response.json({ ok: true, cached: true, ...(cache.payload as object) });
  }
  try {
    const [rates] = await Promise.all([usdRates()]);
    // Pre-fetch Yahoo FX for any currency missing from Frankfurter (RUB).
    const missing = Array.from(new Set(STOCKS.map((s) => s.currency))).filter(
      (c) => c !== 'USD' && c !== 'GBp' && !(rates[c] > 0)
    );
    const fallback: Record<string, number> = {};
    await Promise.all(
      missing.map(async (c) => {
        fallback[c] = await yahooFxPerUsd(c);
      })
    );
    const quotes: StockQuote[] = [];

    // Chunked concurrency to stay polite to Yahoo's unofficial API.
    const CHUNK = 10;
    for (let i = 0; i < STOCKS.length; i += CHUNK) {
      const batch = STOCKS.slice(i, i + CHUNK);
      const results = await Promise.all(batch.map((s) => fetchQuote(s.yahoo)));
      batch.forEach((s, k) => {
        const q = results[k];
        if (!q) return; // skip silently — never fake data
        let priceUSD = q.price;
        if (s.currency !== 'USD') {
          const fxRaw = s.currency === 'GBp' ? rates['GBP'] : rates[s.currency];
          const fx = fxRaw > 0 ? fxRaw : fallback[s.currency] || 0;
          if (s.currency === 'GBp') {
            priceUSD = fx > 0 ? q.price / 100 / fx : 0;
          } else {
            priceUSD = fx > 0 ? q.price / fx : 0;
          }
        }
        if (!(priceUSD > 0)) return;
        quotes.push({
          symbol: s.symbol,
          name: s.name,
          region: s.region,
          exchange: s.exchange,
          currency: s.currency,
          price: q.price,
          priceUSD,
          changePct: q.changePct,
          volume: q.volume,
        });
      });
    }

    if (!quotes.length) {
      return Response.json({ ok: false, error: 'Stock data unavailable' }, { status: 502 });
    }
    const payload = {
      quotes,
      count: quotes.length,
      total: STOCKS.length,
      note: 'Daily closes (Yahoo Finance) — indicative, not live ticks. Demo trading only.',
    };
    cache = { t: Date.now(), payload };
    return Response.json({ ok: true, ...payload });
  } catch {
    return Response.json({ ok: false, error: 'Stock data unavailable' }, { status: 502 });
  }
}
