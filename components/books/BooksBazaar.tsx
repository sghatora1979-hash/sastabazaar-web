'use client';
import { useMemo, useState } from 'react';
import { getProductsByCategory } from '@/lib/products';
import { ProductCard3D } from '@/components/3d/ProductCard3D';

/** Update 26 — Kitabein Bazaar: New / Old tabs + syllabus category chips. */
const BOOK_CHIPS = [
  'All', 'NCERT', 'CBSE', 'ICSE', 'State Boards', 'Hindi Books',
  'Engineering', 'Medical', 'UPSC', 'BA', 'BCom', 'BSc', 'MSc', 'BEd',
];

export function BooksBazaar() {
  const [tab, setTab] = useState<'naya' | 'purana'>('naya');
  const [chip, setChip] = useState('All');

  const products = useMemo(() => {
    const all = getProductsByCategory('10', tab, 60); // category 10 = Books
    if (chip === 'All') return all;
    const q = chip.toLowerCase();
    return all.filter(p =>
      p.subcategory.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.titleHi.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }, [tab, chip]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div
        className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
      >
        <div className="text-6xl mb-3">📚</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold">किताबें बाज़ार</h1>
        <p className="text-white/90 mt-2 text-lg">Syllabus, competitive & degree books — new and pre-owned</p>
        <p className="text-white/70 mt-1 text-sm max-w-2xl">
          NCERT · CBSE · ICSE · State Boards · Engineering · Medical · UPSC · BA / BCom / BSc / MSc / BEd
        </p>
        <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30">
          {products.length} books live
        </div>
      </div>

      {/* New / Old tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'naya' as const, label: '📗 Nayi Kitabein', sub: 'Brand new' },
          { id: 'purana' as const, label: '📖 Purani Kitabein', sub: 'Old prices' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none sm:px-8 py-3 rounded-2xl font-extrabold text-sm border-2 transition ${tab === t.id
              ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            {t.label}
            <span className="block text-[11px] font-normal opacity-70">{t.sub}</span>
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-4 px-4">
        {BOOK_CHIPS.map(c => (
          <button
            key={c}
            onClick={() => setChip(c)}
            className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full border-2 transition ${chip === c
              ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-500 text-sm">
          📚 No books here yet — sellers, list your books from the seller dashboard!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p, i) => (
            <ProductCard3D key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
