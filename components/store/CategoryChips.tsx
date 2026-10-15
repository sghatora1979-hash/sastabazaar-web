'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BRAND } from './ProductCard';

const CHIPS = [
  { label: 'All',        href: '/',            emoji: '🏠' },
  { label: 'Naya',       href: '/naya',        emoji: '🆕' },
  { label: 'Purana',     href: '/purana',      emoji: '♻️' },
  { label: 'Clearance',  href: '/clearance',   emoji: '🔥' },
  { label: 'Local',      href: '/local',       emoji: '📍' },
  { label: 'Festivals',  href: '/festivals',   emoji: '🪔' },
  { label: 'Spin & Win', href: '/spin-and-win', emoji: '🎡' },
  { label: 'Refer & Earn', href: '/refer', emoji: '🎁' },
  { label: 'Lucky Draw', href: '/lucky-draw', emoji: '🍀' },
  { label: 'Marketplace',href: '/marketplace', emoji: '🏪' },
  { label: 'Track',      href: '/track',       emoji: '📦' },
  { label: 'Sell',       href: '/seller',      emoji: '💼' }
];

/**
 * Shein/Temu-style horizontal scrollable category pill nav.
 * Rendered as a strip under the sticky header.
 */
export function CategoryChips() {
  const path = usePathname();
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the active pill visible (e.g. "Sell" when on /seller)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [path]);

  const nudge = (dir: 1 | -1) => {
    stripRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const arrow =
    'absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 text-xs flex items-center justify-center hover:bg-gray-50 active:scale-95';

  return (
    <div className="border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 relative">
        <button aria-label="Pehle wale buttons dekho" onClick={() => nudge(-1)} className={`${arrow} left-0`}>
          ◀
        </button>
        <div ref={stripRef} className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-8">
          {CHIPS.map(c => {
            const active = c.href === '/' ? path === '/' : path.startsWith(c.href);
            return (
              <Link
                key={c.href}
                ref={active ? activeRef : undefined}
                href={c.href}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition whitespace-nowrap ${
                  active
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={active ? { background: BRAND } : undefined}
              >
                <span className="text-[13px]">{c.emoji}</span>
                {c.label}
              </Link>
            );
          })}
        </div>
        <button aria-label="Agli wale buttons dekho" onClick={() => nudge(1)} className={`${arrow} right-0`}>
          ▶
        </button>
      </div>
    </div>
  );
}
