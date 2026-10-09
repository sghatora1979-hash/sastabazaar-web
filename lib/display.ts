'use client';
/**
 * Display settings: reduced motion + lightweight mode.
 * Stored in localStorage; defaults respect prefers-reduced-motion.
 * Animations (Matrix rain, particles, parallax) must check these flags
 * and render nothing heavy when disabled.
 */
import { useEffect, useState, useCallback } from 'react';

const LS_REDUCED = 'sb_reduced_motion';
const LS_LIGHT = 'sb_lightweight_mode';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const v = localStorage.getItem(LS_REDUCED);
  if (v === null) return prefersReducedMotion();
  return v === '1';
}

export function getLightweightMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_LIGHT) === '1';
}

export function useDisplaySettings() {
  const [reduced, setReduced] = useState(false);
  const [lightweight, setLightweight] = useState(false);

  useEffect(() => {
    setReduced(getReducedMotion());
    setLightweight(getLightweightMode());
    document.documentElement.classList.toggle('sb-reduced-motion', getReducedMotion());
    document.documentElement.classList.toggle('sb-lightweight', getLightweightMode());
  }, []);

  const toggleReduced = useCallback(() => {
    setReduced(prev => {
      const next = !prev;
      localStorage.setItem(LS_REDUCED, next ? '1' : '0');
      document.documentElement.classList.toggle('sb-reduced-motion', next);
      return next;
    });
  }, []);

  const toggleLightweight = useCallback(() => {
    setLightweight(prev => {
      const next = !prev;
      localStorage.setItem(LS_LIGHT, next ? '1' : '0');
      document.documentElement.classList.toggle('sb-lightweight', next);
      return next;
    });
  }, []);

  return { reduced, lightweight, toggleReduced, toggleLightweight };
}

/** True when heavy decorative animation should be skipped. */
export function animationsOff(): boolean {
  return getReducedMotion() || getLightweightMode();
}
