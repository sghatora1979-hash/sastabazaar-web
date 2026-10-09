'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shuffle, ChevronLeft, ChevronRight, BadgeIndianRupee } from 'lucide-react';
import { getCheapPicks, BUDGET_CAP } from '@/lib/deals';
import { formatINR } from '@/lib/utils';
import { BRAND } from './ProductCard';
import type { Product } from '@/lib/products';

/**
 * "Under ₹199 — Today's Cheapest Finds": horizontal rail of the cheapest
 * demo products with a Shuffle button that re-randomizes the picks.
 */
export function BudgetPicks() {
  const railRef = useRef<HTMLDivElement>(null);
  const [picks, setPicks] = useState<Product[]>([]);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    setPicks(getCheapPicks());
  }, []);

  const shuffle = () => {
    setShuffling(true);
    setPicks(getCheapPicks());
    window.setTimeout(() => setShuffling(false), 500);
  };

  const scroll = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  if (!picks.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8">
      <div className="rounded-[1.75rem] p-4 sm:p-6 bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: BRAND }} />

        <div className="relative flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: BRAND }}>
              <BadgeIndianRupee size={18} />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Under ₹{BUDGET_CAP} <span className="text-gray-400 font-semibold text-sm sm:text-base">— Today&apos;s Cheapest Finds</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Pocket-friendly deals, refreshed every visit (demo).</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shuffle}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white px-3.5 py-2 rounded-full shadow-md active:scale-95 transition"
              style={{ background: BRAND }}
            >
              <Shuffle size={14} className={shuffling ? 'animate-spin' : ''} />
              Shuffle deals
            </button>
            <div className="hidden sm:flex gap-1.5">
              <button onClick={() => scroll(-1)} aria-label="Scroll left" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scroll(1)} aria-label="Scroll right" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div ref={railRef} className="relative flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1">
          {picks.map(p => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="snap-start shrink-0 w-[148px] sm:w-[176px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-square bg-white">
                <Image src={p.image} alt={p.title} fill sizes="180px" className="object-cover" unoptimized />
                {p.discountPercent > 0 && (
                  <span className="absolute top-2 left-2 bg-[#E62E2E] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow">
                    -{p.discountPercent}%
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <div className="text-xs font-bold text-gray-900 line-clamp-1">{p.titleHi || p.title}</div>
                <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-[15px] font-extrabold tracking-tight" style={{ color: BRAND }}>
                    {formatINR(p.price)}
                  </span>
                  <span className="text-[10px] text-gray-400 line-through">{formatINR(p.mrp)}</span>
                </div>
                <div className="text-[10px] font-semibold text-gray-400 mt-1">★ {p.rating.toFixed(1)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
