// Seller AI Suggestions inbox (Update 24).
// The AI's picks for THIS seller's products. Approve/reject each suggestion.
// Approve writes a CAMPAIGN PRICE OVERRIDE (time-boxed) — the seller's base
// price is NEVER overwritten. Nothing goes live without seller approval.
'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, CheckCircle2, XCircle, Clock, BrainCircuit, FileText, RefreshCw, AlertTriangle, Send,
} from 'lucide-react';
import {
  PageHero, DemoBadge, StatusBadge, cardCls, fieldCls, labelCls,
  primaryBtnCls, ghostBtnCls,
} from '@/components/intl/IntlBadges';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getMySeller, getMySellerProducts, type MySeller } from '@/lib/db/shop';
import type { Product as DbProduct } from '@/lib/products';
import { formatINR } from '@/lib/utils';

type Rec = {
  id: string; product_id: string; campaign_id: string | null;
  recommended_discount_pct: number; recommended_price: number;
  reason: Record<string, unknown>; source: string; status: string; created_at: string;
  products: { title: string; price: number } | null;
  ai_campaigns: { name: string; status: string } | null;
};

type ProfileRow = {
  product_id: string; manufacturing_date: string | null; expiry_date: string | null;
  purchase_cost: number | null; min_selling_price: number | null;
  supplier_location: string | null; season_tags: string[]; festival_tags: string[];
};

type Negotiation = {
  id: string; cluster_key: string; category: string; region: string | null;
  demand_count: number; total_qty: number; product_id: string;
  proposed_price: number; counter_price: number | null; currency: string;
  econ: Record<string, unknown>; status: string; created_at: string;
  products: { title: string; price: number } | null;
};

