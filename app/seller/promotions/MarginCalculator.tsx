'use client';

// SastaBazaar Margin Calculator — PRICING ENGINE v2 (2026-10-12).
// Seller enters: my cost ₹, selling price ₹, shipping ₹, category.
// Live breakdown: platform fee, payment fee, profit, margin % + warning.
// Big click-only inputs, Hindi + English labels.

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { calcMargin, WARNING_TEXT, type MarginWarning } from '@/lib/margin';
import { formatPaise, slugToRateKey, getCategoryRate } from '@/lib/commission';

const WARN_STYLE: Record<MarginWarning, string> = {
  negative: 'bg-red-50 border-red-300 text-red-900',
  low: 'bg-amber-50 border-amber-300 text-amber-900',
  ok: 'bg-green-50 border-green-300 text-green-900',
};

const WARN_EMOJI: Record<MarginWarning, string> = {
  negative: '🔴',
  low: '🟡',
  ok: '🟢',
};

export function MarginCalculator() {
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [shipping, setShipping] = useState('');
  const [cat, setCat] = useState('grocery');

  const result = useMemo(() => {
    const costPaise = Math.round((Number(cost) || 0) * 100);
    const pricePaise = Math.round((Number(price) || 0) * 100);
    const shippingPaise = Math.round((Number(shipping) || 0) * 100);
    if (!pricePaise) return null;
    return {
      ...calcMargin({ costPaise, pricePaise, shippingPaise, category: slugToRateKey(cat) }),
      ratePct: getCategoryRate(slugToRateKey(cat)) * 100,
    };
  }, [cost, price, shipping, cat]);

  const inputCls =
    'w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:border-blue-500 focus:outline-none';

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <h2 className="text-xl font-extrabold mb-1">🧮 Margin Calculator <span className="text-gray-500 font-normal text-sm">/ मार्जिन कैलकुलेटर</span></h2>
      <p className="text-gray-500 text-sm mb-4">
        Pehle hisaab lagao, phir becho! Enter your numbers — see your real profit before listing.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-bold">My cost ₹ <span className="text-gray-500 font-normal">/ मेरी लागत</span></span>
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. 70"
            inputMode="decimal" className={inputCls} />
        </label>
        <label className="block">
          <span className="font-bold">Selling price ₹ <span className="text-gray-500 font-normal">/ बिक्री कीमत</span></span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 100"
            inputMode="decimal" className={inputCls} />
        </label>
        <label className="block">
          <span className="font-bold">Shipping + packing ₹ <span className="text-gray-500 font-normal">/ शिपिंग</span></span>
          <input value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="e.g. 8"
            inputMode="decimal" className={inputCls} />
        </label>
        <label className="block">
          <span className="font-bold">Category <span className="text-gray-500 font-normal">/ श्रेणी</span></span>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.name} / {c.nameHi}
              </option>
            ))}
          </select>
        </label>
      </div>

      {result ? (
        <div className="mt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500">Platform fee ({result.ratePct}%)</div>
              <div className="font-extrabold text-lg">{formatPaise(result.platformFeePaise)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500">Payment fee (~2%)</div>
              <div className="font-extrabold text-lg">{formatPaise(result.paymentFeePaise)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500">Shipping</div>
              <div className="font-extrabold text-lg">{formatPaise(result.shippingPaise)}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="text-xs text-gray-500">Your profit / आपका मुनाफा</div>
              <div className={`font-extrabold text-lg ${result.netProfitPaise < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                {formatPaise(result.netProfitPaise)}
              </div>
              <div className="text-xs text-gray-500">margin {result.marginPct}%</div>
            </div>
          </div>
          <div className={`mt-4 p-4 border-2 rounded-xl font-semibold ${WARN_STYLE[result.warning]}`}>
            {WARN_EMOJI[result.warning]} {WARNING_TEXT[result.warning].en}
            <br />{WARN_EMOJI[result.warning]} {WARNING_TEXT[result.warning].hi}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-gray-400 text-center">Selling price daalo — breakdown yahan dikhega. / Enter a selling price to see the breakdown.</p>
      )}
    </div>
  );
}
