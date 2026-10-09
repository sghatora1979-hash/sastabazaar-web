'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, PenLine, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { ensureSeed, getSessionSeller, saveAgreement, COMMISSION_RATE, COMMISSION_MAX_PER_ORDER, COMMISSION_OLD_FLAT } from '@/lib/seller';
import { formatINR } from '@/lib/utils';

export default function SellerAgreement() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    ensureSeed();
    const s = getSessionSeller();
    if (!s) { router.replace('/seller'); return; }
    if (s.kycStatus !== 'verified') { router.replace('/seller/kyc'); return; }
    if (s.agreement) { router.replace('/seller/dashboard'); return; }
    setSellerId(s.id);
    setSellerName(s.name);
  }, [router]);

  const sign = () => {
    setError('');
    if (!agreed) { setError('Please tick the box to accept the agreement.'); return; }
    if (signature.trim().toLowerCase() !== sellerName.trim().toLowerCase()) {
      setError(`Type your full name exactly as registered: ${sellerName}`);
      return;
    }
    saveAgreement(sellerId, signature.trim());
    router.replace('/seller/dashboard');
  };

  const clauses: { title: string; body: string }[] = [
    {
      title: '1. Parties',
      body: `This Seller Agreement is between SastaBazaar (operated by Sandeep Singh, Head Office: Bangalore, Karnataka, India) and the seller "${sellerName || '[Seller Name]'}".`,
    },
    {
      title: '2. Genuine products only',
      body: 'The seller lists only genuine products with true prices, MRP, stock quantity and photos. Fake, counterfeit or misleading listings lead to immediate removal and account closure.',
    },
    {
      title: '3. Shipping by seller',
      body: 'The seller ships every order within 48 hours of receiving it, packs items safely, and enters the courier tracking ID in the seller dashboard. The customer tracks the order live.',
    },
    {
      title: '4. Commission',
      body: `Two rates. NEW products: ${Math.round(COMMISSION_RATE * 100)}% of the order subtotal, maximum ${formatINR(COMMISSION_MAX_PER_ORDER)} per order \u2014 anything above the cap is a discount from SastaBazaar's side, the seller never pays more. OLD / REFURBISHED / CLEARANCE products: flat ${formatINR(COMMISSION_OLD_FLAT)} per piece, no percentage.`,
    },
    {
      title: '5. Payouts',
      body: 'Seller payout = order subtotal minus SastaBazaar commission. Payouts are settled to the seller\u2019s registered bank account / UPI on the weekly settlement cycle.',
    },
    {
      title: '6. Returns & refunds',
      body: '7-day easy returns. The seller accepts returns for defective, damaged or wrong items. Return shipping for seller-fault cases is borne by the seller.',
    },
    {
      title: '7. KYC',
      body: 'Aadhaar + selfie verification is mandatory before the first payout. SastaBazaar stores KYC documents securely and never shares them.',
    },
    {
      title: '8. Termination',
      body: 'Either party may end this agreement with 7 days written notice. Fraud, fake products or repeated non-shipment ends the agreement immediately, with pending payouts held during investigation.',
    },
    {
      title: '9. E-signature',
      body: 'Typing your full registered name below counts as your digital signature accepting this agreement (demo mode).',
    },
    {
      title: '10. Marketing by SastaBazaar',
      body: 'Marketing is handled 100% by SastaBazaar — Facebook, Instagram, Google, hoardings and everywhere else. The seller gets full access to publish products and set prices, and grants SastaBazaar the right to use product photos, titles and prices for advertising. The seller does not need to spend on marketing.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
            <FileText size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Seller Agreement</h1>
            <p className="text-sm text-gray-500">The contract between you and SastaBazaar. Read it fully.</p>
          </div>
        </div>

        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span><b>Demo draft:</b> this is a starting template. Before real launch, have a lawyer in India finalise it for e-commerce regulations.</span>
        </div>

        <div className="mt-5 max-h-96 overflow-y-auto border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50">
          <p className="text-center font-black text-gray-900">SASTABAZAAR SELLER AGREEMENT</p>
          {clauses.map(c => (
            <div key={c.title}>
              <p className="font-bold text-sm text-gray-900">{c.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{c.body}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-2">Draft version 1.0 · Demo mode</p>
        </div>

        <label className="flex items-start gap-2 mt-5 cursor-pointer text-sm text-gray-700">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-[var(--primary)]" />
          <span>I have read the full agreement above and I accept all its terms as a SastaBazaar seller.</span>
        </label>

        <label className="block mt-4">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <PenLine size={15} /> Digital signature — type your full name ({sellerName})
          </span>
          <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Type your full name"
            className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
        </label>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button onClick={sign} className="btn-primary w-full font-bold py-3.5 rounded-2xl mt-5">
          Sign Agreement & Open Dashboard
        </button>
        <button onClick={() => router.push('/seller/dashboard')} className="w-full text-sm text-gray-500 mt-3">
          I&apos;ll sign later
        </button>

        <a href="/seller-agreement-form.pdf" download
          className="mt-3 w-full inline-flex items-center justify-center gap-2 font-bold py-3 rounded-2xl border-2 border-gray-200 text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)] transition text-sm">
          <Download size={17} /> Download printable form (PDF) — sign on paper & paste Aadhaar + PAN
        </a>
      </motion.div>
    </div>
  );
}
