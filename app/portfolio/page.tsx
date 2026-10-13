'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Wallet, RotateCcw, TriangleAlert, TrendingUp, TrendingDown, ArrowUpToLine, XCircle } from 'lucide-react';
import {
  loadState,
  resetState,
  topUpState,
  closePosition,
  checkLiquidations,
  portfolioValue,
  recordSnapshot,
  fmtUSD,
  fmtQty,
  START_CASH,
  type PaperState,
} from '@/lib/quasar';
import { forexPrices, forexBySymbol } from '@/lib/forex';
import { stockBySymbol } from '@/lib/stocks';
import { BrokerRegionChips, BrokerNotifyButton } from '@/components/BrokersTeaser';
import { EquityCurve } from '@/components/EquityCurve';
import { cn } from '@/lib/utils';

export default function PortfolioPage() {
  const [state, setState] = useState<PaperState>(() => loadState());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const cryptoSymbols = useMemo(() => Object.keys(state.holdings), [state.holdings]);
  const posSymbols = useMemo(() => Array.from(new Set(state.positions.map((p) => p.symbol))), [state.positions]);
  // Stock holdings are priced via /api/stocks (USD-converted); everything else
  // via Kraken ticker (crypto) or Frankfurter (forex).
  const stockSyms = useMemo(() => cryptoSymbols.filter((s) => stockBySymbol(s)), [cryptoSymbols]);
  // Crypto symbols needing live prices: spot holdings + crypto leveraged positions.
  const tickSymbols = useMemo(
    () =>
      Array.from(
        new Set([
          ...cryptoSymbols.filter((s) => !stockBySymbol(s) && !forexBySymbol(s)),
          ...posSymbols.filter((s) => !forexBySymbol(s) && !stockBySymbol(s)),
        ])
      ),
    [cryptoSymbols, posSymbols]
  );

  useEffect(() => {
    if (!tickSymbols.length && !posSymbols.length && !stockSyms.length) return;
    let alive = true;
    const load = async () => {
      try {
        const map: Record<string, number> = {};
        if (tickSymbols.length) {
          const krakenList = tickSymbols
            .map((s) => (s === 'BTC' ? 'XBT' : s) + 'USD')
            .join(',');
          const r = await fetch(`/api/ticker?pair=${krakenList}`, { cache: 'no-store' });
          const j = await r.json();
          if (j.ok) {
            for (const row of j.data as { symbol: string; price: number }[]) map[row.symbol] = row.price;
          }
        }
        if (posSymbols.length) {
          const r = await fetch('/api/forex', { cache: 'no-store' });
          const j = await r.json();
          if (j.ok) Object.assign(map, forexPrices(j.rates as Record<string, number>));
        }
        if (stockSyms.length) {
          const r = await fetch('/api/stocks', { cache: 'no-store' });
          const j = await r.json();
          if (j.ok) {
            for (const q of j.quotes as { symbol: string; priceUSD: number }[]) {
              if (q.priceUSD > 0) map[q.symbol] = q.priceUSD;
            }
          }
        }
        if (!alive) return;
        setPrices(map);
        // Auto-liquidate positions touched at their liquidation price.
        setState((prev) => {
          if (!prev.positions.length) return prev;
          const s: PaperState = {
            ...prev,
            positions: prev.positions.map((p) => ({ ...p })),
            orders: [...prev.orders],
            snapshots: [...prev.snapshots],
          };
          const { liquidated } = checkLiquidations(s, map);
          return liquidated.length ? { ...s } : prev;
        });
        setError('');
      } catch {
        if (alive) setError('Live prices unavailable — showing last known values.');
      }
    };
    load();
    const t = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickSymbols.join(','), posSymbols.join(','), stockSyms.join(',')]);

  const pv = useMemo(() => portfolioValue(state, prices), [state, prices]);

  useEffect(() => {
    if (pv.equity > 0 && (cryptoSymbols.length > 0 || posSymbols.length > 0 || pv.equity !== START_CASH)) {
      setState((s) => {
        const next = recordSnapshot(s, pv.equity);
        return next === s ? s : { ...next };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pv.equity]);

  const doReset = () => {
    if (window.confirm('Reset the demo? This clears cash, holdings, positions, orders and history back to $100,000.')) {
      setState(resetState());
      setPrices({});
    }
  };

  const doTopUp = () => {
    setState((prev) => {
      const s: PaperState = { ...prev, positions: [...prev.positions], orders: [...prev.orders], snapshots: [...prev.snapshots], holdings: { ...prev.holdings } };
      return { ...topUpState(s) };
    });
  };

  const closePos = (id: string) => {
    const px = prices[state.positions.find((p) => p.id === id)?.symbol ?? ''];
    setState((prev) => {
      const s: PaperState = { ...prev, positions: prev.positions.map((p) => ({ ...p })), orders: [...prev.orders], snapshots: [...prev.snapshots] };
      const r = closePosition(s, id, px > 0 ? px : 0);
      if (!r.ok) return prev;
      return { ...s };
    });
  };

  const up = pv.totalPnl >= 0;
  const needsTopUp = state.cash < START_CASH;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Wallet size={22} className="text-accent2" />
          Portfolio
        </h1>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-1">
          Demo funds
        </span>
        <div className="ml-auto flex items-center gap-2">
          {needsTopUp && (
            <button
              onClick={doTopUp}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-accent/80 hover:bg-accent rounded-xl px-3 py-2 transition"
            >
              <ArrowUpToLine size={13} />
              Top up to {fmtUSD(START_CASH, 0)}
            </button>
          )}
          <button
            onClick={doReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-panel border border-edge rounded-xl px-3 py-2 transition"
          >
            <RotateCcw size={13} />
            Reset demo
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-2.5">
          <TriangleAlert size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total equity', value: fmtUSD(pv.equity), tone: 'text-white' },
          {
            label: 'Total P&L',
            value: `${up ? '+' : ''}${fmtUSD(pv.totalPnl)} (${up ? '+' : ''}${pv.totalPnlPct.toFixed(2)}%)`,
            tone: up ? 'text-up' : 'text-down',
          },
          { label: 'Demo cash', value: fmtUSD(pv.cash), tone: 'text-white' },
          { label: 'Holdings value', value: fmtUSD(pv.holdingsValue), tone: 'text-white' },
        ].map((c) => (
          <div key={c.label} className="bg-panel border border-edge rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{c.label}</div>
            <div className={cn('mt-1 text-xl font-extrabold font-mono tabular-nums', c.tone)}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-edge rounded-2xl p-4 mb-5">
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          {up ? <TrendingUp size={14} className="text-up" /> : <TrendingDown size={14} className="text-down" />}
          Equity curve (demo)
        </div>
        <EquityCurve snapshots={state.snapshots} />
      </div>

      {/* Open leveraged positions */}
      <div className="bg-panel border border-edge rounded-2xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-edge text-sm font-semibold text-white flex items-center gap-2">
          Leveraged positions
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
            Demo
          </span>
        </div>
        {pv.posRows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No open leveraged positions. Use the leverage selector on any trade page to open one (paper trading).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-edge">
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold text-right">Lev</th>
                  <th className="px-4 py-3 font-semibold text-right">Entry</th>
                  <th className="px-4 py-3 font-semibold text-right">Live</th>
                  <th className="px-4 py-3 font-semibold text-right">Margin</th>
                  <th className="px-4 py-3 font-semibold text-right">uP&L</th>
                  <th className="px-4 py-3 font-semibold text-right">Margin level</th>
                  <th className="px-4 py-3 font-semibold text-right">To liq.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pv.posRows.map((r) => {
                  const rup = r.pnl >= 0;
                  const danger = r.marginLevel < 120;
                  return (
                    <tr key={r.id} className="border-b border-edge/60 hover:bg-panel2/60 transition">
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mr-1.5', r.side === 'long' ? 'text-up bg-up/15' : 'text-down bg-down/15')}>
                          {r.side}
                        </span>
                        <span className="font-bold text-white">{r.symbol}/USD</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-accent tabular-nums">{r.leverage}x</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400 tabular-nums">{fmtUSD(r.entry, 5)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200 tabular-nums">
                        {r.price > 0 ? fmtUSD(r.price, 5) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white tabular-nums">{fmtUSD(r.margin)}</td>
                      <td className={cn('px-4 py-3 text-right font-mono font-semibold tabular-nums', rup ? 'text-up' : 'text-down')}>
                        {rup ? '+' : ''}{fmtUSD(r.pnl)} ({rup ? '+' : ''}{r.pnlPct.toFixed(1)}%)
                      </td>
                      <td className={cn('px-4 py-3 text-right font-mono font-semibold tabular-nums', danger ? 'text-red-300' : 'text-slate-300')}>
                        {r.marginLevel.toFixed(0)}%
                      </td>
                      <td className={cn('px-4 py-3 text-right font-mono tabular-nums', r.distToLiqPct < 1 ? 'text-red-300 font-bold' : 'text-slate-400')}>
                        {r.distToLiqPct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => closePos(r.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white bg-panel2 border border-edge rounded-lg px-2.5 py-1.5 transition"
                        >
                          <XCircle size={12} />
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-panel border border-edge rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-edge text-sm font-semibold text-white">Holdings</div>
        {pv.rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No holdings yet.{' '}
            <Link href="/" className="text-accent2 hover:underline font-semibold">
              Browse markets
            </Link>{' '}
            and place your first demo trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-edge">
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Avg cost</th>
                  <th className="px-4 py-3 font-semibold text-right">Live price</th>
                  <th className="px-4 py-3 font-semibold text-right">Value</th>
                  <th className="px-4 py-3 font-semibold text-right">P&L</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pv.rows.map((r) => {
                  const rup = r.pnl >= 0;
                  const isStock = !!stockBySymbol(r.symbol);
                  return (
                    <tr key={r.symbol} className="border-b border-edge/60 hover:bg-panel2/60 transition">
                      <td className="px-4 py-3 font-bold text-white">
                        {r.symbol}
                        {!isStock && <span className="text-slate-500 font-medium">/USD</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{fmtQty(r.qty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400 tabular-nums">{fmtUSD(r.avgCost)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200 tabular-nums">
                        {r.price > 0 ? fmtUSD(r.price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white tabular-nums">{fmtUSD(r.value)}</td>
                      <td className={cn('px-4 py-3 text-right font-mono font-semibold tabular-nums', rup ? 'text-up' : 'text-down')}>
                        {rup ? '+' : ''}
                        {fmtUSD(r.pnl)} ({rup ? '+' : ''}
                        {r.pnlPct.toFixed(2)}%)
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={isStock ? `/trade/${r.symbol}` : `/trade/${r.symbol}USD`}
                          className="text-xs font-semibold text-accent2 hover:underline"
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        Started with {fmtUSD(START_CASH, 0)} of demo cash · 0.1% demo fee per trade · leverage is simulated — no real money involved.
      </p>

      {/* Connect a real broker — coming soon */}
      <div className="mt-5 scanlines bg-panel border border-edge rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-void/40" />
        <div className="relative">
          <h2 className="font-bold text-white flex items-center gap-2">
            Connect a real broker
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 border border-edge rounded-full px-2 py-0.5">
              Coming soon
            </span>
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed max-w-2xl">
            Paper trading now. Real broker connections need exchange licensing — coming after launch.
            These are the brokers on our roadmap:
          </p>
          <div className="mt-4">
            <BrokerRegionChips />
          </div>
          <div className="mt-4">
            <BrokerNotifyButton />
          </div>
        </div>
      </div>
    </div>
  );
}
