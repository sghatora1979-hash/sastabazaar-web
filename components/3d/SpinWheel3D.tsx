'use client';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useState } from 'react';

const SEGMENTS = [
  { label: '10% OFF', color: '#0B3D91' },
  { label: 'Free Ship', color: '#22C55E' },
  { label: '5% OFF', color: '#DC2626' },
  { label: 'Try Again', color: '#64748B' },
  { label: '20% OFF', color: '#FF6B35' },
  { label: 'Free Ship', color: '#14B8A6' },
  { label: '15% OFF', color: '#7C3AED' },
  { label: 'Jackpot!', color: '#E91E63' },
];

export function SpinWheel3D({ onResult }: { onResult?: (label: string) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const rotation = useMotionValue(0);
  const springRot = useSpring(rotation, { stiffness: 40, damping: 12 });
  const tiltX = useTransform(springRot, [0, 360], [0, 0]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const winner = Math.floor(Math.random() * SEGMENTS.length);
    // land the pointer (top) on the winning segment
    const segAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 * 6 - (winner * segAngle + segAngle / 2);
    const controls = animate(rotation, rotation.get() + targetAngle, {
      duration: 4,
      ease: [0.15, 0.85, 0.25, 1],
      onComplete: () => {
        setSpinning(false);
        setResult(SEGMENTS[winner].label);
        onResult?.(SEGMENTS[winner].label);
      }
    });
    return () => controls.stop();
  };

  const size = 300;
  const segAngle = 360 / SEGMENTS.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative perspective-1000" style={{ width: size, height: size }}>
        {/* pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-[var(--primary)] drop-shadow-lg" />
        <motion.div
          style={{ rotate: springRot, transformStyle: 'preserve-3d', rotateX: tiltX }}
          className="relative w-full h-full rounded-full shadow-3d overflow-hidden border-8 border-white"
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            {SEGMENTS.map((s, i) => {
              const startAngle = i * segAngle - 90;
              const endAngle = startAngle + segAngle;
              const r = size / 2;
              const x1 = r + r * Math.cos((startAngle * Math.PI) / 180);
              const y1 = r + r * Math.sin((startAngle * Math.PI) / 180);
              const x2 = r + r * Math.cos((endAngle * Math.PI) / 180);
              const y2 = r + r * Math.sin((endAngle * Math.PI) / 180);
              const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
              const tx = r + r * 0.62 * Math.cos(midAngle);
              const ty = r + r * 0.62 * Math.sin(midAngle);
              return (
                <g key={i}>
                  <path d={`M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={s.color} stroke="#fff" strokeWidth="2" />
                  <text x={tx} y={ty} fill="#fff" fontSize="13" fontWeight="bold" textAnchor="middle"
                    transform={`rotate(${(startAngle + endAngle) / 2 + 90} ${tx} ${ty})`}>
                    {s.label}
                  </text>
                </g>
              );
            })}
            <circle cx={size / 2} cy={size / 2} r="34" fill="#fff" />
            <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--primary)">SB</text>
          </svg>
        </motion.div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={spin}
        disabled={spinning}
        className="btn-primary font-bold px-10 py-3.5 rounded-full text-lg disabled:opacity-50"
      >
        {spinning ? 'Spinning…' : 'SPIN NOW'}
      </motion.button>

      {result && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-3d px-8 py-4 text-center"
        >
          <div className="text-sm text-gray-500">You won</div>
          <div className="text-2xl font-black text-[var(--primary)]">{result}</div>
          <div className="text-xs text-gray-400 mt-1">Coupon saved — auto-applied at checkout</div>
        </motion.div>
      )}
    </div>
  );
}
