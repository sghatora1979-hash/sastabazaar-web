'use client';
import { useEffect } from 'react';

/** Registers the PWA service worker (Update 21). Safe no-op when unsupported. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Don't fight dev hot-reload.
    if (window.location.hostname === 'localhost') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
