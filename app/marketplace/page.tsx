'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Store, Check } from 'lucide-react';
import { ensureSeed, getSellerProducts, getSellerById, SellerProduct, CONDITION_LABELS, ProductCondition } from '@/lib/seller';
import { addToCart } from '@/lib/cart';
import { formatINR } from '@/lib/utils';
import { ShareButtons } from '@/components/ui/ShareButtons';
import { stateName } from '@/lib/festivals';

function MarketplaceInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<SellerProduct[]>([]);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
          <Store size={22} />
        </span>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900">Seller Marketplace</h1>
          <p className="text-sm text-gray-500">Direct from verified sellers · shipped by the seller · tracked live</p>
        </div>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
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
          {' '}— <button onClick={() => setStateFilter('')} className="text-[var(--primary)] font-bold underline">clear</button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="mt-10 bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No seller products yet.</p>
          <Link href="/seller/register" className="btn-primary inline-block mt-4 font-bold px-6 py-3 rounded-full text-sm">
            Become the first seller
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {shown.map((p, i) => {
            const seller = getSellerById(p.sellerId);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden flex flex-col"
              >
                <div className="relative aspect-square">
                  <Image src={p.image} alt={p.title} fill className="object-cover" unoptimized />
                  {(p.images?.length ?? 1) > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">📷 {p.images.length}</span>
                  )}
                  {p.mrp > p.price && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                      {Math.round((1 - p.price / p.mrp) * 100)}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="font-bold text-sm text-gray-900 line-clamp-2 flex-1">{p.title}</div>
                  <div className="text-[11px] text-gray-500 mt-1">📍 {stateName(sellerState(p.sellerId))} · Sold by {seller?.name ?? 'Seller'} ✓ verified{(p.condition ?? 'new') !== 'new' && <span className="ml-1 font-bold text-amber-600">· {CONDITION_LABELS[(p.condition ?? 'new') as ProductCondition]}</span>}</div>
                  {(p.sizes?.length ?? 0) > 0 && <div className="text-[11px] text-gray-500 mt-0.5">Sizes: {p.sizes.join(', ')}</div>}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-black text-lg text-[var(--primary)]">{formatINR(p.price)}</span>
                    {p.mrp > p.price && <span className="text-xs line-through text-gray-400">{formatINR(p.mrp)}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <button
                      onClick={() => add(p.id)}
                      className={`flex-1 font-bold py-2.5 rounded-2xl text-sm inline-flex items-center justify-center gap-2 transition ${added === p.id ? 'bg-green-500 text-white' : 'btn-primary'}`}
                    >
                      {added === p.id ? <><Check size={16} /> Added!</> : <><ShoppingCart size={16} /> Add to Cart</>}
                    </button>
                    <ShareButtons title={p.title} compact />
                  </div>
                </div>
              </motion.div>
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
