'use client';
/**
 * /local-bazaar — Aapka Apna Local Bazaar.
 * Nearby shops with filters: city, area, PIN, category, price, delivery.
 */
import { useMemo, useState } from 'react';
import { filterShops, shopCategories, DeliveryMode } from '@/lib/local-shops';
import { ShopCard } from '@/components/ShopCard';
import { Search } from 'lucide-react';

export default function LocalBazaarPage() {
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pin, setPin] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [delivery, setDelivery] = useState<DeliveryMode | ''>('');

  const shops = useMemo(
    () =>
      filterShops({
        city: city || undefined,
        area: area || undefined,
        pin: pin || undefined,
        category: category || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        delivery: delivery || undefined,
      }),
    [city, area, pin, category, maxPrice, delivery]
  );

  const input =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          🛍️ आपका अपना लोकल बाज़ार
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500">
          अपने शहर की दुकानें, अपने मोहल्ले के दुकानदार — अब ऑनलाइन भी।
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Nearby shops · real phone numbers · pickup or local delivery · Demo listings
        </p>
      </div>

      {/* Filters */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2 sm:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City · शहर" className={`${input} pl-9`} />
          </div>
          <input value={area} onChange={e => setArea(e.target.value)} placeholder="Area · मोहल्ला" className={input} />
          <input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN code" inputMode="numeric" className={input} />
          <select value={category} onChange={e => setCategory(e.target.value)} className={input} aria-label="Category">
            <option value="">All categories</option>
            {shopCategories().map(c => (
              <option key={c.en} value={c.en}>{c.hi} · {c.en}</option>
            ))}
          </select>
          <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className={input} aria-label="Max price">
            <option value="">Any price</option>
            <option value="200">Under ₹200</option>
            <option value="500">Under ₹500</option>
            <option value="1000">Under ₹1,000</option>
            <option value="5000">Under ₹5,000</option>
          </select>
          <select value={delivery} onChange={e => setDelivery(e.target.value as DeliveryMode | '')} className={input} aria-label="Delivery">
            <option value="">Any delivery</option>
            <option value="pickup">दुकान से लें · Pickup</option>
            <option value="local">लोकल डिलीवरी · Local</option>
            <option value="national">पूरे भारत में · National</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        <span className="font-bold text-gray-900">{shops.length}</span> local shops found
      </p>

      {shops.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">🏪</div>
          <p className="font-bold text-gray-700">No shops match your filters</p>
          <p className="text-sm mt-1">Try clearing a filter — or register your own shop below!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map(s => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <a href="/sell-local" className="btn-fx inline-block bg-emerald-600 text-white font-extrabold px-8 py-3.5 rounded-full shadow-xl">
          अपनी दुकान ऑनलाइन लाएँ · Register Your Shop
        </a>
        <p className="text-xs text-gray-400 mt-2">Free demo registration · 2 minutes · सिर्फ फोन नंबर से शुरू करें</p>
      </div>
    </div>
  );
}
