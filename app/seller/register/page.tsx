'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, KeyRound, ArrowRight, CheckCircle2, MapPin, Store, Camera, PartyPopper } from 'lucide-react';
import { sendOtp, verifyOtp, getSellerByPhone, saveSeller, setSessionSeller, ensureSeed, Seller } from '@/lib/seller';
import { STATES } from '@/lib/festivals';

/** Downscale a shop photo so it fits comfortably in browser storage. */
function downscaleImage(file: File, maxDim = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d')?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const STEP_LABELS = ['Phone', 'Your shop', 'Start selling'];

export default function SellerRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [code, setCode] = useState('');
  const [shopName, setShopName] = useState('');
  const [state, setState] = useState('UP');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { ensureSeed(); }, []);

  const startOtp = () => {
    setError('');
    if (phone.trim().replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number.'); return; }
    if (getSellerByPhone(phone.trim())) { setError('This phone number is already registered. Please login.'); return; }
    setDemoCode(sendOtp(phone.trim()));
    setOtpSent(true);
  };

  const verifyPhone = () => {
    setError('');
    if (!verifyOtp(phone.trim(), code)) { setError('Wrong or expired OTP. Try again.'); return; }
    setStep(2);
  };

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPhoto(await downscaleImage(f));
    } catch {
      setError('Could not read that photo. Try another one.');
    }
  };

  const finish = () => {
    setError('');
    if (shopName.trim().length < 2) { setError('Please enter your shop name.'); return; }
    const seller: Seller = {
      id: `seller-${Date.now().toString(36)}`,
      name: shopName.trim(),
      email: '',
      phone: phone.trim(),
      state,
      kycStatus: 'none',
      express: true,
      shopName: shopName.trim(),
      photo,
      createdAt: new Date().toISOString(),
    };
    saveSeller(seller);
    setSessionSeller(seller.id);
    setStep(3);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Start selling in 2 minutes</h1>
        <p className="text-sm text-gray-500 mt-1">No paperwork to start. KYC and the agreement come later — only for payouts.</p>

        {/* 3-step indicator */}
        <div className="flex items-center gap-1.5 mt-4 mb-6">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            return (
              <div key={label} className="flex items-center gap-1.5 flex-1 last:flex-none">
                <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </span>
                <span className={`text-xs font-semibold ${step >= s ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                {s < 3 && <span className="flex-1 h-px bg-gray-200 mx-1" />}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Your mobile number</span>
                  <div className="relative mt-1">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" inputMode="tel"
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  </div>
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={startOtp} className="btn-primary w-full font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2">
                  Send OTP <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                  <span className="font-bold">Demo mode:</span> OTP sent to {phone} is{' '}
                  <span className="font-black text-lg tracking-widest">{demoCode}</span>
                  <div className="text-xs mt-1">Real launch needs an SMS gateway connected to your account.</div>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Enter OTP</span>
                  <div className="relative mt-1">
                    <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6}
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  </div>
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={verifyPhone} className="btn-primary w-full font-bold py-3.5 rounded-2xl">Verify & Continue</button>
                <button onClick={() => { setOtpSent(false); setCode(''); }} className="w-full text-sm text-gray-500">Use a different number</button>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Shop name</span>
              <div className="relative mt-1">
                <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Sharma General Store"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Your state (customers can shop state-wise)</span>
              <div className="relative mt-1">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={state} onChange={e => setState(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40">
                  {STATES.map(st => <option key={st.code} value={st.code}>{st.name} — {st.languages.join(', ')}</option>)}
                </select>
              </div>
            </label>
            <div>
              <span className="text-sm font-semibold text-gray-700">Shop photo <span className="font-normal text-gray-400">(optional)</span></span>
              <button onClick={() => fileRef.current?.click()}
                className="mt-1 w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--primary)]/50 transition text-left bg-gray-50">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="Shop" className="w-16 h-16 object-cover rounded-xl" />
                ) : (
                  <span className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">
                    <Camera size={22} />
                  </span>
                )}
                <span className="text-sm text-gray-600">{photo ? 'Photo added — tap to change' : 'Tap to add a photo of your shop'}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={finish} className="btn-primary w-full font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2">
              Create My Shop <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <PartyPopper size={64} className="mx-auto text-[var(--primary)]" />
              <h2 className="text-2xl font-extrabold text-gray-900 mt-4">
                Welcome, {shopName}! Your shop is open.
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                You can list products, take orders and ship right away.
                Complete KYC and sign the agreement later to unlock payouts.
              </p>
              <button onClick={() => router.replace('/seller/dashboard')}
                className="btn-primary mt-6 w-full font-bold py-4 rounded-2xl text-lg inline-flex items-center justify-center gap-2">
                Start Selling — List Your First Product <ArrowRight size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
