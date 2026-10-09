'use client';
/**
 * /admin/feedback — demo admin dashboard for collected feedback.
 * Reads browser localStorage only. Real launch needs backend analytics.
 */
import { useEffect, useState } from 'react';
import { getFeedback, FeedbackEntry } from '@/components/feedback/FeedbackForm';
import { BarChart3 } from 'lucide-react';

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    setItems(getFeedback());
  }, []);

  const avg = items.length ? (items.reduce((s, x) => s + x.rating, 0) / items.length).toFixed(1) : '—';
  const byTopic = items.reduce<Record<string, number>>((m, x) => {
    m[x.topic] = (m[x.topic] ?? 0) + 1;
    return m;
  }, {});
  const noMatch = items.filter(x => x.topic === 'Missing product').length;

  const stat = 'bg-white rounded-2xl border border-gray-200 p-4 shadow-sm';

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
        <BarChart3 size={26} /> Admin · Feedback Dashboard
      </h1>
      <p className="text-xs text-gray-400 mt-1 mb-6">Demo dashboard — reads this browser&apos;s stored feedback only.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className={stat}>
          <p className="text-xs text-gray-400 font-bold uppercase">Avg satisfaction</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{avg}{avg !== '—' && <span className="text-sm text-gray-400">/5</span>}</p>
        </div>
        <div className={stat}>
          <p className="text-xs text-gray-400 font-bold uppercase">Total feedback</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{items.length}</p>
        </div>
        <div className={stat}>
          <p className="text-xs text-gray-400 font-bold uppercase">Missing-product reports</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{noMatch}</p>
        </div>
        <div className={stat}>
          <p className="text-xs text-gray-400 font-bold uppercase">Seller feedback</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{items.filter(x => x.kind === 'seller').length}</p>
        </div>
      </div>

      <h2 className="font-extrabold text-gray-900 mb-3">Popular topics</h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.keys(byTopic).length === 0 && <p className="text-sm text-gray-400">No feedback yet.</p>}
        {Object.entries(byTopic).map(([t, n]) => (
          <span key={t} className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
            {t} · {n}
          </span>
        ))}
      </div>

      <h2 className="font-extrabold text-gray-900 mb-3">Latest feedback</h2>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-gray-400">Nothing here yet — feedback submitted via the form on the contact page will appear here.</p>}
        {items.slice(0, 30).map(f => (
          <div key={f.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
              <span className={`font-bold px-2 py-0.5 rounded-full ${f.kind === 'seller' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {f.kind}
              </span>
              <span className="font-bold text-gray-700">{f.topic}</span>
              <span className="text-amber-500 font-bold">{'★'.repeat(f.rating)}</span>
              <span className="text-gray-400 ml-auto">{new Date(f.at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-700">{f.message}</p>
            {f.contact && <p className="text-xs text-gray-400 mt-1">Contact (consented): {f.contact}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
