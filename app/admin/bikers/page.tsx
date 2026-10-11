'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bike, ChevronDown, ExternalLink, CheckCircle2, XCircle, PauseCircle,
  ShieldAlert, FileText, Flag,
} from 'lucide-react';
import {
  PageHero, DemoBadge, BikerStatusBadge, cardCls, fieldCls, labelCls,
} from '@/components/delivery/DeliveryBadges';
import {
  adminBikers, adminSetBikerStatus, adminDisputes, adminResolveDispute,
  myDocuments, getPrivateDocUrl, maskPhone,
  type BikerProfile, type BikerDoc, type DeliveryDispute,
} from '@/lib/delivery';
import { useAuth } from '@/lib/auth';
import { BRAND } from '@/components/store/ProductCard';

type Tab = 'applications' | 'all' | 'disputes';

const DISPUTE_COLORS: Record<DeliveryDispute['status'], string> = {
  open: 'bg-amber-100 text-amber-800 border-amber-300',
  in_review: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function AdminBikers() {
  const { ready, user, role, configured } = useAuth();
  const realMode = !!(ready && user && configured);

  const [tab, setTab] = useState<Tab>('applications');
  const [bikers, setBikers] = useState<BikerProfile[]>([]);
  const [disputes, setDisputes] = useState<DeliveryDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, BikerDoc[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [docBusy, setDocBusy] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, d] = await Promise.all([adminBikers(), adminDisputes()]);
      setBikers(b);
      setDisputes(d);
      // Pre-fetch document lists for pending applications (for the docs count).
      const pending = b.filter(x => x.status === 'pending_verification');
      const pairs = await Promise.all(
        pending.map(async x => [x.id, await myDocuments(x.id).catch(() => [])] as const)
      );
      const map: Record<string, BikerDoc[]> = {};
      pairs.forEach(([id, list]) => { map[id] = list; });
      setDocs(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (realMode && role === 'admin') void load();
    else setLoading(false);
  }, [realMode, role, load]);

  const refresh = async () => { await load(); setExpanded(null); };

  const setStatus = async (id: string, status: BikerProfile['status'], reason?: string) => {
    setBusyId(id);
    try {
      await adminSetBikerStatus(id, status, reason);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const onReject = (id: string) => {
    const reason = window.prompt('Reason for rejection (shown to the applicant):');
    if (reason === null) return; // cancelled
    void setStatus(id, 'rejected', reason.trim() || 'Not specified');
  };

  const openDoc = async (docId: string, path: string) => {
    setDocBusy(docId);
    try {
      const url = await getPrivateDocUrl(path);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setError('Could not generate a signed URL for this document.');
    } finally {
      setDocBusy(null);
    }
  };

  const resolveDispute = async (id: string, verdict: 'resolved' | 'rejected') => {
    const text = (resolutions[id] ?? '').trim();
    if (!text) { setError('Please write a resolution note before resolving.'); return; }
    setBusyId(id);
    try {
      await adminResolveDispute(id, verdict, text);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resolution failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <PageHero emoji="🛵" title="Delivery partners" sub="Review applications, manage bikers and resolve disputes." />
        <div className={`${cardCls} text-center text-sm text-gray-500`}>Loading…</div>
      </div>
    );
  }

  if (!(realMode && role === 'admin')) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <PageHero emoji="🛵" title="Delivery partners" sub="Review applications, manage bikers and resolve disputes." />
        <div className={`${cardCls} text-center`}>
          <ShieldAlert size={28} className="mx-auto text-red-500" />
          <h2 className="font-extrabold text-gray-900 mt-2">Admins only.</h2>
          <p className="text-xs text-gray-600 mt-1">Please sign in with an admin account to manage delivery partners.</p>
          <Link href="/account" className="inline-block mt-4 text-sm font-bold" style={{ color: BRAND }}>
            Go to login →
          </Link>
        </div>
      </div>
    );
  }

  const applications = bikers.filter(b => b.status === 'pending_verification');
  const tabs: { id: Tab; label: string; count: number; icon: typeof Bike }[] = [
    { id: 'applications', label: 'Applications', count: applications.length, icon: FileText },
    { id: 'all', label: 'All bikers', count: bikers.length, icon: Bike },
    { id: 'disputes', label: 'Disputes', count: disputes.filter(d => d.status === 'open' || d.status === 'in_review').length, icon: Flag },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      <PageHero emoji="🛵" title="Delivery partners" sub="Review applications, manage bikers and resolve delivery disputes." />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition ${
              tab === t.id
                ? 'text-white border-transparent shadow'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
            style={tab === t.id ? { background: BRAND } : undefined}
          >
            <t.icon size={15} />
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === t.id ? 'bg-white/25' : 'bg-gray-100'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className={`${cardCls} text-center text-sm text-gray-500`}>Loading…</div>}

      {/* APPLICATIONS */}
      {!loading && tab === 'applications' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><DemoBadge label="manual KYC review" /><span className="text-[11px] text-gray-500">Every approval is a human decision in this pilot.</span></div>
          {applications.length === 0 && (
            <div className={`${cardCls} text-center text-sm text-gray-500`}>No pending applications. 🎉</div>
          )}
          {applications.map(b => {
            const isOpen = expanded === b.id;
            const list = docs[b.id] ?? [];
            return (
              <div key={b.id} className={cardCls}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-sm text-gray-900">{b.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      📞 {maskPhone(b.phone)} · 📍 {b.service_city ?? '—'}, {b.service_state ?? ''}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">📄 {list.length} document{list.length === 1 ? '' : 's'} uploaded</p>
                  </div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : b.id)}
                    className="shrink-0 p-2 rounded-xl bg-gray-50 border border-gray-200"
                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown size={16} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-[11px] text-gray-500 mb-2">
                      🔒 Least-privilege: only open what you must review.
                    </p>
                    {list.length === 0 ? (
                      <p className="text-xs text-gray-500">No documents uploaded yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {list.map(d => (
                          <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                            <div>
                              <p className="text-xs font-bold text-gray-800 capitalize">{d.doc_type.replace(/_/g, ' ')}</p>
                              <p className={`text-[10px] font-bold ${
                                d.status === 'verified' ? 'text-green-600' : d.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                {d.status.toUpperCase()}
                                {d.masked_value ? ` · ${d.masked_value}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => openDoc(d.id, d.file_path)}
                              disabled={docBusy === d.id}
                              className="flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-lg text-white shadow disabled:opacity-50"
                              style={{ background: BRAND }}
                            >
                              <ExternalLink size={13} />
                              {docBusy === d.id ? 'Opening…' : 'View'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button
                        onClick={() => setStatus(b.id, 'approved')}
                        disabled={busyId === b.id}
                        className="py-2.5 rounded-xl text-white text-xs font-extrabold bg-green-600 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => onReject(b.id)}
                        disabled={busyId === b.id}
                        className="py-2.5 rounded-xl text-white text-xs font-extrabold bg-red-600 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => setStatus(b.id, 'suspended')}
                        disabled={busyId === b.id}
                        className="py-2.5 rounded-xl text-white text-xs font-extrabold bg-orange-600 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <PauseCircle size={14} /> Suspend
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ALL BIKERS */}
      {!loading && tab === 'all' && (
        <div className="space-y-3">
          {bikers.length === 0 && (
            <div className={`${cardCls} text-center text-sm text-gray-500`}>No bikers registered yet.</div>
          )}
          {bikers.map(b => (
            <div key={b.id} className={`${cardCls} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-gray-900 truncate">{b.full_name}</p>
                <p className="text-xs text-gray-500">{b.service_city ?? '—'}{b.online ? ' · ● online' : ''}</p>
                <div className="mt-1.5"><BikerStatusBadge status={b.status} /></div>
              </div>
              {b.status === 'suspended' ? (
                <button
                  onClick={() => setStatus(b.id, 'approved')}
                  disabled={busyId === b.id}
                  className="shrink-0 py-2 px-4 rounded-xl text-white text-xs font-extrabold bg-green-600 hover:brightness-110 disabled:opacity-50"
                >
                  Reactivate
                </button>
              ) : b.status === 'approved' ? (
                <button
                  onClick={() => setStatus(b.id, 'suspended')}
                  disabled={busyId === b.id}
                  className="shrink-0 py-2 px-4 rounded-xl text-white text-xs font-extrabold bg-orange-600 hover:brightness-110 disabled:opacity-50"
                >
                  Suspend
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* DISPUTES */}
      {!loading && tab === 'disputes' && (
        <div className="space-y-3">
          {disputes.length === 0 && (
            <div className={`${cardCls} text-center text-sm text-gray-500`}>No disputes raised yet.</div>
          )}
          {disputes.map(d => {
            const open = d.status === 'open' || d.status === 'in_review';
            return (
              <div key={d.id} className={cardCls}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">“{d.reason}”</p>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">
                      job {d.job_id.slice(0, 8)}… · {new Date(d.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${DISPUTE_COLORS[d.status]}`}>
                    {d.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                {d.resolution && (
                  <p className="text-xs text-gray-600 mt-2 rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                    <strong>Resolution:</strong> {d.resolution}
                  </p>
                )}
                {open && (
                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                    <div>
                      <label className={labelCls}>Resolution note</label>
                      <textarea
                        value={resolutions[d.id] ?? ''}
                        onChange={e => setResolutions(p => ({ ...p, [d.id]: e.target.value }))}
                        rows={2}
                        maxLength={2000}
                        placeholder="What was decided, and why…"
                        className={fieldCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => resolveDispute(d.id, 'resolved')}
                        disabled={busyId === d.id}
                        className="py-2.5 rounded-xl text-white text-xs font-extrabold bg-green-600 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Resolved
                      </button>
                      <button
                        onClick={() => resolveDispute(d.id, 'rejected')}
                        disabled={busyId === d.id}
                        className="py-2.5 rounded-xl text-white text-xs font-extrabold bg-red-600 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} /> Rejected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
