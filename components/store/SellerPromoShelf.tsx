'use client';
/**
 * Seller-powered promo shelf. Shows products the seller placed into a
 * promo (Lucky Draw / Spin & Win / Refer Reward / Festival Pick).
 * Renders nothing when no seller has placed products yet — pages keep
 * their demo content as fallback. Everything by seller; SastaBazaar
 * brings the customers and earns commission on sales.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getPlacedProducts, PromoKind, SellerProduct } from '@/lib/seller';
import { formatINR } from '@/lib/utils';

export function SellerPromoShelf({
  kind, title, subtitle,
}: {
  kind: PromoKind;
  title: string;
  subtitle?: string;
}) {
  const [items, setItems] = useState<SellerProduct[]>([]);
  useEffect(() => {
    try { setItems(getPlacedProducts(kind)); } catch { /* demo fallback */ }
  }, [kind]);

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-extrabold text-gray-900 text-lg">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {items.map((p) => (
          <div key={p.id} className="shrink-0 w-[150px] bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
            <div className="relative aspect-square bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                Seller prize
              </span>
            </div>
            <div className="p-2.5">
              <div className="text-xs font-bold text-gray-900 line-clamp-1">{p.titleHi || p.title}</div>
              <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
              <div className="text-sm font-extrabold text-purple-700 mt-0.5">{formatINR(p.price)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
