// Generates supabase/seed_products.sql from the demo catalog.
// Run: npx tsx supabase/seed_products_tsx.ts
import { writeFileSync } from 'fs';
import { PRODUCTS } from '../lib/products';
import { CATEGORIES } from '../lib/categories';

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const escArr = (a: string[]): string =>
  a.length === 0 ? `'{}'` : `array[${a.map((s) => esc(s)).join(',')}]`;

const slugById: Record<string, string> = {};
CATEGORIES.forEach((c) => { slugById[c.id] = c.slug; });

const lines = PRODUCTS.map((p) => {
  const vals = [
    esc(p.slug),
    esc(p.title),
    esc(p.titleHi),
    esc(p.description),
    escArr(p.highlights),
    esc(p.section),
    esc(slugById[p.categoryId] ?? null),
    esc(p.subcategory),
    esc(p.price),
    esc(p.mrp),
    esc(p.discountPercent),
    esc(p.image),
    escArr(p.images),
    esc(p.rating),
    esc(p.seller),
    esc(p.sellerRating),
    esc(p.city),
    esc(p.condition ?? null),
    esc(p.stock),
    esc(p.dealScore),
    esc('active'),
  ];
  return `(${vals.join(',')})`;
});

const sql = `-- SastaBazaar Phase 0 — product seed (${PRODUCTS.length} rows)\n` +
  `-- Run AFTER 001_phase0_schema.sql in Supabase SQL Editor.\n` +
  `insert into public.products\n` +
  `  (slug,title,title_hi,description,highlights,section,category_slug,subcategory,price,mrp,discount_percent,image,images,rating,seller_name,seller_rating,city,condition,stock,deal_score,status)\n` +
  `values\n${lines.join(',\n')}\n` +
  `on conflict (slug) do nothing;\n`;

writeFileSync('supabase/seed_products.sql', sql);
console.log(`wrote supabase/seed_products.sql (${PRODUCTS.length} products)`);
