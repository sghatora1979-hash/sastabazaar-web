// AI Marketplace Manager — rule-based analyzer (Update 24).
// Reads seller/product data and produces structured picks. The AI NEVER
// invents stock, dates, or costs — every signal below comes from the database.
// Sellers approve each recommendation before anything goes live.
import { getFestivalsInWindow, affinityFor, type UpcomingFestival } from './festivals';

export type DbProduct = {
  id: string; title: string; category_slug: string | null; price: number;
  mrp: number; stock: number; seller_id: string | null; status: string; created_at: string;
};
export type DbProfile = {
  manufacturing_date: string | null; expiry_date: string | null;
  purchase_cost: number | null; min_selling_price: number | null;
  season_tags: string[]; festival_tags: string[];
};
export type SellerInfo = { id: string; business_name: string };

export type ProductSignal = {
  product_id: string; seller_id: string; title: string;
  price: number; mrp: number; stock: number; stock_age_days: number;
  units_sold_90d: number; has_sales_data: boolean;
  expiry_risk: 'none' | 'watch' | 'urgent' | 'critical';
  days_to_expiry: number | null;
  reasons: string[];
  festival_matches: { festival_id: string; festival_name: string; days_away: number }[];
  suggested_discount_pct: number;
  suggested_price: number;
  discount_blocked_reason: string | null;
};

export type AnalysisResult = {
  generated_at: string;
  mode: 'rule_based';
  products_analyzed: number;
  has_sales_data: boolean;
  upcoming_festivals: { id: string; name: string; days_away: number; date: string }[];
  signals: ProductSignal[];
  summary: { expiry_critical: number; expiry_urgent: number; slow_movers: number; festival_matches: number };
};

const DAY = 86400000;

