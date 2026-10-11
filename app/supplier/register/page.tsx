'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe2, ShieldCheck } from 'lucide-react';
import {
  PageHero, DemoBadge, cardCls, fieldCls, labelCls, primaryBtnCls,
} from '@/components/intl/IntlBadges';
import { COUNTRY_SUGGESTIONS } from '@/lib/intl';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { BRAND } from '@/components/store/ProductCard';

export default function SupplierRegister() {
  const router = useRouter();
  const { ready, user, configured } = useAuth();
  const [form, setForm] = useState({
    company_name: '', country: '', city: '', contact_name: '',
    contact_email: '', contact_phone: '', website: '',
    years_in_business: '', product_categories: '', business_license_no: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setMsg(null);
    if (!form.company_name.trim() || !form.country.trim() || !form.contact_name.trim() || !form.contact_email.trim()) {
      setMsg('Please fill company name, country, contact name and email.');
      return;
    }
    if (!user) {
      router.push('/account');
      return;
    }
    const sb = getSupabase();
    if (!sb) { setMsg('Database not configured.'); return; }
    setBusy(true);
    try {
      const { error } = await sb.from('intl_suppliers').insert({
        profile_id: user.id,
        company_name: form.company_name.trim(),
        country: form.country.trim(),
        city: form.city.trim() || null,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        website: form.website.trim() || null,
        years_in_business: form.years_in_business ? parseInt(form.years_in_business, 10) : null,
        product_categories: form.product_categories.trim() || null,
        business_license_no: form.business_license_no.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      await sb.from('intl_audit_log').insert({
        actor_id: user.id, action: 'supplier_registered',
        entity: 'intl_suppliers', details: { company: form.company_name.trim(), country: form.country.trim() },
      });
      setOk(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  if (ok) {
    return (
      <div className="max-w-xl mx-auto px-4 pb-24">
        <PageHero emoji="✅" title="Application received" sub="Our sourcing team will verify your business and approve your account. Wholesale prices you submit stay private — retail customers never see them." />
        <div className={`${cardCls} text-center`}>
          <p className="text-sm text-gray-700">Status: <b>Pending verification</b></p>
          <Link href="/supplier/dashboard" className="inline-block mt-3 text-sm font-extrabold underline" style={{ color: BRAND }}>
            Go to supplier dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-24">
      <PageHero
        emoji="🌍"
        title="Register as an International Supplier"
        sub="Sell to India (and Canada) at retail — no factory MOQs for customers. Suppliers from ANY country are welcome."
      />

      {!ready ? null : !user ? (
        <div className={`${cardCls} text-center`}>
          <p className="text-sm text-gray-700">Please log in first — your supplier profile links to your SastaBazaar account.</p>
          <button onClick={() => router.push('/account')} className={`${primaryBtnCls} mt-3`} style={{ background: BRAND }}>
            Log in / Create account
          </button>
        </div>
      ) : (
        <div className={cardCls}>
          <div className="grid gap-3">
            <div>
              <label className={labelCls}>Company name *</label>
              <input value={form.company_name} onChange={set('company_name')} className={fieldCls} placeholder="e.g. Shenzhen BrightStar Electronics Co., Ltd." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Origin country *</label>
                <input value={form.country} onChange={set('country')} className={fieldCls} placeholder="e.g. China" list="intl-countries" />
                <datalist id="intl-countries">
                  {COUNTRY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input value={form.city} onChange={set('city')} className={fieldCls} placeholder="e.g. Shenzhen" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Contact name *</label>
                <input value={form.contact_name} onChange={set('contact_name')} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Contact email *</label>
                <input value={form.contact_email} onChange={set('contact_email')} className={fieldCls} type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Contact phone</label>
                <input value={form.contact_phone} onChange={set('contact_phone')} className={fieldCls} placeholder="+86-..." />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input value={form.website} onChange={set('website')} className={fieldCls} placeholder="https://" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Years in business</label>
                <input value={form.years_in_business} onChange={set('years_in_business')} className={fieldCls} inputMode="numeric" />
              </div>
              <div>
                <label className={labelCls}>Business licence no. <DemoBadge label="PRIVATE" /></label>
                <input value={form.business_license_no} onChange={set('business_license_no')} className={fieldCls} placeholder="Never shown publicly" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Product categories</label>
              <textarea value={form.product_categories} onChange={set('product_categories')} className={fieldCls} rows={2} placeholder="e.g. Consumer electronics, LED lighting" />
            </div>
          </div>

          <div className="text-[11px] text-gray-600 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mt-3 flex items-start gap-1.5">
            <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: BRAND }} />
            <span>Your wholesale prices, licence number and quotations stay <b>private</b> — visible only to you and our verification team. Retail customers see only retail prices.</span>
          </div>

          {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
          <button onClick={submit} disabled={busy} className={`${primaryBtnCls} mt-3`} style={{ background: BRAND }}>
            {busy ? 'Submitting…' : 'Submit for verification'}
          </button>
          {!configured && <p className="text-[11px] text-amber-700 mt-2"><DemoBadge /> Database not connected — registration needs Supabase.</p>}
        </div>
      )}

      <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
        <Globe2 size={13} /> Already approved? <Link href="/supplier/dashboard" className="font-bold underline" style={{ color: BRAND }}>Open supplier dashboard</Link>
      </p>
    </div>
  );
}
