'use client';
/**
 * Cinematic Matrix hero: the SASTABAZAAR logo is built from live particles.
 * Endless loop: logo holds a glow colour for 10s -> bursts apart and melts
 * into matrix rain -> reassembles in a NEW colour -> repeats forever.
 * Static logo when animations are off / reduced motion / lightweight mode.
 * Purely decorative — never blocks navigation.
 */
import { useEffect, useRef, useState } from 'react';
import { MatrixRain } from '@/components/MatrixRain';
import { animationsOff } from '@/lib/display';

const COLORS = ['#22ff88', '#ffd23f', '#4da6ff', '#c77dff']; // green -> gold -> blue -> purple
const HOLD_MS = 10000;
const DISSOLVE_MS = 1700;
const REFORM_MS = 1500;

type P = {
  hx: number; hy: number; // home (logo shape)
  x: number; y: number;   // current
  vx: number; vy: number;
  a: number;              // alpha
  tw: number;             // twinkle seed
};

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(c1: string, c2: string, t: number): string {
  const a = hexRgb(c1);
  const b = hexRgb(c2);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

export function MatrixIntro() {
  const [fx] = useState(() => !animationsOff());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    let particles: P[] = [];
    let phase: 'hold' | 'dissolve' | 'reform' = 'hold';
    let phaseStart = performance.now();
    let colorIdx = 0;

    const buildParticles = () => {
      const rect = canvas.getBoundingClientRect();
      W = canvas.width = Math.max(1, Math.floor(rect.width));
      H = canvas.height = Math.max(1, Math.floor(rect.height));
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const octx = off.getContext('2d');
      if (!octx) return;
      // Fit the word to the canvas width
      let fontSize = Math.min(72, Math.max(28, W / 12));
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      const setFont = (s: number) => { octx.font = `900 ${s}px system-ui, -apple-system, sans-serif`; };
      setFont(fontSize);
      const tw = octx.measureText('SASTABAZAAR').width;
      if (tw > W * 0.94) {
        fontSize = Math.floor(fontSize * (W * 0.94) / tw);
        setFont(fontSize);
      }
      octx.fillStyle = '#fff';
      octx.fillText('SASTABAZAAR', W / 2, H * 0.36);
      const data = octx.getImageData(0, 0, W, H).data;
      particles = [];
      const gap = W < 480 ? 3 : 4;
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          if (data[(y * W + x) * 4 + 3] > 128) {
            particles.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, a: 1, tw: Math.random() * Math.PI * 2 });
          }
        }
      }
    };

    buildParticles();
    let resizeT: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        buildParticles();
        phase = 'hold';
        phaseStart = performance.now();
      }, 250);
    };
    window.addEventListener('resize', onResize);

    const burst = () => {
      const cx = W / 2;
      const cy = H * 0.36;
      for (const p of particles) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = Math.max(1, Math.hypot(dx, dy));
        const sp = 2 + Math.random() * 5;
        p.vx = (dx / d) * sp + (Math.random() - 0.5) * 2;
        p.vy = (dy / d) * sp - Math.random() * 2;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const t = now - phaseStart;

      if (phase === 'hold' && t >= HOLD_MS) {
        phase = 'dissolve';
        phaseStart = now;
        burst();
      } else if (phase === 'dissolve' && t >= DISSOLVE_MS) {
        phase = 'reform';
        phaseStart = now;
        colorIdx = (colorIdx + 1) % COLORS.length;
      } else if (phase === 'reform' && t >= REFORM_MS) {
        phase = 'hold';
        phaseStart = now;
      }

      const cur = COLORS[colorIdx];
      const prev = COLORS[(colorIdx + COLORS.length - 1) % COLORS.length];
      // During reform, crossfade prev -> cur; otherwise solid cur
      const blend = phase === 'reform' ? Math.min(1, t / REFORM_MS) : 1;
      const col = mix(prev, cur, phase === 'hold' ? 1 : blend);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (const p of particles) {
        if (phase === 'hold') {
          p.x += (p.hx - p.x) * 0.2;
          p.y += (p.hy - p.y) * 0.2;
          p.a += (1 - p.a) * 0.2;
          const shimmer = 0.82 + 0.18 * Math.sin(now / 350 + p.tw);
          ctx.globalAlpha = p.a * shimmer;
          ctx.fillStyle = col;
          const s = W < 480 ? 2.4 : 3;
          ctx.fillRect(p.x, p.y, s, s);
        } else if (phase === 'dissolve') {
          p.vy += 0.12; // gravity — melts into rain
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.985;
          p.a *= 0.985;
          if (p.y > H + 8) {
            // recycle as matrix rain at the top
            p.y = -8;
            p.x = Math.random() * W;
            p.vx = (Math.random() - 0.5) * 0.6;
            p.vy = 1 + Math.random() * 2.5;
          }
          ctx.globalAlpha = Math.max(0, p.a) * 0.9;
          ctx.fillStyle = col;
          const s = W < 480 ? 2.2 : 2.8;
          ctx.fillRect(p.x, p.y, s, s * 1.6);
        } else {
          // reform — fly home with easing
          const k = 0.12;
          p.x += (p.hx - p.x) * k;
          p.y += (p.hy - p.y) * k;
          p.vx = 0;
          p.vy = 0;
          p.a += (1 - p.a) * 0.12;
          ctx.globalAlpha = p.a;
          ctx.fillStyle = col;
          const s = W < 480 ? 2.4 : 3;
          ctx.fillRect(p.x, p.y, s, s);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (resizeT) clearTimeout(resizeT);
    };
  }, [fx]);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#050806] text-center shadow-2xl min-h-[240px] sm:min-h-[300px]">
        {fx && <MatrixRain className="absolute inset-0 w-full h-full opacity-60" density={0.45} />}
        {fx && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.25))' }}
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,8,6,0.85) 100%)' }}
        />

        <div className="relative px-6 pt-6 pb-10 sm:pb-14 flex flex-col items-center justify-end h-full min-h-[240px] sm:min-h-[300px]">
          {!fx && (
            <h1
              className="text-3xl sm:text-5xl font-black tracking-[0.18em]"
              style={{
                color: '#22ff88',
                textShadow: '0 0 18px rgba(34,255,136,.8), 0 0 60px rgba(34,255,136,.35)',
              }}
            >
              SASTABAZAAR
            </h1>
          )}
          {/* Taglines sit below the particle logo (logo occupies upper ~55%) */}
          <p
            className="mt-2 text-xl sm:text-3xl font-extrabold"
            style={{ color: '#ffd23f', textShadow: '0 0 16px rgba(255,210,63,.7)' }}
          >
            आपका अपना लोकल बाज़ार
          </p>
          <p
            className="mt-3 text-xs sm:text-sm tracking-[0.28em] uppercase"
            style={{ color: '#4da6ff', textShadow: '0 0 12px rgba(77,166,255,.7)' }}
          >
            Your Local Market. Your Digital World.
          </p>
        </div>
      </div>
    </section>
  );
}
