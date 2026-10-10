'use client';

import type { Product, Section } from './products';
import { PRODUCTS } from './products';

/*
 * SastaBazaar Seller / Dropship Marketplace (DEMO build)
 * -------------------------------------------------------
 * Everything here runs on localStorage so the flow can be tried end-to-end
 * without a backend. For a REAL launch you must replace this with:
 *  - a database (Supabase/Firebase/Postgres) for sellers, KYC docs, orders
 *  - a real SMS gateway (MSG91 / Twilio / Firebase Phone Auth) for OTP
 *  - secure private storage for Aadhaar/selfie KYC documents (NEVER a
 *    public GitHub repo — KYC documents are sensitive personal data)
 *  - a payment gateway (Razorpay etc.) for real money + commission split
 */

/* Commission rule (set by Sandeep, 2026-10-08, two-tier):
 * NEW products: 10% of the new-items subtotal, NEVER exceeding COMMISSION_MAX_PER_ORDER.
 * Whatever 10% would have been above the cap is shown as "discount from
 * SastaBazaar's side". OLD / REFURBISHED / CLEARANCE products: flat Rs 1 per piece.
 * Change the cap in one place below if he says otherwise. */
export const COMMISSION_RATE = 0.10;
export const COMMISSION_MAX_PER_ORDER = 100; // ₹100 max on the 10% portion — adjustable
export const COMMISSION_OLD_FLAT = 1; // ₹1 per piece on old / refurbished / clearance

export type ProductCondition = 'new' | 'refurbished' | 'clearance';

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'New',
  refurbished: 'Old / Refurbished',
  clearance: 'Clearance',
};

/** Legacy helper: treats the whole subtotal as new products. */
export function calcCommission(subtotal: number): { fee: number; sbDiscount: number } {
  const raw = Math.round(subtotal * COMMISSION_RATE);
  const fee = Math.min(raw, COMMISSION_MAX_PER_ORDER);
  return { fee, sbDiscount: raw - fee };
}

/** Two-tier commission: 10% (capped) on new items + Rs 1 per piece on old/refurbished/clearance. */
export function calcCommissionForItems(
  items: { price: number; qty: number; condition?: ProductCondition }[]
): { fee: number; sbDiscount: number; newSubtotal: number; oldUnits: number } {
  const isNew = (i: { condition?: ProductCondition }) => (i.condition ?? 'new') === 'new';
  const newSubtotal = items.filter(isNew).reduce((s, i) => s + i.price * i.qty, 0);
  const oldUnits = items.filter(i => !isNew(i)).reduce((s, i) => s + i.qty, 0);
  const raw = Math.round(newSubtotal * COMMISSION_RATE);
  const feeNew = Math.min(raw, COMMISSION_MAX_PER_ORDER);
  return {
    fee: feeNew + oldUnits * COMMISSION_OLD_FLAT,
    sbDiscount: raw - feeNew,
    newSubtotal,
    oldUnits,
  };
}

export type KycStatus = 'none' | 'pending' | 'verified';

export type Seller = {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: string; // Indian state code, e.g. 'UP'
  kycStatus: KycStatus;
  agreement?: { signedName: string; acceptedAt: string };
  createdAt: string;
  // Express onboarding (2026-10-08): a small shop owner registers in 3 steps
  // (phone -> shop -> sell). KYC + agreement are only required later to unlock
  // payouts — listing products, orders, tracking and alerts work immediately.
  express?: boolean;
  shopName?: string;
  photo?: string; // shop photo data URL (optional)
};

/** Payouts unlock only when KYC is verified AND the agreement is signed.
 *  Existing sellers that completed the old full flow already satisfy this,
 *  so nobody gets locked out by the migration. */
export function payoutsUnlocked(s: Seller): boolean {
  return s.kycStatus === 'verified' && !!s.agreement;
}

/** Verification progress for the dashboard banner: registration counts as
 *  step 1, then KYC, then the agreement. */
