'use client';
/**
 * Prominent homepage entry point for shopkeepers:
 * "आपका अपना लोकल बाज़ार — Register Your Shop".
 * Physical shop owners apply with shop name, phone, address + PIN;
 * after approval they list products and receive orders.
 */
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, ArrowRight } from 'lucide-react';

export function ShopkeeperCta() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/seller"
          className="btn-fx group relative block overflow-hidden rounded-[1.75rem] text-white shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #f59e0b 100%)' }}
        >
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full blur-3xl opacity-30 bg-yellow-200 pointer-events-none" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <span className="shrink-0 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
              <Store size={32} className="text-amber-200" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                🏪 आपका अपना लोकल बाज़ार — Register Your Shop
              </h2>
              <p className="mt-2 text-sm sm:text-base text-orange-100/90">
                दुकानदार हैं? अपनी दुकान ऑनलाइन लाएँ — नाम, फ़ोन, पता और पिन कोड से रजिस्टर करें।
              </p>
              <p className="mt-1 text-xs sm:text-sm text-orange-200/70">
                List products · get local orders · pickup or delivery — zero tech skills needed
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-2 bg-white text-orange-900 font-extrabold px-6 py-3 rounded-full shadow-lg group-hover:gap-3 transition-all">
              Register <ArrowRight size={18} />
            </span>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
