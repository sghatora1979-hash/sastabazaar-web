'use client';
import Link from 'next/link';
import {
  CheckCircle2, Wallet, FileCheck2, UserPlus, Bike, BadgeCheck,
  CircleDollarSign, ChevronDown, ArrowRight,
} from 'lucide-react';
import {
  PageHero, DemoBadge, SoonBadge, cardCls, labelCls, primaryBtnCls,
} from '@/components/delivery/DeliveryBadges';
import { BRAND } from '@/components/store/ProductCard';
import { useState } from 'react';

const REQUIREMENTS = [
  '18 years or older',
  'Valid driving licence (two-wheeler)',
  'Your own bike / scooter with RC',
  'Vehicle insurance + PUC certificate',
  'Aadhaar + PAN details (masked — we never store full numbers)',
  'A smartphone with internet',
];

const STEPS = [
  { icon: UserPlus, title: 'Register', text: 'Fill the partner form with your details and documents.' },
  { icon: FileCheck2, title: 'KYC review', text: 'Our team reviews your documents and approves you.', soon: true },
  { icon: Bike, title: 'Go online', text: 'Open the biker app, go online, and receive delivery offers.' },
  { icon: Wallet, title: 'Earn', text: 'Complete deliveries and watch your earnings grow.' },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How much can I earn?',
    a: 'You keep the delivery fee for every order you complete. Demo rates are shown in the app; final payout rates are fixed at launch.',
  },
  {
    q: 'When do I get paid?',
    a: (
      <>
        Earnings land in your demo payout ledger instantly. Real payouts to your bank account
        need a payout provider — <SoonBadge />.
      </>
    ),
  },
  {
    q: 'Can I work with other platforms?',
    a: 'Yes — no exclusivity assumed. Ride for whoever you like; go online with us whenever it suits you.',
  },
  {
    q: 'Is my identity verification instant?',
    a: (
      <>
        Not yet. Documents are reviewed manually in this pilot; instant verification needs a
        KYC provider — <SoonBadge />.
      </>
    ),
  },
  {
    q: 'Which cities are hiring?',
    a: 'We start in our pilot delivery zones and expand city by city. Check your PIN on the delivery home page to see if your area is live.',
  },
];

export default function BecomePartner() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero
        emoji="🏍️"
        title="Become a Delivery Partner"
        sub="Turn your two-wheeler into earnings. Flexible hours, zero joining fee, and you keep the delivery fee on every order."
      />

      {/* Earnings explainer */}
      <section className={cardCls}>
        <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
          <CircleDollarSign size={18} style={{ color: BRAND }} /> How you earn
        </h2>
        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
          You keep the <strong>delivery fee per order</strong> — demo rates shown;
          final rates at launch. No commission on your tips, no hidden cuts.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
          <div className="grid grid-cols-3 bg-orange-50 text-[11px] font-extrabold text-gray-700">
            <div className="p-2.5">Distance</div>
            <div className="p-2.5">Demo fee</div>
            <div className="p-2.5">You keep</div>
          </div>
          {[
            ['0–3 km', '₹25', '₹25'],
            ['3–7 km', '₹40', '₹40'],
            ['7–12 km', '₹60', '₹60'],
          ].map(r => (
            <div key={r[0]} className="grid grid-cols-3 text-xs text-gray-700 border-t border-gray-100">
              <div className="p-2.5 font-semibold">{r[0]}</div>
              <div className="p-2.5">{r[1]}</div>
              <div className="p-2.5 font-bold text-green-700">{r[2]}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <DemoBadge label="demo rates" />
          <span className="text-[11px] text-gray-500">Final rates fixed at launch.</span>
        </div>
      </section>

      {/* Requirements */}
      <section className={`${cardCls} mt-6`}>
        <h2 className="text-base font-extrabold text-gray-900">What you need</h2>
        <ul className="mt-3 space-y-2.5">
          {REQUIREMENTS.map(r => (
            <li key={r} className="flex items-start gap-2.5 text-sm text-gray-700">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-green-600" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="mt-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">Get started in 4 steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className={cardCls}>
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ background: BRAND }}
                >
                  {i + 1}
                </span>
                <s.icon size={20} style={{ color: BRAND }} />
              </div>
              <h3 className="font-extrabold text-sm text-gray-900 mt-2 flex items-center gap-2 flex-wrap">
                {s.title} {s.soon && <SoonBadge />}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">Questions, answered</h2>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={f.q} className={cardCls}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-2 text-left"
              >
                <span className={`${labelCls} !mb-0 text-sm`}>{f.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-gray-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && <p className="text-xs text-gray-600 mt-2 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Trust row */}
      <section className={`${cardCls} mt-6 flex items-center gap-3`}>
        <BadgeCheck size={26} className="shrink-0 text-green-600" />
        <p className="text-xs text-gray-600 leading-relaxed">
          Verified partners only: every delivery partner is KYC-reviewed by the SastaBazaar
          team before going online. <DemoBadge label="manual review in pilot" />
        </p>
      </section>

      {/* Trucks / tempos / drivers — registration lives in the delivery section */}
      <Link href="/delivery/vehicles" className={`${cardCls} mt-6 group flex items-center justify-between hover:border-[#FB7701]/60 transition`}>
        <div>
          <h3 className="font-extrabold text-sm text-gray-900">🚚 Own a Truck, Tempo or drive one?</h3>
          <p className="text-xs text-gray-600 mt-0.5">Register your Big Truck / Small Truck / Tempo, or join as a driver — ID + licence only.</p>
        </div>
        <ArrowRight size={20} className="text-gray-400 group-hover:translate-x-1 transition shrink-0" />
      </Link>

      <Link href="/biker/register" className={`${primaryBtnCls} mt-6 flex items-center justify-center gap-2`} style={{ background: BRAND }}>
        Register as a Delivery Partner <ArrowRight size={18} />
      </Link>
      <p className="text-center text-[11px] text-gray-400 mt-2">
        By registering you agree to the SastaBazaar delivery partner terms.
      </p>
    </div>
  );
}
