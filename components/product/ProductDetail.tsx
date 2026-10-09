'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product } from '@/lib/products';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { LikeDislike } from '@/components/ui/LikeDislike';
import { formatINR } from '@/lib/utils';
import { trackView } from '@/lib/interactions';
import { recordView } from '@/lib/recent';
import { addToCart } from '@/lib/cart';
import { ShareButtons } from '@/components/ui/ShareButtons';
import { Star, MapPin, ShieldCheck, Truck, RotateCcw, Store, Check } from 'lucide-react';

export function ProductDetail({ product, categorySlug }: { product: Product; categorySlug?: string }) {
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    trackView(product.id);
    recordView(product.id); // recently viewed (search page) — demo browser storage
  }, [product.id]);

  const handleAdd = () => {
    addToCart(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 shadow-3d"
        >
          <Image
            src={product.images[activeImg]}
            alt={product.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute top-4 left-4">
            <SectionBadge section={product.section} />
          </div>
          {product.discountPercent > 0 && (
            <div className="absolute top-4 right-4 bg-gradient-to-br from-red-500 to-red-700 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
              -{product.discountPercent}%
            </div>
          )}
        </motion.div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                i === activeImg ? 'border-[var(--primary)]' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
          <span>/</span>
          {categorySlug && (
            <>
              <Link href={`/category/${categorySlug}`} className="hover:text-[var(--primary)]">
                {categorySlug.replace(/-/g, ' ')}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-700 font-medium">{product.subcategory}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{product.titleHi || product.title}</h1>
        <p className="text-gray-500 mt-1">{product.title}</p>

        <div className="flex items-center gap-3 mt-3 text-sm">
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full">
            <Star size={14} fill="currentColor" /> {product.rating}
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500">
            <MapPin size={14} /> {product.city}
          </span>
          {product.condition && (
            <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-xs">
              {product.condition}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-5">
          <span className="text-4xl font-black text-[var(--primary)]">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <>
              <span className="text-lg line-through text-gray-400">{formatINR(product.mrp)}</span>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                Save {product.discountPercent}%
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{product.description}</p>

        <ul className="mt-4 space-y-2">
          {product.highlights.map((h, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <Check size={15} className="text-green-600 shrink-0" /> {h}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            className="btn-primary flex-1 font-bold py-3.5 rounded-2xl text-lg"
          >
            {added ? 'Added to Cart ✓' : 'Add to Cart'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            className="flex-1 font-bold py-3.5 rounded-2xl text-lg border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 transition"
          >
            Buy Now
          </motion.button>
        </div>

        <div className="max-w-xs mt-4">
          <LikeDislike productId={product.id} />
        </div>

        <ShareButtons title={product.title} />

        <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <ShieldCheck size={18} className="text-green-600" />
            <span className="text-gray-700 font-medium">Escrow protected</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <Truck size={18} className="text-blue-600" />
            <span className="text-gray-700 font-medium">Free ship over ₹499</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <RotateCcw size={18} className="text-purple-600" />
            <span className="text-gray-700 font-medium">7-day returns</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <Store size={18} className="text-orange-600" />
            <span className="text-gray-700 font-medium">{product.seller}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
