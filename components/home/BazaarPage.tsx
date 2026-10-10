'use client';
import { useEffect, useState } from 'react';
import { getProductsBySection, Section, Product } from '@/lib/products';
import { getSellerProducts, sellerProductToCatalog } from '@/lib/seller';
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
  const products = [...sellerExtra, ...getProductsBySection(config.section, 40)];

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.map((p, i) => (
          <ProductCard3D key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
