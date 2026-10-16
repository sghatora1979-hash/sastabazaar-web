'use client';
/**
 * MatrixBackdrop — Updates 18–20.
 * A fixed, full-website matrix rain rendered BEHIND all page content.
 * Falling glyphs from many Indian scripts, very faint so text stays readable.
 * Update 20: the rain colour rotates through all 7 colours once per HOUR
 * (was every 5 minutes), with smooth blending between hours.
 * Update 20: glyphs brighten near the finger/pointer (pointer-reactive glow).
 * Update 20: crisper rendering on high-DPI screens (devicePixelRatio up to 3).
 * Update 22: glyphs made DARKER / more visible (~2.5x alpha) per Sandeep's
 * request — clearly visible on the cream background, content still paints above.
 * Purely decorative: pointer-events none, sits at z-0, never touches app logic.
 * Disabled when animations are off / reduced motion / lightweight mode.
 */
import { useEffect, useRef } from 'react';
import { animationsOff } from '@/lib/display';

// Glyph pools from many Indian scripts (+ a few digits), classic matrix columns.
const GLYPHS =
  'अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह०१२३४५६७८९' +
  'ਅਆਇਈਉਊਏਐਓਔਕਖਗਘਚਛਜਝਟਠਡਢਤਥਦਧਨਪਫਬਭਮਯਰਲਵਸਹ' +
  'அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன' +
  'అఆఇఈఉఊఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢతథదధనపఫబభమయరలవశషసహ' +
  'ಅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಚಛಜಝಟಠಡಢತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ' +
  'അആഇഈഉഊഎഏഐഒഓഔകഖഗഘചഛജഝടഠഡഢതഥദധനപഫബഭമയരലവശഷസഹ' +
  'অআইঈউঊএঐওঔকখগঘচছজঝটঠডঢতথদধনপফবভমযরলৱশষসহ০১২৩৪৫৬৭৮৯' +
  'અઆઇઈઉઊએઐઓઔકખગઘચછજઝટઠડઢતથદધનપફબભમયરલવશષસહ' +
  'ଅଆଇଈଉଊଏଐଓଔକଖଗଘଚଛଜଝଟଠଡଢତଥଦଧନପଫବଭମଯରଲଵଶଷସହ';

// Update 20: 7 colours, one per hour — the colour pattern changes every hour.
// Update 18 had a 5-minute rotation; his 2026-10-10 request asked for hourly.
const PALETTE = ['#16a34a', '#d4a017', '#2563eb', '#9333ea', '#0891b2', '#ea580c', '#db2777'];
const ROTATE_MS = 60 * 60 * 1000;
const FADE_MS = 3000; // smooth blend between colours

// Update 20: pointer-reactive glow radius (px) and max extra brightness.
// Update 22: base alphas raised ~2.5x (head 0.28→0.66, trail 0.16→0.38) so the
// rain is clearly visible on cream; boost trimmed so the glow stays tasteful.
const GLOW_RADIUS = 140;
const GLOW_BOOST = 0.25;
const HEAD_ALPHA = 0.66;
const TRAIL_ALPHA = 0.38;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

type Column = {
  x: number;
  y: number; // head position in px
  speed: number; // px per second
  chars: string[];
  len: number;
};

export function MatrixBackdrop() {
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
    let cols: Column[] = [];
    let last = performance.now();
    let colorIdx = Math.floor(Date.now() / ROTATE_MS) % PALETTE.length;
    let fadeStart = 0;
    let fromRgb = hexToRgb(PALETTE[colorIdx]);
    let toRgb = fromRgb;

    // Update 20: track the finger/pointer so nearby glyphs brighten as it moves.
    let px = -9999;
    let py = -9999;
    const onPointerMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    const onPointerLeave = () => {
      px = -9999;
      py = -9999;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    const makeColumn = (initial: boolean): Column => {
      const len = 8 + Math.floor(Math.random() * 14);
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -len * 22 - Math.random() * 200,
        speed: 40 + Math.random() * 70,
        chars: Array.from({ length: len }, pick),
        len,
      };
    };

    const resize = () => {
      // Update 20: render up to devicePixelRatio 3 for crisper glyphs on
      // high-DPI screens (sharper look; not a resolution claim about video).
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.floor(w / 34));
      cols = Array.from({ length: n }, () => makeColumn(true));
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

      // rotate colour every hour, blending smoothly
      const idx = Math.floor(now / ROTATE_MS) % PALETTE.length;
      if (idx !== colorIdx) {
        fromRgb = currentRgb(now);
        toRgb = hexToRgb(PALETTE[idx]);
        colorIdx = idx;
        fadeStart = now;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.font = '15px "Noto Sans Devanagari", system-ui, sans-serif';

      const rgb = currentRgb(now);
      const [r, g, b] = rgb.map(Math.round);

      for (const c of cols) {
        c.y += c.speed * dt;
        if (c.y - c.len * 22 > h + 40) Object.assign(c, makeColumn(false));
        // occasionally mutate a trailing char for the classic shimmer
        if (Math.random() < 0.06) c.chars[Math.floor(Math.random() * c.len)] = pick();
        for (let i = 0; i < c.len; i++) {
          const yy = c.y - i * 22;
          if (yy < -24 || yy > h + 24) continue;
          const head = i === 0;
          // Update 22: darker, clearly visible on cream; head brightest.
          let alpha = head ? HEAD_ALPHA : TRAIL_ALPHA * (1 - i / c.len);
          // Update 20: finger/pointer glow — glyphs near the pointer brighten.
          const dx = c.x - px;
          const dy = yy - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < GLOW_RADIUS) {
            alpha += GLOW_BOOST * (1 - dist / GLOW_RADIUS);
          }
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(0.85, alpha).toFixed(3)})`;
          ctx.fillText(c.chars[i], c.x, yy);
        }
      }
    };

    function currentRgb(now: number): [number, number, number] {
      const t = Math.min(1, (now - fadeStart) / FADE_MS);
      const e = t * t * (3 - 2 * t); // smoothstep
      return [
        fromRgb[0] + (toRgb[0] - fromRgb[0]) * e,
        fromRgb[1] + (toRgb[1] - fromRgb[1]) * e,
        fromRgb[2] + (toRgb[2] - fromRgb[2]) * e,
      ];
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
