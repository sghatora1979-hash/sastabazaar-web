'use client';
/**
 * /nursery — स्थानीय नर्सरी | Local Nursery.
 * Demo plant listings + phone-number-first nursery onboarding (demo storage).
 */
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { DEMO_NURSERY, NURSERY_KINDS, kindHi, searchNursery, saveNurseryListing, getUserNurseryListings, NurseryProduct } from '@/lib/nursery';
import { HindiName } from '@/components/HindiName';
import { formatINR } from '@/lib/utils';
import { Phone, MessageCircle, Leaf, CheckCircle2 } from 'lucide-react';

function NurseryCard({ p }: { p: NurseryProduct }) {
  const wa = (p.whatsapp ?? p.phone).replace(/[^0-9]/g, '');
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-square bg-green-50">
        <Image src={p.image} alt={p.nameHi} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" unoptimized />
        <span className="absolute top-2 left-2 bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {kindHi(p.kind)}
        </span>
      </div>
      <div className="p-2.5 sm:p-3">
        <HindiName hi={p.nameHi} en={p.name} size="card" />
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-[16px] font-extrabold text-gray-900">{formatINR(p.price)}</span>
          {p.mrp > p.price && <span className="text-[11px] text-gray-400 line-through">{formatINR(p.mrp)}</span>}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{p.nurseryNameHi} · {p.city} {p.pin}</p>
        <div className="flex gap-2 mt-2">
          <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="btn-fx flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 text-white text-xs font-extrabold py-2 rounded-xl">
            <Phone size={13} /> Call
          </a>
          <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Namaste! I want: ${p.nameHi} — ${formatINR(p.price)}`)}`} target="_blank" rel="noopener noreferrer" className="btn-fx flex-1 inline-flex items-center justify-center gap-1 text-white text-xs font-extrabold py-2 rounded-xl" style={{ background: '#25D366' }}>
            <MessageCircle size={13} /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function OnboardForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [city, setCity] = useState('');
  const [pin, setPin] = useState('');
  const [pname, setPname] = useState('');
  const [pnameHi, setPnameHi] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [done, setDone] = useState(false);

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true); // demo OTP "sent"
      return;
    }
    const listing: NurseryProduct = {
      id: `np-user-${Date.now()}`,
      name: pname || 'Nursery Plant',
      nameHi: pnameHi || 'नर्सरी का पौधा',
      kind: 'Outdoor plant',
      price: Number(price) || 99,
      mrp: Number(price) || 99,
      image: `https://picsum.photos/seed/sb-user-nursery-${Date.now()}/800/800`,
      stock: Number(qty) || 10,
      nurseryId: 'user-nursery',
      nurseryName: name,
      nurseryNameHi: name,
      city: city || 'India',
      pin: pin || '',
      phone,
      whatsapp: phone,
    };
    saveNurseryListing(listing);
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle2 size={36} className="mx-auto text-green-600 mb-2" />
        <p className="font-extrabold text-green-900">🎉 Ready to go digital!</p>
        <p className="text-sm text-green-700 mt-1">Your plant listing is live in this demo. Customers nearby will see it first.</p>
        <button onClick={() => { setDone(false); setOtpSent(false); setPname(''); }} className="mt-4 text-sm font-bold text-green-700 underline">
          Add another plant
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-green-200 p-4 sm:p-6 shadow-sm space-y-3">
      <h3 className="font-extrabold text-gray-900">🌱 Nursery registration — सिर्फ फोन नंबर से शुरू करें</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Owner / business name" className={input} required />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City · शहर" className={input} required />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" inputMode="tel" className={input} required />
        <input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN code" inputMode="numeric" className={input} required />
      </div>
      {!otpSent ? (
        <button type="submit" className="btn-fx w-full bg-green-600 text-white font-extrabold py-3 rounded-xl">
          Send OTP (Demo)
        </button>
      ) : (
        <>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Demo mode: any 4-digit code works. Real SMS OTP needs backend + SMS provider (see /roadmap).
          </p>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 4-digit OTP (demo: 1234)" inputMode="numeric" maxLength={4} className={input} required />
          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <input value={pnameHi} onChange={e => setPnameHi(e.target.value)} placeholder="पौधे का नाम (Hindi)" className={input} required />
            <input value={pname} onChange={e => setPname(e.target.value)} placeholder="Plant name (English)" className={input} required />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ₹" inputMode="numeric" className={input} required />
            <input value={qty} onChange={e => setQty(e.target.value)} placeholder="Quantity" inputMode="numeric" className={input} required />
          </div>
          <button type="submit" className="btn-fx w-full bg-green-600 text-white font-extrabold py-3 rounded-xl">
            Publish listing · लिस्टिंग प्रकाशित करें
          </button>
        </>
      )}
    </form>
  );
}

export default function NurseryPage() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [userListings, setUserListings] = useState<NurseryProduct[]>([]);

  useMemo(() => {
    setUserListings(getUserNurseryListings());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    const base = searchNursery(q, kind || undefined);
    const mine = q || kind ? userListings.filter(p => {
      if (kind && p.kind !== kind) return false;
      if (!q.trim()) return true;
      return p.name.toLowerCase().includes(q.toLowerCase()) || p.nameHi.includes(q.trim());
    }) : userListings;
    return [...mine, ...base];
  }, [q, kind, userListings]);

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          <Leaf className="inline text-green-600" size={30} /> स्थानीय नर्सरी
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-bold">Local Nursery</p>
        <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
          Flower plants, fruit plants, seedlings, pots, seeds & compost — from nurseries near you. Local pickup & seller delivery.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6 max-w-3xl mx-auto">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search plants… पौधे खोजें" className={input} />
        <select value={kind} onChange={e => setKind(e.target.value)} className={input} aria-label="Plant type">
          <option value="">All types · सभी प्रकार</option>
          {NURSERY_KINDS.map(k => (
            <option key={k} value={k}>{kindHi(k)} · {k}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mb-12">
        {results.map(p => (
          <NurseryCard key={p.id} p={p} />
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <OnboardForm />
        <p className="text-[11px] text-gray-400 mt-3 text-center">
          Demo onboarding — stored in this browser only. No real verification happens yet.
        </p>
      </div>
    </div>
  );
}
