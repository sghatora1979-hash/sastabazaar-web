/**
 * Local Bazaar — demo local shops.
 * Demo data only: registered shops are stored in the browser (localStorage)
 * and merged with these demo shops at render time. A real launch needs a
 * secure backend + database (see /roadmap).
 */

export type DeliveryMode = 'pickup' | 'local' | 'national';

export type ShopProduct = {
  id: string;
  name: string;
  nameHi: string;
  price: number;
  mrp: number;
  image: string;
  stock: number;
};

export type LocalShop = {
  id: string;
  name: string;
  nameHi: string;
  owner: string;
  phone: string;
  whatsapp?: string;
  category: string;
  categoryHi: string;
  city: string;
  area: string;
  pin: string;
  photo: string;
  rating: number;
  deliveryModes: DeliveryMode[];
  deliveryNote: string;
  deliveryNoteHi: string;
  products: ShopProduct[];
  isDemo?: boolean;
};

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

export const DELIVERY_MODE_LABEL: Record<DeliveryMode, { hi: string; en: string }> = {
  pickup: { hi: 'दुकान से लें', en: 'Pickup' },
  local: { hi: 'लोकल डिलीवरी', en: 'Local delivery' },
  national: { hi: 'पूरे भारत में डिलीवरी', en: 'Ships across India' },
};

