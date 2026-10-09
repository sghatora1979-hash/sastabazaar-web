'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Ticket, Timer, Users, PartyPopper, Info, Smartphone, BadgeIndianRupee } from 'lucide-react';
import {
  getEntries, addEntry, nextDrawDate, runDemoDraw, getDemoWinners,
  SEEDED_WINNERS, PRIZES, type Winner
} from '@/lib/luckydraw';
import { getCheapPicks } from '@/lib/deals';
import { formatINR } from '@/lib/utils';
import { BRAND } from '@/components/store/ProductCard';
import type { Product } from '@/lib/products';

function useCountdown(target: Date | null) {
  const [left, setLeft] = useState('--d --:--:--');
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const ms = Math.max(0, target.getTime() - Date.now());
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

export default function LuckyDrawPage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [entriesCount, setEntriesCount] = useState(0);
  const [drawAt, setDrawAt] = useState<Date | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [justWon, setJustWon] = useState<Winner[] | null>(null);
  const [picks, setPicks] = useState<Product[]>([]);

  const countdown = useCountdown(drawAt);

  useEffect(() => {
    setDrawAt(nextDrawDate());
    setEntriesCount(getEntries().length);
    setWinners([...getDemoWinners(), ...SEEDED_WINNERS]);
    setPicks(getCheapPicks(undefined, 3));
  }, []);

  const submit = () => {
    const res = addEntry(name, contact);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error || 'Something went wrong.' });
      return;
    }
    setMsg({ ok: true, text: `You're in, ${res.entry!.name.split(' ')[0]}! Good luck — draw is Sunday 8 PM IST.` });
    setName('');
    setContact('');
    setEntriesCount(getEntries().length);
  };

  const demoDraw = () => {
    const res = runDemoDraw();
    if (!res.ok) {
      setMsg({ ok: false, text: res.error || 'Draw failed.' });
      return;
    }
    setJustWon(res.winners!);
    setWinners([...getDemoWinners(), ...SEEDED_WINNERS]);
  };

  const prizeCard = (icon: React.ReactNode, title: string, sub: string, highlight?: boolean) => (
    <div
      className={`rounded-2xl p-4 text-center border ${highlight ? 'text-white border-transparent shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}
      style={highlight ? { background: `linear-gradient(135deg, #7A2E00, ${BRAND})` } : undefined}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <div className={`font-extrabold text-sm ${highlight ? 'text-white' : 'text-gray-900'}`}>{title}</div>
      <div className={`text-[11px] mt-0.5 ${highlight ? 'text-white/80' : 'text-gray-500'}`}>{sub}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.75rem] p-6 sm:p-10 text-white text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2A1503 0%, #7A2E00 55%, #B34A00 100%)' }}
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: BRAND }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-bold mb-4">
            <Trophy size={16} /> Weekly Lucky Draw
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Win {formatINR(10000)} every Sunday</h1>
          <p className="mt-3 text-white/80 max-w-lg mx-auto text-sm sm:text-base">
            Free entry. One winner takes the bumper prize — and every 10th entrant wins a Budget Pick.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-black/30 rounded-full px-5 py-2.5 font-bold">
            <Timer size={16} style={{ color: '#FFB25E' }} />
            <span className="text-sm text-white/70">Next draw in</span>
            <span className="tabular-nums tracking-wider" style={{ color: '#FFB25E' }}>{countdown}</span>
          </div>
          <div className="mt-3 text-xs text-white/60 inline-flex items-center gap-1.5">
            <Users size={13} /> {entriesCount} {entriesCount === 1 ? 'entry' : 'entries'} so far this week
          </div>
        </div>
      </motion.div>

      {/* Prizes */}
      <h2 className="font-extrabold text-gray-900 mt-8 mb-3 text-lg">This week&apos;s prizes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {prizeCard(<Trophy size={26} style={{ color: '#FFB25E' }} />, `${formatINR(10000)} voucher`, 'Bumper prize', true)}
        {prizeCard(<Smartphone size={26} style={{ color: BRAND }} />, 'Smartphone', PRIZES.first)}
        {prizeCard(<BadgeIndianRupee size={26} style={{ color: BRAND }} />, `${formatINR(2000)} voucher`, 'Runner-up prize')}
        {prizeCard(<Ticket size={26} style={{ color: BRAND }} />, 'Budget Picks', 'Every 10th entrant wins')}
      </div>

      {/* Consolation products */}
      {picks.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm font-bold text-gray-900 mb-3">Consolation prizes — real products under ₹199</div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {picks.map(p => (
              <div key={p.id} className="shrink-0 w-[120px]">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                  <Image src={p.image} alt={p.title} fill sizes="120px" className="object-cover" unoptimized />
                </div>
                <div className="text-[11px] font-bold text-gray-900 line-clamp-1 mt-1.5">{p.titleHi || p.title}</div>
                <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                <div className="text-xs font-extrabold" style={{ color: BRAND }}>{formatINR(p.price)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5 sm:p-6"
      >
        <h2 className="font-extrabold text-gray-900 mb-1">Enter the draw — it&apos;s free</h2>
        <p className="text-xs text-gray-500 mb-4">One entry per mobile number or email per week.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Your name</span>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FB7701]/40"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Mobile or email</span>
            <input
              value={contact} onChange={e => setContact(e.target.value)}
              placeholder="10-digit mobile or email"
              inputMode="tel"
              className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FB7701]/40"
            />
          </label>
        </div>
        {msg && (
          <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
        )}
        <button
          onClick={submit}
          className="mt-4 w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-extrabold shadow-md active:scale-95 transition"
          style={{ background: BRAND }}
        >
          Enter Lucky Draw
        </button>
      </motion.div>

      {/* Demo draw */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6">
        <h2 className="font-extrabold text-gray-900 mb-1">Try the draw (demo)</h2>
        <p className="text-xs text-gray-600 mb-4">
          This button simulates Sunday&apos;s draw using this week&apos;s entries — just to show how winners are picked.
        </p>
        <button
          onClick={demoDraw}
          className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-extrabold text-sm shadow-md active:scale-95 transition"
        >
          Run demo draw
        </button>
        <AnimatePresence>
          {justWon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-white rounded-2xl border border-amber-200 p-4"
            >
              <div className="flex items-center gap-2 font-extrabold text-gray-900 mb-3">
                <PartyPopper size={18} style={{ color: BRAND }} /> Demo winners announced!
              </div>
              <div className="space-y-2">
                {justWon.map((w, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-bold text-gray-900">{w.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{w.masked}</span>
                      <div className="text-[11px] text-gray-500">{w.prize}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] font-bold bg-gray-900 text-white px-2.5 py-1 rounded-lg">
                      {w.claimCode}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Past winners */}
      <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="font-extrabold text-gray-900 mb-4">Past winners</h2>
        <div className="space-y-2.5">
          {winners.map((w, i) => (
            <div key={`${w.week}-${w.claimCode}-${i}`} className="flex items-center justify-between gap-3 bg-gray-50 rounded-2xl px-4 py-3 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs" style={{ background: BRAND }}>
                  {w.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{w.name} <span className="font-normal text-gray-400 text-xs">{w.masked}</span></div>
                  <div className="text-[11px] text-gray-500">{w.prize} · {w.week}</div>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-gray-500">{w.claimCode}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-gray-400 flex gap-1.5 items-start">
          <Info size={13} className="shrink-0 mt-0.5" />
          Demo version: entries and draws are stored in this browser only. A real public prize draw in India needs
          legal review under lottery/prize-competition laws, official rules, and tax handling on winnings before launch.
        </p>
      </div>
    </div>
  );
}
