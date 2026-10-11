// Customer demand capture (Update 24b).
// "What are you looking for?" — customers voluntarily post demand; the AI
// matches it to seller products and notifies both sides. Region + language
// are customer-provided only (saved to ai_customer_prefs) — no tracking.
'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Send, CheckCircle2 } from 'lucide-react';
import {
  PageHero, DemoBadge, StatusBadge, cardCls, fieldCls, labelCls,
  primaryBtnCls, ghostBtnCls,
} from '@/components/intl/IntlBadges';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';
import { STATES, stateName } from '@/lib/festivals';
import { formatINR } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'हिन्दी' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' }, { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' }, { code: 'bn', name: 'বাংলা' },
  { code: 'mr', name: 'मराठी' }, { code: 'gu', name: 'ગુજરાતી' },
  { code: 'kn', name: 'ಕನ್ನಡ' }, { code: 'ml', name: 'മലയാളം' },
  { code: 'as', name: 'অসমীয়া' },
];

type Demand = {
  id: string; category: string; description: string;
  budget_min: number | null; budget_max: number | null;
  region: string | null; language: string | null; status: string; created_at: string;
};
type Match = {
  id: string; demand_id: string; match_score: number; reason: string;
  products: { title: string; price: number; slug: string } | null;
};
type Notif = { id: string; title: string; body: string; link: string | null; read: boolean; created_at: string };

