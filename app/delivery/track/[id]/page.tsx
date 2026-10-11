'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Timer, Package, MessageCircle, AlertTriangle, KeyRound, User,
} from 'lucide-react';
import {
  PageHero, DemoBadge, SoonBadge, JobStatusBadge, cardCls, primaryBtnCls, labelCls,
} from '@/components/delivery/DeliveryBadges';
import { ChatBox } from '@/components/delivery/ChatBox';
import {
  getJobDetail, requestJobOtp, getPublicPhotoUrl,
  type JobDetail, type JobStatus,
} from '@/lib/delivery';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';
import { BRAND } from '@/components/store/ProductCard';

const EVENT_LABELS: Record<string, string> = {
  job_created: 'Order received',
  offered: 'Finding a biker',
  assigned: 'Biker assigned',
  picked_up: 'Picked up from shop',
  in_transit: 'On the way to you',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

function eventLabel(t: string): string {
  if (EVENT_LABELS[t]) return EVENT_LABELS[t];
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const OTP_OK_STATUSES: JobStatus[] = ['assigned', 'picked_up', 'in_transit'];

export default function TrackDelivery({ params }: { params: { id: string } }) {
  const { user, ready } = useAuth();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const configured = getSupabase() !== null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getJobDetail(params.id);
      setDetail(d);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  const showOtp = async () => {
    setOtpBusy(true);
    setOtpError(null);
    try {
      const code = await requestJobOtp(params.id, 'delivery');
      setOtp(code);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : 'Could not fetch OTP. Please try again.');
    } finally {
      setOtpBusy(false);
    }
  };

  const isCustomer = ready && !!user && detail !== null && user.id === detail.job.customer_profile_id;
  const canShowOtp = detail !== null && OTP_OK_STATUSES.includes(detail.job.status);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero emoji="📦" title="Track my delivery" sub="Live status of your home delivery, direct from the shop to your door." />

      {!configured && (
        <div className={`${cardCls} text-sm text-gray-700`}>
          <strong>Backend not configured.</strong> Delivery tracking needs the Supabase backend — check the app settings.
        </div>
      )}

      {configured && loading && (
        <div className={`${cardCls} text-center text-sm text-gray-500`}>Loading delivery…</div>
      )}

      {configured && !loading && detail === null && (
        <div className={`${cardCls} text-center`}>
          <AlertTriangle size={28} className="mx-auto text-amber-500" />
          <h2 className="font-extrabold text-gray-900 mt-2">Delivery not found or not authorized.</h2>
          <p className="text-xs text-gray-600 mt-1">
            Check the delivery ID, or open the link you received for this order. Only the customer,
            their biker, and support can view a delivery.
          </p>
          <Link href="/delivery" className="inline-block mt-4 text-sm font-bold" style={{ color: BRAND }}>
            ← Back to Home Delivery
          </Link>
        </div>
      )}

      {configured && !loading && detail !== null && (
        <div className="space-y-4">
          {/* Status header */}
          <section className={cardCls}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <JobStatusBadge status={detail.job.status} />
              <span className="text-[11px] text-gray-400 font-mono">
                ID {detail.job.id.slice(0, 8)}…
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="rounded-xl bg-orange-50 p-2.5">
                <Timer size={16} className="mx-auto" style={{ color: BRAND }} />
                <p className={labelCls + ' !mb-0 mt-1'}>ETA</p>
                <p className="text-sm font-extrabold text-gray-900">
                  {detail.job.eta_minutes ? `~${detail.job.eta_minutes} min` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-2.5">
                <Package size={16} className="mx-auto" style={{ color: BRAND }} />
                <p className={labelCls + ' !mb-0 mt-1'}>Delivery fee</p>
                <p className="text-sm font-extrabold text-gray-900">{formatINR(detail.job.delivery_fee)}</p>
              </div>
              <div className="rounded-xl bg-orange-50 p-2.5">
                <MapPin size={16} className="mx-auto" style={{ color: BRAND }} />
                <p className={labelCls + ' !mb-0 mt-1'}>Distance</p>
                <p className="text-sm font-extrabold text-gray-900">
                  {detail.job.distance_km != null ? `${detail.job.distance_km} km` : '—'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-200 p-2.5">
              <MapPin size={15} className="shrink-0 mt-0.5 text-gray-500" />
              <div>
                <SoonBadge label="Live GPS — Coming soon" />
                <p className="text-[11px] text-gray-500 mt-1">
                  Status updates only in this pilot — no live map yet.
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className={cardCls}>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">Delivery timeline</h2>
            {detail.events.length === 0 ? (
              <p className="text-xs text-gray-500">No status updates yet.</p>
            ) : (
              <ol className="relative border-l-2 border-orange-100 ml-2 space-y-4">
                {detail.events.map(ev => (
                  <li key={ev.id} className="ml-4 relative">
                    <span
                      className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white shadow"
                      style={{ background: BRAND }}
                    />
                    <p className="text-sm font-bold text-gray-900">{eventLabel(ev.event_type)}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(ev.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Biker card */}
          <section className={cardCls}>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">Your biker</h2>
            {detail.biker ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const photo = detail.biker.photo_url ? getPublicPhotoUrl(detail.biker.photo_url) : null;
                  return photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={detail.biker.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-orange-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🧑‍✈️</div>
                  );
                })()}
                <div>
                  <p className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <User size={14} /> {detail.biker.full_name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={12} /> {detail.biker.service_city ?? 'On the way'}
                  </p>
                  <p className={`text-[11px] font-bold ${detail.biker.online ? 'text-green-600' : 'text-gray-400'}`}>
                    {detail.biker.online ? '● Online now' : '○ Offline'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 font-semibold">⏳ Finding your biker…</p>
            )}
          </section>

          {/* Delivery OTP */}
          {isCustomer && canShowOtp && (
            <section className={cardCls}>
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <KeyRound size={18} style={{ color: BRAND }} /> Delivery OTP
              </h2>
              {otp === null ? (
                <div className="mt-3">
                  <button onClick={showOtp} disabled={otpBusy} className={primaryBtnCls} style={{ background: BRAND }}>
                    {otpBusy ? 'Fetching…' : 'Show my delivery OTP'}
                  </button>
                  {otpError && <p className="text-xs text-red-600 mt-2">{otpError}</p>}
                </div>
              ) : (
                <div className="mt-3 text-center rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-5">
                  <div className="flex justify-center gap-2 mb-2"><DemoBadge /></div>
                  <p className="text-5xl font-black tracking-[0.3em] text-gray-900" dir="ltr">{otp}</p>
                  <p className="text-xs text-gray-600 mt-3">
                    Share this with your biker at the door. Demo — no SMS sent.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Chat */}
          <section className={cardCls}>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-1">
              <MessageCircle size={18} style={{ color: BRAND }} /> Chat with your biker
            </h2>
            <ChatBox jobId={params.id} />
          </section>

          {/* Report an issue */}
          <Link href="/delivery/support" className={`${cardCls} flex items-center justify-between hover:border-[#FB7701]/60 transition`}>
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-600" />
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Report an issue</h3>
                <p className="text-xs text-gray-600">Lost package, wrong biker, or anything else.</p>
              </div>
            </div>
            <span className="text-sm font-bold" style={{ color: BRAND }}>→</span>
          </Link>

          <button onClick={load} className={`${primaryBtnCls} mt-1`} style={{ background: BRAND }}>
            Refresh status
          </button>
        </div>
      )}
    </div>
  );
}
