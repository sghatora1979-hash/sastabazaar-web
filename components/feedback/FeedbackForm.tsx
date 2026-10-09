'use client';
/**
 * Customer/seller feedback form (Update 13 spec §11).
 * Demo storage in localStorage; admin dashboard at /admin/feedback.
 * Consent checkbox included before optional contact sharing.
 */
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export type FeedbackEntry = {
  id: string;
  kind: 'customer' | 'seller';
  topic: string;
  message: string;
  rating: number;
  contact?: string;
  consent: boolean;
  at: string;
};

const LS_KEY = 'sb_feedback_v1';

export function getFeedback(): FeedbackEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function FeedbackForm() {
  const [kind, setKind] = useState<'customer' | 'seller'>('customer');
  const [topic, setTopic] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const entry: FeedbackEntry = {
      id: `fb-${Date.now()}`,
      kind,
      topic,
      message: message.trim(),
      rating,
      contact: consent && contact.trim() ? contact.trim() : undefined,
      consent,
      at: new Date().toISOString(),
    };
    const all = getFeedback();
    localStorage.setItem(LS_KEY, JSON.stringify([entry, ...all]));
    setMessage('');
    setContact('');
    setConsent(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex gap-2">
        {(['customer', 'seller'] as const).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${kind === k ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {k === 'customer' ? 'ग्राहक · Customer' : 'विक्रेता · Seller'}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <select value={topic} onChange={e => setTopic(e.target.value)} className={input} aria-label="Feedback topic">
          {['Suggestion', 'Missing product', 'Wrong information', 'Seller issue', 'Delivery issue', 'Appreciation'].map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={rating} onChange={e => setRating(Number(e.target.value))} className={input} aria-label="Rating">
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{'★'.repeat(r)} ({r}/5)</option>
          ))}
        </select>
      </div>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Apna sujhav likhen… / Write your suggestion…"
        rows={4}
        className={input}
        required
      />

      <input
        value={contact}
        onChange={e => setContact(e.target.value)}
        placeholder="Phone or email (optional)"
        className={input}
      />
      <label className="flex items-start gap-2 text-xs text-gray-500">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
        I agree SastaBazaar may contact me about this feedback (optional). / मैं सहमत हूँ।
      </label>

      <button type="submit" className="btn-fx w-full bg-emerald-600 text-white font-extrabold py-3 rounded-xl">
        Submit Feedback · भेजें
      </button>
      {done && (
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={16} /> Dhanyavaad! Your feedback is saved.
        </p>
      )}
      <p className="text-[11px] text-gray-400">Demo: feedback is stored in this browser only.</p>
    </form>
  );
}
