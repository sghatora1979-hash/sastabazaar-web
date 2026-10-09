'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { formatINR } from '@/lib/utils';
import { BRAND } from './ProductCard';

const MAX_STOCK = 50;

function useMidnightCountdown() {
  const [left, setLeft] = useState('--:--:--');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const ms = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

/**
 * Temu-style Flash Deals rail: horizontal snap-scroll cards with
 * red discount badges, "Almost gone" stock progress bars,
 * big price + strikethrough MRP, and a live ends-in countdown.
 */
export function FlashDeals() {
  const railRef = useRef<HTMLDivElement>(null);
  const countdown = useMidnightCountdown();
  const deals = [...PRODUCTS].sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 12);

  const scroll = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8">
      <div
        className="rounded-[1.75rem] p-4 sm:p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #191919 0%, #3A1C00 55%, #7A2E00 100%)' }}
      >
        {/* subtle glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: BRAND }} />

        <div className="relative flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
                <Zap size={18} className="text-white" fill="currentColor" />
              </span>
              Flash Deals
            </h2>
            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs font-bold">
              <span className="text-white/70">Ends in</span>
              <span className="tabular-nums tracking-wider" style={{ color: '#FFB25E' }}>{countdown}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-1.5">
              <button onClick={() => scroll(-1)} aria-label="Scroll left" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scroll(1)} aria-label="Scroll right" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <ChevronRight size={18} />
              </button>
            </div>
            <Link href="/clearance" className="text-xs sm:text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#FFB25E' }}>
              View all <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div
          ref={railRef}
          className="relative flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1"
        >
          {deals.map(p => {
            const soldPct = Math.min(96, Math.round((1 - p.stock / MAX_STOCK) * 100));
            const almostGone = p.stock <= 8;
            return (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="snap-start shrink-0 w-[148px] sm:w-[176px] bg-white rounded-2xl overflow-hidden text-gray-900 shadow-lg hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="relative aspect-square bg-gray-50">
                  <Image src={p.image} alt={p.title} fill sizes="180px" className="object-cover" unoptimized />
                  <span className="absolute top-2 left-2 bg-[#E62E2E] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow">
                    -{p.discountPercent}%
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-gray-900 line-clamp-1">{p.titleHi || p.title}</div>
                  <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[15px] font-extrabold tracking-tight">{formatINR(p.price)}</span>
                    <span className="text-[10px] text-gray-400 line-through">{formatINR(p.mrp)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${soldPct}%`,
                          background: almostGone
                            ? '#E62E2E'
                            : `linear-gradient(90deg, ${BRAND}, #E62E2E)`
                        }}
                      />
                    </div>
                    <div className={`text-[10px] font-bold mt-1 ${almostGone ? 'text-[#E62E2E]' : 'text-gray-500'}`}>
                      {almostGone ? `🔥 Almost gone — ${p.stock} left!` : `${soldPct}% sold`}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
