'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Factory, PackageCheck, BookOpen, Banknote, Route, BadgeCheck, ScrollText, RefreshCw,
} from 'lucide-react';
import {
  PageHero, DemoBadge, StatusBadge, EstimateBadge, cardCls, fieldCls, labelCls,
  primaryBtnCls, ghostBtnCls,
} from '@/components/intl/IntlBadges';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { BRAND } from '@/components/store/ProductCard';

type Supplier = {
  id: string; company_name: string; country: string; city: string | null;
  contact_name: string; contact_email: string; contact_phone: string | null;
  website: string | null; years_in_business: number | null; product_categories: string | null;
  status: string; created_at: string;
};
type SProduct = {
  id: string; supplier_id: string; title: string; wholesale_price: number;
  wholesale_currency: string; moq: number; stock_qty: number; lead_time_days: number;
  incoterms: string; hs_code: string | null; country_of_origin: string;
  description: string | null; status: string;
};
type HsRow = {
  id: string; hs_code: string; category_name: string; dest_country: string;
  duty_rate: number; tax_rate: number; tax_name: string; estimate: boolean; notes: string | null;
};
type Lane = {
  id: string; origin_country: string; origin_city: string | null; dest_country: string;
  dest_city: string | null; carrier: string; transit_days_min: number; transit_days_max: number;
  base_freight: number; freight_currency: string; active: boolean; restrictions: string | null;
};
type Ddp = {
  id: string; listing_id: string; dest_country: string; provider: string;
  included_charges: string; verified: boolean;
};
type Audit = { id: string; action: string; entity: string; created_at: string; details: Record<string, unknown> };

type Tab = 'suppliers' | 'products' | 'hs' | 'rates' | 'lanes' | 'ddp' | 'audit';