export function analyzeProducts(
  products: DbProduct[],
  salesByProduct: Record<string, number>,
  profiles: Record<string, DbProfile>,
  sellers: Record<string, SellerInfo>,
  settings: { margin_floor_pct: number; max_discount_pct: number; lookback_days: number; festival_window_days: number },
  now: Date = new Date(),
): AnalysisResult {
  const festivals = getFestivalsInWindow(settings.festival_window_days, now);
  const hasSalesData = Object.keys(salesByProduct).length > 0;
  const signals: ProductSignal[] = [];

  for (const p of products) {
    if (!p.seller_id || p.status !== 'active' || p.stock <= 0) continue;
    const prof = profiles[p.id];
    const stockAge = Math.floor((now.getTime() - new Date(p.created_at).getTime()) / DAY);
    const sold = salesByProduct[p.id] ?? 0;
    const reasons: string[] = [];

    // --- expiry risk tiers ---
    let expiryRisk: ProductSignal['expiry_risk'] = 'none';
    let daysToExpiry: number | null = null;
    if (prof?.expiry_date) {
      daysToExpiry = Math.ceil((new Date(prof.expiry_date).getTime() - now.getTime()) / DAY);
      if (daysToExpiry <= 7) { expiryRisk = 'critical'; reasons.push(`Expires in ${daysToExpiry} days — clear stock urgently`); }
      else if (daysToExpiry <= 30) { expiryRisk = 'urgent'; reasons.push(`Expires in ${daysToExpiry} days`); }
      else if (daysToExpiry <= 90) { expiryRisk = 'watch'; reasons.push(`Expires in ${daysToExpiry} days — plan clearance`); }
    }

    // --- slow mover: low velocity + ageing stock ---
    const velocity = sold / Math.max(1, settings.lookback_days / 30); // units per month
    const isSlow = hasSalesData && velocity < 1 && stockAge > 60;
    if (isSlow) reasons.push(`Slow mover — ${sold} sold in ${settings.lookback_days} days, ${stockAge} days in stock`);

    // --- festival matches ---
    const festivalMatches: ProductSignal['festival_matches'] = [];
    for (const f of festivals) {
      const tagHit = (prof?.festival_tags ?? []).includes(f.id);
      const catHit = affinityFor(f.id, prof?.season_tags ?? []).includes(p.category_slug ?? '');
      if (tagHit || catHit) {
        festivalMatches.push({ festival_id: f.id, festival_name: f.name, days_away: f.daysAway });
        reasons.push(`Fits ${f.name} (${f.daysAway} days away)`);
      }
    }

    if (reasons.length === 0) continue; // nothing actionable — skip

    // --- discount math (floors respected, never below min price / margin) ---
    const maxD = settings.max_discount_pct;
    let discount = 0;
    if (expiryRisk === 'critical') discount = maxD;
    else if (expiryRisk === 'urgent') discount = Math.round(maxD * 0.7);
    else if (expiryRisk === 'watch') discount = Math.round(maxD * 0.4);
    else if (isSlow) discount = Math.min(20, maxD);
    if (festivalMatches.length > 0) discount = Math.max(discount, Math.min(12, maxD));
    if (stockAge > 180) { discount = Math.max(discount, Math.min(25, maxD)); reasons.push(`Ageing stock — ${stockAge} days old`); }

    let price = Math.round(p.price * (1 - discount / 100));
    let blocked: string | null = null;
    if (prof?.min_selling_price && price < prof.min_selling_price) {
      price = Math.round(prof.min_selling_price);
      discount = Math.max(0, Math.round((1 - price / p.price) * 100));
      if (discount === 0) blocked = 'Seller minimum price reached — no discount possible';
    }
    if (!blocked && prof?.purchase_cost) {
      const floor = prof.purchase_cost * (1 + settings.margin_floor_pct / 100);
      if (price < floor) {
        price = Math.round(floor);
        discount = Math.max(0, Math.round((1 - price / p.price) * 100));
        if (discount === 0) blocked = `Margin floor (${settings.margin_floor_pct}%) reached — no discount possible`;
      }
    }

    signals.push({
      product_id: p.id, seller_id: p.seller_id, title: p.title,
      price: p.price, mrp: p.mrp, stock: p.stock, stock_age_days: stockAge,
      units_sold_90d: sold, has_sales_data: hasSalesData,
      expiry_risk: expiryRisk, days_to_expiry: daysToExpiry,
      reasons, festival_matches: festivalMatches,
      suggested_discount_pct: discount, suggested_price: price,
      discount_blocked_reason: blocked,
    });
  }

  signals.sort((a, b) => {
    const rank = (s: ProductSignal) =>
      s.expiry_risk === 'critical' ? 0 : s.expiry_risk === 'urgent' ? 1 : s.festival_matches.length ? 2 : 3;
    return rank(a) - rank(b) || b.suggested_discount_pct - a.suggested_discount_pct;
  });

  return {
    generated_at: now.toISOString(),
    mode: 'rule_based',
    products_analyzed: products.length,
    has_sales_data: hasSalesData,
    upcoming_festivals: festivals.map((f) => ({
      id: f.id, name: f.name, days_away: f.daysAway, date: f.date.toISOString().slice(0, 10),
    })),
    signals,
    summary: {
      expiry_critical: signals.filter((s) => s.expiry_risk === 'critical').length,
      expiry_urgent: signals.filter((s) => s.expiry_risk === 'urgent').length,
      slow_movers: signals.filter((s) => s.reasons.some((r) => r.startsWith('Slow mover'))).length,
      festival_matches: signals.filter((s) => s.festival_matches.length > 0).length,
    },
  };
}

/** Group signals per seller for email drafting. */
export function groupBySeller(
  result: AnalysisResult,
  sellers: Record<string, SellerInfo>,
): Record<string, { seller: SellerInfo; signals: ProductSignal[] }> {
  const out: Record<string, { seller: SellerInfo; signals: ProductSignal[] }> = {};
  for (const s of result.signals) {
    const seller = sellers[s.seller_id];
    if (!seller) continue;
    (out[s.seller_id] ??= { seller, signals: [] }).signals.push(s);
  }
  return out;
}

export type { UpcomingFestival };
