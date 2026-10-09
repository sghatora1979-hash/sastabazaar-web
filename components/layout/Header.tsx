'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/categories';
import { searchProducts, Product } from '@/lib/products';
import { formatINR } from '@/lib/utils';

export function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setResults(searchProducts(query, 6));
  }, [query]);

  useEffect(() => {
    const update = () => {
      try {
        const c = JSON.parse(localStorage.getItem('sb-cart') || '[]');
        setCartCount(Array.isArray(c) ? c.length : 0);
      } catch { setCartCount(0); }
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener('sb-cart', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('sb-cart', update);
    };
  }, []);

  return (
    <>
      {/* Top strip */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <span>Free shipping over ₹499</span>
          <span className="hidden sm:inline">WhatsApp: +91 90000 00000</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-black text-lg shadow-lg">
              S
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-lg leading-none text-gray-900">
                Sastabazaar
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">सस्ते सामान का बाज़ार</div>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 relative max-w-2xl mx-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, brands…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:bg-white transition"
            />
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                >
                  {results.map(p => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => { setQuery(''); setResults([]); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                    >
                      <span className="relative w-10 h-10 shrink-0">
                        <Image src={p.image} alt="" fill className="rounded-lg object-cover" unoptimized />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-xs text-gray-500">{formatINR(p.price)}</div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link href="/account" className="p-2 hover:bg-gray-100 rounded-full transition" aria-label="Account">
              <User size={20} />
            </Link>
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
            <Link href="/naya" className="px-3 py-2 text-sm font-medium hover:text-[var(--primary)] whitespace-nowrap">नया बाज़ार</Link>
            <Link href="/purana" className="px-3 py-2 text-sm font-medium hover:text-[var(--primary)] whitespace-nowrap">पुराना बाज़ार</Link>
            <Link href="/clearance" className="px-3 py-2 text-sm font-medium hover:text-[var(--primary)] whitespace-nowrap">क्लीयरेंस</Link>
            <Link href="/local" className="px-3 py-2 text-sm font-medium hover:text-[var(--primary)] whitespace-nowrap">लोकल</Link>
            <Link href="/festivals" className="px-3 py-2 text-sm font-bold hover:text-[var(--primary)] whitespace-nowrap">🪔 Festivals</Link>
            <Link href="/marketplace" className="px-3 py-2 text-sm font-medium hover:text-[var(--primary)] whitespace-nowrap">Marketplace</Link>
            <Link href="/track" className="px-3 py-2 text-sm font-medium hover:text-[var(--primary)] whitespace-nowrap">Track Order</Link>
            <Link href="/seller" className="px-3 py-2 text-sm font-bold text-[var(--primary)] whitespace-nowrap">Sell on Sastabazaar</Link>
            <span className="w-px h-4 bg-gray-200 mx-1" />
            {CATEGORIES.slice(0, 8).map(c => (
              <Link key={c.id} href={`/category/${c.slug}`} className="px-3 py-2 text-sm text-gray-600 hover:text-[var(--primary)] whitespace-nowrap">
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 max-w-[80vw] h-full bg-white p-4 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Close"><X size={22} /></button>
              </div>
              <div className="space-y-1">
                <Link href="/naya" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">नया बाज़ार</Link>
                <Link href="/purana" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">पुराना बाज़ार</Link>
                <Link href="/clearance" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">क्लीयरेंस</Link>
                <Link href="/local" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">लोकल</Link>
                <Link href="/festivals" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-bold">🪔 Festivals</Link>
                <Link href="/marketplace" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Marketplace</Link>
                <Link href="/track" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Track Order</Link>
                <Link href="/contact" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Contact Us</Link>
                <Link href="/seller" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-bold">Sell on Sastabazaar</Link>
                <div className="border-t my-2" />
                <div className="text-xs font-bold text-gray-500 uppercase px-3 py-1">Categories</div>
                {CATEGORIES.map(c => (
                  <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm">
                    {c.name}
                  </Link>
                ))}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
