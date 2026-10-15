// SastaBazaar Wallet helpers (Update 22).
// Supabase-first; falls back to localStorage demo when signed out / DB unreachable.
// HONEST: cash top-ups are DEMO until a real payment gateway (Razorpay) is connected.
'use client';

import { getSupabase } from './supabase';

export type WalletState = {
  cash: number;
  points: number;
  txns: { id: string; kind: 'cash' | 'reward'; amount: number; reason: string; created_at: string }[];
  demo: boolean; // true = localStorage demo (not signed in / no DB)
};

const LS_KEY = 'sb-wallet-demo';

function demoState(): WalletState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { cash: 0, points: 0, txns: [], demo: true };
}
function saveDemo(s: WalletState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export async function getWalletState(userId: string | null): Promise<WalletState> {
  const sb = getSupabase();
  if (!sb || !userId) return demoState();
  try {
    const { data: w } = await sb.from('wallets').select('cash_balance,reward_points').eq('user_id', userId).single();
    const { data: t } = await sb.from('wallet_txns')
      .select('id,kind,amount,reason,created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(50);
    if (!w) return demoState();
    return {
      cash: Number(w.cash_balance) || 0,
      points: Number(w.reward_points) || 0,
      txns: (t ?? []).map((x: any) => ({ ...x, amount: Number(x.amount) })),
      demo: false,
    };
  } catch { return demoState(); }
}

async function record(userId: string | null, kind: 'cash' | 'reward', amount: number, reason: string, meta: any = {}) {
  const sb = getSupabase();
  if (sb && userId) {
    try {
      await sb.from('wallet_txns').insert({ user_id: userId, kind, amount, reason, meta });
      const col = kind === 'cash' ? 'cash_balance' : 'reward_points';
      const cur = await sb.from('wallets').select(col).eq('user_id', userId).single();
      const next = (Number((cur.data as Record<string, any> | null)?.[col]) || 0) + amount;
      await sb.from('wallets').update({ [col]: next, updated_at: new Date().toISOString() }).eq('user_id', userId);
      return;
    } catch { /* fall through to demo */ }
  }
  const s = demoState();
  if (kind === 'cash') s.cash += amount; else s.points += amount;
  s.txns.unshift({ id: 'demo-' + Date.now(), kind, amount, reason, created_at: new Date().toISOString() });
  s.txns = s.txns.slice(0, 50);
  saveDemo(s);
}

/** Award reward points (paper money — loyalty points, NO promised value). */
export function awardPoints(userId: string | null, points: number, reason: string) {
  if (points <= 0) return Promise.resolve();
  return record(userId, 'reward', points, reason);
}

/** Map a spin-wheel result label → reward points. */
export function awardSpinReward(label: string, userId: string | null) {
  const pts = label.includes('Jackpot!') ? 100 : /try again/i.test(label) ? 0 : 10;
  if (pts > 0) void awardPoints(userId, pts, `Spin & Win: ${label}`);
}

/** DEMO cash top-up (real UPI/cards need Razorpay — Phase 2). */
export function addCashDemo(userId: string | null, amount: number) {
  return record(userId, 'cash', amount, 'Demo top-up (testing only)', { demo: true });
}

export function formatINR(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
