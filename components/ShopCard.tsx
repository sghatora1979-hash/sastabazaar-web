'use client';
/**
 * Local shop card: shop photo, Hindi-first name, category, area, rating,
 * delivery modes. Clicking opens the shop's public page with its products.
 */
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Phone } from 'lucide-react';
import { LocalShop, DELIVERY_MODE_LABEL } from '@/lib/local-shops';
import { HindiName } from './HindiName';

export function ShopCard({ shop }: { shop: LocalShop }) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow duration-300"
    >
      <div className="relative aspect-[16/9] bg-gray-100">
        <Image src={shop.photo} alt={shop.nameHi} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" unoptimized />
        <span className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {shop.categoryHi} · {shop.category}
        </span>
        {shop.isDemo && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Demo
          </span>
        )}
      </div>
      <div className="p-3">
        <HindiName hi={shop.nameHi} en={shop.name} size="card" />
        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
          <MapPin size={10} />
          <span className="truncate">{shop.area}, {shop.city} {shop.pin}</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-[11px]">
          <Star size={11} className="text-amber-500" fill="currentColor" />
          <span className="font-bold text-gray-900">{shop.rating.toFixed(1)}</span>
          <span className="text-gray-400">·</span>
          <Phone size={10} className="text-gray-400" />
          <span className="text-gray-500 truncate">{shop.phone}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {shop.deliveryModes.map(m => (
            <span key={m} className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
              {DELIVERY_MODE_LABEL[m].hi}
            </span>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-gray-500">
          {shop.products.length} products · <span className="font-bold text-[#FB7701]">View shop →</span>
        </div>
      </div>
    </Link>
  );
}
