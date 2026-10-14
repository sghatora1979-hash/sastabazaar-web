// SastaBazaar margin calculator — PRICING ENGINE v2 (2026-10-12).
// Transparent 4-way accounting per sale: seller profit, customer price,
// shipping, platform fee. Pure functions, paise-based (₹1 = 100 paise).
//
//   netProfit = price - cost - shipping - platformFee - paymentFee
//   marginPct = netProfit / price * 100
//
// Warnings: 'negative' (loss), 'low' (< 5% margin), 'ok' otherwise.

import { calcCategoryCommission, type CommissionItemType } from './commission';

export type MarginWarning = 'negative' | 'low' | 'ok';

export const WARNING_TEXT: Record<MarginWarning, { en: string; hi: string }> = {
  negative: {
    en: 'LOSS! You will lose money on this sale. Raise the price or lower costs.',
    hi: 'नुकसान! इस बिक्री पर आपको घाटा होगा। कीमत बढ़ाएँ या लागत घटाएँ।',
  },
  low: {
    en: 'Low margin (under 5%). One return could wipe out your profit.',
    hi: 'कम मार्जिन (5% से कम)। एक रिटर्न आपका पूरा मुनाफा खा सकता है।',
  },
  ok: {
    en: 'Healthy margin. Safe to sell.',
    hi: 'अच्छा मार्जिन। बेचना सुरक्षित है।',
  },
};

export type MarginInput = {
  costPaise: number;      // seller's purchase cost
  pricePaise: number;     // selling price to customer
  shippingPaise: number;  // packing + courier cost
  category: string;       // product category (drives platform fee rate)
  itemType?: CommissionItemType; // 'new' (default) | 'old' | 'refurbished' | 'clearance'
  qty?: number;           // pieces (only used for flat tiers)
};

export type MarginResult = {
  platformFeePaise: number;
  paymentFeePaise: number; // ~2% of selling price (gateway estimate)
  shippingPaise: number;
  netProfitPaise: number;
  marginPct: number;
  warning: MarginWarning;
};

/** Payment gateway estimate: ~2% of the selling price. */
export const PAYMENT_FEE_RATE = 0.02;

export function calcMargin(input: MarginInput): MarginResult {
  const cost = Math.max(0, Math.round(input.costPaise));
  const price = Math.max(0, Math.round(input.pricePaise));
  const shipping = Math.max(0, Math.round(input.shippingPaise));
  const qty = Math.max(1, Math.floor(input.qty ?? 1));

  const { commissionPaise } = calcCategoryCommission(
    input.itemType ?? 'new',
    price * qty,
    qty,
    input.category,
  );
  const platformFeePaise = commissionPaise;
  const paymentFeePaise = Math.round(price * qty * PAYMENT_FEE_RATE);
  const shippingTotal = shipping * qty;
  const netProfitPaise = price * qty - cost * qty - shippingTotal - platformFeePaise - paymentFeePaise;

  const gross = price * qty;
  const marginPct = gross > 0 ? (netProfitPaise / gross) * 100 : 0;

  let warning: MarginWarning = 'ok';
  if (netProfitPaise < 0) warning = 'negative';
  else if (marginPct < 5) warning = 'low';

  return {
    platformFeePaise,
    paymentFeePaise,
    shippingPaise: shippingTotal,
    netProfitPaise,
    marginPct: Math.round(marginPct * 10) / 10,
    warning,
  };
}
