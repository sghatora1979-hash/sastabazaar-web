'use client';
/**
 * Prominent homepage entry point: "🛍️ आपका अपना लोकल बाज़ार"
 */
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, ArrowRight } from 'lucide-react';

export function LocalBazaarButton() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/local-bazaar"
          className="btn-fx group relative block overflow-hidden rounded-[1.75rem] text-white shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #065f46 55%, #0d9488 100%)' }}
        >
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full blur-3xl opacity-30 bg-emerald-300 pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 bg-yellow-300 pointer-events-none" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <span className="shrink-0 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
              <Store size={32} className="text-emerald-200" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                🛍️ आपका अपना लोकल बाज़ार
              </h2>
              <p className="mt-2 text-sm sm:text-base text-emerald-100/90">
                अपने शहर की दुकानें, अपने मोहल्ले के दुकानदार — अब ऑनलाइन भी।
              </p>
              <p className="mt-1 text-xs sm:text-sm text-emerald-200/70">
                Nearby shops · real phone numbers · pickup or local delivery
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-2 bg-white text-emerald-900 font-extrabold px-6 py-3 rounded-full shadow-lg group-hover:gap-3 transition-all">
              Explore <ArrowRight size={18} />
            </span>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
