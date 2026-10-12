// Admin console — Platform master promotion switches + automation overview.
// Master switch OFF = no seller can use that feature. Lucky Draw / Spin & Win
// need LEGAL REVIEW before enabling (warning banner, never auto-enabled).
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PROMO_FEATURES, formatPaise } from '@/lib/commission';
import { FeeSchedulesEditor } from './FeeSchedulesEditor';

type SwitchRow = { feature: string; enabled: boolean; note: string | null };

export default function AdminHome() {
  const { ready, role } = useAuth();
  const [switches, setSwitches] = useState<Record<string, SwitchRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ledgerTotal, setLedgerTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.from('sb_promo_switches').select('feature,enabled,note');
        const m: Record<string, SwitchRow> = {};
        (data ?? []).forEach((r: SwitchRow) => { m[r.feature] = r; });
        setSwitches(m);
        const { data: led } = await sb.from('sb_commission_ledger')
          .select('commission_paise').eq('status', 'pending').limit(1000);
        if (led) setLedgerTotal(led.reduce((s: number, r: any) => s + Number(r.commission_paise ?? 0), 0));
      }
      setLoading(false);
    })();
  }, [ready]);

  async function toggle(key: string, next: boolean) {
    const sb = getSupabase();
    if (!sb) return;
    setSaving(key);
    setMsg(null);
    const { error } = await sb.from('sb_promo_switches')
      .update({ enabled: next, updated_at: new Date().toISOString() })
      .eq('feature', key);
    setSaving(null);
    if (error) {
      setMsg('❌ Save failed: ' + error.message);
    } else {
      setSwitches((s) => ({ ...s, [key]: { ...s[key], enabled: next } }));
      setMsg(`✅ ${key} is now ${next ? 'ON' : 'OFF'} platform-wide.`);
    }
  }

  if (!ready || loading) {
    return <div className="p-8 text-center text-gray-500">Loading admin…</div>;
  }

  if (role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto p-10 text-center">
        <h1 className="text-2xl font-extrabold">🔒 Admin only</h1>
        <p className="text-gray-500 mt-2">This console needs an admin account.</p>
        <Link href="/" className="text-blue-600 underline mt-4 inline-block">← Home</Link>
      </div>
    );
  }

  const sb = getSupabase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold">⚙️ Admin — Platform Controls</h1>
      <p className="text-gray-500 mt-1 mb-6">Master switches, automation status, ledger overview.</p>

      {msg && <div className="mb-4 p-3 rounded-xl bg-gray-100 text-center font-semibold">{msg}</div>}

      {/* Legal warning */}
      <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl">
        <p className="font-extrabold text-red-800">⚖️ LEGAL REVIEW REQUIRED</p>
        <p className="text-sm text-red-700 mt-1">
          Lucky Draw aur Spin &amp; Win ko ON karne se PEHLE contest/lottery/consumer-protection
          kanoon check karwao (CA/lawyer). Ye switches kabhi auto-ON nahi honge.
          <br />Do NOT enable Lucky Draw / Spin &amp; Win until legal review is complete.
        </p>
      </div>

      {/* Master switches */}
      <h2 className="text-lg font-bold mb-3">🎚️ Promotion master switches</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PROMO_FEATURES.map((feat) => {
          const on = switches[feat.key]?.enabled ?? false;
          const needsLegal = feat.key === 'lucky_draw' || feat.key === 'spin_win';
          return (
            <div key={feat.key} className="border rounded-2xl p-5 bg-white shadow-sm">
              <h3 className="font-bold">{feat.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{switches[feat.key]?.note ?? ''}</p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => toggle(feat.key, !on)}
                  disabled={saving === feat.key}
                  className={`w-16 h-9 rounded-full font-bold text-sm ${on ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'} disabled:opacity-50`}
                >
                  {on ? 'ON' : 'OFF'}
                </button>
                {needsLegal && !on && (
                  <span className="text-xs text-amber-700 font-semibold">⚖️ Legal review pending</span>
                )}
              </div>
              {!on && (
                <p className="text-xs text-gray-500 mt-2">
                  OFF = koi seller ye feature use nahi kar sakta.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Automation status */}
      <h2 className="text-lg font-bold mb-3">🤖 Automation status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-2xl p-5 bg-white shadow-sm">
          <h3 className="font-bold">Commission ledger</h3>
          <p className="text-sm text-gray-500 mt-1">
            Har order par commission apne aap record hota hai (sb_commission_ledger).
          </p>
          <p className="text-2xl font-extrabold mt-2 text-green-700">
            {ledgerTotal === null ? '—' : formatPaise(ledgerTotal)}
          </p>
          <p className="text-xs text-gray-500">pending commission (recent 1000 rows)</p>
        </div>
        <div className="border rounded-2xl p-5 bg-amber-50 border-amber-200 shadow-sm">
          <h3 className="font-bold">💳 Real money — TODO</h3>
          <p className="text-sm text-amber-800 mt-1">
            Ledger sirf hisaab rakhta hai. Asli payout ke liye:
          </p>
          <ul className="text-sm text-amber-800 mt-2 list-disc ml-5 space-y-1">
            <li>Stripe / Razorpay account connect karo (settings me)</li>
            <li>CA se tax (GST/HST) sign-off lo</li>
            <li>Tabhi payout status 'paid' mark karo</li>
          </ul>
        </div>
      </div>

      {/* Fee schedules */}
      <div className="mt-8 mb-8">
        <FeeSchedulesEditor />
      </div>

      {/* Sub-consoles */}
      <h2 className="text-lg font-bold mb-3">📂 Consoles</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/ai-manager', label: '🤖 AI Manager' },
          { href: '/admin/bikers', label: '🚴 Bikers' },
          { href: '/admin/sourcing', label: '🌍 Sourcing' },
          { href: '/admin/feedback', label: '💬 Feedback' },
        ].map((c) => (
          <Link key={c.href} href={c.href}
            className="border rounded-2xl p-4 bg-white shadow-sm text-center font-bold hover:bg-gray-50">
            {c.label}
          </Link>
        ))}
      </div>

      {!sb && (
        <p className="mt-6 text-sm text-red-600">⚠️ Supabase not configured — switches need the database.</p>
      )}
    </div>
  );
}
