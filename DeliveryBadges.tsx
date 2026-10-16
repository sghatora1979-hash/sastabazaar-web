'use client';
import type { BikerStatus, JobStatus } from '@/lib/delivery';

/** Amber pill marking an honest demo stub. */
export function DemoBadge({ label = 'DEMO' }: { label?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide bg-amber-100 text-amber-800 border border-amber-300">
      {label}
    </span>
  );
}

/** Grey pill for features needing a real provider. */
export function SoonBadge({ label = 'Coming soon' }: { label?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide bg-gray-100 text-gray-600 border border-gray-300">
      {label}
    </span>
  );
}

const JOB_COLORS: Record<JobStatus, string> = {
  created: 'bg-slate-100 text-slate-700 border-slate-300',
  offered: 'bg-blue-100 text-blue-800 border-blue-300',
  assigned: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  picked_up: 'bg-purple-100 text-purple-800 border-purple-300',
  in_transit: 'bg-orange-100 text-orange-800 border-orange-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  disputed: 'bg-rose-100 text-rose-800 border-rose-300',
};

const JOB_LABELS: Record<JobStatus, string> = {
  created: 'Created',
  offered: 'Offered',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  in_transit: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${JOB_COLORS[status]}`}>
      {JOB_LABELS[status]}
    </span>
  );
}

const BIKER_COLORS: Record<BikerStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  pending_verification: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  suspended: 'bg-orange-100 text-orange-800 border-orange-300',
  deactivated: 'bg-gray-200 text-gray-600 border-gray-400',
};

const BIKER_LABELS: Record<BikerStatus, string> = {
  draft: 'Draft',
  pending_verification: 'Pending verification',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
};

export function BikerStatusBadge({ status }: { status: BikerStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${BIKER_COLORS[status]}`}>
      {BIKER_LABELS[status]}
    </span>
  );
}

/** Shared form primitives matching the warm-cream storefront. */
export const fieldCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FB7701]/40 focus:border-[#FB7701]';

export const labelCls = 'block text-xs font-bold text-gray-700 mb-1';

export const cardCls = 'bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-orange-100 p-4 sm:p-5';

export const primaryBtnCls =
  'w-full py-3 rounded-2xl text-white font-extrabold text-sm shadow-lg hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none';

export function PageHero({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="text-center py-8 sm:py-10">
      <div className="text-5xl mb-3">{emoji}</div>
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h1>
      <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">{sub}</p>
    </div>
  );
}
