'use client';

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
};

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
  id: string; title: string; price: number; mrp: number; image: string;
  sellerId: string; sellerName: string; href: string; condition: ProductCondition;
} | undefined {
  const sp = getSellerProducts().find(p => p.id === id);
  if (sp) {
    const seller = getSellerById(sp.sellerId);
    return {
      id: sp.id, title: sp.title, price: sp.price, mrp: sp.mrp, image: sp.image,
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
