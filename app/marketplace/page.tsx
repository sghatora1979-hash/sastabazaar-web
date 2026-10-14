'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Store, ArrowRight } from 'lucide-react';
import { ensureSeed, getSellerProducts, getSellerById } from '@/lib/seller';
import { addToCart } from '@/lib/cart';
import { stateName } from '@/lib/festivals';
import { SellerProductCard } from '@/components/store/SellerProductCard';
import { BRAND } from '@/components/store/ProductCard';

function MarketplaceInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ReturnType<typeof getSellerProducts>>([]);
  const [added, setAdded] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState('');

  useEffect(() => {
    ensureSeed();
    setProducts(getSellerProducts());
    setStateFilter(searchParams.get('state') ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = (id: string) => {
    addToCart(id, 1);
    setAdded(id);
    setTimeout(() => setAdded(null), 1500);
  };

  const sellerState = (sellerId: string) => getSellerById(sellerId)?.state ?? '';
  const visibleStates = useMemo(
    () => [...new Set(products.map(p => sellerState(p.sellerId)).filter(Boolean))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products]
  );
  const shown = stateFilter
    ? products.filter(p => sellerState(p.sellerId) === stateFilter)
    : products;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0"
          style={{ background: `linear-gradient(135deg, ${BRAND}, #E05E00)` }}
        >
          <Store size={22} />
        </span>
        <div className="flex-1 min-w-[180px]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Seller Marketplace</h1>
          <p className="text-[13px] text-gray-500">Direct from verified sellers · shipped by the seller · tracked live</p>
        </div>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold shadow-sm focus:outline-none"
          aria-label="Filter by seller state"
        >
          <option value="">🌏 All India</option>
          {visibleStates.map(code => (
            <option key={code} value={code}>📍 {stateName(code)}</option>
          ))}
        </select>
      </div>
      {stateFilter !== '' && (
        <p className="text-sm text-gray-600 mt-3">
          Showing sellers from <b>{stateName(stateFilter)}</b> ({shown.length} products)
          {' '}— <button onClick={() => setStateFilter('')} className="font-bold underline" style={{ color: BRAND }}>clear</button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="mt-10 bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No seller products yet.</p>
          <Link
            href="/seller/register"
            className="inline-flex items-center gap-1.5 mt-4 font-bold px-6 py-3 rounded-full text-sm text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #E05E00)` }}
          >
            Become the first seller <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-6">
          {shown.map((p, i) => {
            const seller = getSellerById(p.sellerId);
            return (
              <SellerProductCard
                key={p.id}
                product={p}
                index={i}
                sellerName={seller?.name ?? 'Seller'}
                sellerState={sellerState(p.sellerId)}
                added={added === p.id}
                onAdd={() => add(p.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading marketplace…</div>}>
      <MarketplaceInner />
    </Suspense>
  );
}
