'use client';
// SastaBazaar Courier Directory (Update 23) — "We accept these couriers".
// HONEST: rates are INDICATIVE starting rates; live booking/labels = Phase 2.
import { useState } from 'react';
import { COURIERS, SCOPES, type Courier } from '@/lib/couriers';
import { Truck, BadgeCheck, Info, ExternalLink } from 'lucide-react';

function Card({ c }: { c: Courier }) {
  return (
    <div className="rounded-3xl border p-5 bg-white shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="font-extrabold text-lg">{c.name}</div>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
          <BadgeCheck size={13} /> Accepted
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-orange-50 p-3">
          <div className="text-xs text-gray-500">Rate (500g, indicative)</div>
          <div className="font-black text-[var(--primary)]">{c.rate}</div>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <div className="text-xs text-gray-500">Delivery time</div>
          <div className="font-black">🕒 {c.time}</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-600">📍 {c.coverage}</div>
      <div className="mt-1 text-sm text-gray-600">⭐ Best for: {c.best}</div>
      {c.track && (
        <a href={c.track} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--primary)]">
          Track shipment <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}

export default function CouriersPage() {
  const [scope, setScope] = useState<'india' | 'intl' | 'china'>('india');
  const list = COURIERS.filter((c) => c.scope === scope);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Truck className="text-[var(--primary)]" size={30} />
        <h1 className="text-3xl font-extrabold">Courier Partners</h1>
      </div>
      <p className="text-gray-500 mb-1">✅ <b>We accept these courier services.</b> Sellers ship from their <b>own courier accounts</b> — SastaBazaar khud parcel nahi bhejta.</p>
      <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex gap-2">
        <Info size={18} className="shrink-0 mt-0.5" />
        <span>Rates <b>indicative starting rates</b> hain (Oct 2026) — asli rate zone, wazan aur tumhare courier contract par nirbhar karta hai. Live rate + label printing Phase 2 mein (aggregator API).</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {SCOPES.map((s) => (
          <button key={s.id} onClick={() => setScope(s.id)}
            className={`rounded-full px-5 py-2.5 font-bold text-sm border-2 transition ${scope === s.id ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-gray-200 text-gray-600'}`}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-4">{SCOPES.find((s) => s.id === scope)?.desc} — {list.length} couriers</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => <Card key={c.name} c={c} />)}
      </div>

      <div className="mt-8 rounded-3xl bg-gray-50 border p-5 text-sm text-gray-600">
        <b>🧾 Seller note:</b> Apna courier account khud banao (courier ki website/app se), phir order aane par wahan se label nikalo aur ship karo.
        Ek se zyada courier rakhna sasta padta hai — har order par compare karo.
        <br /><b>Sources:</b> clickpost.ai, nimbuspost.com (Delhivery/BlueDart/XpressBees/Ekart rate cards, 2026), sf-international.com (SF Express), super-internationalshipping.com — sab indicative.
      </div>
    </div>
  );
}
