// Quasar paper-trading engine — DEMO ONLY. No real money, no real orders.
// All state lives in the browser's localStorage under QUASAR_KEY.

export const START_CASH = 100000;
export const FEE_RATE = 0.001; // 0.1% demo fee
export const MAX_LEVERAGE = 500;
const QUASAR_KEY = 'quasar-paper-v1';

export type Side = 'buy' | 'sell';
export type PosSide = 'long' | 'short';

export type Holding = {
  symbol: string;
  qty: number;
  avgCost: number; // average buy price in USD
};

export type PaperOrder = {
  id: string;
  time: number; // epoch ms
  pair: string; // e.g. BTCUSD or EURUSD
  symbol: string; // e.g. BTC or EUR
  side: Side;
  price: number; // execution price USD
  qty: number; // base quantity
  usd: number; // gross USD value (notional for leveraged)
  fee: number; // USD fee charged
  leverage?: number; // 1 = spot (omitted for old spot orders)
  status: 'filled' | 'liquidated'; // demo fills instantly
};

export type Position = {
  id: string;
  time: number;
  pair: string; // e.g. BTCUSD
  symbol: string; // e.g. BTC
  side: PosSide;
  entry: number; // entry price
  qty: number; // base units = notional / entry
  margin: number; // USD collateral locked (after open fee)
  leverage: number; // 1..500
  liqPrice: number; // auto-liquidation price
  fee: number; // open fee paid
};

export type Snapshot = { t: number; equity: number };

export type PaperState = {
  cash: number;
  holdings: Record<string, Holding>;
  positions: Position[];
  orders: PaperOrder[];
  snapshots: Snapshot[];
  createdAt: number;
};

function blankState(): PaperState {
  return { cash: START_CASH, holdings: {}, positions: [], orders: [], snapshots: [], createdAt: Date.now() };
}

export function loadState(): PaperState {
  if (typeof window === 'undefined') return blankState();
  try {
    const raw = window.localStorage.getItem(QUASAR_KEY);
    if (!raw) return blankState();
    const s = JSON.parse(raw) as PaperState;
    if (typeof s.cash !== 'number' || !s.holdings || !Array.isArray(s.orders)) return blankState();
    // Migration-safe: old states have no positions array.
    if (!Array.isArray(s.positions)) s.positions = [];
    return s;
  } catch {
    return blankState();
  }
}

export function saveState(s: PaperState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QUASAR_KEY, JSON.stringify(s));
  } catch {
    /* storage full/blocked — demo continues in memory */
  }
}

export function resetState(): PaperState {
  const s = blankState();
  saveState(s);
  return s;
}

/** Top up demo cash to $100,000 (never reduces a higher balance). Existing data untouched otherwise. */
export function topUpState(s: PaperState): PaperState {
  if (s.cash < START_CASH) {
    s.cash = START_CASH;
    saveState(s);
  }
  return s;
}

const uid = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export type TradeResult = { ok: true; order: PaperOrder } | { ok: false; error: string };

/** Market BUY: spend `usd` (fee included in the debit). */
export function paperBuy(s: PaperState, symbol: string, usd: number, price: number, pairLabel?: string): TradeResult {
  if (!(usd > 0)) return { ok: false, error: 'Enter an amount above $0.' };
  if (!(price > 0)) return { ok: false, error: 'Live price unavailable — try again in a moment.' };
  if (usd > s.cash + 1e-9) return { ok: false, error: 'Not enough demo cash for this order.' };
  const fee = usd * FEE_RATE;
  const qty = (usd - fee) / price;
  const h = s.holdings[symbol];
  const newQty = (h?.qty ?? 0) + qty;
  const newCost = ((h?.qty ?? 0) * (h?.avgCost ?? 0) + (usd - fee)) / newQty;
  s.holdings[symbol] = { symbol, qty: newQty, avgCost: newCost };
  s.cash = Math.max(0, s.cash - usd);
  const order: PaperOrder = {
    id: uid(),
    time: Date.now(),
    pair: pairLabel ?? `${symbol}USD`,
    symbol,
    side: 'buy',
    price,
    qty,
    usd,
    fee,
    status: 'filled',
  };
  s.orders.unshift(order);
  saveState(s);
  return { ok: true, order };
}

