/**
 * Refer & Earn (demo) — Temu-style referral rewards.
 *
 * All data lives in browser localStorage. There is NO real SMS/email
 * backend: sharing uses wa.me / sms: / mailto: / t.me share intents,
 * which open the user's own apps. Real referral tracking, fraud
 * prevention and credit settlement need a server at launch.
 */

export const REWARD_JOIN = 50; // ₹ credit when a referred friend joins
export const REWARD_FIRST_PURCHASE = 100; // ₹ extra on their first purchase

const CODE_KEY = 'sb-ref-code';
const LIST_KEY = 'sb-referrals';
const REFERRER_KEY = 'sb-referrer';

export type Referral = {
  code: string; // referral code used (mine)
  friendLabel: string; // what the friend is called in the demo list
  joinedAt: string; // ISO
  firstPurchase: boolean;
  firstPurchaseAt?: string;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  // crypto may be unavailable in some contexts; fall back to Math.random
  const rnd: () => number =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? () => {
          const a = new Uint32Array(1);
          crypto.getRandomValues(a);
          return a[0] / 4294967296;
        }
      : Math.random;
  for (let i = 0; i < 6; i++) s += chars[Math.floor(rnd() * chars.length)];
  return `SB-${s}`;
}

/** My unique referral code (generated once per browser). */
export function getMyCode(): string {
  let code = safeGet(CODE_KEY);
  if (!code) {
    code = randomCode();
    safeSet(CODE_KEY, code);
  }
  return code;
}

/** Full shareable referral link. */
export function getMyReferralLink(): string {
  return `https://sastabazaar-web-five.vercel.app/?ref=${encodeURIComponent(getMyCode())}`;
}

/** Record the referrer code from a ?ref= link (called on homepage load). */
export function captureReferrer(code: string) {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) return;
  if (clean === getMyCode()) return; // can't refer yourself
  if (!safeGet(REFERRER_KEY)) safeSet(REFERRER_KEY, clean);
}

/** The referrer code stored from a ?ref= visit, if any. */
export function getReferrer(): string | null {
  return safeGet(REFERRER_KEY);
}

export function getReferrals(): Referral[] {
  try {
    const raw = safeGet(LIST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveReferrals(list: Referral[]) {
  safeSet(LIST_KEY, JSON.stringify(list));
}

/**
 * Demo helper: simulate a friend joining through my link.
 * In production this happens automatically when the friend registers.
 */
export function addReferral(friendLabel?: string): Referral {
  const list = getReferrals();
  const n = list.length + 1;
  const r: Referral = {
    code: getMyCode(),
    friendLabel: friendLabel?.trim() || `Friend ${n}`,
    joinedAt: new Date().toISOString(),
    firstPurchase: false,
  };
  saveReferrals([r, ...list]);
  return r;
}

/** Demo helper: mark a referral's first purchase as done. */
export function simulateFriendPurchase(joinedAt: string): Referral[] {
  const list = getReferrals().map(r =>
    r.joinedAt === joinedAt && !r.firstPurchase
      ? { ...r, firstPurchase: true, firstPurchaseAt: new Date().toISOString() }
      : r
  );
  saveReferrals(list);
  return list;
}

export function getEarnings(): { joins: number; purchases: number; total: number } {
  const list = getReferrals();
  const joins = list.length;
  const purchases = list.filter(r => r.firstPurchase).length;
  return {
    joins,
    purchases,
    total: joins * REWARD_JOIN + purchases * REWARD_FIRST_PURCHASE,
  };
}

/** Share-intent URLs (open the user's own apps — work for real, no backend). */
export function shareLinks(link: string) {
  const text = `Shop India's cheapest bazaar with me! Join SastaBazaar with my link and we BOTH earn rewards: ${link}`;
  const e = encodeURIComponent;
  return {
    whatsapp: `https://wa.me/?text=${e(text)}`,
    sms: `sms:?body=${e(text)}`,
    email: `mailto:?subject=${e('Join me on SastaBazaar — earn rewards')}&body=${e(text)}`,
    telegram: `https://t.me/share/url?url=${e(link)}&text=${e("Join SastaBazaar with my link and we BOTH earn rewards!")}`,
  };
}