export function verificationProgress(s: Seller): {
  done: number; total: number; kyc: boolean; agreement: boolean;
} {
  const kyc = s.kycStatus === 'verified';
  const agreement = !!s.agreement;
  return { done: 1 + (kyc ? 1 : 0) + (agreement ? 1 : 0), total: 3, kyc, agreement };
}

export type KycDoc = {
  sellerId: string;
  fullName: string;
  aadhaarFront: string; // data URL (demo only)
  aadhaarBack: string; // data URL (demo only)
  selfie: string; // data URL (demo only)
  saidNamaskar: boolean;
  spokeName: boolean;
  smiled: boolean;
  status: 'pending' | 'verified';
  submittedAt: string;
};

export type SellerProduct = {
  id: string;
  sellerId: string;
  title: string;
  titleHi?: string; // optional Hindi name, e.g. "मिक्सी" — hides gracefully when absent
  price: number;
  mrp: number;
  categorySlug: string;
  image: string; // first photo (cover)
  images: string[]; // up to 6 photos
  sizes: string[]; // clothing / shoe sizes offered
  description: string; // AI-assisted listing text
  stock: number;
  condition: ProductCondition;
  createdAt: string;
};

export const CLOTH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SHOE_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];

export type OrderItem = {
  productId: string;
  title: string;
  titleHi?: string; // optional Hindi name, carried through from the product at order time
  price: number;
  qty: number;
  image: string;
  sellerId: string;
  sellerName: string;
  condition?: ProductCondition;
};

export type OrderStatus = 'new' | 'shipped' | 'delivered';

export type PaymentMethod = 'upi' | 'phonepe' | 'paypal' | 'card' | 'cod';

export type OrderPayment = {
  method: PaymentMethod;
  upiId?: string; // demo only
  status: 'demo-paid' | 'pending-cod';
};

export type Order = {
  id: string; // SB-XXXXXX
  customer: { name: string; phone: string; address: string };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  platformFee: number; // 10% capped at COMMISSION_MAX_PER_ORDER
  sbDiscount: number; // the part above the cap, given as discount from our side
  total: number;
  payment?: OrderPayment;
  status: OrderStatus;
  trackingId?: string;
  shippedAt?: string;
  createdAt: string;
};

const K = {
  sellers: 'sb-sellers',
  kyc: 'sb-kyc',
  products: 'sb-seller-products',
  orders: 'sb-orders',
  session: 'sb-seller-session',
  otp: 'sb-otp',
  seeded: 'sb-market-seeded',
  promos: 'sb-promo-placements',
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/* ------------------------------ OTP (demo) ------------------------------ */

export function sendOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  write(K.otp, { phone, code, expires: Date.now() + 5 * 60 * 1000 });
  return code; // DEMO: shown on screen. Real launch -> send via SMS gateway.
}

export function verifyOtp(phone: string, code: string): boolean {
  const rec = read<{ phone: string; code: string; expires: number } | null>(K.otp, null);
  if (!rec || rec.phone !== phone) return false;
  if (Date.now() > rec.expires) return false;
  const ok = rec.code === code.trim();
  if (ok) localStorage.removeItem(K.otp);
  return ok;
}

/* -------------------------------- Sellers ------------------------------- */

export function getSellers(): Seller[] {
  return read<Seller[]>(K.sellers, []);
}

export function getSellerByPhone(phone: string): Seller | undefined {
  return getSellers().find(s => s.phone === phone);
}

export function getSellerById(id: string): Seller | undefined {
  return getSellers().find(s => s.id === id);
}

export function saveSeller(s: Seller) {
  const all = getSellers().filter(x => x.id !== s.id);
  write(K.sellers, [...all, s]);
}

export function saveAgreement(sellerId: string, signedName: string) {
  const s = getSellerById(sellerId);
  if (!s) return;
  saveSeller({ ...s, agreement: { signedName, acceptedAt: new Date().toISOString() } });
}

