'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Zap, Gift, Sparkles } from 'lucide-react';
import { Festival, festivalDate, formatFestivalDate, countdownParts } from '@/lib/festivals';
import { fireBlast } from './CelebrationBlast';

const PARTICLES = ['✨', '🎉', '💥', '⭐', '🛍️', '💰', '🎊', '🔥'];

/**
 * Temu/Shein-style mega promo banner — but more advanced:
 * 3D tilt on hover, animated gradient, shine sweep, floating particles,
 * live countdown, hourly lucky-draw teaser.
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
    setTilt({ x: -py * 10, y: px * 14 });
  };

  const units: [string, number][] = [
    ['DAYS', cd.days], ['HRS', cd.hours], ['MIN', cd.mins], ['SEC', cd.secs],
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-6" style={{ perspective: 1200 }}>
      <style>{`
        @keyframes promoShine { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(240%) skewX(-18deg); } }
        @keyframes promoFloat { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-16px) rotate(8deg); } }
        @keyframes promoPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes promoBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes orbDrift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(60px,-40px) scale(1.25); } 66% { transform: translate(-40px,30px) scale(0.9); } }
        @keyframes ultraGlow { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      `}</style>
      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative overflow-hidden rounded-[2rem] shadow-2xl"
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
            animation: 'promoBg 8s ease-in-out infinite',
          }}
        />
        {/* ultra glow orbs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/30 blur-3xl" style={{ animation: 'orbDrift 9s ease-in-out infinite, ultraGlow 4s ease-in-out infinite' }} />
        <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-yellow-200/40 blur-3xl" style={{ animation: 'orbDrift 11s ease-in-out infinite reverse, ultraGlow 5s ease-in-out infinite' }} />
        {/* shine sweep */}
        <div className="absolute inset-y-0 w-1/3 bg-white/25 blur-xl" style={{ animation: 'promoShine 3.5s ease-in-out infinite' }} />
        {/* floating particles */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute text-2xl select-none pointer-events-none"
            style={{
              left: `${6 + i * 11}%`,
              top: `${12 + ((i * 37) % 60)}%`,
              animation: `promoFloat ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              opacity: 0.85,
            }}
          >
            {p}
          </span>
        ))}

        <div className="relative px-6 py-8 sm:px-10 sm:py-10 text-white" style={{ transform: 'translateZ(50px)' }}>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-widest">
            <span className="bg-black/30 rounded-full px-3 py-1 inline-flex items-center gap-1">
              <Zap size={13} /> MEGA SALE
            </span>
            <span className="bg-black/30 rounded-full px-3 py-1">
              {festival.emoji} {formatFestivalDate(festival)}
            </span>
            {festival.govtHoliday && (
              <span className="bg-black/30 rounded-full px-3 py-1">🏛️ Govt Holiday</span>
            )}
          </div>

          <h2 className="text-4xl sm:text-6xl font-black mt-3 drop-shadow-lg" style={{ animation: 'promoPulse 2.4s ease-in-out infinite' }}>
            {festival.emoji} {festival.sale}
          </h2>
          <p className="mt-2 text-white/90 font-medium max-w-xl">{festival.tagline}</p>

          <div className="flex items-center gap-2 mt-3 text-sm font-bold">
            <Gift size={16} />
            <span>Up to 90% OFF* + mystery gift on every order + hourly lucky draw</span>
          </div>

          {/* countdown */}
          <div className="flex gap-2 mt-5">
            {units.map(([label, v]) => (
              <div key={label} className="bg-black/35 backdrop-blur rounded-2xl px-3 py-2 text-center min-w-[64px] border border-white/20">
                <div className="text-2xl font-black tabular-nums">{String(v).padStart(2, '0')}</div>
                <div className="text-[10px] font-bold tracking-widest text-white/70">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href={`/festivals#${festival.id}`}
              onClick={() => fireBlast(true)}
              className="bg-white text-gray-900 font-black px-8 py-3.5 rounded-full text-lg shadow-xl hover:scale-105 transition inline-flex items-center gap-2"
            >
              <Sparkles size={19} /> SHOP THE SALE
            </Link>
            <Link
              href="/spin-and-win"
              className="border-2 border-white/70 text-white font-bold px-8 py-3.5 rounded-full text-lg hover:bg-white/10 transition"
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
