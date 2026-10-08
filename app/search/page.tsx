'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProducts, Product } from '@/lib/products';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { Search as SearchIcon } from 'lucide-react';
import { Suspense } from 'react';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Product[]>(() => searchProducts(q, 30));

  useEffect(() => {
    setQuery(q);
    setResults(searchProducts(q, 30));
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults(searchProducts(query, 30));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <form onSubmit={submit} className="relative max-w-2xl mx-auto mb-8">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products, brands…"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        />
      </form>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
        {q ? `Results for "${q}"` : 'Search the bazaar'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{results.length} products found</p>

      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-semibold text-gray-700">No products found</p>
          <p className="text-sm mt-1">Try a different keyword, e.g. “saree”, “laptop”, “cricket”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {results.map((p, i) => (
            <ProductCard3D key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</div>}>
      <SearchResults />
    </Suspense>
  );
}
