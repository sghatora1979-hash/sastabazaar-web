'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/categories';
import { searchProducts, Product } from '@/lib/products';
import { formatINR } from '@/lib/utils';
import { CategoryChips } from '@/components/store/CategoryChips';
import { BRAND } from '@/components/store/ProductCard';

/**
 * Amazon-style sticky header:
 * thin promo strip → logo | LARGE search | account + cart → category chip pills.
 */
export function Header() {
  const router = useRouter();
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
    // Mobile bottom-nav "Categories" button opens this drawer
    const openMenu = () => setMenuOpen(true);
    window.addEventListener('sb-open-menu', openMenu);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('sb-cart', update);
      window.removeEventListener('sb-open-menu', openMenu);
    };
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setResults([]);
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const pickResult = () => { setQuery(''); setResults([]); };

  return (
    <>
      {/* Thin promo strip */}
      <div className="text-white text-[11px] sm:text-xs" style={{ background: '#191919' }}>
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold truncate">🪔 Festival Sale is LIVE — up to 80% OFF</span>
          <span className="hidden sm:inline text-white/70">Free shipping over ₹499</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {/* Main bar: logo | big search | actions */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 pb-2 flex items-center gap-2 sm:gap-4">
          <button
            className="lg:hidden p-2 -ml-1 text-gray-700"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Sastabazaar home">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #E05E00)` }}
            >
              S
            </div>
            <div className="hidden md:block">
              <div className="font-extrabold text-[17px] leading-none text-gray-900 tracking-tight">
                Sasta<span style={{ color: BRAND }}>bazaar</span>
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">सस्ते सामान का बाज़ार</div>
            </div>
          </Link>

          {/* LARGE Amazon-style search */}
          <form onSubmit={submitSearch} className="flex-1 relative max-w-3xl">
            <div className="flex items-center bg-gray-100 rounded-full p-1 pl-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#fb7701]/40 transition">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search for products, brands and more…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                aria-label="Search products"
              />
              <button
                type="submit"
                aria-label="Search"
                className="shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md hover:brightness-110 transition"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #E05E00)` }}
              >
                <Search size={18} />
              </button>
            </div>

            {/* Autocomplete dropdown */}
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
                      onClick={pickResult}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                    >
                      <span className="relative w-10 h-10 shrink-0">
                        <Image src={p.image} alt="" fill className="rounded-lg object-cover" unoptimized />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{p.titleHi || p.title}</div>
                        <div className="text-[11px] text-gray-500 truncate">{p.title}</div>
                        <div className="text-xs text-gray-500">{formatINR(p.price)}</div>
                      </div>
                    </Link>
                  ))}
                  <button
                    type="submit"
                    className="w-full text-center text-[13px] font-bold py-2.5 bg-gray-50 hover:bg-gray-100"
                    style={{ color: BRAND }}
                  >
                    See all results for “{query}” →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Link href="/account" className="hidden sm:flex flex-col items-center px-2 py-1 text-gray-700 hover:text-gray-900" aria-label="Account">
              <User size={22} />
              <span className="text-[10px] font-semibold">Account</span>
            </Link>
            <Link href="/cart" className="relative flex flex-col items-center px-2 py-1 text-gray-700 hover:text-gray-900" aria-label="Cart">
              <ShoppingCart size={22} />
              <span className="text-[10px] font-semibold hidden sm:block">Cart</span>
              {cartCount > 0 && (
                <span
                  className="absolute top-0 right-1 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow"
                  style={{ background: BRAND }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Category chip pills */}
        <CategoryChips />
      </header>

      {/* Mobile / categories drawer */}
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
                <Link href="/naya" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">🆕 नया बाज़ार</Link>
                <Link href="/purana" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">♻️ पुराना बाज़ार</Link>
                <Link href="/clearance" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">🔥 क्लीयरेंस</Link>
                <Link href="/local" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">📍 लोकल</Link>
                <Link href="/local-bazaar" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-bold">🛍️ Aapka Apna Local Bazaar</Link>
                <Link href="/nursery" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">🌱 Local Nursery</Link>
                <Link href="/medicines" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">💊 Medicines</Link>
                <Link href="/festivals" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-bold">🪔 Festivals</Link>
                <Link href="/marketplace" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">🏪 Marketplace</Link>
                <Link href="/track" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">📦 Track Order</Link>
                <Link href="/contact" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Contact Us</Link>
                <Link href="/seller" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg font-bold text-white" style={{ background: BRAND }}>Sell on Sastabazaar</Link>
                <div className="border-t my-2" />
                <div className="text-xs font-bold text-gray-500 uppercase px-3 py-1">Categories</div>
                {CATEGORIES.map(c => (
                  <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm">
                    {c.emoji} {c.name}
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