export const DEMO_SHOPS: LocalShop[] = [
  {
    id: 'sharma-general-store',
    name: 'Sharma General Store',
    nameHi: 'शर्मा जनरल स्टोर',
    owner: 'Ramesh Sharma',
    phone: '+91 98110 22334',
    whatsapp: '+91 98110 22334',
    category: 'Grocery',
    categoryHi: 'किराना',
    city: 'Delhi',
    area: 'Laxmi Nagar',
    pin: '110092',
    photo: IMG('sb-shop-grocery'),
    rating: 4.6,
    deliveryModes: ['pickup', 'local'],
    deliveryNote: 'Free delivery within 3 km on orders above ₹299',
    deliveryNoteHi: '₹299 से ऊपर के ऑर्डर पर 3 किमी तक मुफ्त डिलीवरी',
    products: [
      { id: 'sgp1', name: 'Aashirvaad Atta 10kg', nameHi: 'आशीर्वाद आटा 10 किलो', price: 485, mrp: 545, image: IMG('sb-atta'), stock: 40 },
      { id: 'sgp2', name: 'Tata Salt 1kg', nameHi: 'टाटा नमक 1 किलो', price: 28, mrp: 30, image: IMG('sb-salt'), stock: 120 },
      { id: 'sgp3', name: 'Fortune Sunflower Oil 1L', nameHi: 'फॉर्च्यून तेल 1 लीटर', price: 142, mrp: 160, image: IMG('sb-oil'), stock: 60 },
      { id: 'sgp4', name: 'Parle-G Gold Biscuits Pack', nameHi: 'पारले-जी बिस्किट', price: 35, mrp: 40, image: IMG('sb-biscuit'), stock: 200 },
    ],
  },
  {
    id: 'fashion-point-boutique',
    name: 'Fashion Point Boutique',
    nameHi: 'फैशन पॉइंट बुटीक',
    owner: 'Simran Kaur',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    category: 'Clothing',
    categoryHi: 'कपड़े',
    city: 'Ludhiana',
    area: 'Model Town',
    pin: '141002',
    photo: IMG('sb-shop-fashion'),
    rating: 4.8,
    deliveryModes: ['pickup', 'local', 'national'],
    deliveryNote: 'Ships across India in 3–5 days, ₹49 shipping',
    deliveryNoteHi: 'पूरे भारत में 3–5 दिन में डिलीवरी, ₹49 शिपिंग',
    products: [
      { id: 'fpp1', name: 'Cotton Kurti — Floral Print', nameHi: 'सूती कुर्ती', price: 599, mrp: 999, image: IMG('sb-kurti'), stock: 25 },
      { id: 'fpp2', name: "Men's Casual Shirt", nameHi: 'पुरुषों की शर्ट', price: 449, mrp: 799, image: IMG('sb-shirt'), stock: 30 },
      { id: 'fpp3', name: 'Phulkari Dupatta', nameHi: 'फुलकारी दुपट्टा', price: 349, mrp: 599, image: IMG('sb-dupatta'), stock: 18 },
    ],
  },
  {
    id: 'mobile-hub-sanjay',
    name: 'Mobile Hub — Sanjay Electronics',
    nameHi: 'मोबाइल हब',
    owner: 'Sanjay Gupta',
    phone: '+91 98990 11223',
    category: 'Mobiles & Electronics',
    categoryHi: 'मोबाइल और इलेक्ट्रॉनिक्स',
    city: 'Delhi',
    area: 'Karol Bagh',
    pin: '110005',
    photo: IMG('sb-shop-mobile'),
    rating: 4.5,
    deliveryModes: ['pickup', 'local'],
    deliveryNote: 'Same-day repair, 7-day replacement on accessories',
    deliveryNoteHi: 'उसी दिन रिपेयर, एक्सेसरीज़ पर 7 दिन रिप्लेसमेंट',
    products: [
      { id: 'mhp1', name: 'boAt Airdopes 141', nameHi: 'बोट एयरडोप्स', price: 1299, mrp: 2499, image: IMG('sb-airdopes'), stock: 15 },
      { id: 'mhp2', name: 'Mi 20000mAh Power Bank', nameHi: 'पावर बैंक', price: 1599, mrp: 2199, image: IMG('sb-powerbank'), stock: 22 },
      { id: 'mhp3', name: 'Noise Smartwatch', nameHi: 'स्मार्टवॉच', price: 1999, mrp: 3999, image: IMG('sb-watch'), stock: 10 },
    ],
  },
  {
    id: 'greenleaf-nursery',
    name: 'GreenLeaf Nursery',
    nameHi: 'ग्रीनलीफ नर्सरी',
    owner: 'Amit Verma',
    phone: '+91 97600 44556',
    whatsapp: '+91 97600 44556',
    category: 'Nursery',
    categoryHi: 'नर्सरी',
    city: 'Dehradun',
    area: 'Rajpur Road',
    pin: '248001',
    photo: IMG('sb-shop-nursery'),
    rating: 4.9,
    deliveryModes: ['pickup', 'local'],
    deliveryNote: 'Free planting guidance with every plant',
    deliveryNoteHi: 'हर पौधे के साथ मुफ्त रोपण सलाह',
    products: [
      { id: 'gnp1', name: 'Rose Plant (Red, Potted)', nameHi: 'गुलाब का पौधा', price: 149, mrp: 199, image: IMG('sb-rose'), stock: 50 },
      { id: 'gnp2', name: 'Mango Sapling — Dasheri', nameHi: 'आम का पौधा', price: 249, mrp: 349, image: IMG('sb-mango'), stock: 30 },
      { id: 'gnp3', name: 'Money Plant in Ceramic Pot', nameHi: 'मनी प्लांट', price: 199, mrp: 299, image: IMG('sb-moneyplant'), stock: 45 },
      { id: 'gnp4', name: 'Organic Compost 5kg', nameHi: 'जैविक खाद 5 किलो', price: 179, mrp: 229, image: IMG('sb-compost'), stock: 80 },
    ],
  },
  {
    id: 'mithaas-sweets',
    name: 'Mithaas Sweets & Snacks',
    nameHi: 'मिठास स्वीट्स',
    owner: 'Kishan Agarwal',
    phone: '+91 98370 77889',
    whatsapp: '+91 98370 77889',
    category: 'Sweets & Festival',
    categoryHi: 'मिठाई और त्योहार',
    city: 'Jaipur',
    area: 'Johari Bazaar',
    pin: '302003',
    photo: IMG('sb-shop-sweets'),
    rating: 4.7,
    deliveryModes: ['pickup', 'local', 'national'],
    deliveryNote: 'Festival gift hampers shipped across India',
    deliveryNoteHi: 'त्योहारों के गिफ्ट हैंपर पूरे भारत में',
    products: [
      { id: 'msp1', name: 'Kaju Katli 1kg', nameHi: 'काजू कतली 1 किलो', price: 899, mrp: 1050, image: IMG('sb-kaju'), stock: 20 },
      { id: 'msp2', name: 'Motichoor Laddu 1kg', nameHi: 'मोतीचूर लड्डू', price: 320, mrp: 380, image: IMG('sb-laddu'), stock: 35 },
      { id: 'msp3', name: 'Diwali Dry-Fruit Hamper', nameHi: 'ड्राई फ्रूट गिफ्ट हैंपर', price: 1299, mrp: 1699, image: IMG('sb-hamper'), stock: 12 },
    ],
  },
  {
    id: 'stepup-footwear',
    name: 'StepUp Footwear',
    nameHi: 'स्टेपअप फुटवियर',
    owner: 'Imran Khan',
    phone: '+91 94150 66778',
    category: 'Footwear',
    categoryHi: 'जूते-चप्पल',
    city: 'Agra',
    area: 'Sadar Bazaar',
    pin: '282001',
    photo: IMG('sb-shop-footwear'),
    rating: 4.4,
    deliveryModes: ['pickup', 'local'],
    deliveryNote: 'Size exchange within 7 days',
    deliveryNoteHi: '7 दिन में साइज़ एक्सचेंज',
    products: [
      { id: 'sfp1', name: "Men's Leather Sandals", nameHi: 'चमड़े की चप्पल', price: 499, mrp: 899, image: IMG('sb-sandal'), stock: 28 },
      { id: 'sfp2', name: "Women's Juttis — Embroidered", nameHi: 'कढ़ाई वाली जूती', price: 649, mrp: 999, image: IMG('sb-jutti'), stock: 16 },
    ],
  },
  {
    id: 'ghar-udyog-papad',
    name: 'Ghar Udyog — Papad & Pickles',
    nameHi: 'घर उद्योग — पापड़ अचार',
    owner: 'Meena Devi',
    phone: '+91 98290 33445',
    whatsapp: '+91 98290 33445',
    category: 'Home Business',
    categoryHi: 'घरेलू व्यवसाय',
    city: 'Jaipur',
    area: 'Malviya Nagar',
    pin: '302017',
    photo: IMG('sb-shop-homebiz'),
    rating: 4.9,
    deliveryModes: ['local', 'national'],
    deliveryNote: 'Homemade, ships in 2 days across India',
    deliveryNoteHi: 'घर का बना, 2 दिन में पूरे भारत में',
    products: [
      { id: 'gup1', name: 'Moong Dal Papad 500g', nameHi: 'मूंग दाल पापड़', price: 120, mrp: 150, image: IMG('sb-papad'), stock: 60 },
      { id: 'gup2', name: 'Mango Pickle 1kg (Homemade)', nameHi: 'आम का अचार', price: 280, mrp: 350, image: IMG('sb-pickle'), stock: 40 },
    ],
  },
  {
    id: 'fixit-home-services',
    name: 'FixIt Home Services',
    nameHi: 'फिक्सइट होम सर्विस',
    owner: 'Rajesh Kumar',
    phone: '+91 98111 99000',
    whatsapp: '+91 98111 99000',
    category: 'Services',
    categoryHi: 'सेवाएँ',
    city: 'Delhi',
    area: 'Rohini',
    pin: '110085',
    photo: IMG('sb-shop-services'),
    rating: 4.6,
    deliveryModes: ['local'],
    deliveryNote: 'Electrician & plumber at your doorstep',
    deliveryNoteHi: 'इलेक्ट्रीशियन और प्लंबर घर बैठे',
    products: [
      { id: 'fhs1', name: 'Fan Repair Visit', nameHi: 'पंखा रिपेयर', price: 249, mrp: 399, image: IMG('sb-fanrepair'), stock: 99 },
      { id: 'fhs2', name: 'Full Home Deep Cleaning', nameHi: 'घर की सफाई', price: 1499, mrp: 2499, image: IMG('sb-cleaning'), stock: 99 },
    ],
  },
];

