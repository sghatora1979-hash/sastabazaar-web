import Image from 'next/image';
import { MEDICINE_CATEGORIES, medicinesByCategory, MEDICINE_DISCLAIMER, MEDICINE_DISCLAIMER_HI, MedicineCategoryId } from '@/lib/medicines';
import { HindiName } from '@/components/HindiName';
import { formatINR } from '@/lib/utils';
import { ShieldAlert, Stethoscope } from 'lucide-react';

function CategorySection({ id }: { id: MedicineCategoryId }) {
  const cat = MEDICINE_CATEGORIES.find(c => c.id === id)!;
  const meds = medicinesByCategory(id);
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl">{cat.emoji}</span>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{cat.nameHi}</h2>
          <p className="text-sm text-gray-500">{cat.name}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">{cat.blurbHi} {cat.blurb}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {meds.map(m => (
          <div key={m.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100">
            <div className="relative aspect-square bg-gray-50">
              <Image src={m.image} alt={m.nameHi} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" unoptimized />
              <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Demo</span>
            </div>
            <div className="p-2.5 sm:p-3">
              <HindiName hi={m.nameHi} en={m.name} size="card" />
              <p className="text-[10px] text-gray-400 mt-1">{m.manufacturer} · {m.packHi}</p>
              <p className="text-[10px] text-gray-400">{m.expiryNote} · Seller: {m.seller}, {m.city}</p>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-[16px] font-extrabold text-gray-900">{formatINR(m.price)}</span>
                {m.mrp > m.price && <span className="text-[11px] text-gray-400 line-through">{formatINR(m.mrp)}</span>}
              </div>
              <button disabled className="mt-2 w-full text-xs font-bold py-2 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed" title="Demo only">
                Not for sale (demo)
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MedicinesPage() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">दवाइयाँ <span className="text-lg text-gray-400 font-semibold">· Medicines</span></h1>
        <p className="text-sm text-gray-500 mt-2">होम्योपैथिक · आयुर्वेदिक · बिना पर्चे मिलने वाली — demo categories</p>
      </div>

      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 mb-8 flex gap-3">
        <ShieldAlert size={28} className="shrink-0 text-amber-600" />
        <div>
          <p className="font-extrabold text-amber-900 text-sm sm:text-base">{MEDICINE_DISCLAIMER_HI}</p>
          <p className="text-amber-800 text-xs sm:text-sm mt-1">{MEDICINE_DISCLAIMER}</p>
          <p className="text-amber-700 text-xs mt-2 flex items-center gap-1">
            <Stethoscope size={13} /> 18+ only. Prescription medicines are never sold as OTC. No treatment or cure claims are made on this page.
          </p>
        </div>
      </div>

      <CategorySection id="homeopathic" />
      <CategorySection id="ayurvedic" />
      <CategorySection id="otc" />
    </div>
  );
}
