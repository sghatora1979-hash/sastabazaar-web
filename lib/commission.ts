// SastaBazaar commission engine — TWO-TIER (set by Sandeep, 2026-10-08).
// Pure functions, no client deps, paise-based (₹1 = 100 paise).
//
//   NEW products:            10% of line total, NEVER more than ₹100 (10000 paise)
//   OLD / REFURBISHED / CLEARANCE: flat ₹1 (100 paise) per piece
//
// Sanity checks (do the math by hand):
//   new, ₹500.00  (50000p) -> 10% = 5000p  = ₹50   commission, ₹450 payout
//   new, ₹2000.00 (200000p)-> 10% = 20000p -> capped 10000p = ₹100 commission, ₹1900 payout
//   old, qty 3, ₹300 (30000p) -> 3 × 100p = 300p = ₹3 commission, ₹297 payout

export type CommissionItemType = 'new' | 'old' | 'refurbished' | 'clearance';

export const COMMISSION_NEW_RATE = 0.10;
export const COMMISSION_NEW_CAP_PAISE = 10000; // ₹100 max on the 10% portion
export const COMMISSION_OLD_FLAT_PAISE = 100; // ₹1 per piece

/** Map a products.section value to the commission item type.
 *  Sections: 'naya' | 'purana' | 'clearance' | 'local'.
 *  'local' (local bazaar) is treated as NEW — change here if Sandeep says otherwise. */
export function sectionToItemType(section: string): CommissionItemType {
  switch ((section || '').toLowerCase()) {
    case 'purana':
      return 'old';
    case 'clearance':
      return 'clearance';
    case 'naya':
    case 'local':
    default:
      return 'new';
  }
}

export type CommissionResult = {
  commissionPaise: number;
  sellerPayoutPaise: number;
};

/** Commission for one seller's line group: totalPaise is the group's item
 *  total (price × qty summed), qty is total pieces (only used for flat tiers). */
export function calcCommission(
  itemType: CommissionItemType,
  totalPaise: number,
  qty = 1,
): CommissionResult {
  const total = Math.max(0, Math.round(totalPaise));
  let commissionPaise: number;
  if (itemType === 'new') {
    commissionPaise = Math.min(
      Math.round(total * COMMISSION_NEW_RATE),
      COMMISSION_NEW_CAP_PAISE,
    );
  } else {
    commissionPaise = COMMISSION_OLD_FLAT_PAISE * Math.max(1, Math.floor(qty));
  }
  return {
    commissionPaise,
    sellerPayoutPaise: Math.max(0, total - commissionPaise),
  };
}

