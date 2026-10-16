'use client';
/**
 * Diwali-season festival greeting with CSS diyas.
 * Pure CSS/SVG — no heavy assets, respects reduced motion via .btn-fx rules.
 */
import { motion } from 'framer-motion';
import Link from 'next/link';

function Diya() {
  return (
    <div className="relative w-10 h-12 mx-2" aria-hidden="true">
      {/* flame */}
      <div className="diya-flame absolute left-1/2 -translate-x-1/2 top-0 w-3 h-5 rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 70%, #fff7cc 0%, #ffd23f 45%, #ff7b00 100%)' }} />
      {/* diya body */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-5 rounded-b-full"
        style={{ background: 'linear-gradient(180deg, #a0522d, #6b3410)' }} />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-black/40" />
    </div>
  );
}

export function FestivalGreeting() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[1.75rem] text-center text-white shadow-2xl px-6 py-10"
        style={{ background: 'linear-gradient(135deg, #2a0a4a 0%, #7b1e2b 55%, #b45309 100%)' }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #ffd23f 0, transparent 40%), radial-gradient(circle at 80% 70%, #ff7b00 0, transparent 45%)' }} />
        <div className="relative">
          <div className="flex justify-center items-end mb-4">
            <Diya /><Diya /><Diya /><Diya /><Diya />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold leading-snug">
            आप सभी को आने वाले त्योहारों की<br className="sm:hidden" /> हार्दिक शुभकामनाएँ! 🪔
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/85 max-w-2xl mx-auto">
            Celebrate Every Festival. Support Local Businesses. Shop with SastaBazaar.
          </p>
          <Link
            href="/festivals"
            className="btn-fx inline-block mt-5 bg-gradient-to-r from-amber-400 to-orange-500 text-purple-950 font-extrabold px-8 py-3 rounded-full shadow-xl"
          >
            🪔 Festival Specials
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
