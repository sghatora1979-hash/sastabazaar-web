'use client';
import { useEffect } from 'react';
import { captureReferrer } from '@/lib/referral';

/**
 * Captures ?ref=CODE from the URL into localStorage on homepage load.
 * Renders nothing. Reads window.location directly so no Suspense
 * boundary is needed.
 */
export function RefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) captureReferrer(ref);
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