export function getSessionSeller(): Seller | null {
  const id = read<string | null>(K.session, null);
  return id ? getSellerById(id) ?? null : null;
}

export function setSessionSeller(id: string | null) {
  if (id) localStorage.setItem(K.session, JSON.stringify(id));
  else localStorage.removeItem(K.session);
}

/* ---------------------------------- KYC --------------------------------- */

export function getKyc(sellerId: string): KycDoc | undefined {
  return read<KycDoc[]>(K.kyc, []).find(k => k.sellerId === sellerId);
}

export function saveKyc(doc: KycDoc) {
  const all = read<KycDoc[]>(K.kyc, []).filter(k => k.sellerId !== doc.sellerId);
  write(K.kyc, [...all, doc]);
  const seller = getSellerById(doc.sellerId);
  if (seller) saveSeller({ ...seller, kycStatus: doc.status });
}

/* ------------------------------ Seller products -------------------------- */

export function getSellerProducts(): SellerProduct[] {
  return read<SellerProduct[]>(K.products, []);
}

export function getSellerProductsBySeller(sellerId: string): SellerProduct[] {
  return getSellerProducts().filter(p => p.sellerId === sellerId);
}

export function addSellerProduct(p: Omit<SellerProduct, 'id' | 'createdAt'>): SellerProduct {
  const full: SellerProduct = {
    ...p,
    id: uid('sp'),
    createdAt: new Date().toISOString(),
  };
  write(K.products, [...getSellerProducts(), full]);
  return full;
}

export function deleteSellerProduct(id: string) {
  write(K.products, getSellerProducts().filter(p => p.id !== id));
  // also drop any promo placements for the deleted product
  write(K.promos, getPromoPlacements().filter(pl => pl.productId !== id));
}

/* ------------------------- Promo placements -------------------------
 * Sellers place their products into site-wide promos: Lucky Draw prizes,
 * Spin & Win wheel prizes, Refer & Earn rewards, Festival picks.
 * SastaBazaar's job: bring the customers. Commission is earned on sales
 * (see COMMISSION_* above). Everything else is seller-powered. */

export type PromoKind = 'lucky-draw' | 'spin' | 'refer' | 'festival';

export const PROMO_LABELS: Record<PromoKind, { label: string; emoji: string }> = {
  'lucky-draw': { label: 'Lucky Draw', emoji: '🎡' },
  'spin': { label: 'Spin & Win', emoji: '🎯' },
  'refer': { label: 'Refer Reward', emoji: '🎁' },
  'festival': { label: 'Festival Pick', emoji: '🎪' },
};

export type PromoPlacement = {
  productId: string;
  kind: PromoKind;
  createdAt: string;
};

export function getPromoPlacements(): PromoPlacement[] {
  return read<PromoPlacement[]>(K.promos, []);
}

export function hasPromoPlacement(productId: string, kind: PromoKind): boolean {
  return getPromoPlacements().some(pl => pl.productId === productId && pl.kind === kind);
}

export function togglePromoPlacement(productId: string, kind: PromoKind): boolean {
  const all = getPromoPlacements();
  const exists = all.some(pl => pl.productId === productId && pl.kind === kind);
  const next = exists
    ? all.filter(pl => !(pl.productId === productId && pl.kind === kind))
    : [...all, { productId, kind, createdAt: new Date().toISOString() }];
  write(K.promos, next);
  return !exists;
}

/** Seller products placed into a promo, with product data resolved.
 *  Resolves demo (localStorage) products AND real DB products. DB products
 *  carry their placement in the promote_in column (Update 19, cross-device);
 *  demo products still use the localStorage placements. */
