// AI Marketplace Manager — festival window + category affinity (Update 24).
// Reads the EXISTING 21-festival dataset (lib/festivals.ts) and exposes the
// festivals falling inside the AI analysis window (default 45 days).
import {
  FESTIVALS, festivalDate, type Festival,
} from '../festivals';

export type UpcomingFestival = Festival & { date: Date; daysAway: number };

/** Festivals occurring within the next `windowDays` days (default 45). */
export function getFestivalsInWindow(windowDays = 45, from: Date = new Date()): UpcomingFestival[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(start.getTime() + windowDays * 86400000);
  return FESTIVALS
    .map((f) => {
      const date = festivalDate(f, start);
      const daysAway = Math.round((date.getTime() - start.getTime()) / 86400000);
      return { ...f, date, daysAway };
    })
    .filter((f) => f.date >= start && f.date <= end)
    .sort((a, b) => a.daysAway - b.daysAway);
}

/**
 * Category affinity: which product categories suit which festival/season.
 * Keys are festival ids from lib/festivals.ts; values are category slugs.
 * This is a curated heuristic — sellers always confirm before anything goes live.
 */
export const FESTIVAL_CATEGORY_AFFINITY: Record<string, string[]> = {
  diwali: ['electronics', 'appliances', 'jewellery', 'fashion-women', 'fashion-men', 'home', 'footwear', 'beauty', 'toys'],
  'lakshmi-puja': ['jewellery', 'electronics', 'appliances', 'home'],
  dhanteras: ['jewellery', 'electronics', 'appliances', 'home'],
  holi: ['fashion-women', 'fashion-men', 'beauty', 'grocery', 'toys'],
  christmas: ['toys', 'electronics', 'fashion-women', 'fashion-men', 'beauty', 'home'],
  'durga-puja': ['fashion-women', 'fashion-men', 'footwear', 'jewellery'],
  navratri: ['fashion-women', 'fashion-men', 'footwear', 'beauty'],
  dussehra: ['electronics', 'appliances', 'fashion-men', 'fashion-women', 'automotive'],
  eid_fitr: ['fashion-women', 'fashion-men', 'beauty', 'grocery'],
  'eid-fitr': ['fashion-women', 'fashion-men', 'beauty', 'grocery'],
  rakhi: ['fashion-women', 'jewellery', 'beauty', 'toys', 'grocery'],
  karva: ['fashion-women', 'jewellery', 'beauty'],
  onam: ['fashion-women', 'fashion-men', 'grocery', 'home'],
  pongal: ['grocery', 'home', 'fashion-women', 'fashion-men'],
  sankranti: ['fashion-women', 'fashion-men', 'grocery', 'sports'],
  baisakhi: ['fashion-women', 'fashion-men', 'grocery'],
  ganesh: ['home', 'furniture', 'electronics'],
  independence: ['fashion-men', 'fashion-women', 'electronics', 'sports'],
  republic: ['fashion-men', 'fashion-women', 'electronics', 'sports'],
  gurpurab: ['fashion-women', 'fashion-men', 'grocery'],
  chhath: ['grocery', 'home', 'fashion-women'],
  gandhi: ['books', 'office', 'handicraft'],
  'buddha-purnima': ['books', 'home', 'handicraft'],
  puthandu: ['fashion-women', 'fashion-men', 'grocery'],
  ugadi: ['fashion-women', 'fashion-men', 'home'],
};

const SEASON_AFFINITY: Record<string, string[]> = {
  summer: ['appliances', 'fashion-women', 'fashion-men', 'footwear', 'beauty', 'sports'],
  winter: ['fashion-women', 'fashion-men', 'footwear', 'appliances', 'home'],
  monsoon: ['footwear', 'appliances', 'home', 'automotive'],
  rainy: ['footwear', 'appliances', 'home', 'automotive'],
  autumn: ['fashion-women', 'fashion-men', 'home'],
  spring: ['fashion-women', 'beauty', 'sports', 'nursery'],
};

/** Category slugs relevant for a festival id + optional season tags. */
export function affinityFor(festivalId: string, seasonTags: string[] = []): string[] {
  const out = new Set<string>(FESTIVAL_CATEGORY_AFFINITY[festivalId] ?? []);
  for (const s of seasonTags) {
    for (const c of SEASON_AFFINITY[s.toLowerCase()] ?? []) out.add(c);
  }
  return [...out];
}
