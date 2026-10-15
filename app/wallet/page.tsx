'use client';
// SastaBazaar Wallet page (Update 22).
// Shows cash balance + reward points + history. Demo money until Razorpay.
// HONEST: reward points are loyalty points (paper money) — NO promised future value.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getWalletState, addCashDemo, formatINR, type WalletState } from '@/lib/wallet';
import { Wallet, Coins, Plus, Gift, History, Info, Sparkles } from 'lucide-react';

export default function WalletPage() {
  const { user, ready } = useAuth();
  const [w, setW] = useState<WalletState | null>(null);
  const [adding, setAdding] = useState(false);

  const reload = () => getWalletState(user?.id ?? null).then(setW);
  useEffect(() => { if (ready) void reload(); }, [ready, user?.id]);

  const demoTopup = async (amt: number) => {
    setAdding(true);
    await addCashDemo(user?.id ?? null, amt);
    await reload();
    setAdding(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Wallet className="text-[var(--primary)]" size={30} />
        <h1 className="text-3xl font-extrabold">My Wallet</h1>
      </div>
      <p className="text-gray-500 mb-6">One wallet for customers, sellers, riders & drivers. Auto-created when you register.</p>

      {w?.demo && (
        <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex gap-2">
          <Info size={18} className="shrink-0 mt-0.5" />
          <span><b>Demo mode</b> — sign in to save your wallet online. Balances shown are for testing.</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-3xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#FF6B35,#FFA53C)' }}>
          <div className="text-sm opacity-90">💰 Cash balance</div>
          <div className="text-4xl font-black mt-1">{w ? formatINR(w.cash) : '…'}</div>
          <div className="text-xs opacity-80 mt-2">Add via UPI / cards — coming soon</div>
        </div>
        <div className="rounded-3xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#7C3AED,#B45309)' }}>
          <div className="text-sm opacity-90">🪙 Reward points</div>
          <div className="text-4xl font-black mt-1">{w ? w.points.toLocaleString('en-IN') : '…'}</div>
          <div className="text-xs opacity-80 mt-2">Earned from Spin & Win (paper money)</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex gap-2 items-center rounded-2xl border p-2">
          <span className="text-sm font-semibold px-2">Add money (demo):</span>
          {[100, 500].map((a) => (
            <button key={a} disabled={adding} onClick={() => demoTopup(a)}
              className="rounded-xl bg-[var(--primary)] text-white text-sm font-bold px-4 py-2 disabled:opacity-50">
              +{formatINR(a)}
            </button>
          ))}
        </div>
        <Link href="/spin-and-win" className="rounded-2xl border-2 border-dashed border-[var(--primary)] px-5 py-3 font-bold text-[var(--primary)] flex items-center gap-2">
          <Gift size={18} /> Daily Spin & Win
        </Link>
      </div>

      <div className="rounded-3xl border p-5 mb-6 bg-violet-50/60">
        <div className="flex gap-2 items-center font-bold mb-1"><Sparkles size={18} className="text-violet-600" /> Reward points value</div>
        <p className="text-sm text-gray-600">
          Reward points are <b>loyalty points</b> (paper money) — they have <b>no rupee value today</b>.
          If SastaBazaar ever announces a revenue-linked conversion in the future, the exact formula
          will be published here first. <b>No promise is being made now.</b>
        </p>
      </div>

      <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><History size={18} /> History</h2>
      {!w || w.txns.length === 0 ? (
        <p className="text-gray-400 text-sm">No transactions yet — spin the wheel or add demo money to begin.</p>
      ) : (
        <div className="space-y-2">
          {w.txns.map((t) => (
            <div key={t.id} className="flex justify-between items-center rounded-2xl border px-4 py-3 text-sm">
              <div>
                <div className="font-semibold">{t.kind === 'cash' ? '💰 Cash' : '🪙 Reward'} — {t.reason}</div>
                <div className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleString('en-IN')}</div>
              </div>
              <div className={`font-black ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {t.amount >= 0 ? '+' : ''}{t.kind === 'cash' ? formatINR(t.amount) : t.amount.toLocaleString('en-IN') + ' pts'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-3xl bg-gray-50 border p-5 text-sm text-gray-600">
        <b>🔌 Real money (UPI / PhonePe / Paytm / cards):</b> needs a payment gateway (Razorpay)
        + business registration + RBI compliance. The button above is demo-only until then.
      </div>
    </div>
  );
}
