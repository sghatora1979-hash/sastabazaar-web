'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getMyBiker, myEarnings, type BikerProfile, type BikerEarning } from '@/lib/delivery';
import { formatINR } from '@/lib/utils';
import { SoonBadge, BikerStatusBadge, cardCls, primaryBtnCls, PageHero } from '@/components/delivery/DeliveryBadges';
import { BRAND } from '@/components/store/ProductCard';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BikerEarningsPage() {
  const { ready, user, configured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [biker, setBiker] = useState<BikerProfile | null>(null);
  const [earnings, setEarnings] = useState<BikerEarning[]>([]);

  const load = useCallback(async () => {
    const b = await getMyBiker();
    setBiker(b);
    if (b?.status === 'approved') setEarnings(await myEarnings());
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
          <PageHero emoji="💰" title="Earnings" sub="" />
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

  const total = earnings.reduce((s, e) => s + e.amount, 0);
  const pending = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + e.amount, 0);
  const paid = earnings.filter(e => e.payout_status === 'paid').reduce((s, e) => s + e.amount, 0);

  const cards = [
    { label: 'Total earned', value: formatINR(total) },
    { label: 'Pending payout', value: formatINR(pending) },
    { label: 'Paid out', value: formatINR(paid) },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9EC] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {cards.map(c => (
            <div key={c.label} className={`${cardCls} !p-3 text-center`}>
              <p className="text-sm font-black text-gray-900">{c.value}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-center">
          <SoonBadge label="UPI payouts — Coming soon" />
        </div>
        <p className="text-[11px] text-gray-500 text-center -mt-2">
          Demo ledger: payouts are recorded here; real money movement needs a payout provider.
        </p>

        <div>
          <h2 className="text-sm font-black text-gray-900 mb-2 px-1">Earnings history</h2>
          {earnings.length === 0 ? (
            <div className={`${cardCls} text-sm text-gray-500 text-center`}>No earnings yet — complete a delivery to earn.</div>
          ) : (
            <div className={`${cardCls} !p-0 overflow-hidden`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-orange-50/60 text-gray-500 text-left">
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Job</th>
                    <th className="px-3 py-2 font-bold text-right">Amount</th>
                    <th className="px-3 py-2 font-bold text-right">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(e => (
                    <tr key={e.id} className="border-t border-gray-100">
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{fmtDate(e.created_at)}</td>
                      <td className="px-3 py-2.5 text-gray-800 font-bold truncate max-w-[110px]">{e.kind.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2.5 text-right font-black" style={{ color: BRAND }}>{formatINR(e.amount)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          e.payout_status === 'paid'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {e.payout_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