export function getPlacedProducts(kind: PromoKind): SellerProduct[] {
  const ids = new Set(getPromoPlacements().filter(pl => pl.kind === kind).map(pl => pl.productId));
  const local = getSellerProducts().filter(p => ids.has(p.id));
  const seen = new Set(local.map(p => p.id));
  const fromDb = PRODUCTS
    .filter(p => !seen.has(p.id) && (ids.has(p.id) || (p.promoteIn ?? []).includes(kind)))
    .map(dbProductToSellerProduct);
  for (const p of fromDb) seen.add(p.id);
  return [...local, ...fromDb];
}

/** Map a catalog/DB product to the seller-product shape for promo shelves. */
function dbProductToSellerProduct(p: Product): SellerProduct {
  const condition: ProductCondition =
    p.section === 'purana' ? 'refurbished' : p.section === 'clearance' ? 'clearance' : 'new';
  return {
    id: p.id, sellerId: 'db', title: p.title, titleHi: p.titleHi,
    price: p.price, mrp: p.mrp, categorySlug: '', image: p.image, images: p.images,
    sizes: [], description: p.description, stock: p.stock, condition,
    createdAt: p.createdAt,
  };
}

/* ----------------- Seller products → main catalog -----------------
 * Lets seller products appear in the Naya / Purana / Clearance bazaars
 * next to the seed catalog, so customers browse ONE shelf with the best
 * deal from many shops. Client-side merge only (localStorage). */

export function sellerProductToCatalog(sp: SellerProduct): Product {
  const section: Section =
    sp.condition === 'clearance' ? 'clearance'
    : sp.condition === 'refurbished' ? 'purana'
    : 'naya';
  const images = sp.images && sp.images.length ? sp.images : [sp.image];
  return {
    id: sp.id,
    slug: sp.id,
    title: sp.title,
    titleHi: sp.titleHi || sp.title,
    section,
    categoryId: sp.categorySlug,
    subcategory: '',
    price: sp.price,
    mrp: sp.mrp,
    discountPercent: sp.mrp > sp.price ? Math.round((1 - sp.price / sp.mrp) * 100) : 0,
    image: sp.image,
    images,
    rating: 4.3,
    seller: sp.sellerId,
    sellerRating: 4.6,
    city: 'India',
    stock: sp.stock,
    dealScore: 60,
    createdAt: sp.createdAt,
    description: sp.description,
    highlights: [],
  };
}

/* --------------------------------- Orders -------------------------------- */

export function getOrders(): Order[] {
  return read<Order[]>(K.orders, []);
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find(o => o.id.toLowerCase() === id.toLowerCase().trim());
}

export function getOrdersForSeller(sellerId: string): Order[] {
  return getOrders().filter(o => o.items.some(i => i.sellerId === sellerId));
}

