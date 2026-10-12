// Seller → Promotion Controls (marketplace automation, Option A).
// Each seller controls their own discount / rewards / lucky-draw / spin-win
// campaigns: ON/OFF, budget, prize, dates, eligibility rules.
// A toggle is disabled when the PLATFORM master switch is OFF.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { getMySeller, type MySeller } from '@/lib/db/shop';
import { PROMO_FEATURES, formatPaise } from '@/lib/commission';
import { MarginCalculator } from './MarginCalculator';

type SwitchRow = { feature: string; enabled: boolean; note: string | null };
type PromoRow = {
  id: string; seller_id: string; feature: string; enabled: boolean;
  budget_paise: number; spend_paise: number; prize_text: string | null;
  starts_at: string | null; ends_at: string | null; eligibility_rules: string | null;
};

type FormState = {
  enabled: boolean; budgetRs: string; prize: string;
  startsAt: string; endsAt: string; rules: string;
};

const emptyForm = (enabled: boolean): FormState => ({
  enabled, budgetRs: '', prize: '', startsAt: '', endsAt: '', rules: '',
});

export default function SellerPromotions() {
  const { ready } = useAuth();
  const [seller, setSeller] = useState<MySeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState<Record<string, SwitchRow>>({});
  const [rows, setRows] = useState<Record<string, PromoRow>>({});
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const sb = getSupabase();
      if (!sb) { setLoading(false); return; }
      const s = await getMySeller();
      setSeller(s);
      const { data: sw } = await sb.from('sb_promo_switches').select('feature,enabled,note');
      const m: Record<string, SwitchRow> = {};
      (sw ?? []).forEach((r: SwitchRow) => { m[r.feature] = r; });
      setMasters(m);
      if (s) {
        const { data: pr } = await sb.from('sb_seller_promos').select('*').eq('seller_id', s.id);
        const rmap: Record<string, PromoRow> = {};
        const fmap: Record<string, FormState> = {};
        (pr ?? []).forEach((r: PromoRow) => {
          rmap[r.feature] = r;
          fmap[r.feature] = {
            enabled: r.enabled,
            budgetRs: r.budget_paise ? String(r.budget_paise / 100) : '',
            prize: r.prize_text ?? '',
            startsAt: r.starts_at ? r.starts_at.slice(0, 16) : '',
            endsAt: r.ends_at ? r.ends_at.slice(0, 16) : '',
            rules: r.eligibility_rules ?? '',
          };
        });
        setRows(rmap);
        setForms(fmap);
      }
      setLoading(false);
    })();
  }, [ready]);

  const formFor = (key: string): FormState =>
    forms[key] ?? emptyForm(rows[key]?.enabled ?? false);

  const setForm = (key: string, patch: Partial<FormState>) =>
    setForms((f) => ({ ...f, [key]: { ...formFor(key), ...patch } }));

  async function save(key: string) {
    if (!seller) return;
    const sb = getSupabase();
    if (!sb) return;
    const f = formFor(key);
    setSaving(key);
    setMsg(null);
    const payload = {
      seller_id: seller.id,
      feature: key,
      enabled: f.enabled,
      budget_paise: Math.max(0, Math.round(Number(f.budgetRs || 0) * 100)),
      prize_text: f.prize || null,
      starts_at: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      ends_at: f.endsAt ? new Date(f.endsAt).toISOString() : null,
      eligibility_rules: f.rules || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb
      .from('sb_seller_promos')
      .upsert(payload, { onConflict: 'seller_id,feature' });
    setSaving(null);
    if (error) {
      setMsg('❌ Save failed: ' + error.message);
    } else {
      setMsg('✅ Saved!');
      const { data: pr } = await sb.from('sb_seller_promos').select('*')
        .eq('seller_id', seller.id).eq('feature', key).maybeSingle();
      if (pr) setRows((r) => ({ ...r, [key]: pr as PromoRow }));
    }
  }

  if (!ready || loading) {
    return <div className="p-8 text-center text-gray-500">Loading… लोड हो रहा है…</div>;
  }

  const sb = getSupabase();
  if (!sb) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-lg font-bold">Database not connected</p>
        <p className="text-gray-500 mt-2">Promotions need Supabase. Please check the app configuration.</p>
        <Link href="/seller/dashboard" className="text-blue-600 underline mt-4 inline-block">← Back to dashboard</Link>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-lg font-bold">Seller account needed</p>
        <p className="text-gray-500 mt-2">Register as a seller first, then set up your promotions here.</p>
        <Link href="/seller/register" className="text-blue-600 underline mt-4 inline-block">Go to seller registration →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold">📢 Promotion Controls</h1>
        <Link href="/seller/dashboard" className="text-blue-600 underline text-sm">← Dashboard</Link>
      </div>
      <p className="text-gray-500 mb-6">
        Apne promotions khud control karo — ON/OFF, budget, prize, dates.
        <br />Control your own promotions — toggle, budget, prize, dates.
      </p>

      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-gray-100 text-center font-semibold">{msg}</div>
      )}

      <div className="space-y-5">
        {PROMO_FEATURES.map((feat) => {
          const master = masters[feat.key];
          const masterOn = master?.enabled ?? false;
          const f = formFor(feat.key);
          const row = rows[feat.key];
          const spend = row?.spend_paise ?? 0;
          const budget = row?.budget_paise ?? 0;
          const pct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
          const isLucky = feat.key === 'lucky_draw' || feat.key === 'spin_win';

          return (
            <div key={feat.key} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold">{feat.label}</h2>
                  <p className="text-sm text-gray-500">{feat.labelHi}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${masterOn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  Platform: {masterOn ? 'ON' : 'OFF'}
                </span>
              </div>

              {!masterOn && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  ⏸️ Platform ne ye feature abhi OFF rakha hai — isliye aap ise ON nahi kar sakte.
                  (This feature is OFF at platform level.)
                </p>
              )}

              {isLucky && masterOn && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  ⚖️ Lucky Draw / Spin & Win ke liye kripya apne campaign ke niyam saaf likhein.
                  Legal review chal raha hai — galat prize promise na karein.
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => setForm(feat.key, { enabled: !f.enabled })}
                  disabled={!masterOn}
                  className={`w-16 h-9 rounded-full font-bold text-sm transition ${!masterOn ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : f.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
                >
                  {f.enabled ? 'ON' : 'OFF'}
                </button>
                <span className="text-sm text-gray-600">
                  {f.enabled ? 'Chalu hai ✅' : 'Band hai ⏸️'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold">Budget (₹) — बजट</span>
                  <input
                    type="number" min="0" value={f.budgetRs}
                    onChange={(e) => setForm(feat.key, { budgetRs: e.target.value })}
                    placeholder="e.g. 5000"
                    className="mt-1 w-full border rounded-xl px-4 py-2.5"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Prize — इनाम</span>
                  <input
                    value={f.prize}
                    onChange={(e) => setForm(feat.key, { prize: e.target.value })}
                    placeholder="e.g. ₹500 gift voucher"
                    className="mt-1 w-full border rounded-xl px-4 py-2.5"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Start date — शुरू</span>
                  <input
                    type="datetime-local" value={f.startsAt}
                    onChange={(e) => setForm(feat.key, { startsAt: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-4 py-2.5"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">End date — खत्म</span>
                  <input
                    type="datetime-local" value={f.endsAt}
                    onChange={(e) => setForm(feat.key, { endsAt: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-4 py-2.5"
                  />
                </label>
              </div>

              <label className="block mt-3">
                <span className="text-sm font-semibold">Eligibility rules — शर्तें</span>
                <textarea
                  value={f.rules}
                  onChange={(e) => setForm(feat.key, { rules: e.target.value })}
                  placeholder="e.g. Minimum order ₹499. One entry per customer."
                  rows={2}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5"
                />
              </label>

              {budget > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Kharch / Spent: {formatPaise(spend)}</span>
                    <span>Budget: {formatPaise(budget)} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => save(feat.key)}
                disabled={saving === feat.key}
                className="mt-4 w-full bg-blue-600 text-white font-bold rounded-xl py-3 hover:bg-blue-700 disabled:opacity-50 text-lg"
              >
                {saving === feat.key ? 'Saving… ⏳' : '💾 Save — सेव करो'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <MarginCalculator />
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900">
        <p className="font-bold mb-1">💰 Commission yaad rakhein:</p>
        <p>NEW products: 10% (max ₹100/order) • OLD / Refurbished / Clearance: ₹1/piece.
        Commission har order par apne aap katega — aapko kuch nahi karna.</p>
      </div>
    </div>
  );
}
