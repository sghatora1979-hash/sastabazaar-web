import Link from 'next/link';
import { CheckCircle2, Clock3, Landmark } from 'lucide-react';

/**
 * /roadmap — honest "what works now vs what needs bank/financial registration".
 * The user asked: add whatever can be live now; write down what is not possible
 * yet and will need bank + financial registration.
 */

const LIVE_NOW: { hi: string; en: string }[] = [
  { hi: 'लोकल बाज़ार — दुकानें, फोन नंबर, WhatsApp ऑर्डर', en: 'Local Bazaar directory with shop photos, phone & WhatsApp ordering (demo data + browser-saved shops)' },
  { hi: 'नर्सरी लिस्टिंग और डेमो रजिस्ट्रेशन', en: 'Nursery listings + demo phone onboarding (browser storage)' },
  { hi: 'दुकान रजिस्ट्रेशन — फोटो के साथ', en: 'Shop registration with shop photo + public shop pages (demo)' },
  { hi: 'हिंदी-पहले प्रोडक्ट नाम', en: 'Hindi-first product names across cards, search, cart' },
  { hi: 'दवा कैटेगरी — डेमो लिस्टिंग', en: 'Medicine categories as demo listings with licensed-pharmacy disclaimer (no sales)' },
  { hi: 'सोशल शेयर — WhatsApp/Telegram/Facebook/कॉपी लिंक', en: 'Social share links + YouTube description kit (share links only, never fake "posted" claims)' },
  { hi: 'Matrix 3D लुक + त्योहार मोड', en: 'Matrix-style visuals, Diwali greeting, reduced-motion & lightweight modes' },
  { hi: 'सर्च — हिंदी + English', en: 'Hindi + English search, filters, recently viewed' },
  { hi: 'फीडबैक फॉर्म', en: 'Customer/seller feedback form (browser storage)' },
];

const NEEDS_BANK: { hi: string; en: string; why: string }[] = [
  { hi: 'असली OTP वेरिफिकेशन', en: 'Real SMS OTP verification', why: 'Needs an SMS provider account + backend server to send and verify codes securely.' },
  { hi: 'ऑनलाइन पेमेंट (UPI/कार्ड/COD सेटलमेंट)', en: 'Online payments (UPI/cards) & seller payouts', why: 'Needs Razorpay / PhonePe Business / PayPal Business merchant accounts — these require bank account + KYC + business registration.' },
  { hi: 'सुरक्षित बैकएंड और डेटाबेस', en: 'Secure backend + database', why: 'Shops, orders, customers and KYC must live on a server database — browser storage is demo-only and wipes on device change.' },
  { hi: 'KYC डॉक्यूमेंट स्टोरेज', en: 'KYC document storage (Aadhaar etc.)', why: 'Needs encrypted server storage — never in GitHub or browser. Requires backend + legal review.' },
  { hi: 'असली दवा बिक्री', en: 'Real medicine sales', why: 'Needs a licensed pharmacy partner, drug licences, prescription verification and legal review. Demo listings only until then.' },
  { hi: 'इंटीग्रेटेड शिपिंग', en: 'Integrated shipping (auto courier booking)', why: 'Needs Shiprocket/Delhivery business accounts + backend order pipeline.' },
  { hi: 'रियल लकी ड्रा प्राइज़', en: 'Real-money Lucky Draw prizes', why: 'Needs Indian prize-law legal review + audited draw process before any real prize.' },
  { hi: 'विक्रेता टैक्स/GST वेरिफिकेशन', en: 'Seller GST/tax verification', why: 'Needs backend verification flow + CA/legal sign-off on the seller agreement.' },
];

export default function RoadmapPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          🗺️ अब क्या लाइव है, आगे क्या चाहिए
        </h1>
        <p className="text-sm text-gray-500 mt-2 font-bold">What works now · What needs bank & financial registration</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
        <h2 className="font-extrabold text-emerald-900 flex items-center gap-2 mb-3">
          <CheckCircle2 size={20} /> ✅ Live now (demo) · अभी उपलब्ध
        </h2>
        <ul className="space-y-2">
          {LIVE_NOW.map((x, i) => (
            <li key={i} className="text-sm text-emerald-900">
              <span className="font-bold">{x.hi}</span>
              <span className="text-emerald-700"> — {x.en}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h2 className="font-extrabold text-amber-900 flex items-center gap-2 mb-1">
          <Landmark size={20} /> 🏦 Bank & financial registration के बाद
        </h2>
        <p className="text-xs text-amber-700 mb-4 flex items-center gap-1">
          <Clock3 size={13} /> Once bank accounts, payment gateways and business registration are done, these unlock:
        </p>
        <ul className="space-y-4">
          {NEEDS_BANK.map((x, i) => (
            <li key={i} className="text-sm">
              <p className="font-bold text-amber-900">{x.hi} <span className="font-medium text-amber-700">· {x.en}</span></p>
              <p className="text-amber-700 text-xs mt-0.5">{x.why}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center mt-8">
        <Link href="/seller" className="btn-fx inline-block bg-gray-900 text-white font-extrabold px-8 py-3 rounded-full">
          Seller Center
        </Link>
      </div>
    </div>
  );
}
