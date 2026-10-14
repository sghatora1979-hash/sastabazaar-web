'use client';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

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

export type WheelSegment = { label: string; color: string };

export function SpinWheel3D({ onResult, segments }: { onResult?: (label: string) => void; segments?: WheelSegment[] }) {
  const SEGS = segments && segments.length >= 4 ? segments : SEGMENTS;
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const rotation = useMotionValue(0);
  const springRot = useSpring(rotation, { stiffness: 40, damping: 12 });
  const tiltX = useTransform(springRot, [0, 360], [0, 0]);
  const audioRef = useRef<AudioContext | null>(null);
  const lastSegRef = useRef(0);
  const mutedRef = useRef(false);

  const ensureAudio = (): AudioContext | null => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioRef.current) audioRef.current = new Ctx();
      if (audioRef.current.state === 'suspended') void audioRef.current.resume();
      return audioRef.current;
    } catch {
      return null;
    }
  };

  /** Short "tuck" click, like a real prize wheel peg. */
  const tick = () => {
    if (mutedRef.current) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.035);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  };

  /** Little win jingle when the wheel stops. */
  const winJingle = () => {
    if (mutedRef.current) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  };

  const toggleMute = () => {
    setMuted(m => {
      mutedRef.current = !m;
      return !m;
    });
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const winner = Math.floor(Math.random() * SEGS.length);
    // land the pointer (top) on the winning segment
    const segAngle = 360 / SEGS.length;
    const targetAngle = 360 * 6 - (winner * segAngle + segAngle / 2);
    lastSegRef.current = Math.floor(rotation.get() / segAngle);
    const controls = animate(rotation, rotation.get() + targetAngle, {
      duration: 4,
      ease: [0.15, 0.85, 0.25, 1],
      onUpdate: (v) => {
        // "tuck tuck" — click every time the pointer passes a segment peg.
        // Ticks naturally slow down as the wheel decelerates. 
        const seg = Math.floor(v / segAngle);
        if (seg !== lastSegRef.current) {
          lastSegRef.current = seg;
          tick();
        }
      },
      onComplete: () => {
        setSpinning(false);
        setResult(SEGS[winner].label);
        winJingle();
        onResult?.(SEGS[winner].label);
      }
    });
    return () => controls.stop();
  };

  const size = 300;
  const segAngle = 360 / SEGS.length;

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
            {SEGS.map((s, i) => {
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

      <button
        onClick={toggleMute}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 -mt-3"
        aria-label={muted ? 'Unmute wheel sounds' : 'Mute wheel sounds'}
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        {muted ? 'Sound off' : 'Sound on'}
      </button>

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
