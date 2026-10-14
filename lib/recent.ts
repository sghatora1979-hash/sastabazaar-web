'use client';
/** Recently-viewed products — demo browser storage. */
import { PRODUCTS, Product } from './products';

export const RECENT_KEY = 'sb_recently_viewed_v1';

export function recordView(productId: string): void {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    const next = [productId, ...ids.filter(id => id !== productId)].slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentlyViewed(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return ids
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 8) as Product[];
  } catch {
    return [];
  }
}
