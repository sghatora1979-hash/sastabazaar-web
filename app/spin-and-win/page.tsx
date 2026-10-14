'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SpinWheel3D, WheelSegment } from '@/components/3d/SpinWheel3D';
import { getPlacedProducts } from '@/lib/seller';
import { Gift } from 'lucide-react';

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { label: '10% OFF', color: '#0B3D91' },
  { label: 'Free Ship', color: '#22C55E' },
  { label: '5% OFF', color: '#DC2626' },
  { label: 'Try Again', color: '#64748B' },
  { label: '20% OFF', color: '#FF6B35' },
  { label: 'Free Ship', color: '#14B8A6' },
  { label: '15% OFF', color: '#7C3AED' },
  { label: 'Jackpot!', color: '#E91E63' },
];

const PRODUCT_COLORS = ['#7C3AED', '#E91E63', '#0B3D91', '#B45309'];

const COUPON_KEY = 'sb-coupons';

function saveCoupon(label: string) {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(label)) {
      list.push(label);
      localStorage.setItem(COUPON_KEY, JSON.stringify(list));
    }
  } catch { /* ignore */ }
}

export default function SpinPage() {
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const [segments, setSegments] = useState<WheelSegment[]>(DEFAULT_SEGMENTS);

  // Seller products placed into Spin & Win become wheel prize segments.
  useEffect(() => {
    try {
      const placed = getPlacedProducts('spin').slice(0, 4);
      if (placed.length > 0) {
        const prodSegs: WheelSegment[] = placed.map((p, i) => ({
          label: `🎁 ${p.title.slice(0, 16)}`,
          color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
        }));
        const filler = DEFAULT_SEGMENTS.filter((s) => s.label !== 'Jackpot!');
        setSegments([...prodSegs, ...filler].slice(0, 8));
      }
    } catch { /* default wheel */ }
  }, []);

  const handleResult = (label: string) => {
    setSpinsLeft(s => Math.max(0, s - 1));
    const isProduct = label.includes('🎁');
    const shown = isProduct ? `${label} — seller will contact you to deliver it!` : label;
    setHistory(h => [shown, ...h].slice(0, 5));
    if (!isProduct && !label.toLowerCase().includes('try again')) saveCoupon(label);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] font-bold px-4 py-1.5 rounded-full text-sm mb-4">
          <Gift size={16} /> Daily Rewards
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Spin &amp; Win</h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Spin the wheel every day to win discount coupons. Coupons are saved automatically and applied at checkout.
        </p>
        <p className="mt-3 text-sm font-semibold text-gray-700">
          Spins left today: <span className="text-[var(--primary)] font-black text-lg">{spinsLeft}</span>
        </p>
      </motion.div>

      <div className="mt-8 flex justify-center">
        {spinsLeft > 0 ? (
          <SpinWheel3D onResult={handleResult} segments={segments} />
        ) : (
          <div className="bg-white rounded-3xl shadow-3d p-10">
            <div className="text-5xl mb-3">😴</div>
            <p className="font-bold text-gray-900 text-lg">No spins left today</p>
            <p className="text-gray-500 text-sm mt-1">Come back tomorrow for 3 fresh spins!</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-10 max-w-sm mx-auto">
          <h2 className="font-bold text-gray-900 mb-3">Your recent wins</h2>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm">
                {h}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
