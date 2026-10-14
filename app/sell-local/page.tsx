'use client';
/**
 * /sell-local — अपनी दुकान ऑनलाइन लाएँ | Register Your Shop (simple path).
 * Mobile + demo OTP, shop name, contact, category, location, SHOP PHOTO
 * (required — shown on the public shop page), selling Mode A/B, demo publish.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Camera, MapPin, Truck } from 'lucide-react';
import { saveUserShop, LocalShop, DeliveryMode } from '@/lib/local-shops';

const CATS = [
  { en: 'Grocery', hi: 'किराना' },
  { en: 'Clothing', hi: 'कपड़े' },
  { en: 'Mobiles & Electronics', hi: 'मोबाइल और इलेक्ट्रॉनिक्स' },
  { en: 'Nursery', hi: 'नर्सरी' },
  { en: 'Footwear', hi: 'जूते-चप्पल' },
  { en: 'Sweets & Festival', hi: 'मिठाई और त्योहार' },
  { en: 'Home Business', hi: 'घरेलू व्यवसाय' },
  { en: 'Services', hi: 'सेवाएँ' },
];

export default function SellLocalPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopNameHi, setShopNameHi] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState(CATS[0].en);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pin, setPin] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [modes, setModes] = useState<DeliveryMode[]>(['pickup', 'local']);
  const [shopId, setShopId] = useState('');

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(f);
  };

  const toggleMode = (m: DeliveryMode) => {
    setModes(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]));
  };

  const publish = () => {
    const id = `user-shop-${Date.now()}`;
    const shop: LocalShop = {
      id,
      name: shopName,
      nameHi: shopNameHi || shopName,
      owner: shopName,
      phone: contact || phone,
      whatsapp: contact || phone,
      category,
      categoryHi: CATS.find(c => c.en === category)?.hi ?? category,
      city: city || 'India',
      area: area || '',
      pin,
      photo: photo || `https://picsum.photos/seed/${id}/800/450`,
      rating: 5.0,
      deliveryModes: modes.length ? modes : ['pickup'],
      deliveryNote: modes.includes('national') ? 'Ships across India' : 'Local pickup & delivery',
      deliveryNoteHi: modes.includes('national') ? 'पूरे भारत में डिलीवरी' : 'लोकल पिकअप और डिलीवरी',
      products: [],
      isDemo: true,
    };
    saveUserShop(shop);
    setShopId(id);
    setStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">अपनी दुकान ऑनलाइन लाएँ</h1>
        <p className="text-sm text-gray-500 font-bold mt-1">Register Your Shop — 2 minutes, demo</p>
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2, 3].map(n => (
            <span key={n} className={`w-8 h-2 rounded-full ${step >= n ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h2 className="font-extrabold">Step 1 — Mobile number · मोबाइल नंबर</h2>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …" inputMode="tel" className={input} />
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Demo OTP — any 4-digit code works. Real SMS verification needs backend + SMS provider (see /roadmap).
          </p>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP (demo: 1234)" inputMode="numeric" maxLength={4} className={input} />
          <button onClick={() => phone.trim() && otp.trim() && setStep(2)} className="btn-fx w-full bg-emerald-600 text-white font-extrabold py-3 rounded-xl">
            Verify & Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h2 className="font-extrabold">Step 2 — Shop details · दुकान की जानकारी</h2>
          <input value={shopNameHi} onChange={e => setShopNameHi(e.target.value)} placeholder="दुकान का नाम (Hindi)" className={input} />
          <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Shop name (English)" className={input} />
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Business contact number" inputMode="tel" className={input} />
          <select value={category} onChange={e => setCategory(e.target.value)} className={input} aria-label="Business category">
            {CATS.map(c => (
              <option key={c.en} value={c.en}>{c.hi} · {c.en}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={input} />
            <input value={area} onChange={e => setArea(e.target.value)} placeholder="Area" className={input} />
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" inputMode="numeric" className={input} />
          </div>

          {/* Shop photo — required, shown on public shop page */}
          <div>
            <p className="text-sm font-bold mb-2 flex items-center gap-1"><Camera size={15} /> Shop photo · दुकान की फोटो (required)</p>
            <label className="block cursor-pointer">
              <span className="btn-fx inline-block bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
                {photo ? 'Change photo' : 'Upload shop photo'}
              </span>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
            {photo && (
              <div className="relative mt-3 h-44 rounded-xl overflow-hidden bg-gray-100">
                <Image src={photo} alt="Shop photo preview" fill className="object-cover" unoptimized />
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-1">Customers see this photo first when they open your shop.</p>
          </div>

          <button
            onClick={() => shopName.trim() && photo && setStep(3)}
            disabled={!shopName.trim() || !photo}
            className="btn-fx w-full bg-emerald-600 text-white font-extrabold py-3 rounded-xl disabled:opacity-40"
          >
            Continue
          </button>
          {(!shopName.trim() || !photo) && (
            <p className="text-xs text-gray-400 text-center">Shop name and photo are required to continue.</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="font-extrabold">Step 3 — How will you sell? · कैसे बेचेंगे?</h2>

          <button
            type="button"
            onClick={() => toggleMode('local')}
            className={`w-full text-left border-2 rounded-2xl p-4 transition ${modes.includes('local') ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
          >
            <p className="font-extrabold flex items-center gap-2"><MapPin size={16} className="text-emerald-600" /> Mode A — Local Bazaar · लोकल बाज़ार</p>
            <p className="text-xs text-gray-500 mt-1">Sell in your city/locality · phone & WhatsApp orders · local pickup & delivery · nearby customers first</p>
          </button>

          <button
            type="button"
            onClick={() => toggleMode('national')}
            className={`w-full text-left border-2 rounded-2xl p-4 transition ${modes.includes('national') ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
          >
            <p className="font-extrabold flex items-center gap-2"><Truck size={16} className="text-blue-600" /> Mode B — पूरे भारत में बिक्री · Sell Across India</p>
            <p className="text-xs text-gray-500 mt-1">List for customers nationwide · set serviceable PIN codes, shipping fees & dispatch time at product level</p>
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={modes.includes('pickup')} onChange={() => toggleMode('pickup')} />
            Also allow <b>दुकान से लें · Pickup</b>
          </label>

          <button onClick={publish} className="btn-fx w-full bg-emerald-600 text-white font-extrabold py-3 rounded-xl">
            Publish my shop · दुकान प्रकाशित करें
          </button>
          <p className="text-[11px] text-gray-400 text-center">Demo publish — saved in this browser only. Real verification, GST/tax info & payouts need backend + bank registration (see /roadmap).</p>
        </div>
      )}

      {step === 4 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-emerald-600 mb-3" />
          <h2 className="text-2xl font-extrabold text-emerald-900">🎉 Ready to go digital!</h2>
          <p className="text-emerald-800 mt-2 text-sm">
            अब आपकी दुकान आपके शहर में बिकेगी — और पूरे भारत में भी भेज सकते हैं!
          </p>
          <p className="text-emerald-700 text-xs mt-1">Your shop can sell in your city and send anywhere in India.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href="/local-bazaar" className="btn-fx bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-full">
              View in Local Bazaar
            </Link>
            <Link href="/seller" className="btn-fx bg-white border border-emerald-300 text-emerald-800 font-extrabold px-6 py-3 rounded-full">
              Full Seller Dashboard
            </Link>
          </div>
          {shopId && <p className="text-[11px] text-emerald-600/70 mt-4">Shop ID: {shopId}</p>}
        </div>
      )}
    </div>
  );
}
