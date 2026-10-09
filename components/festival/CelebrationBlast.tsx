'use client';
import { useEffect, useRef } from 'react';

/*
 * Welcome Blast — canvas confetti explosion + festive fanfare (Web Audio).
 * Any button anywhere can trigger it: fireBlast(true)  -> confetti + sound
 *                                    fireBlast(false) -> confetti only (autoplay-safe)
 * Mount <CelebrationBlast /> once (in the root layout).
 */

const COLORS = ['#FFD700', '#FF6B35', '#E91E63', '#7C3AED', '#22C55E', '#26C6DA', '#FF9933', '#EC407A', '#FF5252'];

type Particle = {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rot: number; vr: number;
};

function ensureAudio(): AudioContext | null {
  try {
    const Ctx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Festive fanfare: dhol-style thumps + ascending celebratory notes. */
export function fanfare() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  // dhol thumps
  [0, 0.22, 0.44, 0.66, 0.88, 1.1].forEach((dt, i) => {
    const t = t0 + dt;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(i % 2 === 0 ? 170 : 120, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.16);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  });
  // bright ascending melody
  [523, 587, 659, 784, 880, 1047, 1319].forEach((f, i) => {
    const t = t0 + 0.08 + i * 0.13;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  });
}

function runConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const parts: Particle[] = [];
  for (let i = 0; i < 200; i++) {
    parts.push({
      x: Math.random() * canvas.width,
      y: -30 - Math.random() * canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2 + Math.random() * 4.5,
      size: 6 + Math.random() * 9,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
    });
  }
  let frames = 0;
  const maxFrames = 260;
  const tick = () => {
    frames++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.x += p.vx + Math.sin(frames / 18 + p.rot) * 1.4;
      p.y += p.vy;
      p.vy += 0.045;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - frames / maxFrames);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (frames < maxFrames) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  tick();
}

export function fireBlast(sound = true) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sb-blast', { detail: { sound } }));
}

export function CelebrationBlast() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const sound = (e as CustomEvent<{ sound?: boolean }>).detail?.sound ?? true;
      if (ref.current) runConfetti(ref.current);
      if (sound) fanfare();
    };
    window.addEventListener('sb-blast', handler);
    return () => window.removeEventListener('sb-blast', handler);
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
