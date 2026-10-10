'use client';
/**
 * MatrixBackdrop — Update 18.
 * A fixed, full-website matrix rain rendered BEHIND all page content.
 * Falling glyphs from many Indian scripts, very faint so text stays readable.
 * The rain colour rotates through a palette every 5 minutes.
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

// Palette the rain colour rotates through every 5 minutes.
const PALETTE = ['#16a34a', '#d4a017', '#2563eb', '#9333ea', '#0891b2', '#ea580c', '#db2777'];
const ROTATE_MS = 5 * 60 * 1000;
const FADE_MS = 3000; // smooth blend between colours

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
      const dpr = Math.min(2, window.devicePixelRatio || 1);
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

      // rotate colour every 5 minutes, blending smoothly
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
          // faint overall so page text stays readable; head slightly brighter
          const alpha = head ? 0.28 : 0.16 * (1 - i / c.len);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
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
