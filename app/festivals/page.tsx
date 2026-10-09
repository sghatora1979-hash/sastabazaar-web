'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, PartyPopper, Landmark } from 'lucide-react';
import {
  FESTIVALS, STATES, stateName, getUpcomingFestivals,
  festivalDate, formatFestivalDate, countdownParts, Festival,
} from '@/lib/festivals';
import { fireBlast } from '@/components/festival/CelebrationBlast';

function MiniCountdown({ f }: { f: Festival }) {
  const target = useMemo(() => festivalDate(f), [f]);
  const [cd, setCd] = useState(() => countdownParts(target));
  useEffect(() => {
    const id = setInterval(() => setCd(countdownParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return (
    <span className="tabular-nums font-bold">
      {cd.days > 0 ? `${cd.days}d ` : ''}{String(cd.hours).padStart(2, '0')}h : {String(cd.mins).padStart(2, '0')}m : {String(cd.secs).padStart(2, '0')}s
    </span>
  );
}

export default function FestivalsPage() {
  const [stateFilter, setStateFilter] = useState('ALL');
  const upcoming = getUpcomingFestivals(24);

  useEffect(() => {
    const t = setTimeout(() => fireBlast(false), 700);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (stateFilter === 'ALL') return upcoming;
    return upcoming.filter(f => f.states.includes('ALL') || f.states.includes(stateFilter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center">
        <span className="inline-flex w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] items-center justify-center">
          <PartyPopper size={24} />
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3">Festival Sale Calendar 🇮🇳</h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto text-sm">
          Every Indian festival & government holiday, state-wise. Pick your state —
          shop ethnic fashion, foods and deals from sellers of that state, in their language.
        </p>
        <button
          onClick={() => fireBlast(true)}
          className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-pink-600 text-white font-black px-8 py-3 rounded-full shadow-xl hover:scale-105 transition"
        >
          🎉 Celebrate with sound!
        </button>
      </div>

      {/* state filter */}
      <div className="mt-6 flex items-center gap-2 justify-center flex-wrap">
        <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1">
          <MapPin size={14} /> Your state:
        </span>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        >
          <option value="ALL">🌏 All India</option>
          {STATES.map(s => (
            <option key={s.code} value={s.code}>{s.name} — {s.languages.join(', ')}</option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {filtered.map((f, i) => (
          <motion.div
            key={f.id}
            id={f.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.5) }}
            className="relative overflow-hidden rounded-3xl shadow-lg text-white scroll-mt-24"
            style={{ background: `linear-gradient(135deg, ${f.theme[0]}, ${f.theme[1]})` }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <span className="text-5xl">{f.emoji}</span>
                <div className="flex flex-col items-end gap-1.5">
                  {f.mega && (
                    <span className="text-[10px] font-black bg-yellow-300 text-red-700 rounded-full px-2.5 py-1 animate-pulse">
                      💥 MEGA BONANZA
                    </span>
                  )}
                  {f.govtHoliday && (
                    <span className="text-[10px] font-black bg-black/30 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                      <Landmark size={11} /> GOVT HOLIDAY
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-black mt-3">{f.name}</h2>
              <p className="text-white/85 text-sm mt-1">{f.tagline}</p>
              <div className="mt-3 text-sm font-bold bg-black/25 rounded-2xl px-4 py-2.5 inline-flex items-center gap-2">
                <CalendarDays size={16} /> {formatFestivalDate(f)}
              </div>
              <div className="mt-2 text-sm">
                ⏳ Sale starts in <MiniCountdown f={f} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(f.states.includes('ALL') ? ['All India'] : f.states.map(stateName)).map(s => (
                  <span key={s} className="text-[11px] font-bold bg-white/20 rounded-full px-2.5 py-1">{s}</span>
                ))}
              </div>
              <div className="mt-4 font-black text-lg">{f.sale}</div>
              <Link
                href={stateFilter === 'ALL' ? '/marketplace' : `/marketplace?state=${stateFilter}`}
                className="mt-3 inline-block bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full text-sm hover:scale-105 transition"
              >
                Shop {stateFilter === 'ALL' ? 'the sale' : stateName(stateFilter) + ' sellers'} →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No festivals found for this filter.</p>
      )}

      <p className="text-xs text-gray-400 text-center mt-8">
        Festival dates follow the lunar calendar and can shift each year — verified for the current season.
        Sellers: list ethnic products for your state's festivals and watch them fly. 🪁
      </p>
    </div>
  );
}
