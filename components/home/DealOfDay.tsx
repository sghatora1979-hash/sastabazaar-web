'use client';
import { useEffect, useState } from 'react';
import { PRODUCTS, Product } from '@/lib/products';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';

export function DealOfDay() {
  const [deals, setDeals] = useState<Product[]>([]);

  useEffect(() => {
    const top = [...PRODUCTS]
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 8);
    setDeals(top);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 inline-flex items-center gap-2">
            <Flame className="text-red-500" /> आज के धमाके
          </h2>
          <p className="text-sm text-gray-500 mt-1">Today&apos;s biggest discounts</p>
        </div>
        <Link
          href="/clearance"
          className="text-sm font-semibold text-[var(--primary)] inline-flex items-center gap-1 hover:gap-2 transition-all"
        >
          View All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {deals.map((p, i) => (
          <ProductCard3D key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
