'use client';
/**
 * Cinematic Matrix-style homepage introduction.
 * Glowing green/gold/blue digital rain behind the brand lines.
 * Auto-hides its canvas when lightweight/reduced-motion is on.
 * Purely decorative — never blocks navigation.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MatrixRain } from '@/components/MatrixRain';
import { animationsOff } from '@/lib/display';

export function MatrixIntro() {
  const [fx] = useState(() => !animationsOff());

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#050806] text-center shadow-2xl">
        {fx && <MatrixRain className="absolute inset-0 w-full h-full opacity-60" density={0.45} />}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,8,6,0.85) 100%)' }} />

        <div className="relative px-6 py-10 sm:py-14">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-5xl font-black tracking-[0.18em]"
            style={{
              color: '#22ff88',
              textShadow: '0 0 18px rgba(34,255,136,.8), 0 0 60px rgba(34,255,136,.35)',
            }}
          >
            SASTABAZAAR
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-3 text-xl sm:text-3xl font-extrabold"
            style={{ color: '#ffd23f', textShadow: '0 0 16px rgba(255,210,63,.7)' }}
          >
            आपका अपना लोकल बाज़ार
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-3 text-xs sm:text-sm tracking-[0.28em] uppercase"
            style={{ color: '#4da6ff', textShadow: '0 0 12px rgba(77,166,255,.7)' }}
          >
            Your Local Market. Your Digital World.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
