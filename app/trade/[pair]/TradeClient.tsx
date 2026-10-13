'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TriangleAlert, Globe2 } from 'lucide-react';
import { PAIRS, pairBySymbol } from '@/lib/pairs';
import { forexBySymbol, forexPrices } from '@/lib/forex';
import { stockBySymbol, fmtStockPrice } from '@/lib/stocks';
import {
  loadState,
  paperBuy,
  paperSell,
  openPosition,
  checkLiquidations,
  fmtUSD,
  type PaperState,
  type TradeResult,
  type PosSide,
} from '@/lib/quasar';
import { TradingViewChart } from '@/components/TradingViewChart';
import { OrderBook, type BookRow } from '@/components/OrderBook';
import { TradePanel } from '@/components/TradePanel';
import { TVTopStories } from '@/components/TVWidgets';
import { cn } from '@/lib/utils';

type DepthResp = {
  ok: boolean;
  asks: BookRow[];
  bids: BookRow[];
  bestAsk: number;
  bestBid: number;
  mid: number;
  spread: number;
  error?: string;
};

export function TradeClient({ symbol, market }: { symbol: string; market: 'crypto' | 'forex' | 'stock' }) {
  const cryptoInfo = market === 'crypto' ? pairBySymbol(symbol) ?? PAIRS[0] : null;
  const fxInfo = market === 'forex' ? forexBySymbol(symbol) : null;
  const stockInfo = market === 'stock' ? stockBySymbol(symbol) : null;
  const name = cryptoInfo?.name ?? fxInfo?.name ?? stockInfo?.name ?? symbol;
  const decimals = cryptoInfo?.decimals ?? fxInfo?.decimals ?? stockInfo?.decimals ?? 4;
  const currency = stockInfo?.currency ?? 'USD';
  const tvSymbol =
    market === 'forex' ? fxInfo!.tv : market === 'stock' ? stockInfo!.tv : `KRAKEN:${cryptoInfo!.tv}USD`;

  const [state, setState] = useState<PaperState>(() => loadState());
  const [depth, setDepth] = useState<DepthResp | null>(null);
  const [price, setPrice] = useState(0); // display price (native currency for stocks)
  const [priceUSD, setPriceUSD] = useState(0); // engine price (always USD)
  const [depthError, setDepthError] = useState('');
  const [liqNotice, setLiqNotice] = useState('');
  const priceRef = useRef(0); // engine (USD) price for order execution
  const displayRef = useRef(0);

  // Apply price update + run liquidation checks against open positions.
  // pxUSD: engine price (USD). pxDisplay: what the user sees (native currency for stocks).
  const applyPrice = useCallback(
    (pxUSD: number, pxDisplay?: number) => {
      if (!(pxUSD > 0)) return;
      priceRef.current = pxUSD;
      displayRef.current = pxDisplay ?? pxUSD;
      setPriceUSD(pxUSD);
      setPrice(displayRef.current);
      setState((prev) => {
        if (!prev.positions.length) return prev;
        const s: PaperState = {
          ...prev,
          positions: prev.positions.map((p) => ({ ...p })),
          orders: [...prev.orders],
          snapshots: [...prev.snapshots],
        };
        const { liquidated } = checkLiquidations(s, { [symbol]: pxUSD });
        if (!liquidated.length) return prev;
        setLiqNotice(
          `${liquidated.length} leveraged position${liquidated.length > 1 ? 's' : ''} liquidated at ${fmtUSD(pxUSD, decimals)} — demo funds only, no real money lost.`
        );
        return { ...s };
      });
    },
    [symbol, decimals]
  );

  useEffect(() => {
    let alive = true;
    const loadCrypto = async () => {
      try {
        const r = await fetch(`/api/depth?pair=${cryptoInfo!.symbol}USD&count=25`, { cache: 'no-store' });
        const j = (await r.json()) as DepthResp;
        if (!alive) return;
        if (j.ok) {
          setDepth(j);
          if (j.mid > 0) applyPrice(j.mid);
          setDepthError('');
        } else {
          setDepthError(j.error ?? 'Order book unavailable');
        }
      } catch {
        if (alive) setDepthError('Could not reach market data.');
      }
    };
    const loadForex = async () => {
      try {
        const r = await fetch('/api/forex', { cache: 'no-store' });
        const j = await r.json();
        if (!alive || !j.ok) return;
        const prices = forexPrices(j.rates as Record<string, number>);
        const px = prices[symbol];
        if (px > 0) {
          applyPrice(px);
          setDepthError('');
        }
      } catch {
        if (alive) setDepthError('Forex reference rates unavailable.');
      }
    };
    const loadStock = async () => {
      try {
        const r = await fetch('/api/stocks', { cache: 'no-store' });
        const j = await r.json();
        if (!alive || !j.ok) return;
        const q = (j.quotes as { symbol: string; price: number; priceUSD: number }[]).find(
          (x) => x.symbol === symbol
        );
        if (q && q.priceUSD > 0) {
          applyPrice(q.priceUSD, q.price);
          setDepthError('');
        }
      } catch {
        if (alive) setDepthError('Stock data unavailable.');
      }
    };
    if (market === 'crypto') {
      loadCrypto();
      const t = setInterval(loadCrypto, 5000);
      return () => {
        alive = false;
        clearInterval(t);
      };
    }
    if (market === 'stock') {
      loadStock();
      const t = setInterval(loadStock, 60_000);
      return () => {
        alive = false;
        clearInterval(t);
      };
    }
    loadForex();
    const t = setInterval(loadForex, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [market, symbol, cryptoInfo, applyPrice]);

  const execute = useCallback(
    (side: 'buy' | 'sell', amount: number, mode: 'usd' | 'coin'): TradeResult => {
      const s: PaperState = {
        ...state,
        holdings: { ...state.holdings },
        positions: [...state.positions],
        orders: [...state.orders],
        snapshots: [...state.snapshots],
      };
      // Stocks: engine trades in USD (priceUSD); display uses native currency.
      // Pair label: bare ticker for stocks, XXXUSD for crypto/forex.
      const pairLabel = market === 'stock' ? symbol : undefined;
      let res: TradeResult;
      if (side === 'buy') {
        const usd = mode === 'usd' ? amount : amount * priceRef.current;
        res = paperBuy(s, symbol, usd, priceRef.current, pairLabel);
      } else {
        const qty = mode === 'coin' ? amount : amount / (priceRef.current || 1);
        res = paperSell(s, symbol, qty, priceRef.current, pairLabel);
      }
      if (res.ok) setState({ ...s });
      return res;
    },
    [state, symbol, market]
  );

  const executeLeveraged = useCallback(
    (dir: PosSide, marginUsd: number, leverage: number): TradeResult => {
      const s: PaperState = {
        ...state,
        holdings: { ...state.holdings },
        positions: state.positions.map((p) => ({ ...p })),
        orders: [...state.orders],
        snapshots: [...state.snapshots],
      };
      const res = openPosition(s, symbol, dir, marginUsd, leverage, priceRef.current);
      if (res.ok) setState({ ...s });
      return res;
    },
    [state, symbol]
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="text-slate-400 hover:text-white transition" aria-label="Back to markets">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            {symbol}
            {market !== 'stock' && <span className="text-slate-500 font-semibold">/USD</span>}
            <span className="ml-1 text-sm font-medium text-slate-400">{name}</span>
            {market === 'forex' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-400/10 border border-sky-400/30 rounded-md px-2 py-0.5">
                Ref rate
              </span>
            )}
            {market === 'stock' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-violet-400/10 border border-violet-400/30 rounded-md px-2 py-0.5">
                Daily close · {stockInfo?.exchange}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-mono tabular-nums">
            {price > 0
              ? market === 'stock'
                ? `${fmtStockPrice(price, currency, decimals)} (${fmtUSD(priceUSD)})`
                : fmtUSD(price, decimals)
              : 'Connecting…'}
          </p>
        </div>
        <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1.5">
          Paper trading — no real money
        </span>
      </div>

      {depthError && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-2.5">
          <TriangleAlert size={14} />
          {depthError}
        </div>
      )}

      {liqNotice && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-300 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2.5">
          <TriangleAlert size={14} />
          {liqNotice}
          <button onClick={() => setLiqNotice('')} className="ml-auto underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {market === 'forex' && (
        <div className="mb-4 flex items-center gap-2 text-xs text-sky-300 bg-sky-400/10 border border-sky-400/30 rounded-xl px-3 py-2.5">
          <Globe2 size={14} />
          Daily reference rate (ECB via Frankfurter) — indicative pricing for demo trading, not a live tick feed.
        </div>
      )}

      {market === 'stock' && (
        <div className="mb-4 flex items-center gap-2 text-xs text-violet-300 bg-violet-400/10 border border-violet-400/30 rounded-xl px-3 py-2.5">
          <Globe2 size={14} />
          Daily stock close (Yahoo Finance) — indicative pricing for demo trading. Spot buy/sell only, no leverage on stocks.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <TradingViewChart key={tvSymbol} tvSymbol={tvSymbol} />
          <div>
            <h2 className="text-lg font-extrabold text-white mb-3">Crypto News</h2>
            <TVTopStories />
            <p className="mt-2 text-[11px] text-slate-500">Live crypto headlines by TradingView.</p>
          </div>
        </div>
        <div className="space-y-4">
          <TradePanel
            symbol={symbol}
            price={priceUSD}
            cash={state.cash}
            holdingQty={state.holdings[symbol]?.qty ?? 0}
            onTrade={execute}
            priceLabel={
              market === 'stock' && price > 0
                ? `${fmtStockPrice(price, currency, decimals)} ≈ ${fmtUSD(priceUSD)}`
                : undefined
            }
            {...(market === 'stock'
              ? { allowLeverage: false }
              : { onLeveraged: executeLeveraged })}
          />
          {market === 'crypto' ? (
            depth ? (
              <OrderBook asks={depth.asks} bids={depth.bids} decimals={decimals} spread={depth.spread} />
            ) : (
              <div className="bg-panel border border-edge rounded-2xl p-6 text-center text-xs text-slate-500">
                Loading order book…
              </div>
            )
          ) : (
            <div className="bg-panel border border-edge rounded-2xl p-6 text-center text-xs text-slate-500">
              {market === 'forex'
                ? 'No live order book for reference FX rates — demo fills execute at the reference price.'
                : 'No live depth for daily stock data — demo fills execute at the daily close.'}
            </div>
          )}
        </div>
      </div>

      <p className={cn('mt-4 text-[11px] text-slate-500')}>
        Chart by TradingView ·{' '}
        {market === 'crypto'
          ? 'order book live from Kraken'
          : market === 'forex'
            ? 'FX rates: ECB daily reference'
            : 'stock prices: Yahoo Finance daily closes (indicative) · spot only'} · demo fills execute instantly
        at market price.
      </p>
    </div>
  );
}
