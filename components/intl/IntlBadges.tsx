'use client';
// Shared UI primitives for the International Sellers module (Update 22).
// Warm-cream storefront styling, honest labelling badges.

/** Amber pill marking an honest estimate (not a guaranteed figure). */
export function EstimateBadge({ label = 'ESTIMATE' }: { label?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide bg-amber-100 text-amber-800 border border-amber-300">
      {label}
    </span>
  );
}

/** Amber pill marking a demo stub. */
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

/** Green pill for verified/confirmed states. */
export function VerifiedBadge({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide bg-green-100 text-green-800 border border-green-300">
      {label}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  suspended: 'bg-orange-100 text-orange-800 border-orange-300',
  paused: 'bg-orange-100 text-orange-800 border-orange-300',
  removed: 'bg-gray-200 text-gray-600 border-gray-400',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700 border-slate-300';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

export function PageHero({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="text-center pt-8 pb-5">
      <div className="text-5xl mb-3">{emoji}</div>
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h1>
      <p className="text-sm text-gray-600 mt-2 max-w-xl mx-auto">{sub}</p>
    </div>
  );
}

/** Shared form primitives matching the warm-cream storefront. */
export const cardCls =
  'bg-white/85 backdrop-blur rounded-2xl border border-orange-100 shadow-sm p-4 sm:p-5';
export const fieldCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FB7701]/40 focus:border-[#FB7701]';
export const labelCls =
  'block text-xs font-bold text-gray-700 mb-1';
export const primaryBtnCls =
  'w-full py-3 rounded-2xl font-extrabold text-white text-sm shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50';
export const ghostBtnCls =
  'w-full py-2.5 rounded-2xl font-bold text-sm border border-gray-200 bg-white text-gray-700 active:scale-[0.98] transition-transform';
