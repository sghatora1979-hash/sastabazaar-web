'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe2, Search, Truck, ShieldCheck, BadgeCheck, ArrowRight, Info,
} from 'lucide-react';
import {
  PageHero, DemoBadge, EstimateBadge, cardCls, fieldCls,
} from '@/components/intl/IntlBadges';
import {
  fetchListings, useCurrency, formatMoney, type RetailListing, type Currency,
} from '@/lib/intl';
import { BRAND } from '@/components/store/ProductCard';

function CurrencySwitcher({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="inline-flex rounded-full border border-orange-200 bg-white/80 p-1 text-xs font-extrabold">
      {(['INR', 'CAD'] as Currency[]).map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-4 py-1.5 rounded-full transition-colors ${value === c ? 'text-white' : 'text-gray-600'}`}
          style={value === c ? { background: BRAND } : undefined}
          aria-pressed={value === c}
        >
          {c === 'INR' ? '₹ INR' : '$ CAD'}
        </button>
      ))}
    </div>
  );
}

export default function InternationalLanding() {
  const [currency, setCurrency] = useCurrency();
  const [listings, setListings] = useState<RetailListing[]>([]);
  const [demo, setDemo] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ratesMeta, setRatesMeta] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchListings();
        setListings(rows);
        // fetchListings falls back to demo data when DB is empty/unconfigured
        setDemo(rows.length > 0 && rows[0].id.startsWith('demo-'));
      } finally {
        setLoading(false);
      }
      try {
        const r = await fetch('/api/rates').then(x => x.json());
        if (r?.ok && r.rates) {
          setRates(r.rates);
          setRatesMeta(`${r.provider} · ${r.timestamp}${r.stale ? ' · STALE' : ''}`);
        }
      } catch { /* rates optional on listing cards; checkout always re-fetches */ }
    })();
  }, []);

  const inCurrency = (inr: number) => {
    if (currency === 'INR' || !rates || !rates['CAD']) return inr;
    return Math.round(inr * rates['CAD'] * 100) / 100;
  };

  const filtered = listings.filter(l =>
    !q.trim() ||
    l.title.toLowerCase().includes(q.trim().toLowerCase()) ||
    l.country_of_origin.toLowerCase().includes(q.trim().toLowerCase())
  );
  const flagship = filtered.filter(l => l.country_of_origin === 'China');
  const rest = filtered.filter(l => l.country_of_origin !== 'China');

  const Card = ({ l }: { l: RetailListing }) => (
    <Link href={`/international/product/${l.id}`} className={`${cardCls} block hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold text-gray-500">
            {l.country_of_origin} → India <span className="text-gray-300">|</span> HS {l.hs_code ?? '—'}
          </div>
          <h3 className="font-extrabold text-gray-900 mt-0.5">{l.title}</h3>
        </div>
        {l.ddp_available ? (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-800 border border-green-300">
            <BadgeCheck size={12} /> DDP
          </span>
        ) : (
          <EstimateBadge label="DUTIES EST." />
        )}
      </div>
      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{l.description}</p>
      <div className="flex items-center justify-between mt-3">
        <div>
          <div className="text-lg font-black" style={{ color: BRAND }}>
            {formatMoney(inCurrency(l.retail_price_inr), currency)}
          </div>
          <div className="text-[10px] text-gray-500">
            {l.availability} · ~{l.processing_days}d processing{ratesMeta && currency === 'CAD' ? ` · ${ratesMeta}` : ''}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-gray-700">
          View landed cost <ArrowRight size={14} />
        </span>
      </div>
      <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
        <ShieldCheck size={11} /> Verified supplier: {l.supplier_display_name}
      </div>
    </Link>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero
        emoji="🌍"
        title="International Sellers"
        sub="Shop Worldwide, Delivered to Your Door — retail prices, no factory minimums, honest landed-cost breakdown before you pay."
      />

      <div className="flex items-center justify-center gap-3 mb-4">
        <CurrencySwitcher value={currency} onChange={setCurrency} />
      </div>

      {/* Flagship corridor banner — China → India leads, but ANY country can list */}
      <section className={`${cardCls} mb-4`} style={{ borderColor: '#FB7701', borderWidth: 2 }}>
        <div className="flex items-center gap-2">
          <Truck size={18} style={{ color: BRAND }} />
          <h2 className="font-extrabold text-gray-900 text-sm">Flagship corridor: China → India</h2>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Sea & air lanes from Guangzhou, Shenzhen and Yiwu with per-category duty estimates.
          Sellers from <b>any country</b> can list here —{' '}
          <Link href="/supplier/register" className="font-bold underline" style={{ color: BRAND }}>
            register as an international supplier
          </Link>.
        </p>
      </section>

      {demo && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Info size={14} className="shrink-0" />
          <span><DemoBadge /> Sample catalogue shown — connect Supabase & run migration 005 for live listings.</span>
        </div>
      )}

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search products or origin country…"
          className={`${fieldCls} pl-10`}
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 py-10">Loading international catalogue…</p>
      ) : (
        <>
          {flagship.length > 0 && (
            <>
              <h2 className="text-sm font-extrabold text-gray-800 mb-2 flex items-center gap-1.5">
                <Globe2 size={15} style={{ color: BRAND }} /> From China → India
              </h2>
              <div className="grid gap-3 mb-6">
                {flagship.map(l => <Card key={l.id} l={l} />)}
              </div>
            </>
          )}
          {rest.length > 0 && (
            <>
              <h2 className="text-sm font-extrabold text-gray-800 mb-2">More origins</h2>
              <div className="grid gap-3">
                {rest.map(l => <Card key={l.id} l={l} />)}
              </div>
            </>
          )}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">No products match your search.</p>
          )}
        </>
      )}

      <section className={`${cardCls} mt-6`}>
        <h2 className="text-sm font-extrabold text-gray-900 mb-2">How international ordering works</h2>
        <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Browse retail products — <b>no minimum order quantity</b>, ever.</li>
          <li>Open a product to see the <b>full landed-cost breakdown</b>: freight, duty, taxes, fees.</li>
          <li>Figures marked <EstimateBadge /> are estimates — final customs charges are set by the destination authority.</li>
          <li>DDP (all-in delivery) is shown <b>only</b> where a logistics provider has confirmed it.</li>
        </ol>
      </section>
    </div>
  );
}
