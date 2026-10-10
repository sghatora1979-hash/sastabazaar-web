export type Section = 'naya' | 'purana' | 'clearance' | 'local';

export type Product = {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  section: Section;
  categoryId: string;
  subcategory: string;
  price: number;
  mrp: number;
  discountPercent: number;
  image: string;
  images: string[];
  rating: number;
  seller: string;
  sellerRating: number;
  city: string;
  condition?: 'Like New' | 'Good' | 'Fair';
  stock: number;
  dealScore: number;
  createdAt: string;
  description: string;
  highlights: string[];
  promoteIn?: string[];
};

// Demo product generator — replace with API/DB later
const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

const CAT_IMAGES: Record<string, string[]> = {
  "appliances": ["/images/appliances-1.png", "/images/appliances-2.webp", "/images/appliances-3.webp"],
  "automotive": ["/images/automotive-1.png", "/images/automotive-2.png", "/images/automotive-3.png"],
  "bags": ["/images/bags-1.png", "/images/bags-2.jpg", "/images/bags-3.png"],
  "beauty": ["/images/beauty-1.png", "/images/beauty-2.jpg", "/images/beauty-3.jpg"],
  "books": ["/images/books-1.jpg", "/images/books-2.jpg", "/images/books-3.jpg"],
  "electronics": ["/images/electronics-1.png", "/images/electronics-2.png", "/images/electronics-3.png"],
  "fashion-men": ["/images/fashion-men-1.jpg", "/images/fashion-men-2.jpg", "/images/fashion-men-3.webp"],
  "fashion-women": ["/images/fashion-women-1.jpg", "/images/fashion-women-2.jpg", "/images/fashion-women-3.jpg"],
  "footwear": ["/images/footwear-1.webp", "/images/footwear-2.jpg", "/images/footwear-3.webp"],
  "furniture": ["/images/furniture-1.jpg", "/images/furniture-2.png", "/images/furniture-3.jpg"],
  "grocery": ["/images/grocery-1.webp", "/images/grocery-2.webp", "/images/grocery-3.webp"],
  "handicraft": ["/images/handicraft-1.webp", "/images/handicraft-2.jpg", "/images/handicraft-3.jpg"],
  "home": ["/images/home-1.jpg", "/images/home-2.jpg", "/images/home-3.jpg"],
  "jewellery": ["/images/jewellery-1.jpg", "/images/jewellery-2.jpg", "/images/jewellery-3.jpg"],
  "mobiles": ["/images/mobiles-1.jpg", "/images/mobiles-2.webp", "/images/mobiles-3.jpg"],
  "musical": ["/images/musical-1.jpg", "/images/musical-2.jpg", "/images/musical-3.jpg"],
  "office": ["/images/office-1.webp", "/images/office-2.png", "/images/office-3.png"],
  "pet": ["/images/pet-1.jpg", "/images/pet-2.webp", "/images/pet-3.jpg"],
  "sports": ["/images/sports-1.jpg", "/images/sports-2.png", "/images/sports-3.png"],
  "toys": ["/images/toys-1.png", "/images/toys-2.jpg", "/images/toys-3.webp"],
};

const catImg = (cat: string, n: number) => {
  const arr = CAT_IMAGES[cat];
  return arr && arr.length ? arr[n % arr.length] : IMG(`sb-fallback-${n}`);
};

