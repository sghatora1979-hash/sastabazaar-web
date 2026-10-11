'use client';
/**
 * TouchGlow — Update 20 (2026-10-10).
 * A soft ambient glow that follows the finger/pointer across the screen,
 * rendered BEHIND all page content (z-0), pointer-events none.
 * Adds the "advanced finger-move screen interaction" feel requested for Update 20:
 * the whole page subtly responds as the finger moves.
 * Purely decorative; disabled when animations are off / reduced motion /
 * lightweight mode. Never touches app logic.
 */
import { useEffect, useRef } from 'react';
import { animationsOff } from '@/lib/display';

const GLOW_SIZE = 320; // px diameter of the radial glow

export function TouchGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animationsOff()) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let tx = -9999; // target (pointer)
    let ty = -9999;
    let cx = -9999; // current (eased)
    let cy = -9999;
    let visible = false;

    const onPointerMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        cx = tx;
        cy = ty;
        visible = true;
      }
    };
    const onPointerLeave = () => {
      visible = false;
      tx = -9999;
      ty = -9999;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      // ease the glow toward the pointer for a smooth trailing feel
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      if (!visible) {
        el.style.opacity = '0';
        return;
      }
      el.style.opacity = '1';
      el.style.transform = `translate(${cx - GLOW_SIZE / 2}px, ${cy - GLOW_SIZE / 2}px)`;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 opacity-0 transition-opacity duration-300"
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        background:
          'radial-gradient(circle, rgba(255, 213, 74, 0.10) 0%, rgba(255, 213, 74, 0.045) 40%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  );
}
