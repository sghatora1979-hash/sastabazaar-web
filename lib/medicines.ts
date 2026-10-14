/**
 * Medicine categories — DEMO LISTINGS ONLY.
 *
 * These are sample catalog entries for UI demonstration. Real medicine sales
 * in India require a licensed pharmacy, valid drug licences, prescription
 * verification for scheduled drugs, and age checks. SastaBazaar does NOT
 * sell medicines today. Nothing here is a treatment recommendation and no
 * cure/efficacy claims are made. See /medicines for the on-page disclaimer.
 */

export type MedicineCategoryId = 'homeopathic' | 'ayurvedic' | 'otc';

export type MedicineCategory = {
  id: MedicineCategoryId;
  nameHi: string;
  name: string;
  emoji: string;
  blurb: string;
  blurbHi: string;
};

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  {
    id: 'homeopathic',
    nameHi: 'होम्योपैथिक दवाइयाँ',
    name: 'Homeopathic Medicines',
    emoji: '💧',
    blurb: 'Demo listings. Traditional homeopathic products — not clinically proven treatments.',
    blurbHi: 'डेमो लिस्टिंग। पारंपरिक होम्योपैथिक उत्पाद।',
  },
  {
    id: 'ayurvedic',
    nameHi: 'आयुर्वेदिक दवाइयाँ',
    name: 'Ayurvedic Medicines',
    emoji: '🌿',
    blurb: 'Demo listings. Traditional Ayurvedic products — consult a qualified practitioner.',
    blurbHi: 'डेमो लिस्टिंग। पारंपरिक आयुर्वेदिक उत्पाद।',
  },
  {
    id: 'otc',
    nameHi: 'बिना पर्चे मिलने वाली दवाइयाँ',
    name: 'Over-the-Counter Medicines',
    emoji: '💊',
    blurb: 'Demo listings. Everyday OTC essentials. Always read the label and expiry date.',
    blurbHi: 'डेमो लिस्टिंग। रोज़मर्रा की OTC चीज़ें। लेबल और एक्सपायरी ज़रूर देखें।',
  },
];

export type Medicine = {
  id: string;
  category: MedicineCategoryId;
  name: string;
  nameHi: string;
  manufacturer: string;
  pack: string;
  packHi: string;
  price: number;
  mrp: number;
  image: string;
  expiryNote: string;
  seller: string;
  city: string;
};

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

