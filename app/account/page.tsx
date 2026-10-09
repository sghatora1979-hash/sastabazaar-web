'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Package, Ticket, LogOut } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { getInteractions } from '@/lib/interactions';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { DisplaySettings } from '@/components/settings/DisplaySettings';

const COUPON_KEY = 'sb-coupons';

export default function AccountPage() {
  const [liked, setLiked] = useState<typeof PRODUCTS>([]);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const store = getInteractions();
    setLiked(PRODUCTS.filter(p => store.likes.includes(p.id)).slice(0, 8));
    try {
      setName(localStorage.getItem('sb-name') || '');
      const raw = localStorage.getItem(COUPON_KEY);
      setCoupons(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }, []);

  const saveName = () => {
    localStorage.setItem('sb-name', name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">My Account</h1>

      <h2 className="text-lg font-extrabold text-gray-900 mb-3">Display · डिस्प्ले</h2>
      <div className="mb-8 max-w-2xl">
        <DisplaySettings />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
            <User size={18} className="text-[var(--primary)]" /> Profile
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
          <motion.button whileTap={{ scale: 0.97 }} onClick={saveName} className="btn-primary mt-3 w-full font-bold py-2.5 rounded-xl text-sm">
            {saved ? 'Saved ✓' : 'Save'}
          </motion.button>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
            <Ticket size={18} className="text-[var(--primary)]" /> My Coupons ({coupons.length})
          </div>
          {coupons.length === 0 ? (
            <p className="text-sm text-gray-500">No coupons yet. <a href="/spin-and-win" className="text-[var(--primary)] font-semibold">Spin &amp; Win</a> to earn some!</p>
          ) : (
            <div className="space-y-2">
              {coupons.map((c, i) => (
                <div key={i} className="bg-[var(--primary)]/10 border border-dashed border-[var(--primary)]/40 rounded-xl px-3 py-2 text-sm font-bold text-[var(--primary)]">
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
            <Package size={18} className="text-[var(--primary)]" /> Orders
          </div>
          <p className="text-sm text-gray-500">No orders yet. Your orders will appear here after checkout.</p>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition"
          >
            <LogOut size={13} /> Reset demo data
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <Heart size={20} className="text-red-500" fill="currentColor" />
        <h2 className="text-xl font-extrabold text-gray-900">Liked by you</h2>
      </div>
      {liked.length === 0 ? (
        <p className="text-sm text-gray-500">Tap the heart on any product and it will show up here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {liked.map((p, i) => (
            <ProductCard3D key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
