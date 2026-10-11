'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ShieldCheck, Truck, BadgeCheck, AlertTriangle,
  Minus, Plus, Lock,
} from 'lucide-react';
import {
  PageHero, DemoBadge, EstimateBadge, VerifiedBadge, cardCls, fieldCls, primaryBtnCls,
} from '@/components/intl/IntlBadges';
import {
  fetchListing, getLandedCost, useCurrency, formatMoney,
  type RetailListing, type LandedCost, type Currency,
} from '@/lib/intl';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { BRAND } from '@/components/store/ProductCard';

export default function IntlProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');
  const [currency, setCurrency] = useCurrency();
  const { ready, user } = useAuth();

  const [listing, setListing] = useState<RetailListing | null>(null);
  const [dest, setDest] = useState<'IN' | 'CA'>('IN');
  const [pin, setPin] = useState('');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState<LandedCost | null>(null);
  const [calcBusy, setCalcBusy] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderMsg, setOrderMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => setListing(await fetchListing(id)))();
  }, [id]);

  // Currency follows destination for sanity (user can still toggle).
  useEffect(() => {
    setCurrency(dest === 'CA' ? 'CAD' : 'INR');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest]);

  const calculate = async () => {
    setCalcBusy(true);
    setCalcError(null);
    setCost(null);
    try {
      const c = await getLandedCost(id, dest, currency, qty, pin.trim());
      if (!c.ok) setCalcError(c.reason ?? 'Could not calculate landed cost.');
      else setCost(c);
    } catch {
      setCalcError('Network error while calculating landed cost.');
    } finally {
      setCalcBusy(false);
    }
  };

  useEffect(() => {
    if (listing) void calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing, dest, currency, qty]);

  const placeOrder = async () => {
    if (!cost || !listing) return;
    if (!ready) return;
    if (!user) {
      router.push('/account');
      return;
    }
    setOrdering(true);
    setOrderMsg(null);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Database not configured.');
      const { error } = await sb.from('intl_order_charges').insert({
        profile_id: user.id,
        listing_id: listing.id,
        qty,
        currency,
        charges: cost.lines,
        fx_rate: cost.fx.rate,
        fx_timestamp: cost.fx.timestamp,
        fx_provider: cost.fx.provider,
        total: cost.total,
        estimate_flags: { stale_fx: cost.fx.stale },
        ddp_confirmed: cost.ddp.confirmed,
      });
      if (error) throw error;
      setOrderMsg('Order summary saved (demo checkout — no payment taken). Our team will confirm the final quotation with you before any charge.');
    } catch (e) {
      setOrderMsg(e instanceof Error ? e.message : 'Could not save the order summary.');
    } finally {
      setOrdering(false);
    }
  };

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <PageHero emoji="🌍" title="Loading…" sub="" />
      </div>
    );
  }

  const specs = Object.entries(listing.specs ?? {});

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <button onClick={() => router.back()} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gray-600">
        <ArrowLeft size={14} /> Back to International Sellers
      </button>

      <section className={`${cardCls} mt-3`}>
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          <span>{listing.country_of_origin} → {dest === 'IN' ? 'India' : 'Canada'}</span>
          <span className="text-gray-300">|</span>
          <span>HS {listing.hs_code ?? '—'}</span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck size={11} /> {listing.supplier_display_name}</span>
          <VerifiedBadge label="Supplier approved" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mt-1">{listing.title}</h1>
        <p className="text-sm text-gray-600 mt-1">{listing.description}</p>

        {specs.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {specs.map(([k, v]) => (
              <div key={k} className="bg-orange-50/60 rounded-xl px-3 py-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">{k.replace(/_/g, ' ')}</div>
                <div className="text-xs font-bold text-gray-800">{String(v)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="rounded-xl bg-white border border-gray-100 py-2">
            <div className="text-[10px] text-gray-500 font-bold">Availability</div>
            <div className="text-xs font-extrabold text-gray-800">{listing.availability}</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 py-2">
            <div className="text-[10px] text-gray-500 font-bold">Processing</div>
            <div className="text-xs font-extrabold text-gray-800">~{listing.processing_days} days</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 py-2">
            <div className="text-[10px] text-gray-500 font-bold">Origin</div>
            <div className="text-xs font-extrabold text-gray-800">{listing.country_of_origin}</div>
          </div>
        </div>
      </section>

      {/* Destination + qty */}
      <section className={`${cardCls} mt-3`}>
        <h2 className="text-sm font-extrabold text-gray-900 mb-2">Delivery details</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-gray-600">Deliver to</label>
            <select value={dest} onChange={e => setDest(e.target.value as 'IN' | 'CA')} className={fieldCls}>
              <option value="IN">🇮🇳 India (INR)</option>
              <option value="CA">🇨🇦 Canada (CAD)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-600">{dest === 'IN' ? 'PIN code' : 'Postal code'}</label>
            <input
              value={pin}
              onChange={e => setPin(e.target.value.slice(0, 10))}
              placeholder={dest === 'IN' ? 'e.g. 400001' : 'e.g. V6B 1A1'}
              className={fieldCls}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[11px] font-bold text-gray-600">Qty</span>
          <div className="inline-flex items-center gap-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full border border-gray-200 bg-white" aria-label="Decrease quantity"><Minus size={14} /></button>
            <span className="font-extrabold w-8 text-center">{qty}</span>
            <button onClick={() => setQty(q => Math.min(99, q + 1))} className="w-8 h-8 rounded-full border border-gray-200 bg-white" aria-label="Increase quantity"><Plus size={14} /></button>
          </div>
          <span className="text-[11px] text-gray-500">Retail only — no minimum order quantity.</span>
        </div>
      </section>

      {/* Landed cost */}
      <section className={`${cardCls} mt-3`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-gray-900">Total landed cost</h2>
          {calcBusy && <span className="text-xs text-gray-500">Calculating…</span>}
        </div>
        {calcError && <p className="text-xs text-red-600 mt-2">{calcError}</p>}
        {cost && (
          <>
            <div className="mt-2 divide-y divide-gray-100">
              {cost.lines.map((l, i) => (
                <div key={i} className="flex items-start justify-between py-1.5 gap-2">
                  <div>
                    <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      {l.label}
                      {l.estimate && <EstimateBadge />}
                    </div>
                    {l.note && <div className="text-[10px] text-gray-500">{l.note}</div>}
                  </div>
                  <div className="text-xs font-extrabold text-gray-900 whitespace-nowrap">
                    {l.amount === 0 ? 'incl.' : formatMoney(l.amount, l.currency)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-orange-100">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black" style={{ color: BRAND }}>{formatMoney(cost.total, cost.currency)}</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              FX: 1 INR = {cost.fx.rate} {cost.currency} · {cost.fx.provider} · {cost.fx.timestamp}
              {cost.fx.stale && ' · STALE — refresh before paying'}
            </div>
            <div className="text-[11px] text-gray-600 mt-2 flex items-start gap-1.5">
              <Truck size={13} className="shrink-0 mt-0.5" style={{ color: BRAND }} />
              <span>Estimated delivery: <b>{cost.eta.label}</b></span>
            </div>
            <div className={`text-[11px] mt-2 rounded-xl px-3 py-2 border flex items-start gap-1.5 ${cost.ddp.confirmed ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              {cost.ddp.confirmed ? <BadgeCheck size={14} className="shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
              <span>{cost.ddp.note}</span>
            </div>
            {cost.warnings.length > 0 && (
              <ul className="text-[11px] text-amber-800 mt-2 space-y-1">
                {cost.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Warranty / returns / restrictions */}
      <section className={`${cardCls} mt-3`}>
        <h2 className="text-sm font-extrabold text-gray-900 mb-2">Warranty, returns & restrictions</h2>
        <div className="text-xs text-gray-600 space-y-1.5">
          {listing.warranty_text && <p><b>Warranty:</b> {listing.warranty_text}</p>}
          {listing.returns_text && <p><b>Returns:</b> {listing.returns_text}</p>}
          {listing.restrictions_text && <p><b>Restrictions:</b> {listing.restrictions_text}</p>}
        </div>
      </section>

      {/* Honest checkout */}
      <section className={`${cardCls} mt-3`} style={{ borderColor: '#FB7701', borderWidth: 2 }}>
        <div className="flex items-center gap-2">
          <Lock size={15} style={{ color: BRAND }} />
          <h2 className="text-sm font-extrabold text-gray-900">Checkout</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          You pay <b>{cost ? formatMoney(cost.total, cost.currency) : '—'}</b> ({currency}).
          {cost && !cost.ddp.confirmed && ' Because DDP is not confirmed, the duty & tax above are estimates — we will confirm the final quotation with you before any charge.'}
          {' '}No payment is taken in this demo build.
        </p>
        <button
          onClick={placeOrder}
          disabled={!cost || ordering}
          className={`${primaryBtnCls} mt-3`}
          style={{ background: BRAND }}
        >
          {ordering ? 'Saving…' : user ? 'Place order (demo — no payment)' : 'Log in to order'}
        </button>
        {orderMsg && <p className="text-xs text-gray-700 mt-2">{orderMsg}</p>}
        <p className="text-[10px] text-gray-500 mt-2">
          Real payments (Razorpay / PhonePe / PayPal) are not connected yet — this checkout only saves an order summary.
        </p>
      </section>

      <div className="text-center mt-4">
        <Link href="/supplier/register" className="text-xs font-bold underline" style={{ color: BRAND }}>
          Sell internationally on SastaBazaar →
        </Link>
      </div>
    </div>
  );
}
