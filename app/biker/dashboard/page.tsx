'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, Bike, MapPin, Navigation, Package, Star, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import {
  getMyBiker, setBikerOnline, getPublicPhotoUrl,
  myOffers, myJobs, claimJob, rejectOffer,
  markInTransit, requestJobOtp, verifyJobOtp,
  myEarnings, myNotifications,
  type BikerProfile, type JobOffer, type DeliveryJob, type BikerEarning, type AppNotification,
} from '@/lib/delivery';
import { formatINR } from '@/lib/utils';
import { OtpInput } from '@/components/delivery/OtpInput';
import { ChatBox } from '@/components/delivery/ChatBox';
import { DemoBadge, JobStatusBadge, BikerStatusBadge, cardCls, primaryBtnCls, labelCls, PageHero } from '@/components/delivery/DeliveryBadges';
import { BRAND } from '@/components/store/ProductCard';

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s left`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s left`;
}

const ACTIVE = ['assigned', 'picked_up', 'in_transit'];

export default function BikerDashboardPage() {
  const { ready, user, configured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [biker, setBiker] = useState<BikerProfile | null>(null);
  const [online, setOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [earnings, setEarnings] = useState<BikerEarning[]>([]);
  const [notes, setNotes] = useState<AppNotification[]>([]);
  const [msg, setMsg] = useState('');
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const b = await getMyBiker();
      setBiker(b);
      setOnline(!!b?.online);
      if (b?.status === 'approved') {
        const [o, j, e, n] = await Promise.all([myOffers(), myJobs(), myEarnings(), myNotifications()]);
        setOffers(o); setJobs(j); setEarnings(e); setNotes(n);
      }
    } catch { /* keep previous state */ }
  }, []);

  useEffect(() => {
    if (!ready) return;
    load().finally(() => setLoading(false));
    const t = setInterval(() => forceTick(x => x + 1), 15000); // refresh countdowns
    const p = setInterval(load, 30000); // poll offers
    return () => { clearInterval(t); clearInterval(p); };
  }, [ready, load]);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      await setBikerOnline(!online);
      setOnline(!online);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not update status.'); }
    finally { setToggling(false); }
  };

  if (!ready || loading) {
    return <div className="min-h-screen bg-[#FFF9EC] flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  }
  if (!user || !configured) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="🛵" title="Biker dashboard" sub="" />
          <div className={`${cardCls} text-center`}>
            <p className="text-sm font-bold text-gray-800 mb-4">Please log in to view your dashboard.</p>
            <Link href="/biker/login" className={`${primaryBtnCls} inline-block`} style={{ background: BRAND }}>Go to biker login</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!getSupabase()) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="🛵" title="Biker dashboard" sub="" />
          <div className={`${cardCls} text-center text-sm text-gray-600`}>Backend not configured.</div>
        </div>
      </div>
    );
  }
  if (!biker || biker.status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="🛵" title="Biker dashboard" sub="Approved bikers only." />
          <div className={`${cardCls} text-center`}>
            {biker && <div className="flex justify-center mb-3"><BikerStatusBadge status={biker.status} /></div>}
            <p className="text-sm text-gray-600 mb-4">
              {biker ? 'Your application is not approved yet.' : 'You have not applied as a delivery partner yet.'}
            </p>
            <Link href="/biker/register" className={`${primaryBtnCls} inline-block`} style={{ background: BRAND }}>Go to registration</Link>
          </div>
        </div>
      </div>
    );
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEarnings = earnings.filter(e => new Date(e.created_at) >= todayStart).reduce((s, e) => s + e.amount, 0);
  const photoUrl = biker.photo_url ? getPublicPhotoUrl(biker.photo_url) : null;

  const activeJob: DeliveryJob | null = (() => {
    // Assigned jobs live in myJobs() (the offer flips to 'accepted' on claim).
    for (const j of jobs) {
      if (ACTIVE.includes(j.status)) return j;
    }
    // Fallback: an offer whose job already moved to an active status.
    for (const o of offers) {
      if (o.job && ACTIVE.includes(o.job.status)) return o.job;
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-[#FFF9EC] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div className={cardCls}>
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img src={photoUrl} alt={biker.full_name} className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: BRAND }} />
            ) : (
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center"><Bike size={26} style={{ color: BRAND }} /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 truncate">{biker.full_name}</p>
              <div className="flex items-center gap-2 mt-0.5"><BikerStatusBadge status={biker.status} /><DemoBadge /></div>
            </div>
            <button
              onClick={toggleOnline}
              disabled={toggling}
              className={`px-5 py-2.5 rounded-full text-sm font-black text-white shadow transition active:scale-95 disabled:opacity-60 ${online ? 'bg-green-600' : 'bg-gray-400'}`}
            >
              {toggling ? '…' : online ? '● Online' : '○ Offline'}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Go <b>Online</b> to receive job offers near {biker.service_city ?? 'your zone'}.</p>
        </div>

        {msg && <p className="text-xs text-red-600 font-bold text-center">{msg}</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`${cardCls} !p-3 text-center`}>
            <Wallet size={18} className="mx-auto mb-1" style={{ color: BRAND }} />
            <p className="text-sm font-black text-gray-900">{formatINR(todayEarnings)}</p>
            <p className="text-[10px] text-gray-500 font-bold">Today's earnings</p>
          </div>
          <div className={`${cardCls} !p-3 text-center`}>
            <Package size={18} className="mx-auto mb-1" style={{ color: BRAND }} />
            <p className="text-sm font-black text-gray-900">{activeJob ? 1 : 0}</p>
            <p className="text-[10px] text-gray-500 font-bold">Active delivery</p>
          </div>
          <div className={`${cardCls} !p-3 text-center`}>
            <Star size={18} className="mx-auto mb-1" style={{ color: BRAND }} />
            <p className="text-sm font-black text-gray-900">—</p>
            <p className="text-[10px] text-gray-500 font-bold">Rating</p>
          </div>
        </div>

        {/* Active job */}
        {activeJob && <ActiveJobCard job={activeJob} onChanged={load} />}

        {/* Offers */}
        <div>
          <h2 className="text-sm font-black text-gray-900 mb-2 px-1">Job offers</h2>
          {offers.filter(o => !o.job || !ACTIVE.includes(o.job.status)).length === 0 ? (
            <div className={`${cardCls} text-center`}>
              <div className="flex justify-center mb-2"><DemoBadge /></div>
              <p className="text-sm text-gray-600"><b>Demo preview</b> — when a shop near you gets an order, the offer appears here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.filter(o => !o.job || !ACTIVE.includes(o.job.status)).map(o => (
                <OfferCard key={o.id} offer={o} onChanged={async () => { setMsg(''); await load(); }} onError={setMsg} />
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-sm font-black text-gray-900 mb-2 px-1 flex items-center gap-1"><Bell size={14} /> Notifications</h2>
          {notes.length === 0 ? (
            <div className={`${cardCls} text-sm text-gray-500 text-center`}>No notifications yet.</div>
          ) : (
            <div className={`${cardCls} !p-2 space-y-1`}>
              {notes.slice(0, 5).map(n => (
                <div key={n.id} className={`p-2.5 rounded-xl ${n.read_at ? 'bg-gray-50' : 'bg-orange-50 border border-orange-100'}`}>
                  <p className="text-xs font-bold text-gray-900">{n.title}</p>
                  {n.body && <p className="text-[11px] text-gray-600">{n.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/biker/jobs" className={`${cardCls} !p-3 text-center text-xs font-bold text-gray-800`}>📦 My jobs</Link>
          <Link href="/biker/earnings" className={`${cardCls} !p-3 text-center text-xs font-bold text-gray-800`}>💰 Earnings</Link>
          <Link href="/delivery/support" className={`${cardCls} !p-3 text-center text-xs font-bold text-gray-800`}>🆘 Support</Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Active job card with OTP flow                                       */
/* ------------------------------------------------------------------ */
function ActiveJobCard({ job, onChanged }: { job: DeliveryJob; onChanged: () => void }) {
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pickupCode, setPickupCode] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); setOtp(''); setPickupCode(null); await onChanged(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setBusy(false); }
  };

  const navAddr = job.status === 'assigned' ? job.pickup_address : job.delivery_address_id;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black text-gray-900">Active delivery</h2>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="space-y-1.5 text-xs text-gray-700 mb-3">
        <p className="flex gap-1.5"><MapPin size={14} className="shrink-0 text-green-600" /><span><b>Pickup:</b> {job.pickup_label ?? '—'} — {job.pickup_address ?? '—'}</span></p>
        <p className="flex gap-1.5"><MapPin size={14} className="shrink-0 text-red-500" /><span><b>Deliver to:</b> {job.delivery_address_id ?? '—'}</span></p>
        <p className="font-bold" style={{ color: BRAND }}>{formatINR(job.delivery_fee)} fee{job.distance_km ? ` · ${job.distance_km} km` : ''}{job.eta_minutes ? ` · ~${job.eta_minutes} min` : ''}</p>
      </div>

      {navAddr && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navAddr)}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border-2 border-blue-200 text-blue-700 text-sm font-bold mb-3"
        >
          <Navigation size={16} /> Navigate ({job.status === 'assigned' ? 'to pickup' : 'to customer'})
        </a>
      )}

      {job.status === 'assigned' && (
        <div className="space-y-2">
          {!pickupCode ? (
            <button onClick={() => run(async () => { const c = await requestJobOtp(job.id, 'pickup'); setPickupCode(c); })} disabled={busy} className={`${primaryBtnCls}`} style={{ background: BRAND }}>
              {busy ? 'Working…' : 'Request pickup OTP'}
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="flex items-center justify-center gap-2"><DemoBadge /><span className="text-sm font-black tracking-widest">{pickupCode}</span></div>
              <p className="text-[11px] text-gray-500 mt-1">Show this code to the shop. Demo — no real SMS.</p>
            </div>
          )}
          <label className={labelCls}>Enter pickup OTP from shop</label>
          <OtpInput value={otp} onChange={setOtp} />
          <button onClick={() => run(async () => { const ok = await verifyJobOtp(job.id, 'pickup', otp); if (!ok) throw new Error('Wrong code.'); })} disabled={busy || otp.length < 6} className={`${primaryBtnCls}`} style={{ background: '#16a34a' }}>
            {busy ? 'Confirming…' : 'Confirm pickup'}
          </button>
        </div>
      )}

      {job.status === 'picked_up' && (
        <button onClick={() => run(() => markInTransit(job.id))} disabled={busy} className={`${primaryBtnCls}`} style={{ background: BRAND }}>
          {busy ? 'Starting…' : 'Start trip'}
        </button>
      )}

      {job.status === 'in_transit' && (
        <div className="space-y-2">
          <label className={labelCls}>Enter delivery OTP from customer</label>
          <OtpInput value={otp} onChange={setOtp} />
          <button onClick={() => run(async () => { const ok = await verifyJobOtp(job.id, 'delivery', otp); if (!ok) throw new Error('Wrong code.'); })} disabled={busy || otp.length < 6} className={`${primaryBtnCls}`} style={{ background: '#16a34a' }}>
            {busy ? 'Completing…' : 'Complete delivery'}
          </button>
        </div>
      )}

      {err && <p className="text-xs text-red-600 font-bold mt-2">{err}</p>}

      <div className="mt-4">
        <p className="text-[11px] font-bold text-gray-500 mb-1">Chat with customer</p>
        <ChatBox jobId={job.id} />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Offer card                                                          */
/* ------------------------------------------------------------------ */
function OfferCard({ offer, onChanged, onError }: { offer: JobOffer; onChanged: () => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const job = offer.job;

  const accept = async () => {
    if (!job) return;
    setBusy(true);
    try { await claimJob(job.id); await onChanged(); }
    catch { onError('This job is no longer available.'); await onChanged(); }
    finally { setBusy(false); }
  };
  const reject = async () => {
    setBusy(true);
    try { await rejectOffer(offer.id); await onChanged(); }
    catch (e) { onError(e instanceof Error ? e.message : 'Could not reject offer.'); }
    finally { setBusy(false); }
  };

  return (
    <div className={`${cardCls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-900">{job?.pickup_label ?? 'Pickup'} → Customer</p>
          <p className="text-[11px] text-gray-500 truncate">{job?.pickup_address ?? ''}</p>
        </div>
        <span className="text-[10px] font-bold text-red-600 shrink-0">{timeLeft(offer.expires_at)}</span>
      </div>
      <p className="text-sm font-black mt-1" style={{ color: BRAND }}>
        {formatINR(job?.delivery_fee ?? 0)}{job?.distance_km ? ` · ${job.distance_km} km` : ''}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button onClick={accept} disabled={busy} className="py-2.5 rounded-xl text-white text-sm font-extrabold disabled:opacity-50" style={{ background: '#16a34a' }}>
          {busy ? '…' : 'Accept'}
        </button>
        <button onClick={reject} disabled={busy} className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-extrabold disabled:opacity-50">
          Reject
        </button>
      </div>
    </div>
  );
}
