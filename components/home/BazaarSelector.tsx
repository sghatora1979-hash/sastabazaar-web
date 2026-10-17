'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getProductsBySection, getProductsByCategory, Product, Section } from '@/lib/products';
import { ProductCard } from '@/components/store/ProductCard';

/** Update 26: Books bazaar added; every card expands inline to show its
 *  categories (no full-page jump needed to browse).
 *  Update 27: tapping a card now opens its ITEMS inline below (mobile-app
 *  style accordion) — Naya shows new items, Purana shows old items, etc. */
const BAZAARS = [
  {
    id: 'naya', label: 'नया बाज़ार', sub: 'Brand New', icon: '🆕', color: '#0B3D91',
    href: '/naya', desc: 'Sealed products from verified sellers',
    cats: ['Electronics', 'Fashion', 'Books', 'Home & Kitchen', 'Mobiles', 'Appliances'],
    catHrefs: ['/category/electronics', '/category/fashion-men', '/category/books', '/category/home', '/category/mobiles', '/category/appliances'],
  },
  {
    id: 'purana', label: 'पुराना बाज़ार', sub: 'Second-hand', icon: '♻️', color: '#22C55E',
    href: '/purana', desc: 'Quality-checked pre-owned items',
    cats: ['Purani Books', 'Purane Tables', 'Purani Chairs', 'Purana Samaan', 'Purani Ghadiyan', 'Purana Furniture'],
    catHrefs: ['/purana', '/purana', '/purana', '/purana', '/purana', '/purana'],
  },
  {
    id: 'clearance', label: 'क्लीयरेंस बाज़ार', sub: '50–80% OFF', icon: '🔥', color: '#DC2626',
    href: '/clearance', desc: 'End of season & stock clearance',
    cats: ['Electronics', 'Books', 'Clothes', 'Footwear', 'Home', 'Toys'],
    catHrefs: ['/clearance', '/clearance', '/clearance', '/clearance', '/clearance', '/clearance'],
  },
  {
    id: 'local', label: 'लोकल बाज़ार', sub: 'Pickup in city', icon: '📍', color: '#FF6B35',
    href: '/local', desc: 'Meet sellers, skip shipping',
    cats: ['Nearby Shops', 'Fresh Grocery', 'Local Fashion', 'Home Needs'],
    catHrefs: ['/local', '/local', '/local', '/local'],
  },
  {
    id: 'books', label: 'किताबें बाज़ार', sub: 'Books', icon: '📚', color: '#7C3AED',
    href: '/books', desc: 'Syllabus, competitive & degree books — new & old',
    cats: ['NCERT', 'CBSE', 'ICSE', 'State Boards', 'Engineering', 'Medical', 'UPSC', 'BA / BCom / BSc'],
    catHrefs: ['/books', '/books', '/books', '/books', '/books', '/books', '/books', '/books'],
  },
];

/** Update 27: inline product strip — mobile-app style. Tap a bazaar card
 *  and its items open right below (no page change). */
function BazaarItems({ bazaarId, href, label }: { bazaarId: string; href: string; label: string }) {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const list = bazaarId === 'books'
      ? getProductsByCategory('10', undefined, 10)
      : getProductsBySection(bazaarId as Section, 10);
    setItems(list);
  }, [bazaarId]);

  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin">
        {items.map((p) => (
          <div key={p.id} className="w-36 sm:w-44 shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <Link
        href={href}
        className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-white underline underline-offset-4"
      >
        VIEW ALL {label} →
      </Link>
    </div>
  );
}

export function BazaarSelector() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          पाँच बाज़ार, एक जगह
        </h2>
        <p className="text-gray-500 mt-2">Five bazaars. One destination. Tap a card — items open right below, like a mobile app.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {BAZAARS.map((b, i) => {
          const isOpen = open === b.id;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 40, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 120 }}
              className={`relative rounded-3xl overflow-hidden shadow-2xl group perspective-1000 ${isOpen ? 'col-span-2 md:col-span-3 lg:col-span-5' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${b.color}, ${b.color}cc)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : b.id)}
                className="block w-full p-5 sm:p-7 text-white text-left"
                aria-expanded={isOpen}
              >
                <div className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {b.icon}
                </div>
                <h3 className="text-lg sm:text-2xl font-extrabold leading-tight">{b.label}</h3>
                <p className="text-sm opacity-90 mt-1">{b.sub}</p>
                <p className="hidden sm:block text-xs opacity-80 mt-2 leading-snug">{b.desc}</p>
                <div className="mt-4 text-sm font-bold inline-flex items-center gap-2">
                  {isOpen ? 'CLOSE ✕' : 'ITEMS ▾'}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-7 pb-6">
                      <div className="flex flex-wrap gap-2">
                        {b.cats.map((c, j) => (
                          <Link
                            key={c}
                            href={b.catHrefs[j]}
                            className="text-xs sm:text-sm font-bold bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/30 text-white px-3.5 py-2 rounded-full transition"
                          >
                            {c}
                          </Link>
                        ))}
                      </div>
                      {/* Update 27: items open inline, mobile-app style */}
                      <BazaarItems bazaarId={b.id} href={b.href} label={b.label} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ background: b.color }}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
