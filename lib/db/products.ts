// Phase 0 data layer: Supabase-first product reads with demo-data fallback.
// Nothing breaks if the database isn't set up yet — callers get the same
// Product shape either way.
import { getSupabase } from '../supabase';
import { PRODUCTS, type Product, type Section } from '../products';

type DbProduct = {
  id: string;
  slug: string;
  title: string;
  title_hi: string | null;
  description: string | null;
  highlights: string[] | null;
  section: Section;
  category_slug: string | null;
  subcategory: string | null;
  price: number;
  mrp: number;
  discount_percent: number;
  promote_in?: string[] | null;
  image: string | null;
  images: string[] | null;
  rating: number;
  seller_name: string | null;
  seller_rating: number;
  city: string | null;
  condition: 'Like New' | 'Good' | 'Fair' | null;
  stock: number;
  deal_score: number;
  status: string;
  created_at: string;
};

const CATEGORY_ID_BY_SLUG: Record<string, string> = {
  mobiles: '1', electronics: '2', 'fashion-women': '3', 'fashion-men': '4',
  footwear: '5', beauty: '6', home: '7', furniture: '8', appliances: '9',
  books: '10', toys: '11', sports: '12', grocery: '13', jewellery: '14',
  bags: '15', automotive: '16', office: '17', musical: '18', pet: '19',
  handicraft: '20',
};

export function mapDbProduct(r: DbProduct): Product {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    titleHi: r.title_hi ?? r.title,
    section: r.section,
    categoryId: (r.category_slug && CATEGORY_ID_BY_SLUG[r.category_slug]) || '1',
    subcategory: r.subcategory ?? '',
    price: Number(r.price),
    mrp: Number(r.mrp),
    discountPercent: r.discount_percent ?? 0,
    image: r.image ?? '',
    images: r.images ?? [],
    rating: Number(r.rating),
    seller: r.seller_name ?? 'SastaBazaar Seller',
    sellerRating: Number(r.seller_rating),
    city: r.city ?? '',
    condition: r.condition ?? undefined,
    stock: r.stock ?? 0,
    dealScore: r.deal_score ?? 0,
    createdAt: r.created_at,
    description: r.description ?? '',
    highlights: r.highlights ?? [],
    promoteIn: r.promote_in ?? [],
  };
}

/** Returns DB products, or null when Supabase isn't configured/reachable. */
export async function fetchProductsFromDb(limit = 500): Promise<Product[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return null;
    return (data as DbProduct[]).map(mapDbProduct);
  } catch {
    return null;
  }
}

/** Drop-in async replacement for the demo PRODUCTS list. */
export async function getAllProducts(): Promise<Product[]> {
  const fromDb = await fetchProductsFromDb();
  return fromDb && fromDb.length > 0 ? fromDb : PRODUCTS;
}

// ---------------------------------------------------------------------------
// Catalog priming: the whole site keeps using the SYNC helpers in
// lib/products.ts. The root layout awaits primeProductCache() once, which
// swaps the module-level PRODUCTS array to the database rows (live binding).
// If the DB is unreachable, the demo catalog stays in place — nothing breaks.
// ---------------------------------------------------------------------------
import { setProducts } from '../products';

const CACHE_TTL_MS = 5 * 60 * 1000; // refresh at most every 5 minutes
let cacheAt = 0;
let priming: Promise<void> | null = null;

export function primeProductCache(): Promise<void> {
  if (priming) return priming;
  if (Date.now() - cacheAt < CACHE_TTL_MS) return Promise.resolve();
  priming = (async () => {
    try {
      const fromDb = await fetchProductsFromDb();
      if (fromDb && fromDb.length > 0) setProducts(fromDb);
    } catch {
      // keep current catalog (demo or previously loaded) on any failure
    } finally {
      cacheAt = Date.now(); // don't hammer the DB when it's down; retry after TTL
      priming = null;
    }
  })();
  return priming;
}
