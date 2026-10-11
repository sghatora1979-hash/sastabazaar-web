// Admin AI Manager console (Update 24).
// Review recommendations, manage campaigns, inspect the email log + audit
// trail, edit settings, and trigger analysis runs.
'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit, Play, RefreshCw, Mail, ScrollText, Settings2, Megaphone, Inbox, Send,
} from 'lucide-react';
import {
  PageHero, DemoBadge, StatusBadge, cardCls, fieldCls, labelCls,
  primaryBtnCls, ghostBtnCls,
} from '@/components/intl/IntlBadges';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';

type Tab = 'overview' | 'recs' | 'campaigns' | 'emails' | 'audit' | 'settings' | 'outreach';

type StatusResp = {
  ok: boolean; last_run: Record<string, unknown> | null;
  counts: Record<string, number>;
  ai_configured: boolean; email_provider: string; cron_configured: boolean;
};

export default function AdminAiManager() {
  const router = useRouter();
  const { ready, role } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recFilter, setRecFilter] = useState('pending');

  // campaign create form
  const [cform, setCform] = useState({ name: '', type: 'festival', festival_id: '', budget_cap: '' });
  // settings editor
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [outreachConsents, setOutreachConsents] = useState(0);

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/ai-manager/status');
      setStatus(await r.json());
    } catch { /* offline */ }
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    try {
      if (t === 'recs') {
        let q = sb.from('ai_recommendations')
          .select('*, products(title), sellers(business_name), ai_campaigns(name)')
          .order('created_at', { ascending: false }).limit(200);
        if (recFilter !== 'all') q = q.eq('status', recFilter);
        const { data } = await q;
        setRows((data ?? []) as Record<string, unknown>[]);
      } else if (t === 'campaigns') {
        const { data } = await sb.from('ai_campaigns').select('*').order('created_at', { ascending: false }).limit(100);
        setRows((data ?? []) as Record<string, unknown>[]);
      } else if (t === 'emails') {
        const { data } = await sb.from('ai_seller_emails')
          .select('*, sellers(business_name)').order('created_at', { ascending: false }).limit(100);
        setRows((data ?? []) as Record<string, unknown>[]);
      } else if (t === 'audit') {
        const { data } = await sb.from('ai_audit_log').select('*').order('created_at', { ascending: false }).limit(150);
        setRows((data ?? []) as Record<string, unknown>[]);
      } else if (t === 'outreach') {
        const { data } = await sb.from('ai_outreach_log').select('*').order('created_at', { ascending: false }).limit(100);
        setRows((data ?? []) as Record<string, unknown>[]);
        const { count: consents } = await sb.from('ai_outreach_consents')
          .select('customer_id', { count: 'exact', head: true }).eq('opted_in', true).is('unsubscribed_at', null);
        setOutreachConsents(consents ?? 0);
      } else if (t === 'settings') {
        const { data } = await sb.from('ai_settings').select('key,value').order('key');
        const m: Record<string, string> = {};
        for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = r.value;
        setSettings(m); setSettingsDirty(false);
      }
    } finally {
      setLoading(false);
    }
  }, [recFilter]);

  useEffect(() => { if (ready && role === 'admin') { void loadStatus(); void loadTab(tab); } }, [ready, role, tab, loadStatus, loadTab]);

  const runNow = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/ai-manager/run', { method: 'POST' });
      const j = await r.json();
      if (!r.ok) {
        setMsg(j.error === 'Unauthorized'
          ? 'Run blocked: CRON_SECRET is set on the server. Trigger scheduled runs via Vercel Cron / external cron with the secret header (see README).'
          : `Run failed: ${j.error ?? 'unknown'}`);
      } else {
        setMsg(`Run finished (${j.mode}): ${j.recommendations_created} recommendations, ${j.emails_queued} emails queued (${j.emails_sent} actually sent). ${j.llm_note ?? ''}`);
      }
      await loadStatus(); await loadTab(tab);
    } catch {
      setMsg('Run failed: network error.');
    } finally {
      setBusy(false);
    }
  };

  const setCampaignStatus = async (id: string, st: string) => {
    const sb = getSupabase(); if (!sb) return;
    setBusy(true);
    const { error } = await sb.from('ai_campaigns').update({ status: st }).eq('id', id);
    if (!error) {
      await sb.rpc('ai_log', {
        p_actor: 'admin', p_action: `campaign_${st}`, p_entity: 'ai_campaigns',
        p_entity_id: id, p_detail: {},
      });
      await loadTab('campaigns');
    } else setMsg(`Error: ${error.message}`);
    setBusy(false);
  };

  const createCampaign = async () => {
    const sb = getSupabase(); if (!sb || !cform.name.trim()) return;
    setBusy(true); setMsg(null);
    const { error } = await sb.from('ai_campaigns').insert({
      name: cform.name.trim(), type: cform.type, festival_id: cform.festival_id.trim() || null,
      status: 'draft', created_by: 'admin',
      budget_cap: cform.budget_cap ? Number(cform.budget_cap) : null,
    });
    if (error) setMsg(`Error: ${error.message}`);
    else {
      setCform({ name: '', type: 'festival', festival_id: '', budget_cap: '' });
      await loadTab('campaigns');
    }
    setBusy(false);
  };

  const decideRec = async (id: string, approve: boolean) => {
    const sb = getSupabase(); if (!sb) return;
    setBusy(true);
    const { error } = await sb.from('ai_recommendations').update({
      status: approve ? 'approved' : 'rejected',
      decided_at: new Date().toISOString(), decided_by: 'admin',
    }).eq('id', id);
    if (!error) {
      await sb.rpc('ai_log', {
        p_actor: 'admin', p_action: approve ? 'recommendation_approved' : 'recommendation_rejected',
        p_entity: 'ai_recommendations', p_entity_id: id, p_detail: {},
      });
      await loadTab('recs'); await loadStatus();
    } else setMsg(`Error: ${error.message}`);
    setBusy(false);
  };

  const saveSettings = async () => {
    const sb = getSupabase(); if (!sb) return;
    setBusy(true); setMsg(null);
    for (const [k, v] of Object.entries(settings)) {
      const { error } = await sb.from('ai_settings').upsert({ key: k, value: v }, { onConflict: 'key' });
      if (error) { setMsg(`Error saving ${k}: ${error.message}`); setBusy(false); return; }
    }
    await sb.rpc('ai_log', { p_actor: 'admin', p_action: 'settings_updated', p_entity: 'ai_settings', p_entity_id: null, p_detail: settings });
    setSettingsDirty(false); setMsg('Settings saved.');
    setBusy(false);
  };

  if (!ready) return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</div>;
  if (role !== 'admin') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="mb-4 text-gray-600">Admin access required.</p>
        <button className={primaryBtnCls} onClick={() => router.push('/')}>Home</button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BrainCircuit size={16} /> },
    { id: 'recs', label: 'Recommendations', icon: <Inbox size={16} /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={16} /> },
    { id: 'emails', label: 'Email log', icon: <Mail size={16} /> },
    { id: 'outreach', label: 'Outreach', icon: <Send size={16} /> },
    { id: 'audit', label: 'Audit log', icon: <ScrollText size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings2 size={16} /> },
  ];

  const lastRun = (status?.last_run ?? {}) as Record<string, unknown>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHero emoji="🤖" title="AI Marketplace Manager" sub="Scheduled analysis, draft campaigns, seller approvals — the AI suggests, humans decide." />
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <DemoBadge label={status?.ai_configured ? 'AI MODEL CONNECTED' : 'RULE-BASED MODE'} />
        <DemoBadge label={`EMAIL: ${String(status?.email_provider ?? 'demo').toUpperCase()}`} />
        <DemoBadge label={status?.cron_configured ? 'CRON SECURED' : 'CRON OPEN (DEMO)'} />
      </div>

      <div className="flex flex-wrap gap-2 mt-6 mb-4">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? primaryBtnCls : ghostBtnCls} onClick={() => setTab(t.id)}>
            <span className="inline-flex items-center gap-1">{t.icon} {t.label}</span>
          </button>
        ))}
        <button className={ghostBtnCls} onClick={() => { void loadStatus(); void loadTab(tab); }}>
          <RefreshCw size={16} className="inline mr-1" /> Refresh
        </button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 whitespace-pre-wrap">{msg}</div>}

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className={`${cardCls} p-5`}>
            <div className="text-xs text-gray-500 mb-1">Last run</div>
            <div className="font-bold">{lastRun.started_at ? new Date(String(lastRun.started_at)).toLocaleString('en-IN') : 'Never'}</div>
            <div className="text-sm text-gray-600 mt-1">Status: <StatusBadge status={String(lastRun.status ?? '—')} /> · Mode: {String(lastRun.mode ?? '—')}</div>
            {lastRun.error ? <div className="text-xs text-red-600 mt-1">{String(lastRun.error)}</div> : null}
            <button className={`${primaryBtnCls} mt-4`} disabled={busy} onClick={() => void runNow()}>
              <Play size={16} className="inline mr-1" /> {busy ? 'Running…' : 'Run analysis now'}
            </button>
          </div>
          {Object.entries(status?.counts ?? {}).map(([k, v]) => (
            <div key={k} className={`${cardCls} p-5`}>
              <div className="text-xs text-gray-500 mb-1">{k.replace(/_/g, ' ')}</div>
              <div className="text-3xl font-extrabold">{v}</div>
            </div>
          ))}
          <div className={`${cardCls} p-5 text-sm text-gray-600`}>
            <b>What the AI will NEVER do:</b>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>Change a seller&apos;s price without approval</li>
              <li>Publish unapproved discounts</li>
              <li>Invent stock, dates, or costs</li>
              <li>Send email as anyone but the configured sender</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'recs' && (
        <div>
          <div className="flex gap-2 mb-3">
            {['pending', 'approved', 'rejected', 'all'].map((f) => (
              <button key={f} className={recFilter === f ? primaryBtnCls : ghostBtnCls} onClick={() => setRecFilter(f)}>{f}</button>
            ))}
          </div>
          {loading ? <p className="text-gray-500">Loading…</p> : (
            <div className="grid gap-2">
              {rows.map((r) => {
                const rec = r as unknown as Rec & { products: { title: string } | null; sellers: { business_name: string } | null; ai_campaigns: { name: string } | null };
                return (
                  <div key={rec.id as string} className={`${cardCls} p-3 flex flex-wrap items-center gap-3 text-sm`}>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-bold">{rec.products?.title ?? rec.product_id}</div>
                      <div className="text-xs text-gray-500">{rec.sellers?.business_name} · {rec.ai_campaigns?.name} · {rec.source}</div>
                    </div>
                    <div className="font-extrabold text-green-700">{formatINR(Number(rec.recommended_price))} <span className="text-xs text-red-600">−{Number(rec.recommended_discount_pct)}%</span></div>
                    <StatusBadge status={String(rec.status)} />
                    {String(rec.status) === 'pending' && (
                      <>
                        <button className={primaryBtnCls} disabled={busy} onClick={() => void decideRec(String(rec.id), true)}>Approve</button>
                        <button className={ghostBtnCls} disabled={busy} onClick={() => void decideRec(String(rec.id), false)}>Reject</button>
                      </>
                    )}
                  </div>
                );
              })}
              {rows.length === 0 && <p className="text-gray-500">No recommendations with this filter yet. Run an analysis first.</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'campaigns' && (
        <div>
          <div className={`${cardCls} p-4 mb-4 grid sm:grid-cols-5 gap-2`}>
            <input className={fieldCls} placeholder="Campaign name" value={cform.name} onChange={(e) => setCform({ ...cform, name: e.target.value })} />
            <select className={fieldCls} value={cform.type} onChange={(e) => setCform({ ...cform, type: e.target.value })}>
              <option value="festival">festival</option><option value="season">season</option>
              <option value="clearance">clearance</option><option value="new_arrival">new_arrival</option>
            </select>
            <input className={fieldCls} placeholder="festival id (e.g. diwali)" value={cform.festival_id} onChange={(e) => setCform({ ...cform, festival_id: e.target.value })} />
            <input className={fieldCls} placeholder="Budget cap ₹" type="number" value={cform.budget_cap} onChange={(e) => setCform({ ...cform, budget_cap: e.target.value })} />
            <button className={primaryBtnCls} disabled={busy || !cform.name.trim()} onClick={() => void createCampaign()}>Create</button>
          </div>
          {loading ? <p className="text-gray-500">Loading…</p> : (
            <div className="grid gap-2">
              {rows.map((r) => {
                const c = r as unknown as { id: string; name: string; type: string; status: string; is_demo: boolean; created_by: string; budget_cap: number | null };
                return (
                  <div key={c.id} className={`${cardCls} p-3 flex flex-wrap items-center gap-3 text-sm`}>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-bold">{c.name} {c.is_demo && <DemoBadge label="DEMO SEED" />}</div>
                      <div className="text-xs text-gray-500">{c.type} · by {c.created_by}{c.budget_cap ? ` · budget ₹${c.budget_cap}` : ''}</div>
                    </div>
                    <StatusBadge status={c.status} />
                    {c.status === 'draft' && <button className={primaryBtnCls} disabled={busy} onClick={() => void setCampaignStatus(c.id, 'active')}>Activate</button>}
                    {c.status === 'active' && <button className={ghostBtnCls} disabled={busy} onClick={() => void setCampaignStatus(c.id, 'completed')}>Complete</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'emails' && (
        loading ? <p className="text-gray-500">Loading…</p> : (
          <div className="grid gap-2">
            {rows.map((r) => {
              const e = r as unknown as { id: string; subject: string; body: string; status: string; provider: string; created_at: string; sellers: { business_name: string } | null; error_text: string | null };
              return (
                <details key={e.id} className={`${cardCls} p-3 text-sm`}>
                  <summary className="cursor-pointer flex flex-wrap items-center gap-2">
                    <span className="font-bold flex-1 min-w-[200px]">{e.subject}</span>
                    <span className="text-xs text-gray-500">{e.sellers?.business_name ?? '—'}</span>
                    <StatusBadge status={`${e.status} (${e.provider})`} />
                  </summary>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 rounded-lg p-3 mt-2 text-gray-700">{e.body}</pre>
                  {e.error_text && <div className="text-xs text-red-600 mt-1">{e.error_text}</div>}
                  <div className="text-[11px] text-gray-400 mt-1">{new Date(e.created_at).toLocaleString('en-IN')}</div>
                </details>
              );
            })}
            {rows.length === 0 && <p className="text-gray-500">No emails logged yet.</p>}
          </div>
        )
      )}

      {tab === 'audit' && (
        loading ? <p className="text-gray-500">Loading…</p> : (
          <div className={`${cardCls} overflow-x-auto`}>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="p-2">Time</th><th className="p-2">Actor</th><th className="p-2">Action</th><th className="p-2">Entity</th><th className="p-2">Detail</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const a = r as unknown as { id: string; created_at: string; actor: string; action: string; entity: string; entity_id: string | null; detail: Record<string, unknown> };
                  return (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="p-2 whitespace-nowrap">{new Date(a.created_at).toLocaleString('en-IN')}</td>
                      <td className="p-2"><StatusBadge status={a.actor} /></td>
                      <td className="p-2 font-mono">{a.action}</td>
                      <td className="p-2">{a.entity}{a.entity_id ? ` · ${a.entity_id.slice(0, 8)}` : ''}</td>
                      <td className="p-2 text-gray-500 max-w-[280px] truncate">{JSON.stringify(a.detail)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="p-4 text-gray-500">No audit entries yet.</p>}
          </div>
        )
      )}

      {tab === 'outreach' && (
        <div>
          <div className={`${cardCls} p-4 mb-3 text-sm text-gray-600`}>
            <b>Consent-first outreach:</b> festival greetings &amp; surveys go <b>only</b> to customers who opted in,
            and unsubscribes are always honored. {outreachConsents} customer(s) currently opted in.
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className={`${cardCls} p-4`}>
              <div className="font-bold">📧 Email</div>
              <div className="mt-1"><StatusBadge status={status?.email_provider === 'resend' ? 'connected' : 'demo mode'} /></div>
              <p className="text-xs text-gray-500 mt-2">Set <code>EMAIL_PROVIDER=resend</code> + <code>EMAIL_API_KEY</code> to send real email. Customer email addresses must be on file first.</p>
            </div>
            {[
              { name: 'Telegram', icon: '✈️', hint: 'Create a bot with @BotFather, set TELEGRAM_BOT_TOKEN, then wire lib/ai-manager/channels.ts.' },
              { name: 'Facebook', icon: '📘', hint: 'Create a Meta app + Page, set FB_PAGE_TOKEN, then wire lib/ai-manager/channels.ts.' },
              { name: 'Instagram', icon: '📸', hint: 'Connect an IG Business account via the Meta app, set IG_TOKEN, then wire lib/ai-manager/channels.ts.' },
            ].map((c) => (
              <div key={c.name} className={`${cardCls} p-4`}>
                <div className="font-bold">{c.icon} {c.name}</div>
                <div className="mt-1"><StatusBadge status="not connected" /></div>
                <p className="text-xs text-gray-500 mt-2">{c.hint} The system NEVER fakes a sent message — attempts are logged as <code>not_connected</code>.</p>
              </div>
            ))}
          </div>
          <h3 className="font-bold mb-2">Outreach log</h3>
          {loading ? <p className="text-gray-500">Loading…</p> : (
            <div className="grid gap-2">
              {rows.map((r) => {
                const o = r as unknown as { id: string; channel: string; kind: string; festival_id: string | null; status: string; detail: string | null; created_at: string };
                return (
                  <div key={o.id} className={`${cardCls} p-3 flex flex-wrap items-center gap-2 text-sm`}>
                    <span className="font-bold">{o.channel}</span>
                    <span className="text-gray-500">{o.kind.replace(/_/g, ' ')}{o.festival_id ? ` · ${o.festival_id}` : ''}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-[11px] text-gray-400 ml-auto">{new Date(o.created_at).toLocaleString('en-IN')}</span>
                    {o.detail && <div className="w-full text-xs text-gray-500">{o.detail}</div>}
                  </div>
                );
              })}
              {rows.length === 0 && <p className="text-gray-500">No outreach attempts yet. They run with the daily analysis.</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className={`${cardCls} p-5 max-w-2xl`}>
          {Object.entries(settings).map(([k, v]) => (
            <div key={k} className="mb-3">
              <label className={labelCls}>{k}</label>
              <input className={fieldCls} value={v}
                onChange={(e) => { setSettings({ ...settings, [k]: e.target.value }); setSettingsDirty(true); }} />
            </div>
          ))}
          <button className={primaryBtnCls} disabled={busy || !settingsDirty} onClick={() => void saveSettings()}>
            Save settings
          </button>
          <p className="text-xs text-gray-500 mt-3">
            margin_floor_pct — minimum margin % the AI must preserve over purchase cost.
            max_discount_pct — hardest cap on any AI-suggested discount.
          </p>
        </div>
      )}
    </div>
  );
}

type Rec = { id: string; product_id: string; status: string; source: string; recommended_price: number; recommended_discount_pct: number };
