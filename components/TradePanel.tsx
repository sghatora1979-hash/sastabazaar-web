'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, BadgeDollarSign, TriangleAlert, ShieldAlert, X } from 'lucide-react';
import {
  FEE_RATE,
  LEVERAGE_STEPS,
  MAX_LEVERAGE,
  fmtQty,
  fmtUSD,
  liquidationPrice,
  wipeoutPct,
  type TradeResult,
  type PosSide,
} from '@/lib/quasar';
import { cn } from '@/lib/utils';

type Props = {
  symbol: string;
  price: number;
  cash: number;
  holdingQty: number;
  onTrade: (side: 'buy' | 'sell', amount: number, mode: 'usd' | 'coin') => TradeResult;
  onLeveraged?: (dir: PosSide, marginUsd: number, leverage: number) => TradeResult;
  /** When false, the leverage selector is hidden (spot trading only). Default true. */
  allowLeverage?: boolean;
  /** Optional display label for the market price row (e.g. native currency for stocks). */
  priceLabel?: string;
};

const RISK_ACK_KEY = 'quasar-lev-risk-ack';

export function TradePanel({ symbol, price, cash, holdingQty, onTrade, onLeveraged, allowLeverage = true, priceLabel }: Props) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [dir, setDir] = useState<PosSide>('long');
  const [mode, setMode] = useState<'usd' | 'coin'>('usd');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [riskAck, setRiskAck] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    try {
      setRiskAck(window.localStorage.getItem(RISK_ACK_KEY) === '1');
    } catch {
      setRiskAck(true);
    }
  }, []);

  const dismissRisk = () => {
    setRiskAck(true);
    try {
      window.localStorage.setItem(RISK_ACK_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const amt = parseFloat(amount) || 0;
  const isLev = leverage > 1;

  const preview = useMemo(() => {
    if (!(amt > 0) || !(price > 0)) return null;
    if (!isLev) {
      if (side === 'buy') {
        const usd = mode === 'usd' ? amt : amt * price;
        const fee = usd * FEE_RATE;
        const qty = (usd - fee) / price;
        return { kind: 'spot' as const, usd, fee, qty, label: `You receive ≈ ${fmtQty(qty)} ${symbol}` };
      }
      const qty = mode === 'coin' ? amt : amt / price;
      const gross = qty * price;
      const fee = gross * FEE_RATE;
      return { kind: 'spot' as const, usd: gross, fee, qty, label: `You receive ≈ ${fmtUSD(gross - fee)}` };
    }
    // Leveraged: amount = margin USD.
    const margin = amt;
    const fee = margin * FEE_RATE;
    const notional = (margin - fee) * leverage;
    const qty = notional / price;
    const liq = liquidationPrice(price, dir, leverage);
    return {
      kind: 'lev' as const,
      usd: margin,
      fee,
      qty,
      notional,
      liq,
      label: `Position ≈ ${fmtQty(qty)} ${symbol} (${fmtUSD(notional)} notional)`,
    };
  }, [amt, mode, price, side, dir, symbol, leverage, isLev]);

  const submit = () => {
    setMsg(null);
    if (!isLev) {
      const res = onTrade(side, amt, mode);
      if (res.ok) {
        setMsg({ ok: true, text: `${side === 'buy' ? 'Bought' : 'Sold'} ${fmtQty(res.order.qty)} ${symbol} @ ${fmtUSD(res.order.price)} (demo fill)` });
        setAmount('');
      } else {
        setMsg({ ok: false, text: res.error });
      }
      return;
    }
    if (!onLeveraged) {
      setMsg({ ok: false, text: 'Leveraged trading unavailable here.' });
      return;
    }
    const res = onLeveraged(dir, amt, leverage);
    if (res.ok) {
      setMsg({
        ok: true,
        text: `Opened ${leverage}x ${dir.toUpperCase()} ${fmtQty(res.order.qty)} ${symbol} @ ${fmtUSD(res.order.price)} — margin ${fmtUSD(amt)} (demo)`,
      });
      setAmount('');
    } else {
      setMsg({ ok: false, text: res.error });
    }
  };

  const maxHint = isLev
    ? `Margin available: ${fmtUSD(cash)}`
    : side === 'buy'
      ? `Available: ${fmtUSD(cash)}`
      : `Available: ${fmtQty(holdingQty)} ${symbol}`;

  const wipe = wipeoutPct(leverage);

  return (
    <div className="bg-panel border border-edge rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 flex items-center justify-between">
        <div className="flex bg-void rounded-xl p-1 gap-1">
          {!isLev
            ? (['buy', 'sell'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSide(s); setMsg(null); }}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-bold capitalize transition flex items-center gap-1.5',
                    side === s
                      ? s === 'buy'
                        ? 'bg-up/20 text-up'
                        : 'bg-down/20 text-down'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {s === 'buy' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                  {s}
                </button>
              ))
            : (['long', 'short'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDir(d); setMsg(null); }}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-bold capitalize transition flex items-center gap-1.5',
                    dir === d
                      ? d === 'long'
                        ? 'bg-up/20 text-up'
                        : 'bg-down/20 text-down'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {d === 'long' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                  {d}
                </button>
              ))}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-1">
          Demo
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Leverage selector (hidden when allowLeverage is false, e.g. stocks) */}
        {allowLeverage && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">Leverage</span>
            <span className="text-xs font-mono font-bold text-accent">{leverage}x</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {LEVERAGE_STEPS.map((L) => (
              <button
                key={L}
                onClick={() => { setLeverage(L); setMsg(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold font-mono whitespace-nowrap border transition',
                  leverage === L
                    ? L >= 50
                      ? 'bg-red-500/20 border-red-400/60 text-red-300'
                      : 'bg-accent/20 border-accent/60 text-accent'
                    : 'bg-void border-edge text-slate-400 hover:text-white hover:border-slate-500'
                )}
              >
                {L}x
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Paper trading only — max {MAX_LEVERAGE}x demo leverage.</p>
        </div>
        )}

        {/* First-use risk education banner */}
        {isLev && !riskAck && (
          <div className="relative text-xs rounded-xl px-3 py-3 pr-9 border text-amber-200 bg-amber-400/10 border-amber-400/40">
            <div className="flex items-start gap-2">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <p>
                <span className="font-bold">Leverage multiplies losses too.</span> 1:500 = wiped out by a
                0.2% move. This is paper trading — never try this with real money.
              </p>
            </div>
            <button
              onClick={dismissRisk}
              aria-label="Dismiss risk warning"
              className="absolute top-2 right-2 text-amber-300/70 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Escalating risk warning */}
        {isLev && leverage >= 50 && (
          <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5 border text-red-200 bg-red-500/10 border-red-500/50">
            <TriangleAlert size={15} className="shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Extreme risk:</span> a {wipe < 0.01 ? wipe.toFixed(3) : wipe.toFixed(2)}%
              move against you = <span className="font-bold">total loss</span> of your margin.
              {leverage === 500 && ' At 500x, normal market noise alone can liquidate you.'}
            </p>
          </div>
        )}
        {isLev && leverage > 1 && leverage < 50 && (
          <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5 border text-amber-200/90 bg-amber-400/5 border-amber-400/25">
            <TriangleAlert size={14} className="shrink-0 mt-0.5" />
            <p>
              {leverage}x leverage: a {wipe.toFixed(1)}% adverse move wipes your margin. Losses are multiplied
              just like gains.
            </p>
          </div>
        )}

        {!isLev && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex bg-void rounded-lg p-0.5 gap-0.5">
              {(['usd', 'coin'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'px-3 py-1.5 rounded-md font-semibold transition',
                    mode === m ? 'bg-panel2 text-white' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {m === 'usd' ? 'USD' : symbol}
                </button>
              ))}
            </div>
            <span>{maxHint}</span>
          </div>
        )}
        {isLev && (
          <div className="flex items-center justify-end text-xs text-slate-400">
            <span>{maxHint}</span>
          </div>
        )}

        <div className="relative">
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-void border border-edge rounded-xl px-4 py-3.5 text-lg font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/60"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">
            {isLev ? 'USD margin' : mode === 'usd' ? 'USD' : symbol}
          </span>
        </div>

        {!isLev && (
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 25, 50, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  if (side === 'buy') {
                    const usd = (cash * pct) / 100;
                    setAmount(mode === 'usd' ? usd.toFixed(2) : (usd / (price || 1)).toFixed(6));
                  } else {
                    const q = (holdingQty * pct) / 100;
                    setAmount(mode === 'coin' ? q.toFixed(6) : (q * (price || 0)).toFixed(2));
                  }
                }}
                className="text-[11px] font-semibold text-slate-400 bg-void border border-edge rounded-lg py-1.5 hover:text-white hover:border-slate-500 transition"
              >
                {pct}%
              </button>
            ))}
          </div>
        )}
        {isLev && (
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 25, 50, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setAmount(((cash * pct) / 100).toFixed(2))}
                className="text-[11px] font-semibold text-slate-400 bg-void border border-edge rounded-lg py-1.5 hover:text-white hover:border-slate-500 transition"
              >
                {pct}%
              </button>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-400 space-y-1 bg-void/60 rounded-xl p-3">
          <div className="flex justify-between">
            <span>{isLev ? 'Reference price' : 'Market price'}</span>
            <span className="font-mono text-slate-200">{priceLabel ?? (price > 0 ? fmtUSD(price, 6) : '—')}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <BadgeDollarSign size={12} /> Demo fee (0.1%)
            </span>
            <span className="font-mono text-slate-200">{preview ? fmtUSD(preview.fee) : '—'}</span>
          </div>
          {preview && preview.kind === 'lev' && (
            <>
              <div className="flex justify-between">
                <span>Notional ({leverage}x)</span>
                <span className="font-mono text-slate-200">{fmtUSD(preview.notional)}</span>
              </div>
              <div className="flex justify-between">
                <span>Liquidation price</span>
                <span className="font-mono text-red-300">{fmtUSD(preview.liq, 6)}</span>
              </div>
            </>
          )}
          {preview && (
            <div className="flex justify-between font-semibold text-slate-200 pt-1 border-t border-edge">
              <span>{preview.kind === 'lev' ? 'Position' : 'Receive'}</span>
              <span className="font-mono text-right">{preview.label.replace('You receive ≈ ', '')}</span>
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!(amt > 0) || !(price > 0)}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed',
            !isLev
              ? side === 'buy'
                ? 'bg-up hover:bg-up/85'
                : 'bg-down hover:bg-down/85'
              : dir === 'long'
                ? 'bg-up hover:bg-up/85'
                : 'bg-down hover:bg-down/85'
          )}
        >
          {!isLev
            ? `${side === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`} · Demo`
            : `${dir === 'long' ? 'Long' : 'Short'} ${symbol} ${leverage}x · Demo`}
        </button>

        {msg && (
          <div
            className={cn(
              'text-xs rounded-xl px-3 py-2.5 border',
              msg.ok ? 'text-up bg-up/10 border-up/30' : 'text-down bg-down/10 border-down/30'
            )}
          >
            {msg.text}
          </div>
        )}
        <p className="text-[11px] text-slate-500 text-center">
          Paper trading — no real money moves. {isLev ? 'Leveraged fills are simulated instantly.' : 'Orders fill instantly at the live market price.'}
        </p>
      </div>
    </div>
  );
}
