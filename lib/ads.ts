/**
 * SastaBazaar Paid Advertisement system (CIM track: advertising).
 *
 * HOW PAID ADS WORK (owner's model):
 * 1. Advertiser contacts customer care (/contact) or WhatsApp with their ad.
 * 2. The ADVERTISER supplies the full creative/script (brand, tagline,
 *    colors, link). SastaBazaar only places it — we never invent ad content.
 * 3. The site team adds it to PAID_ADS below. (Future: admin panel.)
 * 4. Slots are sold by duration: 15 / 20 / 30 seconds per ad, max 1 minute.
 *    Capacity per 24 hours = 86400 / durationSec (see slotsPerDay).
 *
 * HONESTY RULES:
 * - SAMPLE_ADS are PLACEHOLDERS, always rendered with a visible "SAMPLE"
 *   badge. They are NOT real endorsements by those brands.
 * - Paid ads render WITHOUT the sample badge.
 * - No payment checkout exists yet (payments go live only after the
 *   business registration) — booking is inquiry-based via customer care.
 */

export type AdCreative = {
  id: string;
  brand: string; // display name, e.g. "Pepsi"
  tagline: string; // one-line message
  category: string; // e.g. "Beverages"
  bg: string; // CSS background for the creative
  accent: string; // accent color for text/CTA
  link?: string; // click-through URL (optional)
  sample: boolean; // true = placeholder, NOT a real paid ad
  durationSec: 15 | 20 | 30; // slot length
};

/** Placeholder creatives shown until real paid ads arrive. */
export const SAMPLE_ADS: AdCreative[] = [
  {
    id: 'sample-cocacola',
    brand: 'Coca-Cola',
    tagline: 'Thanda matlab Coca-Cola',
    category: 'Beverages',
    bg: 'linear-gradient(120deg,#a40000,#f40009)',
    accent: '#ffffff',
    sample: true,
    durationSec: 30,
  },
  {
    id: 'sample-pepsi',
    brand: 'Pepsi',
    tagline: 'Taste the chill — har sip mein masti',
    category: 'Beverages',
    bg: 'linear-gradient(120deg,#004b93,#00a3e0)',
    accent: '#ffffff',
    sample: true,
    durationSec: 30,
  },
  {
    id: 'sample-volvo',
    brand: 'Volvo',
    tagline: 'Safety first — drive the future',
    category: 'Automobiles',
    bg: 'linear-gradient(120deg,#0f2027,#2c5364)',
    accent: '#ffd23f',
    sample: true,
    durationSec: 30,
  },
  {
    id: 'sample-maruti',
    brand: 'Maruti Suzuki',
    tagline: 'India ki apni gaadi',
    category: 'Automobiles',
    bg: 'linear-gradient(120deg,#1a2a6c,#b21f1f)',
    accent: '#ffffff',
    sample: true,
    durationSec: 20,
  },
  {
    id: 'sample-bikes',
    brand: 'Speed Bikes',
    tagline: 'Nayi bike, naye safar — exchange mela',
    category: 'Two-wheelers',
    bg: 'linear-gradient(120deg,#232526,#414345)',
    accent: '#ff9f1c',
    sample: true,
    durationSec: 20,
  },
  {
    id: 'sample-holidays',
    brand: 'Dream Holidays',
    tagline: 'Goa • Manali • Kerala — packages from ₹9,999',
    category: 'Travel',
    bg: 'linear-gradient(120deg,#11998e,#38ef7d)',
    accent: '#ffffff',
    sample: true,
    durationSec: 30,
  },
  {
    id: 'sample-honeymoon',
    brand: 'Honeymoon Escapes',
    tagline: 'Maldives & Bali honeymoon specials',
    category: 'Tourism',
    bg: 'linear-gradient(120deg,#fc466b,#3f5efb)',
    accent: '#ffffff',
    sample: true,
    durationSec: 30,
  },
];

/**
 * REAL paid ads. Empty until advertisers book space.
 * The site team appends entries here from advertiser-supplied creative.
 */
export const PAID_ADS: AdCreative[] = [
  // Example (do NOT invent real advertisers):
  // {
  //   id: 'paid-001',
  //   brand: 'Advertiser Name',
  //   tagline: 'Their approved message',
  //   category: 'Hotels',
  //   bg: 'linear-gradient(120deg,#000000,#333333)',
  //   accent: '#ffffff',
  //   link: 'https://advertiser.example',
  //   sample: false,
  //   durationSec: 30,
  // },
];

/** Ads actually shown: paid first, then samples fill the remaining rotation. */
export function activeAds(): AdCreative[] {
  return [...PAID_ADS, ...SAMPLE_ADS];
}

/** Seconds in a day. */
export const SECONDS_PER_DAY = 86400;

/** Max ad slots per 24 hours for a given ad duration. */
export function slotsPerDay(durationSec: 15 | 20 | 30): number {
  return Math.floor(SECONDS_PER_DAY / durationSec);
}

/** Slot menu shown on the "Paid Space" panel. */
export const SLOT_MENU: { durationSec: 15 | 20 | 30; label: string }[] = [
  { durationSec: 15, label: '15 sec' },
  { durationSec: 20, label: '20 sec' },
  { durationSec: 30, label: '30 sec' },
];

/** Ad categories accepted from all over India. */
export const AD_CATEGORIES: string[] = [
  'Hotels',
  'Shipping',
  'Transport',
  'Railways',
  'Holidays & Tourism',
  'Automobiles & Bikes',
  'Beverages & FMCG',
  'Voting & Election',
  'Public & Government',
];
