'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Zap, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Festival, festivalDate, formatFestivalDate, countdownParts } from '@/lib/festivals';
import { fireBlast } from './CelebrationBlast';

const PARTICLES = ['✨', '⭐', '🛍️', '🔥'];

/**
 * Sleeker festival mega-sale banner: keeps the 3D tilt, live countdown,
 * shine sweep and celebration blast — with a cleaner, premium finish.
 */
export function FestivalPromo({ festival }: { festival: Festival }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [cd, setCd] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const target = festivalDate(festival);

  useEffect(() => {
    const id = setInterval(() => setCd(countdownParts(target)), 1000);
    setCd(countdownParts(target));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festival.id]);

  const onMove = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 8, y: px * 12 });
  };

  const units: [string, number][] = [
    ['DAYS', cd.days], ['HRS', cd.hours], ['MIN', cd.mins], ['SEC', cd.secs],
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6" style={{ perspective: 1200 }}>
      <style>{`
        @keyframes promoShine { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(240%) skewX(-18deg); } }
        @keyframes promoFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes promoBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes orbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,-30px) scale(1.15); } }
      `}</style>
      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative overflow-hidden rounded-[1.75rem] shadow-2xl"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* animated gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(120deg, ${festival.theme[0]}, ${festival.theme[1]}, ${festival.theme[0]})`,
            backgroundSize: '220% 220%',
            animation: 'promoBg 9s ease-in-out infinite',
          }}
        />
        {/* soft glow orbs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/20 blur-3xl" style={{ animation: 'orbDrift 10s ease-in-out infinite' }} />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-black/20 blur-3xl" />
        {/* shine sweep */}
        <div className="absolute inset-y-0 w-1/4 bg-white/20 blur-xl" style={{ animation: 'promoShine 4s ease-in-out infinite' }} />
        {/* sparse floating particles */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute text-xl select-none pointer-events-none"
            style={{
              left: `${12 + i * 24}%`,
              top: `${18 + ((i * 41) % 55)}%`,
              animation: `promoFloat ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
              opacity: 0.5,
            }}
          >
            {p}
          </span>
        ))}

        <div className="relative px-6 py-8 sm:px-10 sm:py-10 text-white" style={{ transform: 'translateZ(40px)' }}>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-widest">
            <span className="bg-black/30 rounded-full px-3 py-1 inline-flex items-center gap-1">
              <Zap size={12} /> MEGA SALE
            </span>
            <span className="bg-black/30 rounded-full px-3 py-1">
              {festival.emoji} {formatFestivalDate(festival)}
            </span>
            {festival.govtHoliday && (
              <span className="bg-black/30 rounded-full px-3 py-1">🏛️ Govt Holiday</span>
            )}
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold mt-3 tracking-tight drop-shadow-md">
            {festival.emoji} {festival.sale}
          </h2>
          <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl">{festival.tagline}</p>

          <div className="flex items-center gap-2 mt-3 text-[13px] font-semibold text-white/90">
            <Gift size={15} />
            <span>Up to 90% OFF* + mystery gift on every order + hourly lucky draw</span>
          </div>

          {/* countdown */}
          <div className="flex gap-2 mt-5">
            {units.map(([label, v]) => (
              <div key={label} className="bg-white/15 backdrop-blur-md rounded-xl px-3 py-2 text-center min-w-[60px] border border-white/20">
                <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{String(v).padStart(2, '0')}</div>
                <div className="text-[9px] font-bold tracking-widest text-white/70">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href={`/festivals#${festival.id}`}
              onClick={() => fireBlast(true)}
              className="bg-white text-gray-900 font-bold px-7 py-3 rounded-full shadow-xl hover:scale-[1.04] transition inline-flex items-center gap-2"
            >
              <Sparkles size={17} /> SHOP THE SALE <ArrowRight size={16} />
            </Link>
            <Link
              href="/spin-and-win"
              className="border border-white/50 text-white font-bold px-7 py-3 rounded-full hover:bg-white/10 transition"
            >
              Spin & Win Extra
            </Link>
          </div>
          <p className="text-[11px] text-white/60 mt-3">*On selected sellers. Sellers: tag your festival deals — customers are waiting.</p>
        </div>
      </div>
    </div>
  );
}
