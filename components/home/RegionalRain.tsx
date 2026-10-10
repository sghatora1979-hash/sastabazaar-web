'use client';
/**
 * "Regional rain" — the name Sasta Bazaar written in India's regional
 * languages, drifting slowly from top to bottom, small and readable.
 * Sits between the matrix rain and the particle logo. Decorative only.
 * Disabled when animations are off / reduced motion / lightweight mode.
 */
import { useEffect, useRef } from 'react';
import { animationsOff } from '@/lib/display';

const WORDS: { text: string; lang: string }[] = [
  { text: 'सस्ता बाज़ार', lang: 'Hindi' },
  { text: 'ਸਸਤਾ ਬਾਜ਼ਾਰ', lang: 'Punjabi' },
  { text: 'سستا بازار', lang: 'Urdu' },
  { text: 'সস্তা বাজার', lang: 'Bengali' },
  { text: 'সস্তা বজাৰ', lang: 'Assamese' },
  { text: 'ଶସ୍ତା ବଜାର', lang: 'Odia' },
  { text: 'स्वस्त बाजार', lang: 'Marathi' },
  { text: 'સસ્તું બજાર', lang: 'Gujarati' },
  { text: 'மலிவு சந்தை', lang: 'Tamil' },
  { text: 'చౌక బజార్', lang: 'Telugu' },
  { text: 'ಅಗ್ಗದ ಬಜಾರ್', lang: 'Kannada' },
  { text: 'വിലകുറഞ്ഞ ചന്ത', lang: 'Malayalam' },
];

const COLORS = ['#22ff88', '#ffd23f', '#4da6ff', '#c77dff', '#38e1ff', '#ff9f1c'];

type Drop = {
  x: number;
  y: number;
  speed: number; // px per second — slow so it stays readable
  word: string;
  color: string;
  size: number;
};

export function RegionalRain({ className = '', count = 10 }: { className?: string; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (animationsOff()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let drops: Drop[] = [];
    let last = performance.now();

    const spawn = (initial: boolean): Drop => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : -30 - Math.random() * 60,
      speed: 14 + Math.random() * 22, // slow drift
      word: WORDS[Math.floor(Math.random() * WORDS.length)].text,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 11 + Math.random() * 3, // very small
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.floor(rect.width));
      h = canvas.height = Math.max(1, Math.floor(rect.height));
      drops = Array.from({ length: count }, () => spawn(true));
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      for (const d of drops) {
        d.y += d.speed * dt;
        if (d.y > h + 30) Object.assign(d, spawn(false));
        ctx.globalAlpha = 0.55;
        ctx.font = `${d.size}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = d.color;
        ctx.fillText(d.word, d.x, d.y);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
