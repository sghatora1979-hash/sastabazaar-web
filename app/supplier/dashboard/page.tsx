'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, FileText, Upload, IndianRupee, Plus } from 'lucide-react';
import {
  PageHero, DemoBadge, StatusBadge, cardCls, fieldCls, labelCls, primaryBtnCls, ghostBtnCls,
} from '@/components/intl/IntlBadges';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { BRAND } from '@/components/store/ProductCard';

type Supplier = {
  id: string; company_name: string; country: string; city: string | null;
  status: string; contact_email: string;
};
type SProduct = {
  id: string; title: string; wholesale_price: number; wholesale_currency: string;
  moq: number; stock_qty: number; lead_time_days: number; incoterms: string;
  hs_code: string | null; country_of_origin: string; status: string;
};
type Quotation = {
  id: string; supplier_product_id: string; dest_country: string; dest_pin: string | null;
  freight_quote: number; freight_currency: string; incoterm: string; valid_until: string;
};
type Payout = { id: string; period: string; amount: number; currency: string; status: string };

type Tab = 'catalogue' | 'quotations' | 'import' | 'payouts';

const INCOTERMS = ['EXW', 'FOB', 'CIF', 'DDP'];

export default function SupplierDashboard() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const [tab, setTab] = useState<Tab>('catalogue');
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SProduct[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Add-product form
  const [p, setP] = useState({
    title: '', description: '', wholesale_price: '', wholesale_currency: 'CNY',
    moq: '50', stock_qty: '1000', lead_time_days: '7', incoterms: 'FOB',
    hs_code: '', country_of_origin: '', packing_charge: '0', crate_charge: '0',
  });
  const [pBusy, setPBusy] = useState(false);

  // Quotation form
  const [qq, setQq] = useState({ product_id: '', dest_country: 'IN', dest_pin: '', freight_quote: '', freight_currency: 'CNY', incoterm: 'FOB', valid_until: '' });
  const [qBusy, setQBusy] = useState(false);

  // CSV import
  const [csvBusy, setCsvBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: s } = await sb.from('intl_suppliers').select('*').eq('profile_id', user.id).single();
      if (s) {
        setSupplier(s as Supplier);
        const sid = (s as Supplier).id;
        const [pr, qu, pa] = await Promise.all([
          sb.from('supplier_products').select('*').eq('supplier_id', sid).order('created_at', { ascending: false }),
          sb.from('quotations').select('*').in('supplier_product_id',
            ((await sb.from('supplier_products').select('id').eq('supplier_id', sid)).data ?? []).map((r: { id: string }) => r.id)
          ).order('valid_until', { ascending: false }),
          sb.from('supplier_payouts').select('*').eq('supplier_id', sid).order('created_at', { ascending: false }),
        ]);
        setProducts((pr.data ?? []) as SProduct[]);
        setQuotes((qu.data ?? []) as Quotation[]);
        setPayouts((pa.data ?? []) as Payout[]);
        if (!p.country_of_origin) setP(prev => ({ ...prev, country_of_origin: (s as Supplier).country }));
      }
    } finally {
      setLoading(false);
    }
  }, [user, p.country_of_origin]);

  useEffect(() => { if (ready && user) void load(); }, [ready, user, load]);

  const addProduct = async () => {
    setMsg(null);
    if (!supplier || !p.title.trim() || !p.wholesale_price) { setMsg('Title and wholesale price are required.'); return; }
    const sb = getSupabase(); if (!sb) return;
    setPBusy(true);
    try {
      const { error } = await sb.from('supplier_products').insert({
        supplier_id: supplier.id,
        title: p.title.trim(),
        description: p.description.trim() || null,
        wholesale_price: parseFloat(p.wholesale_price),
        wholesale_currency: p.wholesale_currency,
        moq: parseInt(p.moq, 10) || 1,
        stock_qty: parseInt(p.stock_qty, 10) || 0,
        lead_time_days: parseInt(p.lead_time_days, 10) || 7,
        incoterms: p.incoterms,
        hs_code: p.hs_code.trim() || null,
        country_of_origin: p.country_of_origin.trim() || supplier.country,
        packing_charge: parseFloat(p.packing_charge) || 0,
        crate_charge: parseFloat(p.crate_charge) || 0,
        charge_currency: p.wholesale_currency,
        status: 'draft',
      });
      if (error) throw error;
      setP({ title: '', description: '', wholesale_price: '', wholesale_currency: 'CNY', moq: '50', stock_qty: '1000', lead_time_days: '7', incoterms: 'FOB', hs_code: '', country_of_origin: supplier.country, packing_charge: '0', crate_charge: '0' });
      setMsg('Product saved as draft. Submit it for approval from the catalogue below.');
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save product.');
    } finally {
      setPBusy(false);
    }
  };

  const setProductStatus = async (id: string, status: string) => {
    const sb = getSupabase(); if (!sb) return;
    const { error } = await sb.from('supplier_products').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) void load();
  };

  const addQuotation = async () => {
    setMsg(null);
    if (!qq.product_id || !qq.freight_quote || !qq.valid_until) { setMsg('Product, freight quote and expiry date are required.'); return; }
    const sb = getSupabase(); if (!sb) return;
    setQBusy(true);
    try {
      const { error } = await sb.from('quotations').insert({
        supplier_product_id: qq.product_id,
        dest_country: qq.dest_country,
        dest_pin: qq.dest_pin.trim() || null,
        freight_quote: parseFloat(qq.freight_quote),
        freight_currency: qq.freight_currency,
        incoterm: qq.incoterm,
        valid_until: qq.valid_until,
      });
      if (error) throw error;
      setQq({ product_id: '', dest_country: 'IN', dest_pin: '', freight_quote: '', freight_currency: 'CNY', incoterm: 'FOB', valid_until: '' });
      setMsg('Quotation saved.');
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save quotation.');
    } finally {
      setQBusy(false);
    }
  };

  const importCsv = async (file: File) => {
    setMsg(null);
    if (!supplier) return;
    const sb = getSupabase(); if (!sb) return;
    setCsvBusy(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV needs a header row + data rows.');
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const need = ['title', 'wholesale_price', 'moq'];
      for (const n of need) if (!header.includes(n)) throw new Error(`Missing column: ${n}`);
      const rows = lines.slice(1).map(line => {
        const cells = line.split(',').map(c => c.trim());
        const o: Record<string, string> = {};
        header.forEach((h, i) => { o[h] = cells[i] ?? ''; });
        return {
          supplier_id: supplier.id,
          title: o.title,
          description: o.description || null,
          wholesale_price: parseFloat(o.wholesale_price) || 0,
          wholesale_currency: o.wholesale_currency || 'CNY',
          moq: parseInt(o.moq, 10) || 1,
          stock_qty: parseInt(o.stock_qty, 10) || 0,
          lead_time_days: parseInt(o.lead_time_days, 10) || 7,
          incoterms: INCOTERMS.includes((o.incoterms || '').toUpperCase()) ? o.incoterms.toUpperCase() : 'EXW',
          hs_code: o.hs_code || null,
          country_of_origin: o.country_of_origin || supplier.country,
          status: 'draft',
        };
      }).filter(r => r.title);
      const { error } = await sb.from('supplier_products').insert(rows);
      if (error) throw error;
      setMsg(`Imported ${rows.length} product(s) as drafts.`);
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'CSV import failed.');
    } finally {
      setCsvBusy(false);
    }
  };

  if (!ready) return null;
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 pb-24">
        <PageHero emoji="🏭" title="Supplier dashboard" sub="Your private sourcing workspace — wholesale prices here are never visible to retail customers." />
        <div className={`${cardCls} text-center`}>
          <button onClick={() => router.push('/account')} className={`${primaryBtnCls} mt-1`} style={{ background: BRAND }}>Log in</button>
        </div>
      </div>
    );
  }
  if (!loading && !supplier) {
    return (
      <div className="max-w-xl mx-auto px-4 pb-24">
        <PageHero emoji="🏭" title="Supplier dashboard" sub="No supplier profile found on this account yet." />
        <div className={`${cardCls} text-center`}>
          <Link href="/supplier/register" className="text-sm font-extrabold underline" style={{ color: BRAND }}>Register as an international supplier →</Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'catalogue', label: 'Catalogue', icon: <Package size={14} /> },
    { id: 'quotations', label: 'Quotations', icon: <FileText size={14} /> },
    { id: 'import', label: 'CSV import', icon: <Upload size={14} /> },
    { id: 'payouts', label: 'Payouts', icon: <IndianRupee size={14} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero emoji="🏭" title="Supplier dashboard" sub="Private workspace — wholesale costs, quotations and margins never leave this screen." />
      <div className="flex justify-center mb-4"><DemoBadge label="PRIVATE — OWNER ONLY" /></div>

      {supplier && (
        <section className={`${cardCls} mb-3 flex items-center justify-between`}>
          <div>
            <div className="font-extrabold text-gray-900 text-sm">{supplier.company_name}</div>
            <div className="text-[11px] text-gray-500">{supplier.city ? `${supplier.city}, ` : ''}{supplier.country}</div>
          </div>
          <StatusBadge status={supplier.status} />
        </section>
      )}

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-extrabold whitespace-nowrap border ${tab === t.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
            style={tab === t.id ? { background: BRAND } : undefined}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="text-xs text-gray-700 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-3">{msg}</p>}

      {loading && <p className="text-center text-sm text-gray-500 py-8">Loading…</p>}

      {!loading && tab === 'catalogue' && (
        <>
          <section className={cardCls}>
            <h2 className="text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-1.5"><Plus size={15} /> Add product (wholesale — private)</h2>
            <div className="grid gap-2.5">
              <input value={p.title} onChange={e => setP({ ...p, title: e.target.value })} className={fieldCls} placeholder="Product title *" />
              <textarea value={p.description} onChange={e => setP({ ...p, description: e.target.value })} className={fieldCls} rows={2} placeholder="Description / specifications" />
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>Wholesale *</label><input value={p.wholesale_price} onChange={e => setP({ ...p, wholesale_price: e.target.value })} className={fieldCls} inputMode="decimal" placeholder="38" /></div>
                <div><label className={labelCls}>Currency</label>
                  <select value={p.wholesale_currency} onChange={e => setP({ ...p, wholesale_currency: e.target.value })} className={fieldCls}>
                    {['CNY', 'USD', 'INR', 'AED', 'EUR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>MOQ</label><input value={p.moq} onChange={e => setP({ ...p, moq: e.target.value })} className={fieldCls} inputMode="numeric" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>Stock</label><input value={p.stock_qty} onChange={e => setP({ ...p, stock_qty: e.target.value })} className={fieldCls} inputMode="numeric" /></div>
                <div><label className={labelCls}>Lead days</label><input value={p.lead_time_days} onChange={e => setP({ ...p, lead_time_days: e.target.value })} className={fieldCls} inputMode="numeric" /></div>
                <div><label className={labelCls}>Incoterms</label>
                  <select value={p.incoterms} onChange={e => setP({ ...p, incoterms: e.target.value })} className={fieldCls}>
                    {INCOTERMS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>HS code</label><input value={p.hs_code} onChange={e => setP({ ...p, hs_code: e.target.value })} className={fieldCls} placeholder="8517.62" /></div>
                <div><label className={labelCls}>Origin country</label><input value={p.country_of_origin} onChange={e => setP({ ...p, country_of_origin: e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>Packing chg.</label><input value={p.packing_charge} onChange={e => setP({ ...p, packing_charge: e.target.value })} className={fieldCls} inputMode="decimal" /></div>
              </div>
              <button onClick={addProduct} disabled={pBusy} className={`${primaryBtnCls}`} style={{ background: BRAND }}>
                {pBusy ? 'Saving…' : 'Save as draft'}
              </button>
            </div>
          </section>

          <div className="grid gap-2.5 mt-3">
            {products.map(pr => (
              <div key={pr.id} className={cardCls}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm text-gray-900">{pr.title}</div>
                    <div className="text-[11px] text-gray-500">
                      Wholesale: <b>{pr.wholesale_price} {pr.wholesale_currency}</b> · MOQ {pr.moq} · Stock {pr.stock_qty} · {pr.lead_time_days}d · {pr.incoterms} · HS {pr.hs_code ?? '—'}
                    </div>
                  </div>
                  <StatusBadge status={pr.status} />
                </div>
                {pr.status === 'draft' && (
                  <button onClick={() => setProductStatus(pr.id, 'pending_approval')} className={`${ghostBtnCls} mt-2`}>
                    Submit for approval
                  </button>
                )}
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-xs text-gray-500 py-6">No products yet — add your first one above.</p>}
          </div>
        </>
      )}

      {!loading && tab === 'quotations' && (
        <section className={cardCls}>
          <h2 className="text-sm font-extrabold text-gray-900 mb-2">Shipping quotations by destination</h2>
          <div className="grid gap-2.5">
            <div>
              <label className={labelCls}>Product</label>
              <select value={qq.product_id} onChange={e => setQq({ ...qq, product_id: e.target.value })} className={fieldCls}>
                <option value="">Select product…</option>
                {products.map(pr => <option key={pr.id} value={pr.id}>{pr.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Destination</label>
                <select value={qq.dest_country} onChange={e => setQq({ ...qq, dest_country: e.target.value })} className={fieldCls}>
                  <option value="IN">India</option><option value="CA">Canada</option>
                </select>
              </div>
              <div><label className={labelCls}>PIN / postal (optional)</label><input value={qq.dest_pin} onChange={e => setQq({ ...qq, dest_pin: e.target.value })} className={fieldCls} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelCls}>Freight quote *</label><input value={qq.freight_quote} onChange={e => setQq({ ...qq, freight_quote: e.target.value })} className={fieldCls} inputMode="decimal" /></div>
              <div><label className={labelCls}>Currency</label>
                <select value={qq.freight_currency} onChange={e => setQq({ ...qq, freight_currency: e.target.value })} className={fieldCls}>
                  {['CNY', 'USD', 'INR', 'AED', 'EUR'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Incoterm</label>
                <select value={qq.incoterm} onChange={e => setQq({ ...qq, incoterm: e.target.value })} className={fieldCls}>
                  {INCOTERMS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div><label className={labelCls}>Valid until *</label><input type="date" value={qq.valid_until} onChange={e => setQq({ ...qq, valid_until: e.target.value })} className={fieldCls} /></div>
            <button onClick={addQuotation} disabled={qBusy} className={primaryBtnCls} style={{ background: BRAND }}>
              {qBusy ? 'Saving…' : 'Save quotation'}
            </button>
          </div>
          <div className="grid gap-2 mt-4">
            {quotes.map(qo => {
              const pr = products.find(x => x.id === qo.supplier_product_id);
              const expired = new Date(qo.valid_until) < new Date();
              return (
                <div key={qo.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2 flex items-center justify-between">
                  <div className="text-xs">
                    <b>{pr?.title ?? '—'}</b> → {qo.dest_country}{qo.dest_pin ? ` ${qo.dest_pin}` : ''} · {qo.freight_quote} {qo.freight_currency} {qo.incoterm}
                    <div className="text-[10px] text-gray-500">Valid until {qo.valid_until} {expired && <b className="text-red-600">· EXPIRED</b>}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!loading && tab === 'import' && (
        <section className={cardCls}>
          <h2 className="text-sm font-extrabold text-gray-900 mb-2">Bulk import via CSV</h2>
          <p className="text-xs text-gray-600 mb-2">
            Columns: <code className="bg-gray-100 px-1 rounded">title, description, wholesale_price, wholesale_currency, moq, stock_qty, lead_time_days, incoterms, hs_code, country_of_origin</code>.
            Everything imports as <b>draft</b> — nothing goes live without approval.
          </p>
          <label className={`${ghostBtnCls} block text-center cursor-pointer`}>
            {csvBusy ? 'Importing…' : 'Choose CSV file'}
            <input
              type="file" accept=".csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ''; }}
              disabled={csvBusy}
            />
          </label>
          <p className="text-[11px] text-gray-500 mt-2">Catalogues are imported only from files <b>you</b> upload — we never scrape supplier catalogues.</p>
        </section>
      )}

      {!loading && tab === 'payouts' && (
        <section className={cardCls}>
          <h2 className="text-sm font-extrabold text-gray-900 mb-2">Payouts <DemoBadge /></h2>
          {payouts.length === 0 && <p className="text-xs text-gray-500">No payouts yet. Payouts are processed by our finance team after order reconciliation.</p>}
          <div className="grid gap-2">
            {payouts.map(pa => (
              <div key={pa.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2 flex items-center justify-between">
                <div className="text-xs"><b>{pa.period}</b> · {pa.amount} {pa.currency}</div>
                <StatusBadge status={pa.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