export const DEMO_MEDICINES: Medicine[] = [
  // Homeopathic (traditional, no efficacy claims)
  { id: 'med-h1', category: 'homeopathic', name: 'Arnica Montana 30C — 11ml', nameHi: 'अर्निका मोंटाना 30C', manufacturer: 'Demo Homeo Labs', pack: '11ml sealed bottle', packHi: '11ml सीलबंद बोतल', price: 95, mrp: 120, image: IMG('sb-med-h1'), expiryNote: 'Exp: 12/2028', seller: 'Demo Wellness Store', city: 'Delhi' },
  { id: 'med-h2', category: 'homeopathic', name: 'Belladonna 200C — 11ml', nameHi: 'बेलाडोना 200C', manufacturer: 'Demo Homeo Labs', pack: '11ml sealed bottle', packHi: '11ml सीलबंद बोतल', price: 105, mrp: 130, image: IMG('sb-med-h2'), expiryNote: 'Exp: 06/2028', seller: 'Demo Wellness Store', city: 'Mumbai' },
  { id: 'med-h3', category: 'homeopathic', name: 'Calendula Ointment 25g', nameHi: 'कैलेंडुला ऑइंटमेंट', manufacturer: 'Demo Homeo Labs', pack: '25g tube', packHi: '25g ट्यूब', price: 85, mrp: 110, image: IMG('sb-med-h3'), expiryNote: 'Exp: 03/2027', seller: 'Demo Wellness Store', city: 'Jaipur' },
  { id: 'med-h4', category: 'homeopathic', name: 'Nux Vomica 30C — 11ml', nameHi: 'नक्स वोमिका 30C', manufacturer: 'Demo Homeo Labs', pack: '11ml sealed bottle', packHi: '11ml सीलबंद बोतल', price: 95, mrp: 120, image: IMG('sb-med-h4'), expiryNote: 'Exp: 09/2028', seller: 'Demo Wellness Store', city: 'Lucknow' },
  // Ayurvedic (traditional, no efficacy claims)
  { id: 'med-a1', category: 'ayurvedic', name: 'Triphala Churna 100g', nameHi: 'त्रिफला चूर्ण 100g', manufacturer: 'Demo Ayur Herbals', pack: '100g jar', packHi: '100g डिब्बा', price: 140, mrp: 180, image: IMG('sb-med-a1'), expiryNote: 'Exp: 01/2028', seller: 'Demo Ayur Store', city: 'Haridwar' },
  { id: 'med-a2', category: 'ayurvedic', name: 'Ashwagandha Capsules — 60N', nameHi: 'अश्वगंधा कैप्सूल 60N', manufacturer: 'Demo Ayur Herbals', pack: '60 capsules', packHi: '60 कैप्सूल', price: 299, mrp: 399, image: IMG('sb-med-a2'), expiryNote: 'Exp: 05/2027', seller: 'Demo Ayur Store', city: 'Bengaluru' },
  { id: 'med-a3', category: 'ayurvedic', name: 'Neem Face Wash 150ml', nameHi: 'नीम फेस वॉश', manufacturer: 'Demo Ayur Herbals', pack: '150ml bottle', packHi: '150ml बोतल', price: 160, mrp: 199, image: IMG('sb-med-a3'), expiryNote: 'Exp: 08/2027', seller: 'Demo Ayur Store', city: 'Pune' },
  { id: 'med-a4', category: 'ayurvedic', name: 'Chyawanprash 1kg', nameHi: 'च्यवनप्राश 1kg', manufacturer: 'Demo Ayur Herbals', pack: '1kg jar', packHi: '1kg डिब्बा', price: 385, mrp: 460, image: IMG('sb-med-a4'), expiryNote: 'Exp: 11/2027', seller: 'Demo Ayur Store', city: 'Delhi' },
  // OTC essentials (demo)
  { id: 'med-o1', category: 'otc', name: 'Paracetamol 650mg — 15 Tablets (Demo)', nameHi: 'पैरासिटामोल 650mg (डेमो)', manufacturer: 'Demo Generics', pack: '15 tablets strip', packHi: '15 टैबलेट स्ट्रिप', price: 45, mrp: 55, image: IMG('sb-med-o1'), expiryNote: 'Exp: 04/2027', seller: 'Demo Pharmacy', city: 'Delhi' },
  { id: 'med-o2', category: 'otc', name: 'ORS Powder — 4 Sachets (Demo)', nameHi: 'ORS पाउडर (डेमो)', manufacturer: 'Demo Generics', pack: '4 x 21.8g sachets', packHi: '4 सैशे', price: 88, mrp: 100, image: IMG('sb-med-o2'), expiryNote: 'Exp: 02/2028', seller: 'Demo Pharmacy', city: 'Mumbai' },
  { id: 'med-o3', category: 'otc', name: 'Antacid Chewable — 24 Tablets (Demo)', nameHi: 'एंटासिड च्यूएबल (डेमो)', manufacturer: 'Demo Generics', pack: '24 chewable tablets', packHi: '24 चबाने वाली टैबलेट', price: 120, mrp: 145, image: IMG('sb-med-o3'), expiryNote: 'Exp: 07/2027', seller: 'Demo Pharmacy', city: 'Chennai' },
  { id: 'med-o4', category: 'otc', name: 'Adhesive Bandages — 50N (Demo)', nameHi: 'बैंडेज 50N (डेमो)', manufacturer: 'Demo Care', pack: '50 bandages box', packHi: '50 बैंडेज का डिब्बा', price: 99, mrp: 130, image: IMG('sb-med-o4'), expiryNote: 'Sterile pack', seller: 'Demo Pharmacy', city: 'Kolkata' },
];

export const MEDICINE_DISCLAIMER =
  'Demo listings — real medicine sales need a licensed pharmacy. SastaBazaar does not sell medicines today. No treatment or cure claims are made; consult a qualified doctor or pharmacist.';

export const MEDICINE_DISCLAIMER_HI =
  'डेमो लिस्टिंग — असली दवा बिक्री के लिए लाइसेंसधारी फार्मेसी ज़रूरी है। कोई इलाज/आराम का दावा नहीं; डॉक्टर से सलाह लें।';

export function medicinesByCategory(cat: MedicineCategoryId): Medicine[] {
  return DEMO_MEDICINES.filter(m => m.category === cat);
}
