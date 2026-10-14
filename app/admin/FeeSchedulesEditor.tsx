'use client';

// Admin → Fee Schedules editor — PRICING ENGINE v2 (2026-10-12).
// Platform admin edits per-category commission rates (commercial rates,
// NOT government-fixed). Saves to sb_fee_schedules.

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { CATEGORY_RATES } from '@/lib/commission';

type FeeRow = { category: string; rate_bps: number; cap_paise: number };

const CATEGORY_LABELS: Record<string, string> = {
  grocery: '🛒 Grocery / FMCG',
  fmcg: '🛒 FMCG',
  medicines: '💊 Medicines',
  electronics: '💻 Electronics',
  home: '🏠 Home & Kitchen',
  beauty: '💄 Beauty',
  toys: '🧸 Toys',
  sports: '⚽ Sports',
  books: '📚 Books',
  fashion: '👗 Fashion',
  default: '📦 Default (others)',
};

export function FeeSchedulesEditor() {
  const sb = getSupabase();
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    if (sb) {
      const { data } = await sb.from('sb_fee_schedules').select('category,rate_bps,cap_paise').order('category');
      if (data && data.length) {
        setRows(data as FeeRow[]);
        setLoading(false);
        return;
      }
    }
    // Code fallback (migration 008 not run yet)
    setRows(Object.entries(CATEGORY_RATES).map(([category, rate]) => ({
      category, rate_bps: Math.round(rate * 10000), cap_paise: 10000,
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(row: FeeRow) {
    if (!sb) { setMsg('Supabase not configured.'); return; }
    setSaving(row.category);
    setMsg(null);
    const { error } = await sb.from('sb_fee_schedules')
      .upsert({ category: row.category, rate_bps: row.rate_bps, cap_paise: row.cap_paise, updated_at: new Date().toISOString() });
    setSaving(null);
    setMsg(error ? `Error: ${error.message}` : `Saved ${row.category} ✓`);
  }

  function setRate(category: string, pctStr: string) {
    const pct = Number(pctStr);
    if (isNaN(pct) || pct < 0 || pct > 50) return;
    setRows((rs) => rs.map((r) => r.category === category ? { ...r, rate_bps: Math.round(pct * 100) } : r));
  }

  if (loading) return <p className="text-gray-500">Loading fee schedules…</p>;

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <h2 className="text-lg font-extrabold mb-1">💰 Fee Schedules <span className="text-sm font-normal text-gray-500">/ कमीशन दरें</span></h2>
      <p className="text-sm text-gray-500 mb-4">
        Ye <b>commercial</b> rates hain (seller agreement ke hisaab se) — <b>sarkari tay dar NAHI</b>.
        <br />These are commercial rates per your seller agreement — not government-fixed.
      </p>
      {!sb && <p className="text-sm text-amber-700 mb-3">⚠️ Showing code defaults — run migration 008 to make them editable.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-2">Category</th>
              <th className="py-2 pr-2">Rate %</th>
              <th className="py-2 pr-2">Cap ₹</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category} className="border-b last:border-0">
                <td className="py-2 pr-2 font-semibold">{CATEGORY_LABELS[r.category] ?? r.category}</td>
                <td className="py-2 pr-2">
                  <input
                    type="number" min="0" max="50" step="0.5"
                    value={(r.rate_bps / 100).toString()}
                    onChange={(e) => setRate(r.category, e.target.value)}
                    className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 font-bold"
                  /> %
                </td>
                <td className="py-2 pr-2 font-semibold">₹{(r.cap_paise / 100).toFixed(0)}</td>
                <td className="py-2">
                  <button
                    onClick={() => save(r)}
                    disabled={saving === r.category || !sb}
                    className="bg-blue-600 text-white text-sm font-bold rounded-lg px-3 py-1.5 disabled:opacity-40"
                  >
                    {saving === r.category ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-center">{msg}</p>}
    </div>
  );
}
