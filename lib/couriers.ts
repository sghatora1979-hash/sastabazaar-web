// SastaBazaar Courier Directory (Update 23).
// INDICATIVE starting rates (500g) — actual rate depends on zone/volume/contract.
// Sellers ship from their OWN courier accounts; SastaBazaar does not ship itself.
export type Courier = {
  name: string;
  scope: 'india' | 'intl' | 'china';
  rate: string;        // indicative 500g range
  time: string;        // typical delivery time
  coverage: string;
  best: string;        // best-for note
  track: string;       // tracking URL
};

export const COURIERS: Courier[] = [
  // ---------- INDIA DOMESTIC ----------
  { name: 'Delhivery', scope: 'india', rate: '₹40–75', time: '2–4 din', coverage: '29,000+ pincodes', best: 'Sabse zyada reach — chhote sheher/kasbe', track: 'https://www.delhivery.com/track' },
  { name: 'BlueDart', scope: 'india', rate: '₹65–150', time: '1–2 din', coverage: 'Pan-India metros', best: 'Fastest premium — urgent/mahanga samaan', track: 'https://www.bluedart.com/tracking' },
  { name: 'DTDC', scope: 'india', rate: '₹60–130', time: '2–3 din', coverage: 'Pan-India', best: 'Purana bharosemand network', track: 'https://www.dtdc.in/trace.asp' },
  { name: 'Ecom Express', scope: 'india', rate: '₹45–100', time: '3–5 din', coverage: 'Pan-India', best: 'Budget e-commerce shipping', track: 'https://ecomexpress.in/tracking' },
  { name: 'XpressBees', scope: 'india', rate: '₹40–65', time: '2–4 din', coverage: 'Pan-India', best: 'Sasta + tez e-commerce', track: 'https://www.xpressbees.com/track' },
  { name: 'Ekart', scope: 'india', rate: '₹34–59', time: '2–4 din', coverage: 'Pan-India', best: 'Sabse saste mein se ek', track: 'https://www.ekartlogistics.com/track' },
  { name: 'Shadowfax', scope: 'india', rate: '₹25–60', time: 'Same-day–2 din', coverage: '500+ cities', best: 'Hyperlocal / same-city delivery', track: 'https://shadowfax.in/track' },
  { name: 'India Post (Speed Post)', scope: 'india', rate: '₹40–75', time: '3–6 din', coverage: 'Har gaon tak', best: 'Sabse sasta — remote areas', track: 'https://www.indiapost.gov.in' },
  { name: 'Gati', scope: 'india', rate: '₹60–120', time: '3–7 din', coverage: 'Pan-India surface', best: 'Bhaari/bulk samaan (surface)', track: 'https://www.gati.com' },
  { name: 'Shiprocket (Aggregator)', scope: 'india', rate: '₹21 se shuru', time: 'courier par nirbhar', coverage: '27+ courier ek dashboard', best: 'Ek login mein sab courier compare karo', track: 'https://www.shiprocket.in' },
  // ---------- INTERNATIONAL ----------
  { name: 'DHL Express', scope: 'intl', rate: '₹1,500–2,500', time: '2–4 din', coverage: '220+ desh', best: 'Sabse tez international', track: 'https://www.dhl.com/in-en/home/tracking.html' },
  { name: 'FedEx', scope: 'intl', rate: '₹1,200–2,000', time: '2–5 din', coverage: '220+ desh', best: 'Reliable worldwide', track: 'https://www.fedex.com/en-in/home.html' },
  { name: 'UPS', scope: 'intl', rate: '₹1,200–2,200', time: '2–5 din', coverage: '220+ desh', best: 'B2B + heavy parcels', track: 'https://www.ups.com/track' },
  { name: 'Aramex', scope: 'intl', rate: '₹900–1,500', time: '3–6 din', coverage: 'Middle East + worldwide', best: 'Budget international', track: 'https://www.aramex.com/track' },
  // ---------- CHINA → INDIA (Chinese seller) ----------
  { name: 'SF Express', scope: 'china', rate: '~₹3,100 (0.5kg)', time: '3–5 din', coverage: 'China → India', best: 'Official fast — mahanga lekin tez', track: 'https://www.sf-international.com' },
  { name: 'Cainiao', scope: 'china', rate: '~₹500–900/kg', time: '8–15 din', coverage: 'China → worldwide', best: 'Alibaba ka network — sasta', track: 'https://global.cainiao.com' },
  { name: 'Yanwen', scope: 'china', rate: '~₹400–800/kg', time: '10–18 din', coverage: 'China → India', best: 'Budget e-packet jaisa', track: 'https://www.yanwenexpress.com' },
  { name: '4PX', scope: 'china', rate: '~₹450–850/kg', time: '8–15 din', coverage: 'China → worldwide', best: 'Cross-border e-commerce specialist', track: 'https://www.4px.com' },
  { name: 'China Post', scope: 'china', rate: '~₹600–1,000/kg', time: '12–20 din', coverage: 'Worldwide', best: 'Sarkari post — sabse sasta', track: 'https://www.chinapost.com.cn' },
  { name: 'DDP Agent (door-to-door)', scope: 'china', rate: '~₹750–1,300/kg', time: '7–12 din', coverage: 'China → India', best: 'Customs included — no headache', track: '' },
];

export const SCOPES = [
  { id: 'india', label: '🇮🇳 India Couriers', desc: 'Indian sellers ke liye domestic delivery' },
  { id: 'intl', label: '🌍 International', desc: 'India se bahar bhejna ho to' },
  { id: 'china', label: '🇨🇳 China → India', desc: 'Chinese seller ke liye' },
] as const;
