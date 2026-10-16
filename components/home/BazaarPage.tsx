'use client';
import { useEffect, useMemo, useState } from 'react';
import { getProductsBySection, Section, Product } from '@/lib/products';
import { getSellerProducts, sellerProductToCatalog } from '@/lib/seller';
import { CATEGORIES } from '@/lib/categories';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { SectionBadge } from '@/components/ui/SectionBadge';

export type BazaarConfig = {
  section: Section;
  title: string;
  subtitle: string;
  gradient: string;
  icon: string;
  description: string;
};

/** Update 26: clearance groups items by category, top to bottom. */
export function BazaarPage({ config }: { config: BazaarConfig }) {
  // Server renders the seed catalog; seller products (localStorage) merge
  // in on the client so hydration always matches.
  const [sellerExtra, setSellerExtra] = useState<Product[]>([]);
  useEffect(() => {
    try {
      setSellerExtra(
        getSellerProducts()
          .map(sellerProductToCatalog)
          .filter((p) => p.section === config.section)
      );
    } catch { /* private mode etc. — catalog still renders */ }
  }, [config.section]);
  const products = [...sellerExtra, ...getProductsBySection(config.section, 60)];

  const grouped = useMemo(() => {
    if (config.section !== 'clearance') return null;
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const key = p.categoryId || '0';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].map(([catId, items]) => ({
      cat: CATEGORIES.find(c => c.id === catId),
      items,
    }));
  }, [products, config.section]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div
        className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
        style={{ background: config.gradient }}
      >
        <div className="text-6xl mb-3">{config.icon}</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
          {config.title} <SectionBadge section={config.section} />
        </h1>
        <p className="text-white/90 mt-2 text-lg">{config.subtitle}</p>
        <p className="text-white/70 mt-1 text-sm max-w-2xl">{config.description}</p>
        <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30">
          {products.length} products live
        </div>
      </div>

      {grouped ? (
        <div className="space-y-10">
          {grouped.map(({ cat, items }) => (
            <section key={cat?.id ?? 'other'}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{cat?.emoji ?? '📦'}</span>
                <h2 className="text-xl font-extrabold text-gray-900">
                  {cat ? `${cat.nameHi} · ${cat.name}` : 'Other items'}
                </h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {items.map((p, i) => (
                  <ProductCard3D key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p, i) => (
            <ProductCard3D key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
