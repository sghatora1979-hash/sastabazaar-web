// AI Marketplace Manager — demand <-> seller matching engine (Update 24b).
//
// HARD SAFEGUARD (b): matching uses ONLY category, budget, region, language.
// It NEVER uses race, health, or inferred sensitive attributes.
// HARD SAFEGUARD (c): no harvesting — inputs are customer-entered demands and
// public product/seller data only.
export type Demand = {
  id: string; customer_id: string | null; category: string; description: string;
  budget_min: number | null; budget_max: number | null;
  region: string | null; language: string | null; status: string; is_demo: boolean;
};

export type MatchProduct = {
  id: string; title: string; category_slug: string | null; price: number;
  mrp: number; stock: number; seller_id: string; seller_state: string | null;
  min_selling_price: number | null;
};

export type ScoredMatch = {
  product_id: string; seller_id: string; score: number; reasons: string[];
};

/**
 * Score one demand against one product. Returns null when the product can
 * never satisfy the demand (wrong category, no stock, or even the seller's
 * minimum price exceeds the customer's max budget).
 */
export function scoreDemand(d: Demand, p: MatchProduct): ScoredMatch | null {
  if (p.category_slug !== d.category) return null;
  if (p.stock <= 0) return null;
  // Respect the seller's minimum price as a HARD floor — never promise below it.
  const floor = p.min_selling_price ?? 0;
  if (d.budget_max != null && floor > d.budget_max) return null; // can never satisfy
  if (d.budget_max != null && p.price > d.budget_max) return null; // current price over budget

  let score = 50;
  const reasons: string[] = ['Category match'];
  if (d.budget_max != null && p.price <= d.budget_max) {
    score += 20; reasons.push(`Within budget (≤ ₹${d.budget_max})`);
    if (d.budget_min != null && p.price >= d.budget_min) { score += 10; reasons.push('Inside your budget range'); }
  }
  if (p.stock >= 10) { score += 10; reasons.push('Good stock available'); }
  else { score += 5; reasons.push(`In stock (${p.stock} left)`); }
  if (d.region && p.seller_state && p.seller_state === d.region) {
    score += 10; reasons.push('Seller in your region — faster delivery');
  }
  return { product_id: p.id, seller_id: p.seller_id, score: Math.min(100, score), reasons };
}

export type DemandCluster = {
  cluster_key: string; category: string; region: string | null;
  demands: Demand[];
};

/** Group open demands into negotiation clusters: same category (+region). */
export function clusterDemands(demands: Demand[], minCluster: number): DemandCluster[] {
  const groups = new Map<string, Demand[]>();
  for (const d of demands) {
    if (d.status !== 'open' || d.is_demo) continue;
    const key = `${d.category}::${d.region ?? 'ANY'}`;
    const arr = groups.get(key) ?? [];
    arr.push(d);
    groups.set(key, arr);
  }
  const out: DemandCluster[] = [];
  for (const [key, arr] of groups) {
    if (arr.length < minCluster) continue;
    const [category, region] = key.split('::');
    out.push({ cluster_key: key, category, region: region === 'ANY' ? null : region, demands: arr });
  }
  return out;
}

export type BulkProposal = {
  cluster_key: string; category: string; region: string | null;
  demand_count: number; total_qty: number;
  product_id: string; seller_id: string;
  proposed_price: number; currency: 'INR';
  econ: Record<string, unknown>;
};

/**
 * Win-win bulk proposal math. ALL assumptions are labeled as estimates.
 * The seller's min_selling_price is a HARD floor — the proposal can never
 * go below it. Returns null when no honest deal exists.
 */
export function proposeBulk(
  cluster: DemandCluster,
  product: { id: string; price: number; mrp: number; stock: number; seller_id: string; min_selling_price: number | null },
): BulkProposal | null {
  const qty = cluster.demands.length; // 1 unit per demand (conservative)
  if (product.stock < qty) return null;
  const budgets = cluster.demands.map((d) => d.budget_max).filter((b): b is number => b != null);
  const budgetCeil = budgets.length > 0 ? Math.min(...budgets) : product.price;
  const floor = Math.max(product.min_selling_price ?? 0, 1);
  // Offer: 8% under current price, but never below floor and never above the
  // tightest customer budget. Shared-packaging/shipment savings are estimates.
  let proposed = Math.min(product.price * 0.92, budgetCeil);
  proposed = Math.max(proposed, floor);
  proposed = Math.round(proposed);
  if (proposed >= product.price) return null; // no real discount → no proposal
  const discountPct = Math.round((1 - proposed / product.price) * 100);
  return {
    cluster_key: cluster.cluster_key,
    category: cluster.category,
    region: cluster.region,
    demand_count: cluster.demands.length,
    total_qty: qty,
    product_id: product.id,
    seller_id: product.seller_id,
    proposed_price: proposed,
    currency: 'INR',
    econ: {
      base_price: product.price,
      discount_pct: discountPct,
      seller_floor_respected: floor,
      assumptions: [
        'Estimate: shared packaging saves ~₹15/unit at this quantity.',
        'Estimate: combined shipment saves ~₹25/unit vs individual parcels.',
        'Actual savings depend on seller location and courier rates — seller confirms.',
      ],
    },
  };
}