export default function SellerAiSuggestions() {
  const router = useRouter();
  const { ready, user, role } = useAuth();
  const [seller, setSeller] = useState<MySeller | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [tab, setTab] = useState<'suggestions' | 'data' | 'bulk'>('suggestions');
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // profile form state (per selected product)
  const [selPid, setSelPid] = useState('');
  const [form, setForm] = useState({ manufacturing_date: '', expiry_date: '', purchase_cost: '', min_selling_price: '', supplier_location: '', season_tags: '', festival_tags: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    const s = await getMySeller();
    setSeller(s);
    if (s) {
      const { data: recRows } = await sb.from('ai_recommendations')
        .select('*, products(title,price), ai_campaigns(name,status)')
        .eq('seller_id', s.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setRecs(((recRows ?? []) as unknown) as Rec[]);
      const prods = await getMySellerProducts(s.id);
      setProducts(prods);
      const { data: profRows } = await sb.from('ai_product_profile').select('*').eq('seller_id', s.id);
      const pm: Record<string, ProfileRow> = {};
      for (const r of (profRows ?? []) as ProfileRow[]) pm[r.product_id] = r;
      setProfiles(pm);
      const { data: negRows } = await sb.from('ai_negotiations')
        .select('*, products(title,price)').eq('seller_id', s.id)
        .order('created_at', { ascending: false }).limit(50);
      setNegotiations(((negRows ?? []) as unknown) as Negotiation[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const decide = async (rec: Rec, approve: boolean) => {
    const sb = getSupabase();
    if (!sb || !seller) return;
    setBusy(rec.id); setMsg(null);
    try {
      if (approve) {
        const now = new Date();
        const ends = new Date(now.getTime() + 30 * 86400000);
        const { error: pErr } = await sb.from('ai_campaign_prices').insert({
          product_id: rec.product_id,
          campaign_id: rec.campaign_id,
          override_price: rec.recommended_price,
          starts_at: now.toISOString(),
          ends_at: ends.toISOString(),
          approved_by: 'seller',
        });
        if (pErr) throw new Error(pErr.message);
      }
      const { error: rErr } = await sb.from('ai_recommendations').update({
        status: approve ? 'approved' : 'rejected',
        decided_at: new Date().toISOString(),
        decided_by: 'seller',
      }).eq('id', rec.id);
      if (rErr) throw new Error(rErr.message);
      await sb.rpc('ai_log', {
        p_actor: 'seller',
        p_action: approve ? 'recommendation_approved' : 'recommendation_rejected',
        p_entity: 'ai_recommendations',
        p_entity_id: rec.id,
        p_detail: { product_id: rec.product_id, price: rec.recommended_price, discount: rec.recommended_discount_pct },
      });
      setMsg(approve
        ? `Approved — campaign price ₹${rec.recommended_price} is live for 30 days. Your base price is untouched.`
        : 'Rejected — the AI will not use this suggestion.');
      await load();
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'failed'}`);
    } finally {
      setBusy(null);
    }
  };

  const decideNegotiation = async (n: Negotiation, action: 'accepted' | 'modified' | 'rejected') => {
    const sb = getSupabase();
    if (!sb) return;
    let finalPrice = n.proposed_price;
    if (action === 'modified') {
      const cp = Number(counterPrice);
      if (!cp || cp <= 0) { setMsg('Enter a valid counter price first.'); return; }
      finalPrice = Math.round(cp);
    }
    setBusy(n.id); setMsg(null);
    try {
      if (action === 'accepted' || action === 'modified') {
        const now = new Date();
        const ends = new Date(now.getTime() + 30 * 86400000);
        const { error: pErr } = await sb.from('ai_campaign_prices').insert({
          product_id: n.product_id,
          campaign_id: null,
          override_price: finalPrice,
          starts_at: now.toISOString(),
          ends_at: ends.toISOString(),
          approved_by: 'seller',
        });
        if (pErr) throw new Error(pErr.message);
      }
      const { error: uErr } = await sb.from('ai_negotiations').update({
        status: action,
        counter_price: action === 'modified' ? finalPrice : null,
        decided_at: new Date().toISOString(),
      }).eq('id', n.id);
      if (uErr) throw new Error(uErr.message);
      await sb.rpc('ai_log', {
        p_actor: 'seller', p_action: `negotiation_${action}`, p_entity: 'ai_negotiations',
        p_entity_id: n.id, p_detail: { final_price: finalPrice, qty: n.total_qty },
      });
      setMsg(action === 'rejected'
        ? 'Proposal rejected — no changes made.'
        : `Accepted at ₹${finalPrice}/unit for ~${n.total_qty} units (30-day campaign price).`);
      setCounterFor(null); setCounterPrice('');
      await load();
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'failed'}`);
    } finally {
      setBusy(null);
    }
  };

  const loadForm = (pid: string) => {
    setSelPid(pid);
    const p = profiles[pid];
    setForm({
      manufacturing_date: p?.manufacturing_date ?? '',
      expiry_date: p?.expiry_date ?? '',
      purchase_cost: p?.purchase_cost?.toString() ?? '',
      min_selling_price: p?.min_selling_price?.toString() ?? '',
      supplier_location: p?.supplier_location ?? '',
      season_tags: (p?.season_tags ?? []).join(','),
      festival_tags: (p?.festival_tags ?? []).join(','),
      notes: '',
    });
  };

  const saveProfile = async () => {
    const sb = getSupabase();
    if (!sb || !seller || !selPid) return;
    setSaving(true); setMsg(null);
    try {
      const row = {
        product_id: selPid, seller_id: seller.id,
        manufacturing_date: form.manufacturing_date || null,
        expiry_date: form.expiry_date || null,
        purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
        min_selling_price: form.min_selling_price ? Number(form.min_selling_price) : null,
        supplier_location: form.supplier_location || null,
        season_tags: form.season_tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        festival_tags: form.festival_tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        notes: form.notes || null,
      };
      const { error } = await sb.from('ai_product_profile').upsert(row, { onConflict: 'product_id' });
      if (error) throw new Error(error.message);
      await sb.rpc('ai_log', {
        p_actor: 'seller', p_action: 'product_profile_saved', p_entity: 'ai_product_profile',
        p_entity_id: selPid, p_detail: { has_cost: !!row.purchase_cost, has_expiry: !!row.expiry_date },
      });
      setMsg('Product data saved — the AI will use it in the next analysis run.');
      await load();
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'failed'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Loading AI suggestions…</div>;
  }
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="mb-4 text-gray-600">Please log in as a seller to see AI suggestions.</p>
        <button className={primaryBtnCls} onClick={() => router.push('/account')}>Log in</button>
      </div>
    );
  }
  if (!seller) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="mb-4 text-gray-600">No seller account found for this login.</p>
        <button className={primaryBtnCls} onClick={() => router.push('/seller/register')}>Become a seller</button>
      </div>
    );
  }

  const pending = recs.filter((r) => r.status === 'pending');
  const decided = recs.filter((r) => r.status !== 'pending');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHero
        emoji="🤖"
        title="AI Suggestions"
        sub="The AI Manager reads your catalogue and suggests festival picks, clearance discounts and campaigns. Nothing goes live until you approve it."
      />
      <div className="flex items-center gap-2 mt-4">
        <DemoBadge label={role === 'admin' ? 'ADMIN VIEW' : 'SELLER INBOX'} />
        <span className="text-xs text-gray-500">Your base prices are never changed by the AI.</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 mb-4">
        <button className={tab === 'suggestions' ? primaryBtnCls : ghostBtnCls} onClick={() => setTab('suggestions')}>
          <Sparkles size={16} className="inline mr-1" /> Suggestions ({pending.length} pending)
        </button>
        <button className={tab === 'bulk' ? primaryBtnCls : ghostBtnCls} onClick={() => setTab('bulk')}>
          <Send size={16} className="inline mr-1" /> Bulk proposals ({negotiations.filter((n) => n.status === 'pending').length})
        </button>
        <button className={tab === 'data' ? primaryBtnCls : ghostBtnCls} onClick={() => setTab('data')}>
          <FileText size={16} className="inline mr-1" /> Product data for AI
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{msg}</div>
      )}

      {tab === 'suggestions' && (
        <>
          {pending.length === 0 && (
            <div className={`${cardCls} p-8 text-center text-gray-500`}>
              <BrainCircuit size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">No pending suggestions right now.</p>
              <p className="text-sm mt-1">The AI runs daily. Fill in <b>Product data for AI</b> (costs, expiry dates, season tags) so its picks are smarter.</p>
            </div>
          )}
          <div className="grid gap-3">
            {pending.map((r) => (
              <div key={r.id} className={`${cardCls} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{r.products?.title ?? r.product_id}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Campaign: <b>{r.ai_campaigns?.name ?? '—'}</b>
                      {' '}· Source: {r.source === 'ai_llm' ? 'AI model' : 'rule-based draft'}
                    </div>
                    <div className="text-sm mt-2">
                      <span className="text-gray-500 line-through mr-2">{formatINR(r.products?.price ?? 0)}</span>
                      <span className="font-extrabold text-green-700">{formatINR(r.recommended_price)}</span>
                      <span className="ml-2 text-xs font-bold text-red-600">−{r.recommended_discount_pct}%</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {String((r.reason as { text?: string })?.text ?? '')}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className={primaryBtnCls} disabled={busy === r.id}
                    onClick={() => void decide(r, true)}
                  >
                    <CheckCircle2 size={16} className="inline mr-1" />
                    {busy === r.id ? 'Saving…' : 'Approve (30-day campaign price)'}
                  </button>
                  <button
                    className={ghostBtnCls} disabled={busy === r.id}
                    onClick={() => void decide(r, false)}
                  >
                    <XCircle size={16} className="inline mr-1" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {decided.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Clock size={16} /> Decided</h3>
              <div className="grid gap-2">
                {decided.slice(0, 20).map((r) => (
                  <div key={r.id} className={`${cardCls} px-4 py-2 flex items-center justify-between text-sm`}>
                    <span className="truncate">{r.products?.title}</span>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'bulk' && (
        <>
          <div className={`${cardCls} p-4 mb-3 text-sm text-gray-600`}>
            <b>Win-win bulk proposals:</b> when several customers in a region want the same category,
            the AI computes a bulk unit price — always above your minimum price floor — and asks you to
            accept, counter, or reject. All math is shown transparently.
          </div>
          {negotiations.filter((n) => n.status === 'pending').length === 0 && (
            <div className={`${cardCls} p-8 text-center text-gray-500`}>
              <p className="font-semibold">No pending bulk proposals.</p>
              <p className="text-sm mt-1">Proposals appear when customer demand clusters form in your categories.</p>
            </div>
          )}
          <div className="grid gap-3">
            {negotiations.filter((n) => n.status === 'pending').map((n) => (
              <div key={n.id} className={`${cardCls} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{n.products?.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {n.demand_count} customers{n.region ? ` in ${n.region}` : ''} want {n.category} · ~{n.total_qty} units
                    </div>
                    <div className="text-sm mt-2">
                      <span className="text-gray-500 line-through mr-2">{formatINR(n.products?.price ?? 0)}</span>
                      <span className="font-extrabold text-green-700">{formatINR(n.proposed_price)}/unit</span>
                    </div>
                    <details className="text-xs text-gray-500 mt-2">
                      <summary className="cursor-pointer font-semibold">How this price was computed</summary>
                      <pre className="whitespace-pre-wrap bg-gray-50 rounded-lg p-2 mt-1">{JSON.stringify(n.econ, null, 1)}</pre>
                    </details>
                  </div>
                  <StatusBadge status={n.status} />
                </div>
                {counterFor === n.id ? (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <input type="number" min="1" className={fieldCls} style={{ maxWidth: 180 }}
                      placeholder="Your counter price ₹" value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)} />
                    <button className={primaryBtnCls} disabled={busy === n.id}
                      onClick={() => void decideNegotiation(n, 'modified')}>Send counter</button>
                    <button className={ghostBtnCls} onClick={() => { setCounterFor(null); setCounterPrice(''); }}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button className={primaryBtnCls} disabled={busy === n.id}
                      onClick={() => void decideNegotiation(n, 'accepted')}>
                      <CheckCircle2 size={16} className="inline mr-1" />
                      {busy === n.id ? 'Saving…' : `Accept ₹${n.proposed_price}/unit`}
                    </button>
                    <button className={ghostBtnCls} disabled={busy === n.id}
                      onClick={() => setCounterFor(n.id)}>Counter price</button>
                    <button className={ghostBtnCls} disabled={busy === n.id}
                      onClick={() => void decideNegotiation(n, 'rejected')}>
                      <XCircle size={16} className="inline mr-1" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {negotiations.filter((n) => n.status !== 'pending').length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-2">Decided proposals</h3>
              <div className="grid gap-2">
                {negotiations.filter((n) => n.status !== 'pending').slice(0, 15).map((n) => (
                  <div key={n.id} className={`${cardCls} px-4 py-2 flex items-center justify-between text-sm`}>
                    <span className="truncate">{n.products?.title} · {n.demand_count} customers</span>
                    <StatusBadge status={`${n.status}${n.counter_price ? ` @ ₹${n.counter_price}` : ''}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'data' && (
        <div className={`${cardCls} p-5`}>
          <h3 className="font-bold mb-1">Teach the AI about your products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Costs and minimum prices are <b>private</b> — only you and admins can see them.
            They stop the AI suggesting discounts that lose you money.
          </p>
          <label className={labelCls}>Product</label>
          <select className={fieldCls} value={selPid} onChange={(e) => loadForm(e.target.value)}>
            <option value="">— choose a product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.title} {profiles[p.id] ? '✓' : ''}</option>
            ))}
          </select>

          {selPid && (
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label className={labelCls}>Manufacturing date</label>
                <input type="date" className={fieldCls} value={form.manufacturing_date}
                  onChange={(e) => setForm({ ...form, manufacturing_date: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Expiry date (if applicable)</label>
                <input type="date" className={fieldCls} value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Purchase cost ₹ (private)</label>
                <input type="number" min="0" className={fieldCls} value={form.purchase_cost}
                  onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} placeholder="e.g. 500" />
              </div>
              <div>
                <label className={labelCls}>Minimum selling price ₹ (private)</label>
                <input type="number" min="0" className={fieldCls} value={form.min_selling_price}
                  onChange={(e) => setForm({ ...form, min_selling_price: e.target.value })} placeholder="e.g. 650" />
              </div>
              <div>
                <label className={labelCls}>Supplier location</label>
                <input className={fieldCls} value={form.supplier_location}
                  onChange={(e) => setForm({ ...form, supplier_location: e.target.value })} placeholder="e.g. Delhi" />
              </div>
              <div>
                <label className={labelCls}>Season tags (comma separated)</label>
                <input className={fieldCls} value={form.season_tags}
                  onChange={(e) => setForm({ ...form, season_tags: e.target.value })} placeholder="summer,winter" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Festival tags (comma separated)</label>
                <input className={fieldCls} value={form.festival_tags}
                  onChange={(e) => setForm({ ...form, festival_tags: e.target.value })} placeholder="diwali,holi,christmas" />
              </div>
              <div className="sm:col-span-2">
                <button className={primaryBtnCls} disabled={saving} onClick={() => void saveProfile()}>
                  <RefreshCw size={16} className="inline mr-1" /> {saving ? 'Saving…' : 'Save product data'}
                </button>
              </div>
            </div>
          )}
          {products.length === 0 && (
            <p className="text-sm text-amber-700 mt-3 flex items-center gap-1">
              <AlertTriangle size={14} /> No DB products found for your seller account yet. Add products in the seller dashboard first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