export default function DemandPage() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const [tab, setTab] = useState<'post' | 'mine'>('post');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [matches, setMatches] = useState<Record<string, Match[]>>({});
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    category: 'fashion-women', description: '', budget_min: '', budget_max: '',
    region: '', language: 'en', greetings_email: false, surveys: false,
  });

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { data: dRows } = await sb.from('ai_customer_demands').select('*')
      .eq('customer_id', user.id).order('created_at', { ascending: false }).limit(50);
    const ds = ((dRows ?? []) as unknown) as Demand[];
    setDemands(ds);
    if (ds.length > 0) {
      const { data: mRows } = await sb.from('ai_matches')
        .select('*, products(title,price,slug)')
        .in('demand_id', ds.map((d) => d.id))
        .order('match_score', { ascending: false });
      const mm: Record<string, Match[]> = {};
      for (const m of ((mRows ?? []) as unknown as Match[])) {
        (mm[m.demand_id] ??= []).push(m);
      }
      setMatches(mm);
    }
    const { data: nRows } = await sb.from('ai_customer_notifications').select('*')
      .eq('customer_id', user.id).order('created_at', { ascending: false }).limit(20);
    setNotifs(((nRows ?? []) as unknown) as Notif[]);
  }, [user]);

  useEffect(() => { if (ready && user) void load(); }, [ready, user, load]);

  const submit = async () => {
    const sb = getSupabase();
    if (!sb || !user) { setMsg('Please log in first.'); return; }
    if (!form.description.trim()) { setMsg('Please describe what you are looking for.'); return; }
    setBusy(true); setMsg(null);
    try {
      const { data, error } = await sb.from('ai_customer_demands').insert({
        customer_id: user.id,
        category: form.category,
        description: form.description.trim().slice(0, 500),
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        region: form.region || null,
        language: form.language,
        status: 'open',
      }).select('id').single();
      if (error) throw new Error(error.message);
      const demandId = (data as { id: string }).id;

      // save region/language prefs (customer-provided only)
      await sb.from('ai_customer_prefs').upsert({
        customer_id: user.id, region: form.region || null, language: form.language,
      }, { onConflict: 'customer_id' });

      // consent-first outreach preferences
      for (const [channel, on] of [['email', form.greetings_email]] as const) {
        await sb.from('ai_outreach_consents').upsert({
          customer_id: user.id, channel,
          opted_in: on, unsubscribed_at: on ? null : new Date().toISOString(),
        }, { onConflict: 'customer_id,channel' });
      }

      // trigger matching now (also runs in the daily scheduled run)
      let matched = 0;
      try {
        const r = await fetch('/api/ai-manager/match', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demand_id: demandId }),
        });
        const j = await r.json();
        matched = j.matches ?? 0;
      } catch { /* matching will happen in scheduled run */ }

      setMsg(matched > 0
        ? `Posted! ${matched} seller product(s) already match — see "My demands".`
        : 'Posted! Sellers will be notified and you will see matches here soon.');
      setForm({ ...form, description: '', budget_min: '', budget_max: '' });
      setTab('mine');
      await load();
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'failed'}`);
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (id: string) => {
    const sb = getSupabase(); if (!sb) return;
    await sb.from('ai_customer_notifications').update({ read: true }).eq('id', id);
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const catName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHero
        emoji="🔍"
        title="What are you looking for?"
        sub="Tell us what you want — our AI matches your demand to sellers across India and notifies you when products fit your budget."
      />

      <div className="flex gap-2 mt-6 mb-4">
        <button className={tab === 'post' ? primaryBtnCls : ghostBtnCls} onClick={() => setTab('post')}>
          <Send size={16} className="inline mr-1" /> Post demand
        </button>
        <button className={tab === 'mine' ? primaryBtnCls : ghostBtnCls} onClick={() => setTab('mine')}>
          <Bell size={16} className="inline mr-1" /> My demands & matches
          {notifs.filter((n) => !n.read).length > 0 && (
            <span className="ml-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifs.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{msg}</div>}

      {!user && (
        <div className={`${cardCls} p-6 text-center`}>
          <p className="text-gray-600 mb-3">Log in to post a demand and get matched.</p>
          <button className={primaryBtnCls} onClick={() => router.push('/account')}>Log in</button>
        </div>
      )}

      {user && tab === 'post' && (
        <div className={`${cardCls} p-5`}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select className={fieldCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Your region (state)</label>
              <select className={fieldCls} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                <option value="">— all India —</option>
                {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Describe what you want</label>
              <textarea className={fieldCls} rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Cotton kurtas for Diwali, bright colours, size M" />
            </div>
            <div>
              <label className={labelCls}>Budget min ₹ (optional)</label>
              <input type="number" min="0" className={fieldCls} value={form.budget_min}
                onChange={(e) => setForm({ ...form, budget_min: e.target.value })} placeholder="500" />
            </div>
            <div>
              <label className={labelCls}>Budget max ₹ (optional)</label>
              <input type="number" min="0" className={fieldCls} value={form.budget_max}
                onChange={(e) => setForm({ ...form, budget_max: e.target.value })} placeholder="800" />
            </div>
            <div>
              <label className={labelCls}>Preferred language</label>
              <select className={fieldCls} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm space-y-2">
            <div className="font-bold text-gray-700">Notifications (your choice — opt in anytime)</div>
            <label className="flex items-start gap-2 text-gray-600">
              <input type="checkbox" className="mt-1" checked={form.greetings_email}
                onChange={(e) => setForm({ ...form, greetings_email: e.target.checked })} />
              <span>Email me festival greetings &amp; match alerts <DemoBadge label="OPT-IN" /></span>
            </label>
            <p className="text-[11px] text-gray-400">We never share your details. Unsubscribe anytime — one tap, no questions.</p>
          </div>

          <button className={`${primaryBtnCls} mt-4`} disabled={busy} onClick={() => void submit()}>
            <Search size={16} className="inline mr-1" /> {busy ? 'Posting…' : 'Post demand & find sellers'}
          </button>
        </div>
      )}

      {user && tab === 'mine' && (
        <div className="space-y-4">
          {notifs.length > 0 && (
            <div className={`${cardCls} p-4`}>
              <h3 className="font-bold mb-2">Notifications</h3>
              <div className="space-y-2">
                {notifs.map((n) => (
                  <button key={n.id} onClick={() => void markRead(n.id)}
                    className={`w-full text-left text-sm rounded-lg px-3 py-2 ${n.read ? 'bg-gray-50 text-gray-500' : 'bg-amber-50 text-gray-800 font-medium'}`}>
                    <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-600" />{n.title}</div>
                    <div className="text-xs mt-0.5">{n.body}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {demands.length === 0 && <p className="text-gray-500 text-center py-8">No demands yet — post one above.</p>}
          {demands.map((d) => (
            <div key={d.id} className={`${cardCls} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{catName(d.category)} {d.region ? `· ${stateName(d.region)}` : ''}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{d.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Budget: {d.budget_min ? formatINR(d.budget_min) : '—'} – {d.budget_max ? formatINR(d.budget_max) : '—'}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              {(matches[d.id] ?? []).length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs font-bold text-gray-500 mb-2">MATCHING PRODUCTS</div>
                  <div className="space-y-1.5">
                    {(matches[d.id] ?? []).map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                        <span className="truncate">{m.products?.title ?? 'Product'}</span>
                        <span className="font-extrabold text-green-700 ml-2">{m.products ? formatINR(m.products.price) : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