/** Market SELL: sell `qty` units at `price`. */
export function paperSell(s: PaperState, symbol: string, qty: number, price: number, pairLabel?: string): TradeResult {
  if (!(qty > 0)) return { ok: false, error: 'Enter a quantity above 0.' };
  if (!(price > 0)) return { ok: false, error: 'Live price unavailable — try again in a moment.' };
  const h = s.holdings[symbol];
  if (!h || h.qty < qty - 1e-12) return { ok: false, error: `Not enough ${symbol} in your demo portfolio.` };
  const gross = qty * price;
  const fee = gross * FEE_RATE;
  const net = gross - fee;
  const left = h.qty - qty;
  if (left <= 1e-9) delete s.holdings[symbol];
  else s.holdings[symbol] = { ...h, qty: left };
  s.cash += net;
  const order: PaperOrder = {
    id: uid(),
    time: Date.now(),
    pair: pairLabel ?? `${symbol}USD`,
    symbol,
    side: 'sell',
    price,
    qty,
    usd: gross,
    fee,
    status: 'filled',
  };
  s.orders.unshift(order);
  saveState(s);
  return { ok: true, order };
}

// ---------- Leveraged positions (paper only) ----------

export const LEVERAGE_STEPS = [1, 5, 10, 25, 50, 100, 200, 500];

/** Fee buffer baked into the liquidation price (covers round-trip demo fees). */
const LIQ_FEE_BUFFER = FEE_RATE;

/** Liquidation price: adverse move of 1/L (minus a small fee buffer) wipes the margin. */
export function liquidationPrice(entry: number, side: PosSide, leverage: number): number {
  const L = Math.min(Math.max(leverage, 1), MAX_LEVERAGE);
  return side === 'long'
    ? entry * (1 - 1 / L + LIQ_FEE_BUFFER)
    : entry * (1 + 1 / L - LIQ_FEE_BUFFER);
}

/** Open a leveraged LONG/SHORT. `marginUsd` is collateral debited from cash. */
export function openPosition(
  s: PaperState,
  symbol: string,
  side: PosSide,
  marginUsd: number,
  leverage: number,
  price: number
): TradeResult {
  const L = Math.round(leverage);
  if (!(marginUsd > 0)) return { ok: false, error: 'Enter a margin above $0.' };
  if (!(price > 0)) return { ok: false, error: 'Live price unavailable — try again in a moment.' };
  if (L < 1 || L > MAX_LEVERAGE) return { ok: false, error: `Leverage must be 1–${MAX_LEVERAGE}x.` };
  if (marginUsd > s.cash + 1e-9) return { ok: false, error: 'Not enough demo cash for this margin.' };
  const fee = marginUsd * FEE_RATE;
  const margin = marginUsd - fee;
  const notional = margin * L;
  const qty = notional / price;
  const liqPrice = liquidationPrice(price, side, L);
  s.cash = Math.max(0, s.cash - marginUsd);
  const pos: Position = {
    id: uid(),
    time: Date.now(),
    pair: `${symbol}USD`,
    symbol,
    side,
    entry: price,
    qty,
    margin,
    leverage: L,
    liqPrice,
    fee,
  };
  s.positions.unshift(pos);
  const order: PaperOrder = {
    id: uid(),
    time: Date.now(),
    pair: pos.pair,
    symbol,
    side: side === 'long' ? 'buy' : 'sell',
    price,
    qty,
    usd: notional,
    fee,
    leverage: L,
    status: 'filled',
  };
  s.orders.unshift(order);
  saveState(s);
  return { ok: true, order };
}

export type CloseResult = { ok: true; pnl: number; credit: number } | { ok: false; error: string };

/** Close a position at `price`. reason 'liquidated' marks the order accordingly. */
export function closePosition(
  s: PaperState,
  id: string,
  price: number,
  reason: 'manual' | 'liquidated' = 'manual'
): CloseResult {
  const idx = s.positions.findIndex((p) => p.id === id);
  if (idx < 0) return { ok: false, error: 'Position not found.' };
  if (!(price > 0)) return { ok: false, error: 'Live price unavailable — try again in a moment.' };
  const pos = s.positions[idx];
  const notional = pos.qty * pos.entry;
  const gross = pos.qty * price;
  const rawPnl = pos.side === 'long' ? gross - notional : notional - gross;
  const closeFee = gross * FEE_RATE;
  const pnl = rawPnl - closeFee;
  const credit = Math.max(0, pos.margin + pnl);
  s.positions.splice(idx, 1);
  s.cash += credit;
  s.orders.unshift({
    id: uid(),
    time: Date.now(),
    pair: pos.pair,
    symbol: pos.symbol,
    side: pos.side === 'long' ? 'sell' : 'buy',
    price,
    qty: pos.qty,
    usd: gross,
    fee: closeFee,
    leverage: pos.leverage,
    status: reason === 'liquidated' ? 'liquidated' : 'filled',
  });
  saveState(s);
  return { ok: true, pnl, credit };
}

