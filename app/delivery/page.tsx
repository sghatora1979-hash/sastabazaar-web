'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, Search, ShieldCheck, MessageCircle, Radar,
  ShoppingBag, Bike, KeyRound, ChevronRight, Info,
} from 'lucide-react';
import {
  PageHero, DemoBadge, SoonBadge, cardCls, fieldCls, primaryBtnCls,
} from '@/components/delivery/DeliveryBadges';
import { listServiceZones } from '@/lib/delivery';
import { BRAND } from '@/components/store/ProductCard';

type PinResult = { ok: boolean; city: string; zone: string | null } | null;

export default function DeliveryLanding() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PinResult>(null);
  const [trackId, setTrackId] = useState('');

  const checkPin = async () => {
    const clean = pin.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) return;
    setChecking(true);
    setResult(null);
    try {
      const zones = await listServiceZones();
      const hit = zones.find(z => z.pin === clean);
      setResult(hit
        ? { ok: true, city: hit.city, zone: hit.zone_name ?? hit.district ?? null }
        : { ok: false, city: '', zone: null });
    } catch {
      setResult({ ok: false, city: '', zone: null });
    } finally {
      setChecking(false);
    }
  };

  const goTrack = () => {
    const id = trackId.trim();
    if (id) router.push(`/delivery/track/${encodeURIComponent(id)}`);
  };

  const steps = [
    { icon: ShoppingBag, title: '1. Shop', text: 'Order from your favourite local shops on SastaBazaar.' },
    { icon: Bike, title: '2. Biker picks up', text: 'A verified delivery partner collects your order from the shop.' },
    { icon: KeyRound, title: '3. OTP delivery', text: 'Share your one-time code with the biker at your door.' },
  ];

  const features = [
    { icon: Radar, title: 'Live tracking', text: 'Watch your biker on the way to you.', soon: true },
    { icon: ShieldCheck, title: 'OTP-secured handover', text: 'Delivery is confirmed only with your one-time code.' },
    { icon: MessageCircle, title: 'Order chat', text: 'Chat directly with your biker about the delivery.' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero
        emoji="🚴"
        title="Bikers & Home Delivery"
        sub="Fast, honest home delivery from your neighbourhood shops — powered by our own delivery partners."
      />

      {/* PIN serviceability checker */}
      <section className={cardCls}>
        <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
          <MapPin size={18} style={{ color: BRAND }} /> Check if we deliver to you
        </h2>
        <div className="flex gap-2 mt-3">
          <input
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="Enter 6-digit PIN"
            maxLength={6}
            className={fieldCls}
          />
          <button
            onClick={checkPin}
            disabled={checking || pin.length !== 6}
            className="shrink-0 px-5 rounded-xl text-white font-extrabold text-sm shadow hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: BRAND }}
          >
            <Search size={16} /> Check
          </button>
        </div>
        {result && (
          <div className={`mt-3 p-3 rounded-xl border text-sm font-semibold flex flex-wrap items-center gap-2 ${result.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {result.ok ? (
              <>
                <span>✅ We deliver to {pin}{result.city ? ` — ${result.city}` : ''}{result.zone ? ` (${result.zone})` : ''}</span>
                <DemoBadge label="demo zones" />
              </>
            ) : (
              <>
                <span>❌ Not serviceable yet — we&apos;re expanding soon.</span>
                <SoonBadge />
              </>
            )}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mt-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map(s => (
            <div key={s.title} className={cardCls}>
              <s.icon size={26} style={{ color: BRAND }} />
              <h3 className="font-extrabold text-sm text-gray-900 mt-2">{s.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mt-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">Why you&apos;ll love it</h2>
        <div className="space-y-3">
          {features.map(f => (
            <div key={f.title} className={`${cardCls} flex items-start gap-3`}>
              <f.icon size={22} className="shrink-0 mt-0.5" style={{ color: BRAND }} />
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                  {f.title} {f.soon && <SoonBadge />}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/delivery/become-partner"
          className={`${cardCls} group flex items-center justify-between hover:border-[#FB7701]/60 transition`}
        >
          <div>
            <h3 className="font-extrabold text-sm text-gray-900">Become a Delivery Partner</h3>
            <p className="text-xs text-gray-600 mt-0.5">Earn per delivery on your bike.</p>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition" />
        </Link>
        <div className={cardCls}>
          <h3 className="font-extrabold text-sm text-gray-900">Track my delivery</h3>
          <div className="flex gap-2 mt-2">
            <input
              value={trackId}
              onChange={e => setTrackId(e.target.value)}
              placeholder="Delivery ID"
              className={fieldCls}
            />
            <button
              onClick={goTrack}
              disabled={!trackId.trim()}
              className="shrink-0 px-4 rounded-xl text-white font-extrabold text-sm shadow hover:brightness-110 disabled:opacity-50"
              style={{ background: BRAND }}
            >
              Go
            </button>
          </div>
        </div>
      </section>

      {/* Honest pilot note */}
      <section className={`${cardCls} mt-6 bg-amber-50/60`}>
        <div className="flex items-start gap-2">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-700" />
          <p className="text-xs text-gray-700 leading-relaxed">
            <DemoBadge /> <span className="font-bold">Pilot:</span> delivery jobs are
            created from real shop orders by the shop/admin; SMS &amp; live GPS need
            providers. <SoonBadge label="Coming soon" />
          </p>
        </div>
      </section>

      <button onClick={() => router.push('/delivery/become-partner')} className={`${primaryBtnCls} mt-6`} style={{ background: BRAND }}>
        Join as a Delivery Partner
      </button>
    </div>
  );
}
