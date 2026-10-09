'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';
import { Product } from '@/lib/products';
import { formatINR } from '@/lib/utils';
import { LikeDislike } from '@/components/ui/LikeDislike';

/** Fixed storefront brand orange (independent of the daily rotating theme). */
export const BRAND = '#FB7701';

/** Deterministic pseudo "sold" count per product (demo data has no order history). */
export function soldCount(p: { id: string; dealScore?: number }): number {
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) % 9973;
  return 120 + ((h * ((p.dealScore ?? 50) + 7)) % 4800);
}

export function formatSold(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k sold`;
  return `${n} sold`;
}

export function RatingRow({ rating, sold }: { rating: number; sold: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-1 text-[11px]">
      <span className="inline-flex items-center gap-0.5 font-bold text-gray-900">
        <Star size={11} className="text-amber-500" fill="currentColor" />
        {rating.toFixed(1)}
      </span>
      <span className="text-gray-400">|</span>
      <span className="text-gray-500">{formatSold(sold)}</span>
    </div>
  );
}

/**
 * Modern Temu/Shein-style product card.
 * White card, subtle shadow, red discount badge, 2-line title clamp,
 * star rating + sold count, big price + strikethrough MRP.
 */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const sold = soldCount(product);
  const lowStock = product.stock <= 10;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow duration-300"
      >
        <div className="relative aspect-square bg-gray-50">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            unoptimized
          />
          {product.discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-[#E62E2E] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow">
              -{product.discountPercent}%
            </span>
          )}
          {product.condition && (
            <span className="absolute bottom-2 left-2 bg-black/65 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {product.condition}
            </span>
          )}
        </div>

        <div className="p-2.5 sm:p-3">
          <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.4rem]">
            {product.title}
          </h3>
          <p className="text-[11px] text-gray-500 leading-snug truncate mt-0.5">{product.titleHi}</p>
          <RatingRow rating={product.rating} sold={sold} />

          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-[17px] font-extrabold text-gray-900 tracking-tight">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
            <MapPin size={9} />
            <span className="truncate">{product.city}</span>
            {lowStock && (
              <span className="ml-auto shrink-0 font-bold" style={{ color: BRAND }}>
                Only {product.stock} left
              </span>
            )}
          </div>

          <LikeDislike productId={product.id} compact />
        </div>
      </Link>
    </motion.div>
  );
}