const titles: Record<string, { en: string; hi: string; cat: string; sub: string }[]> = {
  mobiles: [
    { en: 'iPhone 13 128GB Midnight', hi: 'आईफोन 13', cat: '1', sub: 'Smartphones' },
    { en: 'Samsung Galaxy S22 5G', hi: 'सैमसंग गैलेक्सी S22', cat: '1', sub: 'Smartphones' },
    { en: 'Redmi Note 12 Pro', hi: 'रेडमी नोट 12 प्रो', cat: '1', sub: 'Smartphones' },
    { en: 'Realme Buds Air 3', hi: 'रियलमी बड्स', cat: '1', sub: 'Accessories' },
    { en: 'OnePlus Nord CE 3', hi: 'वनप्लस नॉर्ड', cat: '1', sub: 'Smartphones' }
  ],
  electronics: [
    { en: 'Dell Inspiron 15 i5', hi: 'डेल इंस्पिरॉन', cat: '2', sub: 'Laptops' },
    { en: 'Sony Bravia 43" 4K TV', hi: 'सोनी ब्राविया टीवी', cat: '2', sub: 'TVs' },
    { en: 'Canon EOS 1500D DSLR', hi: 'कैनन कैमरा', cat: '2', sub: 'Cameras' },
    { en: 'boAt Airdopes 141', hi: 'बोट एयरडोप्स', cat: '2', sub: 'Audio' },
    { en: 'PS5 DualSense Controller', hi: 'PS5 कंट्रोलर', cat: '2', sub: 'Gaming' }
  ],
  'fashion-women': [
    { en: 'Banarasi Silk Saree', hi: 'बनारसी साड़ी', cat: '3', sub: 'Sarees' },
    { en: 'Cotton Anarkali Kurti', hi: 'अनारकली कुर्ती', cat: '3', sub: 'Kurtis' },
    { en: 'Designer Lehenga Choli', hi: 'लहंगा चोली', cat: '3', sub: 'Lehengas' },
    { en: 'Kanjivaram Silk Saree', hi: 'कांजीवरम साड़ी', cat: '3', sub: 'Sarees' },
    { en: 'Georgette Party Gown', hi: 'पार्टी गाउन', cat: '3', sub: 'Tops' }
  ],
  'fashion-men': [
    { en: 'Levi\'s 511 Slim Jeans', hi: 'लेवीज जींस', cat: '4', sub: 'Jeans' },
    { en: 'Raymond Formal Shirt', hi: 'रेमंड शर्ट', cat: '4', sub: 'Shirts' },
    { en: 'Allen Solly Polo T-Shirt', hi: 'पोलो टी-शर्ट', cat: '4', sub: 'T-Shirts' },
    { en: 'Manyavar Kurta Pyjama', hi: 'कुर्ता पजामा', cat: '4', sub: 'Kurta' },
    { en: 'Van Heusen Blazer', hi: 'ब्लेज़र', cat: '4', sub: 'Suits' }
  ],
  footwear: [
    { en: 'Nike Air Max Sneakers', hi: 'नाइक स्नीकर्स', cat: '5', sub: 'Sneakers' },
    { en: 'Bata Formal Shoes', hi: 'बाटा फॉर्मल', cat: '5', sub: 'Formal' },
    { en: 'Puma Running Shoes', hi: 'प्यूमा रनिंग', cat: '5', sub: 'Sports' },
    { en: 'Sparx Slippers', hi: 'स्पार्क्स चप्पल', cat: '5', sub: 'Slippers' },
    { en: 'Woodland Sandals', hi: 'वुडलैंड सैंडल', cat: '5', sub: 'Sandals' }
  ],
  beauty: [
    { en: 'Lakme Face Serum 30ml', hi: 'लेकमे सीरम', cat: '6', sub: 'Skincare' },
    { en: 'Maybelline Matte Lipstick', hi: 'मेबेलीन लिपस्टिक', cat: '6', sub: 'Makeup' },
    { en: 'Mamaearth Onion Hair Oil', hi: 'मामाअर्थ हेयर ऑयल', cat: '6', sub: 'Hair' },
    { en: 'Forest Essentials Perfume', hi: 'परफ्यूम', cat: '6', sub: 'Fragrance' },
    { en: 'Patanjali Aloe Vera Gel', hi: 'एलोवेरा जेल', cat: '6', sub: 'Ayurveda' }
  ],
  home: [
    { en: 'Hawkins Pressure Cooker 5L', hi: 'प्रेशर कुकर', cat: '7', sub: 'Cookware' },
    { en: 'Cello Storage Set 12pc', hi: 'स्टोरेज सेट', cat: '7', sub: 'Storage' },
    { en: 'Decorative Wall Clock', hi: 'दीवार घड़ी', cat: '7', sub: 'Decor' },
    { en: 'Bombay Dyeing Bedsheet', hi: 'बेडशीट', cat: '7', sub: 'Bedding' },
    { en: 'Philips LED Bulb 9W', hi: 'LED बल्ब', cat: '7', sub: 'Lighting' }
  ],
  furniture: [
    { en: '3-Seater Fabric Sofa', hi: 'सोफा', cat: '8', sub: 'Sofas' },
    { en: 'Queen Size Wooden Bed', hi: 'लकड़ी का बेड', cat: '8', sub: 'Beds' },
    { en: 'Study Table with Drawer', hi: 'स्टडी टेबल', cat: '8', sub: 'Tables' },
    { en: 'Ergonomic Office Chair', hi: 'ऑफिस चेयर', cat: '8', sub: 'Chairs' },
    { en: '2-Door Steel Wardrobe', hi: 'अलमारी', cat: '8', sub: 'Wardrobes' }
  ],
  appliances: [
    { en: 'LG 260L Refrigerator', hi: 'फ्रिज', cat: '9', sub: 'Fridges' },
    { en: 'IFB 7kg Washing Machine', hi: 'वॉशिंग मशीन', cat: '9', sub: 'Washing Machines' },
    { en: 'Voltas 1.5T Split AC', hi: 'स्प्लिट AC', cat: '9', sub: 'ACs' },
    { en: 'Samsung Microwave Oven', hi: 'माइक्रोवेव', cat: '9', sub: 'Microwaves' },
    { en: 'Havells Ceiling Fan', hi: 'पंखा', cat: '9', sub: 'Fans' }
  ],
  books: [
    { en: 'Wings of Fire — APJ Kalam', hi: 'विंग्स ऑफ फायर', cat: '10', sub: 'Fiction' },
    { en: 'NCERT Physics Class 12', hi: 'NCERT भौतिकी', cat: '10', sub: 'Academic' },
    { en: 'Amar Chitra Katha Box Set', hi: 'अमर चित्र कथा', cat: '10', sub: 'Comics' },
    { en: 'UPSC Prelims Guide', hi: 'UPSC गाइड', cat: '10', sub: 'Competitive' },
    { en: 'Panchatantra for Kids', hi: 'पंचतंत्र', cat: '10', sub: 'Kids' }
  ],
  toys: [
    { en: 'Lego Classic Creative Box', hi: 'लेगो', cat: '11', sub: 'Toys' },
    { en: 'Pampers Baby Diapers M', hi: 'डायपर', cat: '11', sub: 'Diapers' },
    { en: 'Baby Cotton Onesie 5pc', hi: 'बेबी वनसी', cat: '11', sub: 'Clothing' },
    { en: 'Philips Avent Bottle', hi: 'फीडिंग बॉटल', cat: '11', sub: 'Feeding' },
    { en: 'Chicco Baby Stroller', hi: 'स्ट्रोलर', cat: '11', sub: 'Strollers' }
  ],
  sports: [
    { en: 'SG Cricket Bat English Willow', hi: 'क्रिकेट बैट', cat: '12', sub: 'Cricket' },
    { en: 'Nivia Football Size 5', hi: 'फुटबॉल', cat: '12', sub: 'Football' },
    { en: 'Kore Dumbbell Set 20kg', hi: 'डम्बल सेट', cat: '12', sub: 'Gym' },
    { en: 'Boldfit Yoga Mat 6mm', hi: 'योगा मैट', cat: '12', sub: 'Yoga' },
    { en: 'Btwin Mountain Cycle', hi: 'साइकिल', cat: '12', sub: 'Cycling' }
  ],
  grocery: [
    { en: 'Aashirvaad Atta 10kg', hi: 'आटा', cat: '13', sub: 'Staples' },
    { en: 'Haldiram Bhujia 1kg', hi: 'भुजिया', cat: '13', sub: 'Snacks' },
    { en: 'Tata Tea Gold 1kg', hi: 'टाटा चाय', cat: '13', sub: 'Beverages' },
    { en: 'Everest Garam Masala', hi: 'गरम मसाला', cat: '13', sub: 'Spices' },
    { en: 'Organic India Tulsi Tea', hi: 'ऑर्गेनिक चाय', cat: '13', sub: 'Organic' }
  ],
  jewellery: [
    { en: '22KT Gold Chain 5g', hi: 'सोने की चेन', cat: '14', sub: 'Gold' },
    { en: 'Silver Anklet Pair', hi: 'चांदी की पायल', cat: '14', sub: 'Silver' },
    { en: 'Kundan Bridal Set', hi: 'कुंदन सेट', cat: '14', sub: 'Imitation' },
    { en: 'Fastrack Analog Watch', hi: 'फास्ट्रैक घड़ी', cat: '14', sub: 'Watches' },
    { en: 'Pearl Earrings Set', hi: 'मोती झुमके', cat: '14', sub: 'Accessories' }
  ],
  bags: [
    { en: 'Wildcraft 35L Backpack', hi: 'बैकपैक', cat: '15', sub: 'Backpacks' },
    { en: 'Lavie Leather Handbag', hi: 'हैंडबैग', cat: '15', sub: 'Handbags' },
    { en: 'American Tourister Trolley', hi: 'ट्रॉली', cat: '15', sub: 'Trolleys' },
    { en: 'Woodland Leather Wallet', hi: 'वॉलेट', cat: '15', sub: 'Wallets' },
    { en: 'Skybags School Bag', hi: 'स्कूल बैग', cat: '15', sub: 'School Bags' }
  ],
  automotive: [
    { en: 'Car Dashboard Camera', hi: 'डैश कैमरा', cat: '16', sub: 'Car Accessories' },
    { en: 'Bike Chain Lubricant', hi: 'चेन लुब्रिकेंट', cat: '16', sub: 'Bike Parts' },
    { en: 'Steelbird Helmet ISI', hi: 'हेलमेट', cat: '16', sub: 'Helmets' },
    { en: 'Bosch Car Tool Kit', hi: 'टूल किट', cat: '16', sub: 'Tools' },
    { en: '3M Car Shampoo 1L', hi: 'कार शैम्पू', cat: '16', sub: 'Care' }
  ],
  office: [
    { en: 'Classmate Notebook Pack 6', hi: 'नोटबुक', cat: '17', sub: 'Stationery' },
    { en: 'HP DeskJet Printer', hi: 'प्रिंटर', cat: '17', sub: 'Printers' },
    { en: 'Featherlite Office Chair', hi: 'ऑफिस चेयर', cat: '17', sub: 'Chairs' },
    { en: 'Kangaro File Cabinet', hi: 'फाइल कैबिनेट', cat: '17', sub: 'Storage' },
    { en: 'JK Copier Paper A4 500', hi: 'A4 पेपर', cat: '17', sub: 'Paper' }
  ],
  musical: [
    { en: 'Yamaha F310 Acoustic Guitar', hi: 'गिटार', cat: '18', sub: 'Guitars' },
    { en: 'Casio CTK-3500 Keyboard', hi: 'कीबोर्ड', cat: '18', sub: 'Keyboards' },
    { en: 'Tama Drum Kit 5pc', hi: 'ड्रम सेट', cat: '18', sub: 'Drums' },
    { en: 'Bansuri Flute Set', hi: 'बांसुरी', cat: '18', sub: 'Wind' },
    { en: 'Guitar Strings Elixir', hi: 'गिटार स्ट्रिंग', cat: '18', sub: 'Accessories' }
  ],
  pet: [
    { en: 'Pedigree Dog Food 10kg', hi: 'डॉग फूड', cat: '19', sub: 'Food' },
    { en: 'Pet Chew Toy Bundle', hi: 'पेट टॉय', cat: '19', sub: 'Toys' },
    { en: 'Pet Grooming Kit', hi: 'ग्रूमिंग किट', cat: '19', sub: 'Grooming' },
    { en: 'Orthopedic Pet Bed', hi: 'पेट बेड', cat: '19', sub: 'Beds' },
    { en: 'Cat Collar with Bell', hi: 'कॉलर', cat: '19', sub: 'Accessories' }
  ],
  handicraft: [
    { en: 'Madhubani Painting A3', hi: 'मधुबनी पेंटिंग', cat: '20', sub: 'Paintings' },
    { en: 'Terracotta Flower Vase', hi: 'मिट्टी का फूलदान', cat: '20', sub: 'Pottery' },
    { en: 'Handloom Cotton Saree', hi: 'हथकरघा साड़ी', cat: '20', sub: 'Textiles' },
    { en: 'Carved Wooden Elephant', hi: 'लकड़ी का हाथी', cat: '20', sub: 'Wood' },
    { en: 'Brass Diya Set of 12', hi: 'पीतल दीया', cat: '20', sub: 'Metal' }
  ]
};

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateProducts(): Product[] {
  const products: Product[] = [];
  const sections: Section[] = ['naya', 'purana', 'clearance', 'local'];
  let id = 1;

  for (const [catSlug, items] of Object.entries(titles)) {
    for (const section of sections) {
      for (let i = 0; i < items.length; i++) {
        const base = items[i];
        const seed = id * 7.13;
        const r1 = pseudoRandom(seed);
        const r2 = pseudoRandom(seed + 1);
        const r3 = pseudoRandom(seed + 2);

        const mrp = Math.round(500 + r1 * 49500);
        let discountPercent: number;
        if (section === 'clearance') discountPercent = Math.round(50 + r2 * 30);
        else if (section === 'purana') discountPercent = Math.round(30 + r2 * 40);
        else if (section === 'local') discountPercent = Math.round(10 + r2 * 30);
        else discountPercent = Math.round(5 + r2 * 25);

        const price = Math.round(mrp * (1 - discountPercent / 100));
        const slug = `${base.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${section}-${id}`;

        const cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'];
        const city = cities[Math.floor(r3 * cities.length)];
        const condition = section === 'purana'
          ? (['Like New', 'Good', 'Fair'] as const)[Math.floor(r2 * 3)]
          : undefined;

        products.push({
          id: String(id),
          slug,
          title: base.en,
          titleHi: base.hi,
          section,
          categoryId: base.cat,
          subcategory: base.sub,
          price,
          mrp,
          discountPercent,
          image: catImg(catSlug, i),
          images: [catImg(catSlug, i), catImg(catSlug, i + 1), catImg(catSlug, i + 2), catImg(catSlug, i + 3)],
          rating: Math.round((3.5 + r1 * 1.5) * 10) / 10,
          seller: ['Rajesh Traders', 'Sharma Store', 'Gupta & Sons', 'Khan Brothers', 'Verma Enterprises'][Math.floor(r2 * 5)],
          sellerRating: Math.round((4 + r3) * 10) / 10,
          city,
          condition,
          stock: Math.floor(3 + r1 * 47),
          dealScore: Math.round(r1 * 100),
          createdAt: new Date(Date.now() - Math.floor(r2 * 60) * 86400000).toISOString(),
          description: `Premium quality ${base.en} available in ${section === 'purana' ? 'gently used' : 'brand new'} condition. Verified seller, escrow protected payment, fast shipping across India.`,
          highlights: [
            section === 'purana' ? `Condition: ${condition}` : 'Brand New · Sealed',
            `Seller rating ${Math.round((4 + r3) * 10) / 10}★`,
            'Escrow protected',
            '7-day returns',
            `Ships from ${city}`
          ]
        });
        id++;
      }
    }
  }
  return products;
}

export let PRODUCTS: Product[] = generateProducts();

/** Phase 0: replace the in-memory catalog with rows from Supabase.
 *  All importers see the update via the live binding; sync helpers
 *  (getProductsBySection, searchProducts, …) keep working unchanged. */
export function setProducts(next: Product[]): void {
  if (Array.isArray(next) && next.length > 0) PRODUCTS = next;
}

export function getProductsBySection(section: Section, limit = 40) {
  return PRODUCTS.filter(p => p.section === section).slice(0, limit);
}

export function getProductBySlug(slug: string) {
  return PRODUCTS.find(p => p.slug === slug);
}

export function getProductsByCategory(categoryId: string, section?: Section, limit = 40) {
  return PRODUCTS
    .filter(p => p.categoryId === categoryId && (!section || p.section === section))
    .slice(0, limit);
}

export function searchProducts(query: string, limit = 30) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PRODUCTS
    .filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.titleHi.includes(q) ||
      p.subcategory.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
