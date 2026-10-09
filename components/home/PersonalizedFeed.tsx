'use client';
import { useEffect, useState } from 'react';
import { Product } from '@/lib/products';
import { getPersonalizedProducts } from '@/lib/recommendations';
import { ProductCard, BRAND } from '@/components/store/ProductCard';
import { Sparkles } from 'lucide-react';

/**
 * "Recommended for you" — same personalization engine as before,
 * now rendered with the modern storefront product cards.
 */
export function PersonalizedFeed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = () => setProducts(getPersonalizedProducts(10));
    load();
    window.addEventListener('sb-interactions', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('sb-interactions', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-10">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: BRAND }}>
              <Sparkles size={17} />
            </span>
            Recommended for you
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 ml-10">
            Picked for you based on your likes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
