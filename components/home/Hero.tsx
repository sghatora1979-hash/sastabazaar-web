'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/components/ui/ThemeProvider';
import { HeroParallax } from '@/components/3d/HeroParallax';

export function Hero() {
  const { theme } = useTheme();

  return (
    <HeroParallax>
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}
      >
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/30">
              {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)} Day Special · Extra 10% OFF
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              सस्ते सामान का<br />
              <span className="text-white/90">बाज़ार</span>
            </h1>
            <p className="mt-4 text-base sm:text-xl text-white/90 max-w-2xl mx-auto">
              Naya bhi. Purana bhi. Sabse sastey. India&apos;s smartest 4-in-1 marketplace.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/naya"
                className="bg-white text-gray-900 font-bold px-8 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-transform w-full sm:w-auto text-center"
              >
                Start Shopping →
              </Link>
              <Link
                href="/spin-and-win"
                className="bg-black/20 backdrop-blur-md text-white font-bold px-8 py-3.5 rounded-full border border-white/30 hover:bg-black/30 transition w-full sm:w-auto text-center"
              >
                Spin &amp; Win
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 max-w-lg mx-auto gap-4 text-white">
              <Stat label="Products" value="15,000+" />
              <Stat label="Sellers" value="500+" />
              <Stat label="Cities" value="12+" />
            </div>
          </motion.div>
        </div>

        {/* Marquee strip */}
        <div className="relative bg-black/20 backdrop-blur-md border-t border-white/20 overflow-hidden py-2.5">
          <div className="flex animate-marquee whitespace-nowrap">
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center gap-8 px-4 text-white/90 text-sm font-medium">
                <span>Up to 80% OFF</span>
                <span>Verified Second-hand</span>
                <span>Local Pickup</span>
                <span>Free Shipping over ₹499</span>
                <span>UPI · COD · Card</span>
                <span>Escrow Protected</span>
                <span>WhatsApp Support</span>
                <span>Same-day Dispatch</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </HeroParallax>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-extrabold">{value}</div>
      <div className="text-xs text-white/80 uppercase tracking-wider">{label}</div>
    </div>
  );
}
