'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import {
  getMyBiker, myOffers, claimJob, rejectOffer, myJobs,
  type BikerProfile, type JobOffer, type DeliveryJob,
} from '@/lib/delivery';
import { formatINR } from '@/lib/utils';
import { DemoBadge, JobStatusBadge, BikerStatusBadge, cardCls, primaryBtnCls, PageHero } from '@/components/delivery/DeliveryBadges';
import { BRAND } from '@/components/store/ProductCard';

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s left`;
  return `${Math.floor(s / 60)}m ${s % 60}s left`;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function BikerJobsPage() {
  const { ready, user, configured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [biker, setBiker] = useState<BikerProfile | null>(null);
  const [tab, setTab] = useState<'available' | 'history'>('available');
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const b = await getMyBiker();
    setBiker(b);
    if (b?.status === 'approved') {
      const [o, j] = await Promise.all([myOffers(), myJobs()]);
      setOffers(o); setJobs(j);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (getSupabase()) load().finally(() => setLoading(false));
    else setLoading(false);
  }, [ready, load]);

  if (!ready || loading) {
    return <div className="min-h-screen bg-[#FFF9EC] flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  }

  const guard = !user || !configured ? 'login' : !getSupabase() ? 'backend' : !biker || biker.status !== 'approved' ? 'status' : null;
  if (guard) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="📦" title="My jobs" sub="" />
          <div className={`${cardCls} text-center`}>
            {guard === 'login' && (<><p className="text-sm font-bold text-gray-800 mb-4">Please log in first.</p><Link href="/biker/login" className={`${primaryBtnCls} inline-block`} style={{ background: BRAND }}>Go to biker login</Link></>)}
            {guard === 'backend' && <p className="text-sm text-gray-600">Backend not configured.</p>}
            {guard === 'status' && (<>
              {biker && <div className="flex justify-center mb-3"><BikerStatusBadge status={biker.status} /></div>}
              <p className="text-sm text-gray-600 mb-4">Approved bikers only.</p>
              <Link href="/biker/register" className={`${primaryBtnCls} inline-block`} style={{ background: BRAND }}>Go to registration</Link>
            </>)}
          </div>
        </div>
      </div>
    );
  }

  const accept = async (jobId: string) => {
    try { await claimJob(jobId); setMsg(''); await load(); }
    catch { setMsg('This job is no longer available.'); await load(); }
  };
  const reject = async (offerId: string) => {
    try { await rejectOffer(offerId); setMsg(''); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Could not reject offer.'); }
  };

  return (
    <div className="min-h-screen bg-[#FFF9EC] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(['available', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2.5 rounded-xl text-sm font-extrabold border-2 transition ${tab === t ? 'border-[#FB7701] bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-500'}`}>
              {t === 'available' ? 'Available' : 'History'}
            </button>
          ))}
        </div>

        {msg && <p className="text-xs text-red-600 font-bold text-center">{msg}</p>}

        {tab === 'available' && (
          offers.length === 0 ? (
            <div className={`${cardCls} text-center`}>
              <div className="flex justify-center mb-2"><DemoBadge /></div>
              <p className="text-sm text-gray-600"><b>Demo preview</b> — available offers near your zone will appear here. Go <b>Online</b> on the dashboard to receive them.</p>
              <Link href="/biker/dashboard" className="inline-block mt-3 text-xs font-bold underline" style={{ color: BRAND }}>Open dashboard</Link>
            </div>
          ) : (
            offers.map(o => {
              const job = o.job;
              return (
                <div key={o.id} className={cardCls}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900">{job?.pickup_label ?? 'Pickup'} → Customer</p>
                      <p className="text-[11px] text-gray-500 truncate">{job?.pickup_address ?? ''}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 shrink-0">{timeLeft(o.expires_at)}</span>
                  </div>
                  <p className="text-sm font-black mt-1" style={{ color: BRAND }}>{formatINR(job?.delivery_fee ?? 0)}{job?.distance_km ? ` · ${job.distance_km} km` : ''}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => job && accept(job.id)} className="py-2.5 rounded-xl text-white text-sm font-extrabold" style={{ background: '#16a34a' }}>Accept</button>
                    <button onClick={() => reject(o.id)} className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-extrabold">Reject</button>
                  </div>
                </div>
              );
            })
          )
        )}

        {tab === 'history' && (
          jobs.length === 0 ? (
            <div className={`${cardCls} text-sm text-gray-500 text-center`}>No deliveries yet — completed jobs will show here.</div>
          ) : (
            jobs.map(j => (
              <div key={j.id} className={`${cardCls} !py-3`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-gray-800 truncate">{j.pickup_label ?? 'Delivery'} → {j.delivery_address_id ?? 'customer'}</p>
                  <JobStatusBadge status={j.status} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-gray-500">{fmtDate(j.created_at)}</span>
                  <span className="text-sm font-black" style={{ color: BRAND }}>{formatINR(j.delivery_fee)}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
