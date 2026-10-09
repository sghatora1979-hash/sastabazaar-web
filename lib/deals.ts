import { PRODUCTS, type Product } from './products';

export const BUDGET_CAP = 199;

/**
 * Demo helper: cheapest products first, then shuffled.
 * If fewer than `count` products are under the cap, fills up with the
 * next-cheapest products so the rail is never empty.
 */
export function getCheapPicks(products: Product[] = PRODUCTS, count = 10): Product[] {
  const cheap = products.filter(p => p.price <= BUDGET_CAP);
  const rest = products
    .filter(p => p.price > BUDGET_CAP)
    .sort((a, b) => a.price - b.price);
  const pool = [...cheap, ...rest];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
