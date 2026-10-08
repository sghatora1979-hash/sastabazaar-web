'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

export function HeroParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const yFg = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y: yBg }} className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      </motion.div>
      <motion.div style={{ y: yFg, opacity }} className="relative">
        {children}
      </motion.div>
    </div>
  );
}
