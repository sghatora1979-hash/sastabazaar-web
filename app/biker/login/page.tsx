'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getMyBiker } from '@/lib/delivery';
import { OtpInput } from '@/components/delivery/OtpInput';
import { DemoBadge, SoonBadge, fieldCls, labelCls, cardCls, primaryBtnCls, PageHero } from '@/components/delivery/DeliveryBadges';

const STEPS = ['Email login', 'Verify code', 'Where to ride'];

/** Simple biker entry: explains account + email OTP login + zone pick starter. */
export default function BikerLoginPage() {
  const { ready, user, configured, sendOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [routing, setRouting] = useState<string | null>(null);

  // Logged in → route by biker status
  useEffect(() => {
    if (!ready || !user) return;
    const sb = getSupabase();
    if (!sb) { setRouting('backend'); return; }
    let live = true;
    (async () => {
      try {
        const biker = await getMyBiker();
        if (!live) return;
        if (biker?.status === 'approved') {
          setRouting('dashboard'); router.replace('/biker/dashboard');
        } else if (biker && (biker.status === 'pending_verification' || biker.status === 'draft' || biker.status === 'rejected')) {
          setRouting('register'); router.replace('/biker/register');
        } else {
          setRouting('none'); // show CTA below
        }
      } catch { if (live) setRouting('none'); }
    })();
    return () => { live = false; };
  }, [ready, user, router]);

  const doSend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMsg('Enter a valid email address.'); return; }
    setBusy(true); setMsg('');
    const r = await sendOtp(email.trim());
    setBusy(false);
    if (r.ok) { setCodeSent(true); setMsg('Code sent! Check your email (and spam folder).'); }
    else setMsg(r.error ?? 'Could not send code.');
  };

  const doVerify = async () => {
    if (code.trim().length < 6) { setMsg('Enter the 6-digit code.'); return; }
    setBusy(true); setMsg('');
    const r = await verifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (r.ok) {
      setMsg('Logged in! Checking your biker profile…');
      setTimeout(() => router.push('/biker/register'), 600);
    } else setMsg(r.error ?? 'Wrong or expired code.');
  };

  if (!ready) {
    return <div className="min-h-screen bg-[#FFF9EC] flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  }

  if (user) {
    if (routing === 'none') {
      return (
        <div className="min-h-screen bg-[#FFF9EC] pb-24">
          <div className="max-w-2xl mx-auto px-4">
            <PageHero emoji="🛵" title="Become a delivery partner" sub="You're signed in. Apply to ride with SastaBazaar — it takes a few minutes." />
            <Link href="/biker/register" className={`${primaryBtnCls} text-center block`} style={{ background: '#FB7701' }}>
              Start biker application
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FFF9EC] flex items-center justify-center text-sm text-gray-500">
        {routing === 'backend' ? 'Backend not configured — live login is unavailable right now.' : 'Checking your biker profile…'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9EC] pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <PageHero
          emoji="🛵"
          title="Ride with SastaBazaar"
          sub="Bikers use their normal SastaBazaar account — no separate password. Sign in with your email and a one-time code, then apply or open your dashboard."
        />

        {/* How it works */}
        <div className={`${cardCls} mb-4`}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ background: '#FB7701' }}>{i + 1}</div>
                <span className="text-[11px] font-bold text-gray-700">{s}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-3 text-center">
            After signing in you'll be routed automatically: approved bikers → dashboard, everyone else → registration.
          </p>
        </div>

        <div className={cardCls}>
          {!configured && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-bold">
              Backend not configured — live login is unavailable right now.
            </div>
          )}
          <label className={labelCls}>Email address</label>
          <input
            className={fieldCls}
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {!codeSent ? (
            <button onClick={doSend} disabled={busy || !configured} className={`${primaryBtnCls} mt-3`} style={{ background: '#FB7701' }}>
              {busy ? 'Sending…' : 'Send login code'}
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
              <label className={labelCls}>6-digit code</label>
              <OtpInput value={code} onChange={setCode} />
              <button onClick={doVerify} disabled={busy} className={`${primaryBtnCls} mt-3`} style={{ background: '#FB7701' }}>
                {busy ? 'Verifying…' : 'Verify & continue'}
              </button>
              <button onClick={() => { setCodeSent(false); setCode(''); setMsg(''); }} className="w-full mt-2 text-xs font-bold text-gray-500">
                Use a different email
              </button>
            </motion.div>
          )}
          {msg && <p className="text-xs font-bold text-gray-700 mt-3 text-center">{msg}</p>}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Prefer the main account page? <Link href="/account" className="font-bold underline" style={{ color: '#FB7701' }}>Go to /account</Link>
        </p>

        <div className="flex items-center justify-center gap-2 mt-4">
          <SoonBadge label="Delivery app — Coming soon" />
          <DemoBadge label="DEMO" />
        </div>
      </div>
    </div>
  );
}
