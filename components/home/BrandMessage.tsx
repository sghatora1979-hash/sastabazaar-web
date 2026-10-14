'use client';
/** Final brand message block (Update 13 spec §13). */
import { motion } from 'framer-motion';

export function BrandMessage() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-10 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[1.75rem] bg-gray-950 text-center px-6 py-12 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(34,255,136,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,255,136,.35) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="relative">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            <span className="text-white">SASTABAZAAR</span>{' '}
            <span className="text-emerald-400">— आपका अपना लोकल बाज़ार</span>
          </h2>
          <p className="mt-4 text-base sm:text-xl text-emerald-200 font-semibold">
            अब हर दुकानदार डिजिटल। हर ग्राहक के करीब।
          </p>
          <p className="mt-2 text-sm sm:text-base text-gray-300">
            Local Shopping. National Reach. One Digital Bazaar.
          </p>
          <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
            Support Your Local Shop. Discover Better Prices. Sell Online with Ease.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
