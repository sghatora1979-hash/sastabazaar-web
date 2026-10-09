'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, KeyRound, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { sendOtp, verifyOtp, getSellerByPhone, saveSeller, setSessionSeller, ensureSeed, Seller } from '@/lib/seller';
import { STATES } from '@/lib/festivals';

export default function SellerRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('UP');
  const [demoCode, setDemoCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { ensureSeed(); }, []);

  const startOtp = () => {
    setError('');
    if (name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (phone.trim().replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number.'); return; }
    if (getSellerByPhone(phone.trim())) { setError('This phone number is already registered. Please login.'); return; }
    setDemoCode(sendOtp(phone.trim()));
    setStep(2);
  };

  const finish = () => {
    setError('');
    if (!verifyOtp(phone.trim(), code)) { setError('Wrong or expired OTP. Try again.'); return; }
    const seller: Seller = {
      id: `seller-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      state,
      kycStatus: 'none',
      createdAt: new Date().toISOString(),
    };
    saveSeller(seller);
    setSessionSeller(seller.id);
    router.replace('/seller/kyc');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Become a Seller</h1>
        <div className="flex items-center gap-2 mt-3 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? <CheckCircle2 size={16} /> : s}
              </span>
              <span className="text-xs font-semibold text-gray-600">{s === 1 ? 'Details' : 'Verify OTP'}</span>
              {s === 1 && <span className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Full name</span>
              <div className="relative mt-1">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Kumar"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Email</span>
              <div className="relative mt-1">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Phone number (OTP will be sent here)</span>
              <div className="relative mt-1">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" inputMode="tel"
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={startOtp} className="btn-primary w-full font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2">
              Send OTP <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
            <button onClick={finish} className="btn-primary w-full font-bold py-3.5 rounded-2xl">Verify & Continue to KYC</button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-gray-500">Edit details</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
