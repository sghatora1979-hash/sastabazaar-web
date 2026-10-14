'use client';
/**
 * Lightweight Matrix-style digital rain on canvas.
 * Auto-disabled when: lightweight mode ON, reduced motion ON, or the
 * OS prefers reduced motion. Pauses when tab is hidden (battery-friendly).
 */
import { useEffect, useRef } from 'react';
import { animationsOff } from '@/lib/display';

export function MatrixRain({ className = '', density = 0.5 }: { className?: string; density?: number }) {
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
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.floor(rect.width);
      h = canvas.height = Math.floor(rect.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = '01अआइईउऊएऐओऔकखगघ$₹#*+';
    const fontSize = 14;
    let columns = Math.floor(w / fontSize);
    let drops: number[] = Array.from({ length: columns }, () => Math.random() * -50);
    const colors = ['#22ff88', '#ffd23f', '#4da6ff'];

    const draw = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.fillStyle = 'rgba(5, 8, 6, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;
      const cols = Math.floor(w / fontSize);
      if (cols !== columns) {
        columns = cols;
        drops = Array.from({ length: columns }, () => Math.random() * -50);
      }
      for (let i = 0; i < drops.length; i++) {
        if (Math.random() > density) continue;
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.75;
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1;
        if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
