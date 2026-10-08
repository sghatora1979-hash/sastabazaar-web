'use client';
import { useEffect, useState } from 'react';
import { Product } from '@/lib/products';
import { getPersonalizedProducts } from '@/lib/recommendations';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { Sparkles } from 'lucide-react';

export function PersonalizedFeed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = () => setProducts(getPersonalizedProducts(8));
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
    <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 inline-flex items-center gap-2">
            <Sparkles className="text-[var(--primary)]" /> आपके लिए
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Picked for you based on your likes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.map((p, i) => (
          <ProductCard3D key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