/** Unrealized P&L + margin health for an open position at `price`. */
export function positionPnl(pos: Position, price: number) {
  const notional = pos.qty * pos.entry;
  const gross = pos.qty * (price > 0 ? price : pos.entry);
  const raw = pos.side === 'long' ? gross - notional : notional - gross;
  const pnl = raw - gross * FEE_RATE;
  const pnlPct = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
  // Margin level: equity in position vs margin, as %.
  const marginLevel = pos.margin > 0 ? ((pos.margin + pnl) / pos.margin) * 100 : 0;
  // Distance from current price to liquidation, as % of current price.
  const distToLiqPct =
    price > 0
      ? pos.side === 'long'
        ? ((price - pos.liqPrice) / price) * 100
        : ((pos.liqPrice - price) / price) * 100
      : 0;
  return { pnl, pnlPct, marginLevel, distToLiqPct };
}

/**
 * Auto-liquidate positions whose liquidation price was touched.
 * Mutates `s` (removes positions, adjusts cash, appends orders) and saves.
 * Returns the liquidated positions.
 */
export function checkLiquidations(
  s: PaperState,
  prices: Record<string, number>
): { liquidated: Position[] } {
  const liquidated: Position[] = [];
  for (const pos of [...s.positions]) {
    const px = prices[pos.symbol];
    if (!(px > 0)) continue;
    const hit = pos.side === 'long' ? px <= pos.liqPrice : px >= pos.liqPrice;
    if (hit) {
      const r = closePosition(s, pos.id, pos.liqPrice, 'liquidated');
      if (r.ok) liquidated.push(pos);
    }
  }
  return { liquidated };
}

/** Portfolio math given a map of live prices (symbol -> USD). Includes open positions. */
export function portfolioValue(s: PaperState, prices: Record<string, number>) {
  let holdingsValue = 0;
  let costBasis = 0;
  const rows = Object.values(s.holdings).map((h) => {
    const px = prices[h.symbol] ?? 0;
    const value = h.qty * px;
    const cost = h.qty * h.avgCost;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    holdingsValue += value;
    costBasis += cost;
    return { ...h, price: px, value, cost, pnl, pnlPct };
  });
  // Open leveraged positions: margin + unrealized P&L counts toward equity.
  let positionsMargin = 0;
  let positionsPnl = 0;
  const posRows = s.positions.map((pos) => {
    const px = prices[pos.symbol] ?? pos.entry;
    const m = positionPnl(pos, px);
    positionsMargin += pos.margin;
    positionsPnl += m.pnl;
    return { ...pos, price: px, ...m };
  });
  const equity = s.cash + holdingsValue + positionsMargin + positionsPnl;
  const totalPnl = equity - START_CASH;
  const totalPnlPct = (totalPnl / START_CASH) * 100;
  return { rows, posRows, cash: s.cash, holdingsValue, positionsMargin, positionsPnl, costBasis, equity, totalPnl, totalPnlPct };
}

/** Append an equity snapshot (cap history at ~500 points). */
export function recordSnapshot(s: PaperState, equity: number): PaperState {
  const last = s.snapshots[s.snapshots.length - 1];
  if (last && Math.abs(last.equity - equity) < 0.005 && Date.now() - last.t < 60_000) return s;
  s.snapshots.push({ t: Date.now(), equity });
  if (s.snapshots.length > 500) s.snapshots = s.snapshots.slice(-500);
  saveState(s);
  return s;
}

export const fmtUSD = (n: number, dp = 2) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dp, maximumFractionDigits: dp });

export const fmtQty = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });

/** % adverse move that wipes a leveraged position, e.g. 500x -> 0.2%. */
export const wipeoutPct = (leverage: number) => 100 / Math.max(1, leverage);