/** Shops registered by the user in this browser (demo storage). */
const LS_KEY = 'sb_local_shops_v1';

export function getUserShops(): LocalShop[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserShop(shop: LocalShop): void {
  if (typeof window === 'undefined') return;
  const existing = getUserShops();
  localStorage.setItem(LS_KEY, JSON.stringify([shop, ...existing]));
}

export function getAllShops(): LocalShop[] {
  return [...getUserShops(), ...DEMO_SHOPS];
}

export function getShopById(id: string): LocalShop | undefined {
  return getAllShops().find(s => s.id === id);
}

export function filterShops(opts: {
  city?: string;
  area?: string;
  pin?: string;
  category?: string;
  maxPrice?: number;
  delivery?: DeliveryMode | '';
}): LocalShop[] {
  return getAllShops().filter(shop => {
    if (opts.city && !shop.city.toLowerCase().includes(opts.city.toLowerCase())) return false;
    if (opts.area && !shop.area.toLowerCase().includes(opts.area.toLowerCase())) return false;
    if (opts.pin && !shop.pin.includes(opts.pin)) return false;
    if (opts.category && shop.category !== opts.category) return false;
    if (opts.delivery && !shop.deliveryModes.includes(opts.delivery)) return false;
    if (opts.maxPrice && !shop.products.some(p => p.price <= (opts.maxPrice as number))) return false;
    return true;
  });
}

export function shopCategories(): { en: string; hi: string }[] {
  const map = new Map<string, string>();
  getAllShops().forEach(s => {
    if (!map.has(s.category)) map.set(s.category, s.categoryHi);
  });
  return [...map.entries()].map(([en, hi]) => ({ en, hi }));
}
