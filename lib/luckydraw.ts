/**
 * Lucky Draw (demo) — weekly prize draw.
 *
 * Entries live in browser localStorage. The "draw" is a demo pick.
 * IMPORTANT: a real public prize draw in India needs legal review
 * (lottery/prize-competition laws, state rules, T&Cs, tax on winnings)
 * before launch. This page carries that disclaimer.
 */

export type DrawEntry = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  enteredAt: string; // ISO
  weekKey: string; // e.g. "2026-W41"
};

export type Winner = {
  name: string;
  masked: string; // masked phone/email for public display
  prize: string;
  week: string;
  claimCode: string;
};

const ENTRIES_KEY = 'sb-draw-entries';
const WINNERS_KEY = 'sb-draw-demo-winners';

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

/** ISO-ish week key, e.g. "2026-W41". */
export function weekKey(d: Date = new Date()): string {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Next draw: Sunday 8:00 PM IST. Returns the real instant. */
export function nextDrawDate(now: Date = new Date()): Date {
  const IST = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + IST);
  const t = new Date(istNow);
  t.setUTCDate(t.getUTCDate() + ((7 - t.getUTCDay()) % 7));
  t.setUTCHours(14, 30, 0, 0); // 20:00 IST == 14:30 UTC
  if (t.getTime() <= istNow.getTime()) t.setUTCDate(t.getUTCDate() + 7);
  return new Date(t.getTime() - IST);
}

export function validateContact(contact: string): {
  ok: boolean;
  type?: 'phone' | 'email';
  value?: string;
  error?: string;
} {
  const v = contact.trim();
  if (/^[6-9]\d{9}$/.test(v)) return { ok: true, type: 'phone', value: v };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
    return { ok: true, type: 'email', value: v.toLowerCase() };
  return {
    ok: false,
    error: 'Please enter a valid 10-digit Indian mobile number or email address.',
  };
}

export function maskContact(e: DrawEntry): string {
  if (e.phone) return `${e.phone.slice(0, 2)}XXXXXX${e.phone.slice(-2)}`;
  if (e.email) {
    const [u, d] = e.email.split('@');
    return `${u.slice(0, 1)}***@${d}`;
  }
  return '***';
}

export function getEntries(): DrawEntry[] {
  try {
    const raw = safeGet(ENTRIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveEntries(list: DrawEntry[]) {
  safeSet(ENTRIES_KEY, JSON.stringify(list));
}

/** Add an entry: one per phone/email per week (demo rule). */
export function addEntry(
  name: string,
  contact: string
): { ok: boolean; entry?: DrawEntry; error?: string } {
  const cleanName = name.trim();
  if (cleanName.length < 2) return { ok: false, error: 'Please enter your name.' };
  const v = validateContact(contact);
  if (!v.ok) return { ok: false, error: v.error };
  const wk = weekKey();
  const list = getEntries();
  const dup = list.some(
    e =>
      e.weekKey === wk &&
      ((v.type === 'phone' && e.phone === v.value) ||
        (v.type === 'email' && e.email === v.value))
  );
  if (dup) return { ok: false, error: 'This number/email already entered this week\u2019s draw.' };
  const entry: DrawEntry = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    name: cleanName,
    phone: v.type === 'phone' ? v.value : undefined,
    email: v.type === 'email' ? v.value : undefined,
    enteredAt: new Date().toISOString(),
    weekKey: wk,
  };
  saveEntries([entry, ...list]);
  return { ok: true, entry };
}

/* ---------- demo draw ---------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic-ish random pick (demo): same week + entries => same winners. */
export function pickWinners(entries: DrawEntry[], count: number, seedStr: string): DrawEntry[] {
  if (!entries.length || count <= 0) return [];
  const rnd = mulberry32(hashStr(seedStr));
  const pool = [...entries];
  const out: DrawEntry[] = [];
  while (out.length < Math.min(count, pool.length)) {
    out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  }
  return out;
}

export function makeClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SB-WIN-${s}`;
}

export const PRIZES = {
  bumper: '₹10,000 SastaBazaar voucher',
  first: 'Smartphone (demo prize)',
  second: '₹2,000 SastaBazaar voucher',
};

/** Seeded demo winners from "past weeks" (clearly demo data). */
export const SEEDED_WINNERS: Winner[] = [
  { name: 'Ramesh K.', masked: '98XXXXXX21', prize: PRIZES.bumper, week: '2026-W40', claimCode: 'SB-WIN-7Q2A' },
  { name: 'Priya S.', masked: '97XXXXXX44', prize: PRIZES.first, week: '2026-W40', claimCode: 'SB-WIN-3M8P' },
  { name: 'Amit V.', masked: '99XXXXXX07', prize: PRIZES.second, week: '2026-W39', claimCode: 'SB-WIN-9T4Z' },
  { name: 'Sunita D.', masked: '96XXXXXX52', prize: PRIZES.bumper, week: '2026-W39', claimCode: 'SB-WIN-2K6W' },
];

export function getDemoWinners(): Winner[] {
  try {
    const raw = safeGet(WINNERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Run the demo draw for the current week.
 * Bumper winner: random pick. Consolation: every 10th entrant wins a budget pick.
 */
export function runDemoDraw(): { ok: boolean; winners?: Winner[]; error?: string } {
  const entries = getEntries().filter(e => e.weekKey === weekKey());
  if (!entries.length) return { ok: false, error: 'No entries yet this week. Add an entry first to test the draw.' };
  const wk = weekKey();
  const winners: Winner[] = [];
  const [bumper] = pickWinners(entries, 1, `bumper-${wk}-${entries.length}`);
  winners.push({
    name: bumper.name,
    masked: maskContact(bumper),
    prize: PRIZES.bumper,
    week: wk,
    claimCode: makeClaimCode(),
  });
  // Consolation: every 10th entrant (10th, 20th, 30th...) wins a budget pick
  entries.forEach((e, i) => {
    if ((i + 1) % 10 === 0) {
      winners.push({
        name: e.name,
        masked: maskContact(e),
        prize: 'Budget Pick prize (under ₹199 product)',
        week: wk,
        claimCode: makeClaimCode(),
      });
    }
  });
  const prev = getDemoWinners().filter(w => w.week !== wk);
  safeSet(WINNERS_KEY, JSON.stringify([...winners, ...prev]));
  return { ok: true, winners };
}
