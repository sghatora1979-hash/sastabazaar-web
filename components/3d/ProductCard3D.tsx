'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/products';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { LikeDislike } from '@/components/ui/LikeDislike';
import { formatINR } from '@/lib/utils';
import { Star, MapPin } from 'lucide-react';

export function ProductCard3D({ product, index = 0 }: { product: Product; index?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(sy, [-100, 100], [8, -8]);
  const rotateY = useTransform(sx, [-100, 100], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
      className="perspective-1000"
    >
      <Link href={`/product/${product.slug}`}>
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { x.set(0); y.set(0); }}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          whileHover={{ scale: 1.03 }}
          className="relative rounded-2xl bg-white shadow-3d hover:shadow-3d-hover p-3 sm:p-4 cursor-pointer"
        >
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10">
            <SectionBadge section={product.section} small />
          </div>
          {product.discountPercent > 0 && (
            <motion.div
              style={{ translateZ: 50 }}
              className="absolute top-3 right-3 z-10 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
            >
              -{product.discountPercent}%
            </motion.div>
          )}

          {/* Image */}
          <motion.div
            style={{ translateZ: 30 }}
            className="relative aspect-square overflow-hidden rounded-xl bg-gray-50"
          >
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 hover:scale-110"
              unoptimized
            />
            {product.condition && (
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {product.condition}
              </span>
            )}
          </motion.div>

          {/* Info */}
          <div className="mt-3" style={{ transform: 'translateZ(20px)' }}>
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
              {product.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{product.titleHi}</p>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-lg font-extrabold text-[var(--primary)]">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs line-through text-gray-400">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                <Star size={10} fill="currentColor" /> {product.rating}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={10} /> {product.city}
              </span>
            </div>

            {product.section === 'local' && (
              <p className="text-[11px] text-green-600 font-medium mt-1">
                ✓ Pickup available
              </p>
            )}
          </div>

          <div style={{ transform: 'translateZ(25px)' }}>
            <LikeDislike productId={product.id} compact />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
