import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, MapPin, Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { DEMO_SHOPS, DELIVERY_MODE_LABEL } from '@/lib/local-shops';
import { HindiName } from '@/components/HindiName';
import { ShareButtons } from '@/components/ui/ShareButtons';
import { formatINR } from '@/lib/utils';

/** Prerender demo shops; user-registered shops render on demand. */
export function generateStaticParams() {
  return DEMO_SHOPS.map(s => ({ id: s.id }));
}

export default function ShopPage({ params }: { params: { id: string } }) {
  const shop = DEMO_SHOPS.find(s => s.id === params.id);
  if (!shop) notFound();

  const waNumber = (shop.whatsapp ?? shop.phone).replace(/[^0-9]/g, '');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      <Link href="/local-bazaar" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={15} /> Back to Local Bazaar
      </Link>

      {/* Shop header */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100">
        <div className="relative h-52 sm:h-72 bg-gray-100">
          <Image src={shop.photo} alt={shop.nameHi} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="text-xs font-bold text-emerald-300">{shop.categoryHi} · {shop.category}</p>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1">{shop.nameHi}</h1>
            <p className="text-sm text-white/80">{shop.name} · by {shop.owner}</p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1 font-bold text-gray-900">
              <Star size={14} className="text-amber-500" fill="currentColor" /> {shop.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-500">
              <MapPin size={14} /> {shop.area}, {shop.city} — {shop.pin}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {shop.deliveryModes.map(m => (
              <span key={m} className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                {DELIVERY_MODE_LABEL[m].hi} · {DELIVERY_MODE_LABEL[m].en}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">{shop.deliveryNoteHi}</p>
          <p className="text-xs text-gray-400">{shop.deliveryNote}</p>

          <div className="flex flex-wrap gap-3 mt-5">
            <a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="btn-fx inline-flex items-center gap-2 bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-full shadow">
              <Phone size={16} /> {shop.phone}
            </a>
            {shop.whatsapp && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Namaste! I saw your shop ${shop.nameHi} on SastaBazaar.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-fx inline-flex items-center gap-2 text-white font-extrabold px-6 py-3 rounded-full shadow"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <ShareButtons title={shop.name} titleHi={shop.nameHi} priceText={`${shop.products.length} products`} />
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-8 mb-4">
        इस दुकान के प्रोडक्ट <span className="text-sm font-medium text-gray-400">· What this shop sells ({shop.products.length})</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {shop.products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <div className="relative aspect-square bg-gray-50">
              <Image src={p.image} alt={p.nameHi} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" unoptimized />
            </div>
            <div className="p-2.5 sm:p-3">
              <HindiName hi={p.nameHi} en={p.name} size="card" />
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-[16px] font-extrabold text-gray-900">{formatINR(p.price)}</span>
                {p.mrp > p.price && <span className="text-[11px] text-gray-400 line-through">{formatINR(p.mrp)}</span>}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{p.stock > 0 ? `${p.stock} available` : 'Out of stock'}</p>
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Namaste! I want to buy: ${p.nameHi} (${p.name}) — ${formatINR(p.price)}. Shop: ${shop.nameHi}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-fx mt-2 block text-center text-xs font-extrabold text-white py-2 rounded-xl"
                style={{ background: '#25D366' }}
              >
                Order on WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 mt-6 text-center">
        Demo shop page. Orders via phone/WhatsApp are arranged directly with the shop owner.
      </p>
    </div>
  );
}