/** ₹ formatting for paise values. */
export function formatPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ===== Category-wise commission (India marketplace reality, 2026) =====
 * Sandeep's rule (2026-10-12): flat 10% kills thin-margin sellers.
 * Example: ₹10 Pepsi, seller margin 25-50 paise (2.5-5%) — a 10% (₹1)
 * commission eats the seller's ENTIRE profit. So rates follow the
 * category's real margin, like Amazon India / Flipkart do (5-25% by
 * category). Rates are the PLATFORM's share of the selling price —
 * always inside MRP, never on top of it (Legal Metrology Act, 2009:
 * no one may sell above MRP).
 *
 * Tiers: 'new' uses the category rate (capped at ₹100/order);
 * 'old'/'refurbished'/'clearance' stay flat ₹1/piece (Sandeep's rule).
 */
export const CATEGORY_RATES: Record<string, number> = {
  grocery: 0.03,      // FMCG, food, beverages — thin margins (2-5%)
  fmcg: 0.03,
  medicines: 0.04,    // pharmacy — regulated thin margins
  electronics: 0.06,  // mobiles, laptops, gadgets
  home: 0.08,         // home & kitchen
  beauty: 0.08,       // personal care, cosmetics
  fashion: 0.12,      // apparel, footwear — healthy margins
  toys: 0.08,
  sports: 0.08,
  books: 0.05,
  default: 0.08,
};

/** Look up the commission rate for a product category (case-insensitive).
 *  Unknown categories fall back to `default`. */
export function getCategoryRate(category: string): number {
  const key = (category || '').toLowerCase().trim();
  return CATEGORY_RATES[key] ?? CATEGORY_RATES.default;
}

/** Category-aware commission. Same as calcCommission but uses the
 *  category's rate for 'new' items instead of the flat 10%.
 *  The ₹100/order cap still applies to the percentage portion. */
export function calcCategoryCommission(
  itemType: CommissionItemType,
  totalPaise: number,
  qty = 1,
  category = 'default',
): CommissionResult {
  const total = Math.max(0, Math.round(totalPaise));
  let commissionPaise: number;
  if (itemType === 'new') {
    const rate = getCategoryRate(category);
    commissionPaise = Math.min(
      Math.round(total * rate),
      COMMISSION_NEW_CAP_PAISE,
    );
  } else {
    commissionPaise = COMMISSION_OLD_FLAT_PAISE * Math.max(1, Math.floor(qty));
  }
  return {
    commissionPaise,
    sellerPayoutPaise: Math.max(0, total - commissionPaise),
  };
}

/* ===== MRP guardrail — Legal Metrology Act, 2009 =====
 * MRP (Maximum Retail Price) is set by the manufacturer and INCLUDES all
 * taxes. NO ONE in the chain — manufacturer, wholesaler, retailer,
 * e-commerce seller OR marketplace — may sell above MRP.
 * Penalty: fine up to ₹25,000 (1st), ₹50,000 (2nd), then up to 1 yr
 * imprisonment + ₹1,00,000 fine. Selling BELOW MRP (discounts) is legal.
 * Returns false when mrp is missing/zero (cannot verify — treat as block).
 */
export function isPriceLegal(pricePaise: number, mrpPaise: number): boolean {
  if (!mrpPaise || mrpPaise <= 0) return false;
  return pricePaise <= mrpPaise;
}

export const PROMO_FEATURES = [
  { key: 'discount', label: 'Discount & Sale', labelHi: 'छूट और सेल' },
  { key: 'rewards', label: 'Rewards & Refer & Earn', labelHi: 'रिवॉर्ड और रेफर' },
  { key: 'lucky_draw', label: 'Lucky Draw', labelHi: 'लकी ड्रॉ' },
  { key: 'spin_win', label: 'Spin & Win', labelHi: 'स्पिन और जीतो' },
] as const;

export type PromoFeatureKey = (typeof PROMO_FEATURES)[number]['key'];

/** Map a product category SLUG (e.g. 'fashion-men', 'mobiles') to a
 *  fee-schedule key in CATEGORY_RATES. Unknown slugs → 'default'. */
export function slugToRateKey(slug: string): string {
  const s = (slug || '').toLowerCase();
  if (s.includes('grocery') || s.includes('fmcg') || s.includes('food')) return 'grocery';
  if (s.includes('medicine') || s.includes('pharma')) return 'medicines';
  if (s.includes('mobile') || s.includes('electronic') || s.includes('appliance') || s.includes('gadget')) return 'electronics';
  if (s.includes('fashion') || s.includes('footwear') || s.includes('jewellery') || s.includes('jewelry') || s.includes('bag') || s.includes('apparel') || s.includes('clothing')) return 'fashion';
  if (s.includes('beauty') || s.includes('cosmetic') || s.includes('personal')) return 'beauty';
  if (s.includes('home') || s.includes('kitchen') || s.includes('furniture')) return 'home';
  if (s.includes('toy') || s.includes('baby')) return 'toys';
  if (s.includes('sport') || s.includes('fitness') || s.includes('gym')) return 'sports';
  if (s.includes('book')) return 'books';
  return 'default';
}

/* ===== DB-backed fee schedules (PRICING ENGINE v2) =====
 * getRateBps: async — reads sb_fee_schedules, falls back to code defaults.
 * getRateBpsSync: sync code-only fallback (no DB needed).
 * Rates are basis points: 800 = 8%.
 */
export function getRateBpsSync(category: string): number {
  return Math.round(getCategoryRate(category) * 10000);
}

export async function getRateBps(
  getSupabase: () => { from: (t: string) => any } | null,
  category: string,
): Promise<number> {
  try {
    const sb = getSupabase();
    if (!sb) return getRateBpsSync(category);
    const key = (category || '').toLowerCase().trim() || 'default';
    const { data } = await sb.from('sb_fee_schedules').select('rate_bps').eq('category', key).maybeSingle();
    if (data && typeof data.rate_bps === 'number') return data.rate_bps;
    if (key !== 'default') {
      const d2 = await sb.from('sb_fee_schedules').select('rate_bps').eq('category', 'default').maybeSingle();
      if (d2.data && typeof d2.data.rate_bps === 'number') return d2.data.rate_bps;
    }
  } catch {
    /* fall through to code default */
  }
  return getRateBpsSync(category);
}
