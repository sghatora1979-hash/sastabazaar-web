'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const BAZAARS = [
  { id: 'naya',       label: 'नया बाज़ार',       sub: 'Brand New',        icon: '🆕', color: '#0B3D91', href: '/naya',       desc: 'Sealed products from verified sellers' },
  { id: 'purana',     label: 'पुराना बाज़ार',     sub: 'Second-hand',      icon: '♻️', color: '#22C55E', href: '/purana',     desc: 'Quality-checked pre-owned items' },
  { id: 'clearance',  label: 'क्लीयरेंस बाज़ार',  sub: '50–80% OFF',       icon: '🔥', color: '#DC2626', href: '/clearance',  desc: 'End of season & stock clearance' },
  { id: 'local',      label: 'लोकल बाज़ार',       sub: 'Pickup in city',   icon: '📍', color: '#FF6B35', href: '/local',      desc: 'Meet sellers, skip shipping' }
];

export function BazaarSelector() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          चार बाज़ार, एक जगह
        </h2>
        <p className="text-gray-500 mt-2">Four bazaars. One destination.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {BAZAARS.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 40, rotateX: -15 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 120 }}
            whileHover={{ y: -8, scale: 1.03, rotateY: 5 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer shadow-2xl group perspective-1000"
            style={{
              background: `linear-gradient(135deg, ${b.color}, ${b.color}cc)`,
              transformStyle: 'preserve-3d'
            }}
          >
            <Link href={b.href} className="block p-5 sm:p-7 text-white">
              <div className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {b.icon}
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold leading-tight">{b.label}</h3>
              <p className="text-sm opacity-90 mt-1">{b.sub}</p>
              <p className="hidden sm:block text-xs opacity-80 mt-2 leading-snug">{b.desc}</p>
              <div className="mt-4 text-sm font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                SHOP <span>→</span>
              </div>
              <div
                className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ background: b.color }}
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
