'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { SellerProduct, CONDITION_LABELS, ProductCondition } from '@/lib/seller';
import { formatINR } from '@/lib/utils';
import { ShareButtons } from '@/components/ui/ShareButtons';
import { stateName } from '@/lib/festivals';
import { BRAND, soldCount } from './ProductCard';

type Props = {
  product: SellerProduct;
  index?: number;
  sellerName: string;
  sellerState: string;
  added: boolean;
  onAdd: () => void;
};

/**
 * Modern marketplace card for seller-listed products.
 * Matches the storefront ProductCard language: white card, red discount
 * badge, 2-line title clamp, price + MRP, seller/state/verified line.
 */
export function SellerProductCard({ product: p, index = 0, sellerName, sellerState, added, onAdd }: Props) {
  const discount = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const sold = soldCount({ id: p.id, dealScore: 60 });
  const soldLabel = sold >= 1000 ? `${(sold / 1000).toFixed(1).replace(/\.0$/, '')}k sold` : `${sold} sold`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow duration-300 flex flex-col"
    >
      <div className="relative aspect-square bg-gray-50">
        <Image src={p.image} alt={p.title} fill className="object-cover" unoptimized />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#E62E2E] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow">
            -{discount}%
          </span>
        )}
        {(p.images?.length ?? 1) > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            📷 {p.images.length}
          </span>
        )}
      </div>

      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.4rem]">
          {p.title}
        </h3>
        {p.titleHi && (
          <p className="text-[11px] text-gray-500 leading-snug truncate mt-0.5">{p.titleHi}</p>
        )}
        <div className="text-[10px] text-gray-500 mt-1 leading-snug">
          📍 {stateName(sellerState)} · {sellerName} <span className="text-green-600 font-bold">✓ verified</span>
          {(p.condition ?? 'new') !== 'new' && (
            <span className="ml-1 font-bold text-amber-600">· {CONDITION_LABELS[(p.condition ?? 'new') as ProductCondition]}</span>
          )}
        </div>
        {(p.sizes?.length ?? 0) > 0 && (
          <div className="text-[10px] text-gray-400 mt-0.5">Sizes: {p.sizes.join(', ')}</div>
        )}
        <div className="text-[10px] text-gray-400 mt-0.5">{soldLabel}</div>

        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-[17px] font-extrabold text-gray-900 tracking-tight">{formatINR(p.price)}</span>
          {p.mrp > p.price && (
            <span className="text-[11px] line-through text-gray-400">{formatINR(p.mrp)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={onAdd}
            className={`flex-1 font-bold py-2 rounded-xl text-[13px] inline-flex items-center justify-center gap-1.5 transition text-white shadow ${
              added ? 'bg-green-500' : ''
            }`}
            style={added ? undefined : { background: `linear-gradient(135deg, ${BRAND}, #E05E00)` }}
          >
            {added ? <><Check size={15} /> Added!</> : <><ShoppingCart size={15} /> Add</>}
          </button>
          <ShareButtons title={p.title} compact />
        </div>
      </div>
    </motion.div>
  );
}
