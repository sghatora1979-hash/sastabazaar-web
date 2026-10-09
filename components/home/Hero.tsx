'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { HeroParallax } from '@/components/3d/HeroParallax';
import { BRAND } from '@/components/store/ProductCard';

/**
 * Modernized hero — cleaner premium banner: deep dark gradient with
 * warm orange glow, sharp typography, crisp CTAs. Same content & links.
 */
export function Hero() {
  const { theme } = useTheme();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <HeroParallax>
        <div className="relative overflow-hidden rounded-[1.75rem] text-white shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #141414 0%, #2A1503 60%, #4A2200 100%)' }}
        >
          {/* glow orbs */}
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: BRAND }} />
          <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: '#FFD23F' }} />
          {/* subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
              backgroundSize: '44px 44px'
            }}
          />

          <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/15">
                <Gift size={14} style={{ color: '#FFB25E' }} />
                {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)} Day Special · Extra 10% OFF
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
                सस्ते सामान का{' '}
                <span style={{ background: `linear-gradient(90deg, ${BRAND}, #FFB25E)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                  बाज़ार
                </span>
              </h1>
              <p className="mt-4 text-sm sm:text-lg text-white/70 max-w-xl mx-auto">
                Naya bhi. Purana bhi. Sabse sastey. — India&apos;s smartest 4-in-1 marketplace.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href="/naya"
                  className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-full shadow-xl hover:brightness-110 hover:scale-[1.03] transition w-full sm:w-auto justify-center"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, #E05E00)` }}
                >
                  Start Shopping <ArrowRight size={18} />
                </Link>
                <Link
                  href="/spin-and-win"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white font-bold px-8 py-3.5 rounded-full border border-white/20 hover:bg-white/15 transition w-full sm:w-auto"
                >
                  🎡 Spin &amp; Win
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 max-w-md mx-auto gap-4">
                <Stat label="Products" value="15,000+" />
                <Stat label="Sellers" value="500+" />
                <Stat label="Cities" value="12+" />
              </div>
            </motion.div>
          </div>

          {/* Marquee strip */}
          <div className="relative bg-black/30 backdrop-blur-md border-t border-white/10 overflow-hidden py-2.5">
            <div className="flex animate-marquee whitespace-nowrap">
              {[0, 1].map((k) => (
                <div key={k} className="flex items-center gap-8 px-4 text-white/70 text-xs sm:text-sm font-medium">
                  <span>Up to 80% OFF</span><span>·</span>
                  <span>Verified Second-hand</span><span>·</span>
                  <span>Local Pickup</span><span>·</span>
                  <span>Free Shipping over ₹499</span><span>·</span>
                  <span>UPI · COD · Card</span><span>·</span>
                  <span>Escrow Protected</span><span>·</span>
                  <span>Same-day Dispatch</span><span>·</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </HeroParallax>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-extrabold">{value}</div>
      <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{label}</div>
    </div>
  );
}
