'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">श्रेणियाँ</h2>
        <p className="text-sm text-gray-500 mt-1">Browse by category</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {CATEGORIES.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -6, scale: 1.05 }}
          >
            <Link
              href={`/category/${c.slug}`}
              className="block bg-white rounded-2xl p-4 text-center shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="text-4xl mb-2">{c.emoji}</div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {c.name}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{c.nameHi}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
