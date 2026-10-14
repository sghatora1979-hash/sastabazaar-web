/*
 * Sasta Sahayak — shared knowledge base (v2).
 * Used by BOTH the client widget (instant free answers) and the
 * server route /api/sahayak (AI prompt context + honest fallback).
 * Nothing here is secret. Demo data is always labelled demo.
 */

export type LangCode =
  | 'hi' | 'en' | 'pa' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'zh' | 'es';

export const LANGS: { code: LangCode; label: string; native: string; speech: string }[] = [
  { code: 'hi', label: 'Hindi', native: 'हिंदी', speech: 'hi-IN' },
  { code: 'en', label: 'English', native: 'English', speech: 'en-IN' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', speech: 'pa-IN' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', speech: 'bn-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', speech: 'mr-IN' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', speech: 'gu-IN' },
  { code: 'zh', label: 'Chinese (Simplified)', native: '简体中文', speech: 'zh-CN' },
  { code: 'es', label: 'Spanish', native: 'Español', speech: 'es-ES' },
];

export function langName(code: LangCode): string {
  return LANGS.find((l) => l.code === code)?.label ?? 'English';
}
export function speechCode(code: LangCode): string {
  return LANGS.find((l) => l.code === code)?.speech ?? 'en-IN';
}

export type Entry = { k: string[]; hi: string; en: string };

export const KB: Entry[] = [
/* ---- CUSTOMER: orders & tracking ---- */
{ k:['track','tracking','order status','kahan hai','parcel','shipment','shipment kahan','order id','reference'],
  hi:'📦 <b>ऑर्डर ट्रैकिंग (डेमो):</b> अपना ऑर्डर नंबर लिखो (जैसे SB123456)। /track पेज पे भी देख सकते हो।<br>असली ट्रैकिंग तब लाइव होगी जब कोरियर कंपनी (Delhivery/Shiprocket जैसी) जुड़ेगी — Phase 2 में।',
  en:'📦 <b>Order tracking (demo):</b> type your order number (e.g. SB123456). Also see the /track page.<br>Real live tracking goes live once courier partners connect — Phase 2.' },
{ k:['return','refund','wapas','paisa wapas','return policy'],
  hi:'↩️ <b>रिटर्न/रिफंड:</b> <a href="/return-policy">रिटर्न पॉलिसी</a> पढ़ो। सामान मिलने के <b>7 दिन</b> के अंदर रिटर्न रिक्वेस्ट डालो — अकाउंट → My Orders → Return। पैसा 5-7 दिन में वापस।',
  en:'↩️ <b>Return/Refund:</b> read the <a href="/return-policy">return policy</a>. Raise a return within <b>7 days</b> of delivery — Account → My Orders → Return. Money back in 5-7 days.' },
{ k:['damage','damaged','kharab','toota','tuta','not working','defect'],
  hi:'😟 सामान खराब/टूटा आया? <b>24 घंटे</b> के अंदर फोटो के साथ शिकायत करो — अकाउंट → My Orders → Report Issue। सेलर को रिप्लेस या रिफंड करना होगा।',
  en:'😟 Item arrived damaged? Complain within <b>24 hours</b> with photos — Account → My Orders → Return. Seller must replace or refund.' },
{ k:['email','otp nahi','mail nahi aaya','login otp'],
  hi:'📧 OTP नहीं आया? स्पैम/जंक फोल्डर देखो, 2 मिनट रुको, फिर Resend OTP दबाओ। ईमेल सही लिखा है ये चेक करो।',
  en:'📧 OTP not received? Check spam/junk, wait 2 minutes, then tap Resend OTP. Make sure the email is typed correctly.' },
{ k:['login','sign in','password bhool','account nahi khul'],
  hi:'🔑 <b>लॉगिन:</b> /account पे ईमेल डालो → OTP आएगा → डालो → अंदर! पासवर्ड याद रखने की जरूरत नहीं।',
  en:'🔑 <b>Login:</b> go to /account → enter email → enter the OTP → you are in! No password to remember.' },
{ k:['payment','upi','card','paisa kat gaya','pay nahi ho raha'],
  hi:'💳 पेमेंट अटक गया? पैसा कटा पर ऑर्डर नहीं बना → 24-48 घंटे में <b>auto-refund</b>। UPI PIN सही डालो, नेट चालू रखो।',
  en:'💳 Payment stuck? Money deducted but no order → <b>auto-refund</b> in 24-48 hrs. Enter UPI PIN correctly, keep internet on.' },
{ k:['kab aayega','kitne din','delivery time','delivery kab'],
  hi:'🕒 डिलीवरी आमतौर पर <b>3-7 दिन</b> में। लोकल सेलर से same-city ऑर्डर 1-2 दिन में भी आ सकता है।',
  en:'🕒 Delivery usually takes <b>3-7 days</b>. Same-city orders from local sellers can arrive in 1-2 days.' },
{ k:['refer','referral','invite','kamao'],
  hi:'🎁 <b>Refer & Earn:</b> <a href="/refer">/refer</a> पे अपना लिंक दोस्तों को भेजो — हर नए जॉइन पर रिवॉर्ड!',
  en:'🎁 <b>Refer & Earn:</b> share your link from <a href="/refer">/refer</a> — earn rewards for every new join!' },
/* ---- SELLER ---- */
{ k:['seller ban','bechna hai','sell karna','list product','product kaise dale','naya product'],
  hi:'🏪 <b>सेलर बनो:</b> <a href="/sell-local">/sell-local</a> खोलो → दुकान का नाम + फोन डालो → प्रोडक्ट डालो: फोटो, नाम, प्राइस, MRP, स्टॉक। Commission सिर्फ बिकने पर!',
  en:'🏪 <b>Become a seller:</b> open <a href="/sell-local">/sell-local</a> → shop name + phone → add product: photo, name, price, MRP, stock. Commission only when you sell!' },
{ k:['photo','image','picture','foto','tasveer','upload nahi'],
  hi:'📸 <b>फोटो टिप्स:</b> दिन की रोशनी में खींचो, साफ बैकग्राउंड, 3-4 एंगल। JPG/PNG, 5MB से कम। बटन: Add Product → 📷 आइकन → गैलरी से चुनो।',
  en:'📸 <b>Photo tips:</b> shoot in daylight, clean background, 3-4 angles. JPG/PNG under 5MB. Button: Add Product → 📷 icon → pick from gallery.' },
{ k:['price','daam','rate','mrp','kimat'],
  hi:'💰 <b>प्राइस:</b> प्राइस <b>MRP से ज्यादा नहीं</b> हो सकता (कानून है!)। लागत + कमीशन + थोड़ा मुनाफा = तुम्हारा प्राइस। Margin calculator पेज पे है।',
  en:'💰 <b>Price:</b> price can <b>never exceed MRP</b> (it is the law!). Cost + commission + small profit = your price. Margin calculator is on the page.' },
{ k:['commission','fees','charge kitna','kat ta hai'],
  hi:'🧾 <b>कमीशन:</b> कैटेगरी के हिसाब से — किराना 3%, इलेक्ट्रॉनिक्स 6%, फैशन 12%। सिर्फ बिकने पर कटता है, लिस्टिंग फ्री!',
  en:'🧾 <b>Commission:</b> by category — grocery 3%, electronics 6%, fashion 12%. Only deducted on sale, listing is free!' },
{ k:['weight','vajan','wajan'],
  hi:'⚖️ <b>वजन:</b> प्रोडक्ट का सही वजन (kg/gram) डालो — डिलीवरी चार्ज इसी से बनता है। गलत वजन = गलत चार्ज!',
  en:'⚖️ <b>Weight:</b> enter the correct weight (kg/grams) — delivery charge is calculated from it. Wrong weight = wrong charge!' },
{ k:['size','xl','small','large','medium'],
  hi:'📏 <b>साइज:</b> कपड़ों के लिए S/M/L/XL/XXL चुनो + साइज चार्ट (छाती/लंबाई cm में) जरूर डालो — रिटर्न कम होंगे!',
  en:'📏 <b>Size:</b> for clothes pick S/M/L/XL/XXL + always add a size chart (chest/length in cm) — fewer returns!' },
{ k:['quality','kwality'],
  hi:'⭐ <b>क्वालिटी:</b> Condition सही चुनो — नया / हल्का इस्तेमाल / पुराना। Stock Age (कितना पुराना माल) ईमानदारी से लिखो — भरोसा बढ़ता है!',
  en:'⭐ <b>Quality:</b> pick the honest condition — new / lightly used / old. Write Stock Age truthfully — trust grows!' },
{ k:['discount','chhoot','offer','sasta karo'],
  hi:'🏷️ <b>डिस्काउंट:</b> MRP से कम प्राइस = अपने आप डिस्काउंट दिखेगा। त्योहारों पे Clearance Bazaar में डालो — ज्यादा बिकेगा!',
  en:'🏷️ <b>Discount:</b> price below MRP = discount shows automatically. During festivals list in Clearance Bazaar — sells more!' },
{ k:['guarantee','warranty'],
  hi:'🛡️ <b>Seller Guarantee:</b> अपना वादा 200 अक्षरों में लिखो (जैसे "7 दिन में वापसी") — प्रोडक्ट पेज पे दिखेगा।',
  en:'🛡️ <b>Seller Guarantee:</b> write your promise in 200 characters (e.g. "7-day return") — it shows on the product page.' },
/* ---- DELIVERY ---- */
{ k:['rider ban','delivery boy','delivery job','driver ban','rider kaise'],
  hi:'🛵 <b>डिलीवरी पार्टनर बनो:</b> <a href="/delivery/vehicles">/delivery/vehicles</a> खोलो → गाड़ी (truck/tempo) + RC + insurance + permit डालो, ड्राइवर की ID + licence। अप्रूव होते ही ऑर्डर मिलेंगे!',
  en:'🛵 <b>Become a delivery partner:</b> open <a href="/delivery/vehicles">/delivery/vehicles</a> → vehicle (truck/tempo) + RC + insurance + permit, driver ID + licence. Get orders once approved!' },
{ k:['rider ka naam','kaun layega','delivery wala','rider number','rider photo'],
  hi:'🛵 <b>डिलीवरी जानकारी (डेमो):</b> असली राइडर का नाम, फोटो, बाइक नंबर और फोन नंबर ऑर्डर ट्रैकिंग में दिखेगा — जब डिलीवरी पार्टनर सिस्टम लाइव होगा (Phase 2)।',
  en:'🛵 <b>Delivery info (demo):</b> the real rider name, photo, bike number and phone will show in order tracking once the delivery partner system goes live (Phase 2).' },
/* ---- PAGES / SECTIONS ---- */
{ k:['naya','naya bazaar','naya bazar','brand new'],
  hi:'🆕 <b>Naya Bazaar</b> = बिल्कुल नया सामान, verified sellers से। <a href="/naya">/naya</a> खोलो।',
  en:'🆕 <b>Naya Bazaar</b> = brand-new products from verified sellers. Open <a href="/naya">/naya</a>.' },
{ k:['purana','purana bazaar','second hand','second-hand','purana bazar','old item'],
  hi:'♻️ <b>Purana Bazaar</b> = quality-checked पुराना/सेकंड-हैंड सामान, सबसे सस्ता। <a href="/purana">/purana</a> खोलो।',
  en:'♻️ <b>Purana Bazaar</b> = quality-checked second-hand items at the lowest prices. Open <a href="/purana">/purana</a>.' },
{ k:['clearance','clearence','sale','80%'],
  hi:'🔥 <b>Clearance Bazaar</b> = सेल वाला स्टॉक, 80% तक OFF — जब तक स्टॉक है! <a href="/clearance">/clearance</a> खोलो।',
  en:'🔥 <b>Clearance Bazaar</b> = end-of-season stock, up to 80% OFF — while stock lasts! Open <a href="/clearance">/clearance</a>.' },
{ k:['local','local bazaar','local bazar','paas ki dukan','nearby shop','aas paas'],
  hi:'📍 <b>Local Bazaar</b> = तुम्हारे आस-पास की दुकानें — same-city डिलीवरी 1-2 दिन में। <a href="/local-bazaar">/local-bazaar</a> खोलो।',
  en:'📍 <b>Local Bazaar</b> = shops near you — same-city delivery in 1-2 days. Open <a href="/local-bazaar">/local-bazaar</a>.' },
{ k:['courier','courier partner','delhivery','bluedart','dtdc','shiprocket','ship karna'],
  hi:'🚚 <b>Courier Partners</b> (<a href="/couriers">/couriers</a>): 20 कंपनियाँ — India (Delhivery, BlueDart, DTDC…), International (DHL, FedEx, UPS, Aramex), China→India (SF Express, Cainiao…)। रेट <i>indicative</i> हैं; सेलर अपने अकाउंट से शिप करते हैं।',
  en:'🚚 <b>Courier Partners</b> (<a href="/couriers">/couriers</a>): 20 companies — India (Delhivery, BlueDart, DTDC…), International (DHL, FedEx, UPS, Aramex), China→India (SF Express, Cainiao…). Rates are <i>indicative</i>; sellers ship from their own accounts.' },
{ k:['vehicle','truck','tempo','gadi register','gaadi','rc ','insurance','permit'],
  hi:'🚛 <b>Vehicle Registration:</b> <a href="/delivery/vehicles">/delivery/vehicles</a> पे गाड़ी डालो — truck/tempo के लिए RC + insurance + permit <b>जरूरी</b> हैं। ड्राइवर की ID + licence भी। अप्रूवल के बाद ऑर्डर मिलेंगे।',
  en:'🚛 <b>Vehicle Registration:</b> add your vehicle at <a href="/delivery/vehicles">/delivery/vehicles</a> — RC + insurance + permit are <b>required</b> for truck/tempo. Driver ID + licence too. Orders come after approval.' },
{ k:['wallet','paisa kitna','balance','points','reward point'],
  hi:'👛 <b>My Wallet</b> (<a href="/wallet">/wallet</a>): कैश + रिवॉर्ड पॉइंट्स, पूरी हिस्ट्री। पॉइंट्स = loyalty points, इनकी कोई तय कीमत नहीं।',
  en:'👛 <b>My Wallet</b> (<a href="/wallet">/wallet</a>): cash + reward points with full history. Points are loyalty points — no fixed cash value.' },
{ k:['lucky','lottery','draw','10000'],
  hi:'🎰 <b>Lucky Draw</b> (<a href="/lucky-draw">/lucky-draw</a>): हर रविवार ₹10,000 का इनाम!',
  en:'🎰 <b>Lucky Draw</b> (<a href="/lucky-draw">/lucky-draw</a>): win ₹10,000 every Sunday!' },
{ k:['festival','diwali','tyohar','sale calendar'],
  hi:'🎉 <b>Festival Sale Calendar</b> (<a href="/festivals">/festivals</a>): पूरे साल के त्योहारों की सेल — कब क्या सस्ता!',
  en:'🎉 <b>Festival Sale Calendar</b> (<a href="/festivals">/festivals</a>): year-round festival sales — what goes cheap and when!' },
{ k:['dawai','medicine','dawa'],
  hi:'💊 <b>दवाइयाँ</b> (<a href="/medicines">/medicines</a>): दवाइयाँ और हेल्थ प्रोडक्ट्स।',
  en:'💊 <b>Medicines</b> (<a href="/medicines">/medicines</a>): medicines and health products.' },
{ k:['paudha','plant','nursery','ped'],
  hi:'🌱 <b>Nursery</b> (<a href="/nursery">/nursery</a>): पौधे और गार्डनिंग का सामान।',
  en:'🌱 <b>Nursery</b> (<a href="/nursery">/nursery</a>): plants and gardening supplies.' },
{ k:['marketplace','seller marketplace','dukaan list'],
  hi:'🏬 <b>Seller Marketplace</b> (<a href="/marketplace">/marketplace</a>): सारी दुकानें एक जगह — सबसे अच्छा दाम खुद चुनो।',
  en:'🏬 <b>Seller Marketplace</b> (<a href="/marketplace">/marketplace</a>): all shops in one place — pick the best deal yourself.' },
{ k:['international','videsh','foreign','import'],
  hi:'🌍 <b>International</b> (<a href="/international">/international</a>): विदेशी प्रोडक्ट्स और इंटरनेशनल शिपिंग की जानकारी।',
  en:'🌍 <b>International</b> (<a href="/international">/international</a>): foreign products and international shipping info.' },
{ k:['demand','maang','nahi mil raha','request product'],
  hi:'📢 <b>Demand</b> (<a href="/demand">/demand</a>): जो चीज़ नहीं मिल रही, उसकी डिमांड डालो — सेलर देखेंगे!',
  en:'📢 <b>Demand</b> (<a href="/demand">/demand</a>): cannot find something? Post your demand — sellers will see it!' },
{ k:['biker','bike se'],
  hi:'🏍️ <b>Biker</b> (<a href="/biker">/biker</a>): बाइक डिलीवरी पार्टनर की जानकारी और जॉइनिंग।',
  en:'🏍️ <b>Biker</b> (<a href="/biker">/biker</a>): bike delivery partner info and joining.' },
{ k:['search','khojo','dhundo'],
  hi:'🔍 <b>Search</b> (<a href="/search">/search</a>): ऊपर सर्च बार में नाम लिखो — चारों बाज़ारों में एक साथ खोजो।',
  en:'🔍 <b>Search</b> (<a href="/search">/search</a>): type in the top search bar — searches all 4 bazaars at once.' },
{ k:['cart','tokri','checkout','order karo'],
  hi:'🛒 <b>Cart</b> (<a href="/cart">/cart</a>): सामान टोकरी में डालो → Checkout → पता डालो → पेमेंट → ऑर्डर!',
  en:'🛒 <b>Cart</b> (<a href="/cart">/cart</a>): add to basket → Checkout → address → payment → order!' },
{ k:['category','shreni','grocery','fashion','electronics'],
  hi:'🗂️ <b>Category</b> (<a href="/category">/category</a>): कैटेगरी से ब्राउज़ करो — किराना, फैशन, इलेक्ट्रॉनिक्स और भी।',
  en:'🗂️ <b>Category</b> (<a href="/category">/category</a>): browse by category — grocery, fashion, electronics and more.' },
{ k:['contact','sampark','baat karni hai'],
  hi:'☎️ <b>Contact</b> (<a href="/contact">/contact</a>): हमसे जुड़ो — ईमेल care@sastabazaar.in।',
  en:'☎️ <b>Contact</b> (<a href="/contact">/contact</a>): reach us — email care@sastabazaar.in.' },
{ k:['shipping','shipping policy'],
  hi:'📦 <b>Shipping Policy</b> (<a href="/shipping">/shipping</a>): शिपिंग के नियम और चार्ज की जानकारी।',
  en:'📦 <b>Shipping Policy</b> (<a href="/shipping">/shipping</a>): shipping rules and charge info.' },
{ k:['spin','wheel','prize','inam'],
  hi:'🎡 <b>Spin & Win</b> (<a href="/spin-and-win">/spin-and-win</a>): रोज़ व्हील घुमाओ, इनाम जीतो! Jackpot = 100 पॉइंट्स।',
  en:'🎡 <b>Spin & Win</b> (<a href="/spin-and-win">/spin-and-win</a>): spin daily and win! Jackpot = 100 points.' },
/* ---- GENERAL ---- */
{ k:['kya hai','what is sastabazaar','sastabazaar kya'],
  hi:'🛒 <b>SastaBazaar = 4 बाज़ार एक जगह:</b> Naya (नया सामान), Purana (पुराना/सेकंड हैंड), Clearance (सेल वाला), Local (आस-पास की दुकानें)।',
  en:'🛒 <b>SastaBazaar = 4 bazaars in one:</b> Naya (new), Purana (second-hand), Clearance (sale), Local (nearby shops).' },
{ k:['human','call karo','phone number','customer care'],
  hi:'📞 <b>Customer Care:</b> Mon–Sat, 10–7 (IST)। ईमेल: care@sastabazaar.in। फोन नंबर जल्दी आ रहा है!',
  en:'📞 <b>Customer Care:</b> Mon–Sat, 10am–7pm IST. Email: care@sastabazaar.in. Phone number coming soon!' },
{ k:['thank','thanks','shukriya','dhanyavad'],
  hi:'खुशी हुई मदद करके! 😊 और कुछ पूछो।', en:'Happy to help! 😊 Ask me anything else.' },
{ k:['hi','hello','hey','namaste','sat sri'],
  hi:'नमस्ते! 🙏 बताओ, क्या मदद करूँ? नीचे टॉपिक भी दबा सकते हो।',
  en:'Hello! 🙏 Tell me how I can help — or tap a topic below.' },
];

/* Demo order-ID pattern: e.g. SB123456 */
export function demoTracking(id: string, lang: 'hi' | 'en'): string {
  const up = id.toUpperCase();
  if (lang === 'hi')
    return `📦 <b>ऑर्डर ${up} (डेमो ट्रैकिंग):</b><br>✅ पैक हो गया → 🚚 शिप हो गया (DemoCourier) → 🛵 डिलीवरी के लिए निकला<br>राइडर: Demo Rider • बाइक DL-01-AB-1234 • ⭐4.8<br><i>असली लाइव ट्रैकिंग Phase 2 में — कोरियर जुड़ते ही।</i>`;
  return `📦 <b>Order ${up} (demo tracking):</b><br>✅ Packed → 🚚 Shipped (DemoCourier) → 🛵 Out for delivery<br>Rider: Demo Rider • Bike DL-01-AB-1234 • ⭐4.8<br><i>Real live tracking in Phase 2 — once couriers connect.</i>`;
}

export function answerFor(text: string, lang: 'hi' | 'en'): string {
  const s = text.toLowerCase();
  const m = s.match(/\b([a-z]{2,}\d{4,})\b/);
  if (m) return demoTracking(m[1], lang);
  let best: Entry | null = null, score = 0;
  for (const e of KB) {
    let sc = 0;
    for (const k of e.k) if (s.includes(k)) sc += k.length;
    if (sc > score) { score = sc; best = e; }
  }
  if (best && score > 0) return lang === 'hi' ? best.hi : best.en;
  return lang === 'hi'
    ? `समझ नहीं आया 🤔 — टॉपिक बटन दबाओ, या ऐसे लिखो: <i>"refund kaise milega"</i>। मुश्किल सवाल हो तो स्क्रीनशॉट भेजो → <b>s.ghatora1979@gmail.com</b> 📧`
    : `Didn't catch that 🤔 — tap a topic button, or write like: <i>"how do I get a refund"</i>. For tricky stuff email a screenshot → <b>s.ghatora1979@gmail.com</b> 📧`;
}

/* ---------------- NAVIGATION INTENTS (voice/text → page) ---------------- */
/* "Gujarati kapde dikhao", "wo page kholo" → real site URLs. Works offline. */
type NavRule = { k: string[]; url: (q: string) => string };

const NAV_RULES: NavRule[] = [
  { k: ['saree','sari','kurti','lehenga','mahila','women','aurat'], url: () => '/category/fashion-women' },
  { k: ['shirt','kurta','t-shirt','tshirt','men ','purush','aadmi','gent'], url: () => '/category/fashion-men' },
  { k: ['mobile','phone','smartphone'], url: () => '/category/mobiles' },
  { k: ['laptop','tv','television','camera','electronic','electrical'], url: () => '/category/electronics' },
  { k: ['joota','shoe','sandal','sneaker','chappal'], url: () => '/category/footwear' },
  { k: ['makeup','lipstick','beauty','skincare','cream'], url: () => '/category/beauty' },
  { k: ['kitchen','bartan','ghar ka','home '], url: () => '/category/home' },
  { k: ['sofa','bed ','furniture','table','chair'], url: () => '/category/furniture' },
  { k: ['fridge','washing','ac ','microwave','appliance'], url: () => '/category/appliances' },
  { k: ['kitab','book','novel'], url: () => '/category/books' },
  { k: ['khilona','toy','baby'], url: () => '/category/toys' },
  { k: ['cricket','football','gym','sport','yoga'], url: () => '/category/sports' },
  { k: ['kirana','grocery','ration','masala'], url: () => '/category/grocery' },
  { k: ['gahna','jewellery','jewelry','sona','gold','chandi'], url: () => '/category/jewellery' },
  { k: ['bag','handbag','trolley'], url: () => '/category/bags' },
  { k: ['dawai','dawa','medicine','tablet','syrup'], url: () => '/medicines' },
  { k: ['paudha','plant','phool','flower','nursery'], url: () => '/nursery' },
  { k: ['naya bazaar','naya bazar','naya section'], url: () => '/naya' },
  { k: ['purana bazaar','purana bazar','second hand'], url: () => '/purana' },
  { k: ['clearance','clearence'], url: () => '/clearance' },
  { k: ['local bazaar','local bazar','local shop'], url: () => '/local-bazaar' },
  { k: ['courier'], url: () => '/couriers' },
  { k: ['wallet'], url: () => '/wallet' },
  { k: ['lucky','lottery'], url: () => '/lucky-draw' },
  { k: ['spin'], url: () => '/spin-and-win' },
  { k: ['track'], url: () => '/track' },
  { k: ['cart'], url: () => '/cart' },
];

const NAV_TRIGGERS = ['dikhao','dikhado','dikha','kholo','khol','open','show','search','khojo','le chalo','leke chalo','dekho'];

function cleanQuery(s: string): string {
  return s
    .replace(/dikhao|dikhado|dikha|kholo|khol|open|show|search|khojo|le chalo|leke chalo|dekho|karke|zara|please|mujhe|wo|yeh|ye|wo |the |kapde|clothes|saman/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns a site URL when the user asks to see/open something, else null. */
export function navIntent(text: string): string | null {
  const s = ' ' + text.toLowerCase() + ' ';
  const wantsNav = NAV_TRIGGERS.some((t) => s.includes(t));
  if (!wantsNav) return null;
  for (const r of NAV_RULES) {
    if (r.k.some((k) => s.includes(k))) return r.url('');
  }
  const q = cleanQuery(text);
  if (q.length >= 2) return '/search?q=' + encodeURIComponent(q);
  return null;
}

/* ---------------- MY SIZE PROFILE (localStorage, v2) ---------------- */
/* v2: browser-only. Phase 2 upgrade = server-side profile fields. */
export type SizeProfile = {
  heightCm?: string; waistIn?: string; chestIn?: string;
  skinTone?: string; favColors?: string; notes?: string;
};

const SIZE_KEY = 'sasta-size-profile';

export function loadSizeProfile(): SizeProfile {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(SIZE_KEY) : null;
    return raw ? (JSON.parse(raw) as SizeProfile) : {};
  } catch { return {}; }
}

export function saveSizeProfile(p: SizeProfile): void {
  try { window.localStorage.setItem(SIZE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/** One-line summary sent to the AI for size/color advice. */
export function sizeProfileLine(p: SizeProfile): string {
  const bits: string[] = [];
  if (p.heightCm) bits.push(`height ${p.heightCm}cm`);
  if (p.waistIn) bits.push(`waist ${p.waistIn} inch`);
  if (p.chestIn) bits.push(`chest ${p.chestIn} inch`);
  if (p.skinTone) bits.push(`skin tone ${p.skinTone}`);
  if (p.favColors) bits.push(`likes colors: ${p.favColors}`);
  if (p.notes) bits.push(p.notes);
  return bits.join(', ');
}

/* Condensed plain-text context for the AI system prompt (server-side). */
export const SITE_CONTEXT = `
SastaBazaar (sastabazaar.in) = 4 bazaars in one website: Naya (/naya, brand-new products), Purana (/purana, quality-checked second-hand), Clearance (/clearance, up to 80% off), Local (/local-bazaar, nearby shops, 1-2 day same-city delivery).
Key pages: /search (search all bazaars), /category (browse by category), /product (product page), /cart (checkout), /track (order tracking), /account (email OTP login, no password), /wallet (cash + reward points; points are loyalty points with no fixed cash value), /refer (refer & earn), /lucky-draw (win Rs 10,000 every Sunday), /spin-and-win (daily spin wheel; jackpot 100 points), /festivals (festival sale calendar), /medicines, /nursery (plants), /marketplace (all seller shops), /international (foreign products), /demand (post product requests), /couriers (20 courier partners: India incl. Delhivery BlueDart DTDC, International DHL FedEx UPS Aramex, China-to-India SF Express Cainiao; rates indicative; sellers ship from own accounts), /delivery/vehicles (register truck/tempo: RC + insurance + permit required; driver: ID + licence; approval needed), /biker (bike delivery partners), /sell-local and /seller (become a seller: shop name + phone, add photo/name/price/MRP/stock), /shipping, /return-policy (7-day returns; report damage within 24h with photos), /contact (care@sastabazaar.in; customer care Mon-Sat 10-7 IST; phone coming soon).
Seller rules: price can NEVER exceed MRP (Indian law); commission by category (grocery 3%, electronics 6%, fashion 12%) deducted only on sale; listing is free; honest Stock Age and Condition build trust; Seller Guarantee max 200 chars.
HONESTY RULES: order tracking and rider/driver details are DEMO until real courier APIs connect (Phase 2) — always label demo as demo. Never invent tracking data, prices, or phone numbers. Never promise a phone number that is not published. Keep answers short (2-4 lines).
`;