export default function AdminSourcing() {
  const router = useRouter();
  const { ready, user, role } = useAuth();
  const [tab, setTab] = useState<Tab>('suppliers');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<SProduct[]>([]);
  const [hs, setHs] = useState<HsRow[]>([]);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [ddp, setDdp] = useState<Ddp[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [rates, setRates] = useState<Record<string, unknown> | null>(null);
  const [ratesBusy, setRatesBusy] = useState(false);

  // Publish form (approve product → retail listing)
  const [pub, setPub] = useState({ product_id: '', retail_price_inr: '', disclosed_margin_inr: '0', processing_days: '3', ddp_available: false, ddp_note: '' });
  const [pubBusy, setPubBusy] = useState(false);

  // HS edit
  const [hsEdit, setHsEdit] = useState<Record<string, Partial<HsRow>>>({});

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    setLoading(true);
    try {
      const [s, p, h, l, d, a] = await Promise.all([
        sb.from('intl_suppliers').select('*').order('created_at', { ascending: false }),
        sb.from('supplier_products').select('*').order('created_at', { ascending: false }),
        sb.from('hs_code_duties').select('*').order('dest_country').order('hs_code'),
        sb.from('shipping_lanes').select('*').order('origin_country').order('dest_country'),
        sb.from('ddp_coverage').select('*').order('created_at', { ascending: false }),
        sb.from('intl_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setSuppliers((s.data ?? []) as Supplier[]);
      setProducts((p.data ?? []) as SProduct[]);
      setHs((h.data ?? []) as HsRow[]);
      setLanes((l.data ?? []) as Lane[]);
      setDdp((d.data ?? []) as Ddp[]);
      setAudit((a.data ?? []) as Audit[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRates = useCallback(async () => {
    setRatesBusy(true);
    try {
      const r = await fetch('/api/rates').then(x => x.json());
      setRates(r);
    } catch {
      setRates({ ok: false, reason: 'Could not reach /api/rates' });
    } finally {
      setRatesBusy(false);
    }
  }, []);

  useEffect(() => { if (ready && role === 'admin') { void load(); void loadRates(); } }, [ready, role, load, loadRates]);

  const act = async (fn: () => Promise<void>, okMsg: string) => {
    setMsg(null);
    try { await fn(); setMsg(okMsg); void load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Action failed.'); }
  };

  const setSupplierStatus = (id: string, status: string) => act(async () => {
    const sb = getSupabase()!;
    const { error } = await sb.from('intl_suppliers').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await sb.from('intl_audit_log').insert({ actor_id: user!.id, action: `supplier_${status}`, entity: 'intl_suppliers', entity_id: id, details: {} });
  }, `Supplier ${status}.`);

  const publishProduct = async () => {
    setMsg(null);
    const pr = products.find(x => x.id === pub.product_id);
    if (!pr) { setMsg('Select a product.'); return; }
    if (!pub.retail_price_inr) { setMsg('Retail price (INR) is required.'); return; }
    const sb = getSupabase()!;
    setPubBusy(true);
    try {
      const sup = suppliers.find(s => s.id === pr.supplier_id);
      // 1. mark wholesale product approved
      const { error: e1 } = await sb.from('supplier_products').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', pr.id);
      if (e1) throw e1;
      // 2. create/update the PUBLIC retail listing (retail-safe fields only)
      const { error: e2 } = await sb.from('retail_listings').upsert({
        supplier_product_id: pr.id,
        supplier_id: pr.supplier_id,
        supplier_display_name: sup?.company_name ?? '',
        supplier_country: sup?.country ?? pr.country_of_origin,
        title: pr.title,
        description: pr.description,
        specs: {},
        country_of_origin: pr.country_of_origin,
        hs_code: pr.hs_code,
        weight_kg: 0.5,
        retail_price_inr: parseFloat(pub.retail_price_inr),
        disclosed_margin_inr: parseFloat(pub.disclosed_margin_inr) || 0,
        processing_days: parseInt(pub.processing_days, 10) || 3,
        warranty_text: '6-month replacement warranty against manufacturing defects.',
        returns_text: '7-day replacement for damaged/defective items.',
        ddp_available: pub.ddp_available,
        ddp_note: pub.ddp_note || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'supplier_product_id' });
      if (e2) throw e2;
      await sb.from('intl_audit_log').insert({
        actor_id: user!.id, action: 'product_published', entity: 'retail_listings',
        details: { product: pr.title, retail_price_inr: pub.retail_price_inr },
      });
      setPub({ product_id: '', retail_price_inr: '', disclosed_margin_inr: '0', processing_days: '3', ddp_available: false, ddp_note: '' });
      setMsg(`Published "${pr.title}" to the international storefront.`);
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Publish failed.');
    } finally {
      setPubBusy(false);
    }
  };

  const saveHs = async (row: HsRow) => {
    const patch = hsEdit[row.id];
    if (!patch) return;
    await act(async () => {
      const sb = getSupabase()!;
      const { error } = await sb.from('hs_code_duties').update({
        duty_rate: patch.duty_rate ?? row.duty_rate,
        tax_rate: patch.tax_rate ?? row.tax_rate,
        estimate: patch.estimate ?? row.estimate,
        notes: patch.notes ?? row.notes,
      }).eq('id', row.id);
      if (error) throw error;
    }, `HS ${row.hs_code} (${row.dest_country}) updated.`);
    setHsEdit(prev => { const n = { ...prev }; delete n[row.id]; return n; });
  };

  const toggleLane = (lane: Lane) => act(async () => {
    const sb = getSupabase()!;
    const { error } = await sb.from('shipping_lanes').update({ active: !lane.active }).eq('id', lane.id);
    if (error) throw error;
  }, `Lane ${lane.active ? 'deactivated' : 'activated'}.`);

  const toggleDdp = (row: Ddp) => act(async () => {
    const sb = getSupabase()!;
    const { error } = await sb.from('ddp_coverage').update({
      verified: !row.verified, verified_at: !row.verified ? new Date().toISOString() : null,
    }).eq('id', row.id);
    if (error) throw error;
    await sb.from('intl_audit_log').insert({
      actor_id: user!.id, action: row.verified ? 'ddp_unverified' : 'ddp_verified',
      entity: 'ddp_coverage', entity_id: row.id, details: { provider: row.provider },
    });
  }, `DDP ${row.verified ? 'unverified' : 'verified'}.`);

  if (!ready) return null;
  if (role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 pb-24">
        <PageHero emoji="🔒" title="Admin only" sub="The sourcing console needs an admin account." />
        <div className={`${cardCls} text-center`}>
          <button onClick={() => router.push('/account')} className={primaryBtnCls} style={{ background: BRAND }}>Log in</button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'suppliers', label: 'Suppliers', icon: <Factory size={14} /> },
    { id: 'products', label: 'Products', icon: <PackageCheck size={14} /> },
    { id: 'hs', label: 'HS codes', icon: <BookOpen size={14} /> },
    { id: 'rates', label: 'FX rates', icon: <Banknote size={14} /> },
    { id: 'lanes', label: 'Lanes', icon: <Route size={14} /> },
    { id: 'ddp', label: 'DDP', icon: <BadgeCheck size={14} /> },
    { id: 'audit', label: 'Audit', icon: <ScrollText size={14} /> },
  ];

  const pendingSuppliers = suppliers.filter(s => s.status === 'pending');
  const pendingProducts = products.filter(p => p.status === 'pending_approval');

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      <PageHero emoji="🌐" title="Sourcing console" sub="Verify suppliers, publish products, review duties, monitor FX — wholesale data stays private." />
      <div className="flex justify-center mb-4"><DemoBadge label="ADMIN ONLY" /></div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-extrabold whitespace-nowrap border ${tab === t.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
            style={tab === t.id ? { background: BRAND } : undefined}
          >
            {t.icon} {t.label}
            {t.id === 'suppliers' && pendingSuppliers.length > 0 && (
              <span className="bg-white text-xs px-1.5 rounded-full" style={{ color: BRAND }}>{pendingSuppliers.length}</span>
            )}
            {t.id === 'products' && pendingProducts.length > 0 && (
              <span className="bg-white text-xs px-1.5 rounded-full" style={{ color: BRAND }}>{pendingProducts.length}</span>
            )}
          </button>
        ))}
      </div>

      {msg && <p className="text-xs text-gray-700 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-3">{msg}</p>}
      {loading && <p className="text-center text-sm text-gray-500 py-8">Loading…</p>}

      {!loading && tab === 'suppliers' && (
        <div className="grid gap-2.5">
          {suppliers.map(s => (
            <div key={s.id} className={cardCls}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-sm text-gray-900">{s.company_name}</div>
                  <div className="text-[11px] text-gray-500">
                    {s.city ? `${s.city}, ` : ''}{s.country} · {s.contact_name} · {s.contact_email}{s.contact_phone ? ` · ${s.contact_phone}` : ''}
                    {s.years_in_business ? ` · ${s.years_in_business}y in business` : ''}
                  </div>
                  {s.product_categories && <div className="text-[11px] text-gray-500">Categories: {s.product_categories}</div>}
                  {s.website && <div className="text-[11px] text-gray-500">{s.website}</div>}
                </div>
                <StatusBadge status={s.status} />
              </div>
              {s.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setSupplierStatus(s.id, 'approved')} className={`${ghostBtnCls} !w-auto px-4 !text-green-700 !border-green-200`}>Approve</button>
                  <button onClick={() => setSupplierStatus(s.id, 'rejected')} className={`${ghostBtnCls} !w-auto px-4 !text-red-700 !border-red-200`}>Reject</button>
                </div>
              )}
              {s.status === 'approved' && (
                <button onClick={() => setSupplierStatus(s.id, 'suspended')} className="text-[11px] font-bold text-orange-700 underline mt-2">Suspend</button>
              )}
            </div>
          ))}
          {suppliers.length === 0 && <p className="text-center text-xs text-gray-500 py-6">No supplier applications yet.</p>}
        </div>
      )}

      {!loading && tab === 'products' && (
        <>
          <section className={cardCls}>
            <h2 className="text-sm font-extrabold text-gray-900 mb-2">Publish to storefront</h2>
            <div className="grid gap-2.5">
              <div>
                <label className={labelCls}>Approved product</label>
                <select value={pub.product_id} onChange={e => setPub({ ...pub, product_id: e.target.value })} className={fieldCls}>
                  <option value="">Select…</option>
                  {products.filter(p => p.status !== 'rejected').map(p => (
                    <option key={p.id} value={p.id}>{p.title} — {p.wholesale_price} {p.wholesale_currency} (wholesale, private)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>Retail ₹ (INR) *</label><input value={pub.retail_price_inr} onChange={e => setPub({ ...pub, retail_price_inr: e.target.value })} className={fieldCls} inputMode="decimal" /></div>
                <div><label className={labelCls}>Disclosed margin ₹</label><input value={pub.disclosed_margin_inr} onChange={e => setPub({ ...pub, disclosed_margin_inr: e.target.value })} className={fieldCls} inputMode="decimal" /></div>
                <div><label className={labelCls}>Processing days</label><input value={pub.processing_days} onChange={e => setPub({ ...pub, processing_days: e.target.value })} className={fieldCls} inputMode="numeric" /></div>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <input type="checkbox" checked={pub.ddp_available} onChange={e => setPub({ ...pub, ddp_available: e.target.checked })} />
                DDP confirmed by logistics provider <EstimateBadge label="ONLY IF CONFIRMED" />
              </label>
              {pub.ddp_available && (
                <input value={pub.ddp_note} onChange={e => setPub({ ...pub, ddp_note: e.target.value })} className={fieldCls} placeholder="DDP note — included charges" />
              )}
              <button onClick={publishProduct} disabled={pubBusy} className={primaryBtnCls} style={{ background: BRAND }}>
                {pubBusy ? 'Publishing…' : 'Approve & publish'}
              </button>
              <p className="text-[11px] text-gray-500">Only retail-safe fields go to the storefront — wholesale price and MOQ never leave this console.</p>
            </div>
          </section>
          <div className="grid gap-2.5 mt-3">
            {pendingProducts.map(p => (
              <div key={p.id} className={cardCls}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm text-gray-900">{p.title}</div>
                    <div className="text-[11px] text-gray-500">
                      Wholesale: <b>{p.wholesale_price} {p.wholesale_currency}</b> · MOQ {p.moq} · {p.country_of_origin} · HS {p.hs_code ?? '—'} · {p.incoterms}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <button onClick={() => setPub({ ...pub, product_id: p.id })} className={`${ghostBtnCls} mt-2`}>Select for publishing ↑</button>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && tab === 'hs' && (
        <div className="grid gap-2.5">
          <p className="text-[11px] text-gray-600">Duty is <b>never</b> a universal percentage — each HS code × destination has its own row. Rows marked <EstimateBadge /> are indicative: confirm with a customs broker.</p>
          {hs.map(row => {
            const ed = hsEdit[row.id] ?? {};
            return (
              <div key={row.id} className={cardCls}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-sm text-gray-900">{row.hs_code}</span>
                    <span className="text-[11px] text-gray-500 ml-2">{row.category_name} → <b>{row.dest_country}</b></span>
                  </div>
                  {row.estimate && <EstimateBadge />}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div><label className={labelCls}>Duty %</label>
                    <input type="number" step="0.5" defaultValue={Number(row.duty_rate) * 100}
                      onChange={e => setHsEdit(prev => ({ ...prev, [row.id]: { ...prev[row.id], duty_rate: (parseFloat(e.target.value) || 0) / 100 } }))}
                      className={fieldCls} />
                  </div>
                  <div><label className={labelCls}>{row.tax_name} %</label>
                    <input type="number" step="0.5" defaultValue={Number(row.tax_rate) * 100}
                      onChange={e => setHsEdit(prev => ({ ...prev, [row.id]: { ...prev[row.id], tax_rate: (parseFloat(e.target.value) || 0) / 100 } }))}
                      className={fieldCls} />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                      <input type="checkbox" defaultChecked={row.estimate}
                        onChange={e => setHsEdit(prev => ({ ...prev, [row.id]: { ...prev[row.id], estimate: e.target.checked } }))} />
                      Estimate
                    </label>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => saveHs(row)} disabled={!hsEdit[row.id]} className={`${ghostBtnCls} !py-2 disabled:opacity-40`}>Save</button>
                  </div>
                </div>
                {row.notes && <p className="text-[10px] text-gray-500 mt-1">{row.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'rates' && (
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold text-gray-900">Exchange rates (INR base)</h2>
            <button onClick={loadRates} disabled={ratesBusy} className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: BRAND }}>
              <RefreshCw size={13} className={ratesBusy ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {!rates && <p className="text-xs text-gray-500">Loading…</p>}
          {rates && (rates as { ok?: boolean }).ok === false && (
            <p className="text-xs text-red-600">{String((rates as { reason?: string }).reason ?? 'Rate provider unreachable.')}</p>
          )}
          {rates && (rates as { ok?: boolean }).ok && (() => {
            const r = rates as { rates: Record<string, number>; timestamp: string; provider: string; stale: boolean; source: string };
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['CAD', 'CNY', 'USD', 'AED'].map(c => (
                    <div key={c} className="rounded-xl bg-orange-50/60 px-3 py-2">
                      <div className="text-[10px] font-bold text-gray-500">1 INR =</div>
                      <div className="text-sm font-black text-gray-900">{r.rates[c]?.toFixed(4) ?? '—'} {c}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Provider: {r.provider} · {r.timestamp} · Source: {r.source} {r.stale && <b className="text-amber-700">· STALE</b>}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">Rates are never hardcoded and never called “guaranteed” — every quote shows provider + timestamp.</p>
              </>
            );
          })()}
          <p className="text-[11px] text-gray-500 mt-3">To switch to a paid provider later, replace the fetch URL in <code className="bg-gray-100 px-1 rounded">lib/fx.ts</code> — the cache schema stays the same.</p>
        </section>
      )}

      {!loading && tab === 'lanes' && (
        <div className="grid gap-2.5">
          {lanes.map(l => (
            <div key={l.id} className={cardCls}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-sm text-gray-900">
                    {l.origin_country}{l.origin_city ? ` (${l.origin_city})` : ''} → {l.dest_country}{l.dest_city ? ` (${l.dest_city})` : ''}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {l.carrier} · {l.transit_days_min}-{l.transit_days_max} days · {l.base_freight} {l.freight_currency}/kg
                    {l.restrictions ? ` · ${l.restrictions}` : ''}
                  </div>
                </div>
                <button onClick={() => toggleLane(l)} className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full border ${l.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {l.active ? 'Active' : 'Off'}
                </button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-gray-500">New lanes are added in Supabase (shipping_lanes) — the schema accepts any origin → destination pair.</p>
        </div>
      )}

      {!loading && tab === 'ddp' && (
        <div className="grid gap-2.5">
          <p className="text-[11px] text-gray-600">DDP messaging appears on the storefront <b>only</b> for rows verified here. Unverified rows keep the honest “duties are estimates” state.</p>
          {ddp.map(d => (
            <div key={d.id} className={cardCls}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-sm text-gray-900">{d.provider} → {d.dest_country}</div>
                  <div className="text-[11px] text-gray-500">Includes: {d.included_charges}</div>
                </div>
                <button onClick={() => toggleDdp(d)} className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full border ${d.verified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {d.verified ? 'Verified ✓' : 'Not verified'}
                </button>
              </div>
            </div>
          ))}
          {ddp.length === 0 && <p className="text-center text-xs text-gray-500 py-6">No DDP coverage rows yet.</p>}
        </div>
      )}

      {!loading && tab === 'audit' && (
        <div className="grid gap-2">
          {audit.map(a => (
            <div key={a.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <div className="text-xs font-bold text-gray-800">{a.action} <span className="text-gray-400">· {a.entity}</span></div>
              <div className="text-[10px] text-gray-500">{new Date(a.created_at).toLocaleString('en-IN')}</div>
            </div>
          ))}
          {audit.length === 0 && <p className="text-center text-xs text-gray-500 py-6">No audit events yet.</p>}
        </div>
      )}
    </div>
  );
}
