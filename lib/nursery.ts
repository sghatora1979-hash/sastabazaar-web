/**
 * Local Nursery — demo plant listings.
 * Nursery onboarding is demo-only (browser storage). Real launch needs
 * backend + verification (see /roadmap).
 */
import { getShopById } from './local-shops';

export type NurseryProduct = {
  id: string;
  name: string;
  nameHi: string;
  kind: 'Flower plant' | 'Fruit plant' | 'Vegetable seedling' | 'Indoor plant' | 'Outdoor plant' | 'Pot' | 'Seed' | 'Compost' | 'Gardening supply';
  price: number;
  mrp: number;
  image: string;
  stock: number;
  nurseryId: string;
  nurseryName: string;
  nurseryNameHi: string;
  city: string;
  pin: string;
  phone: string;
  whatsapp?: string;
};

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

const KIND_HI: Record<NurseryProduct['kind'], string> = {
  'Flower plant': 'फूलों के पौधे',
  'Fruit plant': 'फलों के पौधे',
  'Vegetable seedling': 'सब्ज़ी के पौधे',
  'Indoor plant': 'इनडोर पौधे',
  'Outdoor plant': 'आउटडोर पौधे',
  Pot: 'गमले',
  Seed: 'बीज',
  Compost: 'खाद',
  'Gardening supply': 'बागवानी सामान',
};

export function kindHi(kind: NurseryProduct['kind']): string {
  return KIND_HI[kind];
}

export const NURSERY_KINDS = Object.keys(KIND_HI) as NurseryProduct['kind'][];

export const DEMO_NURSERY: NurseryProduct[] = [
  { id: 'np1', name: 'Rose Plant — Red (Potted)', nameHi: 'गुलाब का पौधा (लाल)', kind: 'Flower plant', price: 149, mrp: 199, image: IMG('sb-n-rose'), stock: 50, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np2', name: 'Marigold Seedlings (Pack of 10)', nameHi: 'गेंदे के पौधे (10 का पैक)', kind: 'Flower plant', price: 99, mrp: 149, image: IMG('sb-n-marigold'), stock: 100, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np3', name: 'Mango Sapling — Dasheri', nameHi: 'आम का पौधा (दशहरी)', kind: 'Fruit plant', price: 249, mrp: 349, image: IMG('sb-n-mango'), stock: 30, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np4', name: 'Lemon Plant (Grafted)', nameHi: 'नींबू का पौधा', kind: 'Fruit plant', price: 199, mrp: 279, image: IMG('sb-n-lemon'), stock: 40, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np5', name: 'Tomato Seedlings (Pack of 12)', nameHi: 'टमाटर के पौधे (12 का पैक)', kind: 'Vegetable seedling', price: 79, mrp: 120, image: IMG('sb-n-tomato'), stock: 120, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np6', name: 'Money Plant in Ceramic Pot', nameHi: 'मनी प्लांट (सिरेमिक गमले में)', kind: 'Indoor plant', price: 199, mrp: 299, image: IMG('sb-n-moneyplant'), stock: 45, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np7', name: 'Snake Plant (Air Purifier)', nameHi: 'स्नेक प्लांट', kind: 'Indoor plant', price: 249, mrp: 349, image: IMG('sb-n-snake'), stock: 35, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np8', name: 'Hibiscus Plant (Outdoor)', nameHi: 'गुड़हल का पौधा', kind: 'Outdoor plant', price: 179, mrp: 249, image: IMG('sb-n-hibiscus'), stock: 28, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np9', name: 'Terracotta Pots — Set of 4', nameHi: 'मिट्टी के गमले (4 का सेट)', kind: 'Pot', price: 299, mrp: 449, image: IMG('sb-n-pots'), stock: 60, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np10', name: 'Organic Compost 5kg', nameHi: 'जैविक खाद 5 किलो', kind: 'Compost', price: 179, mrp: 229, image: IMG('sb-n-compost'), stock: 80, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np11', name: 'Neem Oil Spray 500ml', nameHi: 'नीम तेल स्प्रे', kind: 'Gardening supply', price: 229, mrp: 299, image: IMG('sb-n-neem'), stock: 55, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
  { id: 'np12', name: 'Tulsi Plant (Holy Basil)', nameHi: 'तुलसी का पौधा', kind: 'Outdoor plant', price: 89, mrp: 129, image: IMG('sb-n-tulsi'), stock: 90, nurseryId: 'greenleaf-nursery', nurseryName: 'GreenLeaf Nursery', nurseryNameHi: 'ग्रीनलीफ नर्सरी', city: 'Dehradun', pin: '248001', phone: '+91 97600 44556', whatsapp: '+91 97600 44556' },
];

export function searchNursery(query: string, kind?: string): NurseryProduct[] {
  const q = query.toLowerCase().trim();
  return DEMO_NURSERY.filter(p => {
    if (kind && p.kind !== kind) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.nameHi.includes(query.trim()) ||
      p.kind.toLowerCase().includes(q) ||
      kindHi(p.kind).includes(query.trim()) ||
      p.city.toLowerCase().includes(q) ||
      p.pin.includes(q)
    );
  });
}

/** User-registered nursery listings (demo browser storage). */
const LS_KEY = 'sb_nursery_listings_v1';

export function getUserNurseryListings(): NurseryProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNurseryListing(p: NurseryProduct): void {
  if (typeof window === 'undefined') return;
  const existing = getUserNurseryListings();
  localStorage.setItem(LS_KEY, JSON.stringify([p, ...existing]));
}

export function getNurseryById(id: string) {
  return getShopById(id);
}
