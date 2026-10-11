'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail, Clock, Flag, ChevronDown, CheckCircle2, LogIn, Phone,
} from 'lucide-react';
import {
  PageHero, DemoBadge, SoonBadge, cardCls, fieldCls, labelCls, primaryBtnCls,
} from '@/components/delivery/DeliveryBadges';
import { customerJobs, raiseDispute, type DeliveryJob } from '@/lib/delivery';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { BRAND } from '@/components/store/ProductCard';

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'My package is lost. What do I do?',
    a: 'Raise a dispute below with your delivery selected — our team will trace the order with the shop and biker, and keep you posted by email.',
  },
  {
    q: 'The OTP didn’t work. Now what?',
    a: 'Ask the biker to wait a moment and tap “Show my delivery OTP” again — a fresh code is generated each time. If it still fails, raise a dispute and we’ll confirm delivery manually.',
  },
  {
    q: 'My biker is a no-show.',
    a: (
      <>
        Check the tracking timeline first — the biker may still be at the shop. If they
        don’t arrive, call support during care hours. <SoonBadge label="In-app calling — Coming soon" />
      </>
    ),
  },
  {
    q: 'How do refunds work?',
    a: 'Refunds are handled by the shop for the order value, and by SastaBazaar support for delivery-fee issues raised within 48 hours.',
  },
];

export default function DeliverySupport() {
  const { user, ready } = useAuth();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [jobId, setJobId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const configured = getSupabase() !== null;

  useEffect(() => {
    if (ready && user && configured) {
      customerJobs().then(j => {
        setJobs(j);
        if (j.length > 0 && !jobId) setJobId(j[0].id);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, configured]);

  const submit = async () => {
    if (!jobId || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await raiseDispute(jobId, reason);
      setSuccess(true);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not raise the dispute. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero
        emoji="🛟"
        title="Delivery Support"
        sub="Something wrong with your home delivery? Talk to us — we’ll sort it out."
      />

      {/* Contact card */}
      <section className={cardCls}>
        <h2 className="text-base font-extrabold text-gray-900">Contact us</h2>
        <div className="mt-3 space-y-2.5 text-sm">
          <a href="mailto:care@sastabazaar.in" className="flex items-center gap-2.5 text-gray-800 font-semibold">
            <Mail size={17} style={{ color: BRAND }} /> care@sastabazaar.in
          </a>
          <p className="flex items-center gap-2.5 text-gray-600">
            <Clock size={17} className="text-gray-400" /> Mon–Sat, 10 AM – 7 PM IST
          </p>
          <p className="flex items-center gap-2.5 text-gray-600">
            <Phone size={17} className="text-gray-400" /> Phone support <SoonBadge label="Coming soon" />
          </p>
        </div>
      </section>

      {/* Raise a dispute */}
      <section className={`${cardCls} mt-6`}>
        <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
          <Flag size={18} style={{ color: BRAND }} /> Raise a dispute
        </h2>
        {!ready ? (
          <p className="text-xs text-gray-500 mt-3">Loading…</p>
        ) : !user ? (
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <LogIn size={22} className="mx-auto text-gray-400" />
            <p className="text-sm text-gray-700 font-semibold mt-2">Please log in to raise a dispute about your delivery.</p>
            <Link
              href="/account"
              className="inline-block mt-3 px-6 py-2.5 rounded-xl text-white font-extrabold text-sm shadow hover:brightness-110"
              style={{ background: BRAND }}
            >
              Log in / Sign up
            </Link>
          </div>
        ) : !configured ? (
          <p className="text-xs text-gray-500 mt-3">Backend not configured — disputes need the Supabase backend.</p>
        ) : success ? (
          <div className="mt-3 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
            <CheckCircle2 size={26} className="mx-auto text-green-600" />
            <p className="text-sm text-green-800 font-bold mt-2">Dispute raised successfully.</p>
            <p className="text-xs text-green-700 mt-1">Our support team will review it and contact you by email.</p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-3 text-xs font-bold text-green-700 underline"
            >
              Raise another dispute
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {jobs.length === 0 ? (
              <p className="text-xs text-gray-500">No deliveries found on your account yet.</p>
            ) : (
              <div>
                <label className={labelCls}>Your delivery</label>
                <select value={jobId} onChange={e => setJobId(e.target.value)} className={fieldCls}>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.id.slice(0, 8)}… — {j.status.replace(/_/g, ' ')} — {new Date(j.created_at).toLocaleDateString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>What went wrong?</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Describe the issue — e.g. package never arrived, biker asked for extra money…"
                className={fieldCls}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={submit}
              disabled={busy || !jobId || !reason.trim()}
              className={primaryBtnCls}
              style={{ background: BRAND }}
            >
              {busy ? 'Submitting…' : 'Raise dispute'}
            </button>
            <div className="flex items-center gap-2">
              <DemoBadge />
              <span className="text-[11px] text-gray-500">Disputes are reviewed manually by our support team.</span>
            </div>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="mt-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">Common questions</h2>
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

      <Link href="/delivery" className="inline-block mt-6 text-sm font-bold" style={{ color: BRAND }}>
        ← Back to Home Delivery
      </Link>
    </div>
  );
}
