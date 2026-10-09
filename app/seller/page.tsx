'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, KeyRound, ArrowRight, ShieldCheck, Truck, BadgePercent, Megaphone, Download, Sparkles, Timer } from 'lucide-react';
import { getSessionSeller, getSellerByPhone, sendOtp, verifyOtp, setSessionSeller, ensureSeed } from '@/lib/seller';

export default function SellerHub() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    ensureSeed();
    if (getSessionSeller()) router.replace('/seller/dashboard');
  }, [router]);

  const requestOtp = () => {
    setError('');
    const p = phone.trim();
    if (p.replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number.'); return; }
    const seller = getSellerByPhone(p);
    if (!seller) { setError('No seller account found for this number. Please register first.'); return; }
    setDemoCode(sendOtp(p)); // DEMO: code shown on screen (real SMS gateway needed for launch)
    setOtpSent(true);
  };

  const login = () => {
    setError('');
    if (verifyOtp(phone.trim(), code)) {
      const seller = getSellerByPhone(phone.trim())!;
      setSessionSeller(seller.id);
      router.replace('/seller/dashboard');
    } else {
      setError('Wrong or expired OTP. Try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-sm px-4 py-1.5 rounded-full">
            <Timer size={16} /> Start selling in 2 minutes
          </div>
          <h1 className="text-4xl font-black text-gray-900 mt-4 leading-tight">
            Sell on Sastabazaar.<br /><span className="text-[var(--primary)]">No paperwork to start.</span>
          </h1>
          <p className="text-gray-600 mt-4">
            Just your phone number and shop name — list products in the morning, get orders on your phone,
            ship them yourself. KYC and the seller agreement are only needed later, when you want payouts.
          </p>
          <div className="mt-6 flex items-center gap-2">
            {[
              { n: '1', t: 'Phone' },
              { n: '2', t: 'Shop name' },
              { n: '3', t: 'Sell' },
            ].map(({ n, t }, i) => (
              <div key={t} className="flex items-center gap-2 flex-1 last:flex-none">
                <span className="w-9 h-9 shrink-0 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-black">{n}</span>
                <span className="text-sm font-bold text-gray-800">{t}</span>
                {i < 2 && <ArrowRight size={16} className="text-gray-300 mx-1" />}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {[
              { icon: BadgePercent, t: 'Low commission', d: 'New products: 10% (never more than \u20b9100/order). Old / refurbished / clearance: just \u20b91 per piece.' },
              { icon: ShieldCheck, t: 'Sell first, verify later', d: 'Start listing products immediately. Complete KYC + sign the agreement only when you want your payouts.' },
              { icon: Truck, t: 'You ship, we bring buyers', d: 'Order alerts on phone & email. You dispatch, you share the tracking ID.' },
              { icon: Sparkles, t: 'AI listing helper', d: 'Upload 5\u20136 photos, AI writes your title & description. Clothes & shoe sizes included.' },
              { icon: Megaphone, t: 'We do ALL marketing', d: 'You only publish products & set prices. We advertise on Facebook, Google, Instagram, hoardings — everywhere.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <div>
                  <div className="font-bold text-gray-900">{t}</div>
                  <div className="text-sm text-gray-500">{d}</div>
                </div>
              </div>
            ))}
          </div>
          <a href="/seller-agreement-form.pdf" download
            className="mt-4 w-full inline-flex items-center justify-center gap-2 font-bold py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-[var(--primary)] hover:text-[var(--primary)] transition text-sm">
            <Download size={17} /> Download printable agreement (PDF) \u2014 sign & paste Aadhaar + PAN
          </a>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-gray-900">Seller Login</h2>
          <p className="text-sm text-gray-500 mt-1">We send an OTP to your registered phone number.</p>
          {!otpSent ? (
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Phone number</span>
                <div className="relative mt-1">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    inputMode="tel"
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                  />
                </div>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={requestOtp} className="btn-primary w-full font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2">
                Send OTP <ArrowRight size={18} />
              </button>
              <p className="text-sm text-center text-gray-500">
                New seller?{' '}
                <Link href="/seller/register" className="font-bold text-[var(--primary)]">Register here</Link>
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                <span className="font-bold">Demo mode:</span> your OTP is{' '}
                <span className="font-black text-lg tracking-widest">{demoCode}</span>
                <div className="text-xs mt-1">Real launch needs an SMS gateway (MSG91/Twilio) connected to your account.</div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Enter OTP</span>
                <div className="relative mt-1">
                  <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                  />
                </div>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={login} className="btn-primary w-full font-bold py-3.5 rounded-2xl">Verify & Login</button>
              <button onClick={() => setOtpSent(false)} className="w-full text-sm text-gray-500">Use a different number</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