export function createOrder(
  customer: Order['customer'],
  items: OrderItem[],
  shipping: number,
  payment?: OrderPayment
): Order {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const { fee: platformFee, sbDiscount } = calcCommissionForItems(items);
  const order: Order = {
    id: `SB-${Math.floor(100000 + Math.random() * 900000)}`,
    customer,
    items,
    subtotal,
    shipping,
    platformFee,
    sbDiscount,
    total: subtotal + shipping,
    payment,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  write(K.orders, [order, ...getOrders()]);
  return order;
}

export function markShipped(orderId: string, trackingId: string) {
  const orders = getOrders().map(o =>
    o.id === orderId
      ? { ...o, status: 'shipped' as OrderStatus, trackingId, shippedAt: new Date().toISOString() }
      : o
  );
  write(K.orders, orders);
}

export function sellerStats(sellerId: string) {
  const orders = getOrdersForSeller(sellerId);
  // New-product fee (10% capped per order) is attributed proportionally to this
  // seller's share of the order's new-items subtotal; old/refurbished/clearance
  // fee is exactly Rs 1 per piece.
  const isNew = (i: OrderItem) => (i.condition ?? 'new') === 'new';
  let revenue = 0;
  let fee = 0;
  for (const o of orders) {
    const mine = o.items.filter(i => i.sellerId === sellerId);
    revenue += mine.reduce((s, i) => s + i.price * i.qty, 0);
    const all = calcCommissionForItems(o.items);
    const feeNewTotal = all.fee - all.oldUnits * COMMISSION_OLD_FLAT;
    const mineNewSub = mine.filter(isNew).reduce((s, i) => s + i.price * i.qty, 0);
    fee += all.newSubtotal > 0 ? (feeNewTotal * mineNewSub) / all.newSubtotal : 0;
    fee += mine.filter(i => !isNew(i)).reduce((s, i) => s + i.qty, 0) * COMMISSION_OLD_FLAT;
  }
  fee = Math.round(fee);
  return { orders: orders.length, revenue, fee, payout: revenue - fee, pending: orders.filter(o => o.status === 'new').length };
}

/** Resolve any product id (demo catalog or seller product) for cart/checkout. */
export function getAnyProduct(id: string): {
  id: string; title: string; titleHi?: string; price: number; mrp: number; image: string;
  sellerId: string; sellerName: string; href: string; condition: ProductCondition;
} | undefined {
  const sp = getSellerProducts().find(p => p.id === id);
  if (sp) {
    const seller = getSellerById(sp.sellerId);
    return {
      id: sp.id, title: sp.title, titleHi: sp.titleHi, price: sp.price, mrp: sp.mrp, image: sp.image,
      sellerId: sp.sellerId, sellerName: seller?.name ?? 'Seller',
      href: '/marketplace', condition: sp.condition ?? 'new',
    };
  }
  return undefined;
}

/* ------------------------------- Demo seed ------------------------------- */

export function ensureSeed() {
  if (typeof window === 'undefined' || read(K.seeded, false)) return;
  const seller: Seller = {
    id: 'seller-demo-1',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    phone: '+919876543210',
    state: 'UP',
    kycStatus: 'verified',
    agreement: { signedName: 'Ravi Kumar', acceptedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
  };
  write(K.sellers, [seller]);
  write(K.products, [
    {
      id: 'sp-demo-1',
      sellerId: seller.id,
      title: 'Handloom Cotton Kurta — Festival Special',
      price: 499,
      mrp: 999,
      categorySlug: 'fashion-men',
      image: '/images/fashion-men-1.jpg',
      images: ['/images/fashion-men-1.jpg'],
      sizes: ['M', 'L', 'XL'],
      description: 'Handloom Cotton Kurta - Festival Special. Premium handloom cotton, comfortable festive fit.',
      stock: 25,
      condition: 'new',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sp-demo-2',
      sellerId: seller.id,
      title: 'Brass Diya Set of 6 — Diwali Gift Pack',
      price: 299,
      mrp: 599,
      categorySlug: 'handicraft',
      image: '/images/handicraft-1.webp',
      images: ['/images/handicraft-1.webp'],
      sizes: [],
      description: 'Brass Diya Set of 6 - perfect Diwali gift pack.',
      stock: 40,
      condition: 'new',
      createdAt: new Date().toISOString(),
    },
  ] as SellerProduct[]);
  const items: OrderItem[] = [
    {
      productId: 'sp-demo-1',
      title: 'Handloom Cotton Kurta — Festival Special',
      price: 499,
      qty: 2,
      image: '/images/fashion-men-1.jpg',
      sellerId: seller.id,
      sellerName: seller.name,
      condition: 'new',
    },
  ];
  const { fee, sbDiscount } = calcCommissionForItems(items);
  write(K.orders, [
    {
      id: 'SB-482913',
      customer: { name: 'Priya Sharma', phone: '+919123456789', address: '42, MG Road, Bengaluru, Karnataka 560001' },
      items,
      subtotal: 998,
      shipping: 0,
      platformFee: fee,
      sbDiscount,
      total: 998,
      status: 'new',
      createdAt: new Date().toISOString(),
    } as Order,
  ]);
  write(K.seeded, true);
}
