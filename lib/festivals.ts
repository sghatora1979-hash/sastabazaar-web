/*
 * Festival Commerce Engine
 * ------------------------
 * Indian festivals + government holidays, state-wise. Powers:
 *  - Temu-style 3D promo banners with live countdowns
 *  - Festival calendar page (/festivals)
 *  - Shop-by-state filtering (each state: own language, clothes, food, sellers)
 *
 * NOTE: many festival dates follow the lunar calendar and shift every year.
 * Verify dates each January. Government holiday dates are fixed.
 */

export type IndianState = {
  code: string;
  name: string;
  languages: string[];
};

export const STATES: IndianState[] = [
  { code: 'AP', name: 'Andhra Pradesh', languages: ['Telugu'] },
  { code: 'AR', name: 'Arunachal Pradesh', languages: ['English', 'Hindi'] },
  { code: 'AS', name: 'Assam', languages: ['Assamese'] },
  { code: 'BR', name: 'Bihar', languages: ['Hindi'] },
  { code: 'CT', name: 'Chhattisgarh', languages: ['Hindi', 'Chhattisgarhi'] },
  { code: 'GA', name: 'Goa', languages: ['Konkani'] },
  { code: 'GJ', name: 'Gujarat', languages: ['Gujarati'] },
  { code: 'HR', name: 'Haryana', languages: ['Hindi', 'Haryanvi'] },
  { code: 'HP', name: 'Himachal Pradesh', languages: ['Hindi'] },
  { code: 'JH', name: 'Jharkhand', languages: ['Hindi'] },
  { code: 'KA', name: 'Karnataka', languages: ['Kannada'] },
  { code: 'KL', name: 'Kerala', languages: ['Malayalam'] },
  { code: 'MP', name: 'Madhya Pradesh', languages: ['Hindi'] },
  { code: 'MH', name: 'Maharashtra', languages: ['Marathi'] },
  { code: 'MN', name: 'Manipur', languages: ['Manipuri'] },
  { code: 'ML', name: 'Meghalaya', languages: ['English', 'Khasi'] },
  { code: 'MZ', name: 'Mizoram', languages: ['Mizo'] },
  { code: 'NL', name: 'Nagaland', languages: ['English', 'Nagamese'] },
  { code: 'OD', name: 'Odisha', languages: ['Odia'] },
  { code: 'PB', name: 'Punjab', languages: ['Punjabi'] },
  { code: 'RJ', name: 'Rajasthan', languages: ['Hindi', 'Rajasthani'] },
  { code: 'SK', name: 'Sikkim', languages: ['Nepali', 'English'] },
  { code: 'TN', name: 'Tamil Nadu', languages: ['Tamil'] },
  { code: 'TG', name: 'Telangana', languages: ['Telugu'] },
  { code: 'TR', name: 'Tripura', languages: ['Bengali', 'Kokborok'] },
  { code: 'UP', name: 'Uttar Pradesh', languages: ['Hindi'] },
  { code: 'UT', name: 'Uttarakhand', languages: ['Hindi'] },
  { code: 'WB', name: 'West Bengal', languages: ['Bengali'] },
  { code: 'AN', name: 'Andaman & Nicobar', languages: ['Hindi', 'Bengali'] },
  { code: 'CH', name: 'Chandigarh', languages: ['Hindi', 'Punjabi'] },
  { code: 'DN', name: 'Dadra & Nagar Haveli and Daman & Diu', languages: ['Gujarati', 'Hindi'] },
  { code: 'DL', name: 'Delhi', languages: ['Hindi'] },
  { code: 'JK', name: 'Jammu & Kashmir', languages: ['Urdu', 'Kashmiri'] },
  { code: 'LA', name: 'Ladakh', languages: ['Ladakhi'] },
  { code: 'LD', name: 'Lakshadweep', languages: ['Malayalam'] },
  { code: 'PY', name: 'Puducherry', languages: ['Tamil', 'French'] },
];

export function stateName(code: string): string {
  return STATES.find(s => s.code === code)?.name ?? code;
}

export type Festival = {
  id: string;
  name: string;
  emoji: string;
  month: number; // 1-12
  day: number;
  states: string[]; // state codes, or ['ALL']
  theme: [string, string]; // gradient colors
  tagline: string;
  sale: string; // sale event name
  govtHoliday?: boolean;
  mega?: boolean; // big bonanza sales
};

export const FESTIVALS: Festival[] = [
  { id: 'sankranti', name: 'Makar Sankranti', emoji: '🪁', month: 1, day: 14, states: ['ALL'], theme: ['#FF9933', '#FF5722'], tagline: 'Kites, til-gud & winter fashion deals', sale: 'Sankranti Soar Sale' },
  { id: 'pongal', name: 'Pongal', emoji: '🍚', month: 1, day: 14, states: ['TN'], theme: ['#2E7D32', '#66BB6A'], tagline: 'Tamil Nadu harvest festival specials', sale: 'Pongal Harvest Sale' },
  { id: 'republic', name: 'Republic Day', emoji: '🇮🇳', month: 1, day: 26, states: ['ALL'], theme: ['#FF9933', '#138808'], tagline: 'Tricolour pride, patriotic prices', sale: 'Republic Day Dhamaka', govtHoliday: true },
  { id: 'holi', name: 'Holi', emoji: '🎨', month: 3, day: 4, states: ['ALL'], theme: ['#E91E63', '#9C27B0'], tagline: 'Colours, sweets & festive fashion', sale: 'Holi Colour Carnival Mega Bonanza', mega: true },
  { id: 'ugadi', name: 'Ugadi / Gudi Padwa', emoji: '🌾', month: 3, day: 19, states: ['KA', 'AP', 'TG', 'MH'], theme: ['#F9A825', '#EF6C00'], tagline: 'New Year, new wardrobe', sale: 'New Year Fresh Sale' },
  { id: 'eid-fitr', name: 'Eid al-Fitr', emoji: '🌙', month: 3, day: 20, states: ['ALL'], theme: ['#0D47A1', '#26C6DA'], tagline: 'Eid Mubarak — festive gifting', sale: 'Eid Celebration Sale' },
  { id: 'baisakhi', name: 'Baisakhi', emoji: '🌾', month: 4, day: 13, states: ['PB', 'HR'], theme: ['#F57F17', '#FFB300'], tagline: 'Punjab harvest joy & phulkari fashion', sale: 'Baisakhi Bounty Sale' },
  { id: 'puthandu', name: 'Puthandu / Vishu / Bihu', emoji: '🥁', month: 4, day: 14, states: ['TN', 'KL', 'AS'], theme: ['#C62828', '#FF8A65'], tagline: 'New Year across South & East India', sale: 'Spring New Year Sale' },
  { id: 'independence', name: 'Independence Day', emoji: '🇮🇳', month: 8, day: 15, states: ['ALL'], theme: ['#FF9933', '#000080'], tagline: 'Freedom sale — biggest of the monsoon', sale: 'Freedom Flash Sale', govtHoliday: true },
  { id: 'onam', name: 'Onam', emoji: '🌸', month: 8, day: 26, states: ['KL'], theme: ['#AD1457', '#EC407A'], tagline: "Kerala's grand floral festival", sale: 'Onam Sadhya Sale' },
  { id: 'rakhi', name: 'Raksha Bandhan', emoji: '🧵', month: 8, day: 28, states: ['ALL'], theme: ['#D81B60', '#FF7043'], tagline: 'Gifts for your brother & sister', sale: 'Rakhi Gift Rush' },
  { id: 'ganesh', name: 'Ganesh Chaturthi', emoji: '🐘', month: 9, day: 14, states: ['MH', 'GA', 'KA'], theme: ['#E65100', '#FFA000'], tagline: 'Bappa blessings & home makeover', sale: 'Bappa Home Festival' },
  { id: 'gandhi', name: 'Gandhi Jayanti', emoji: '🕊️', month: 10, day: 2, states: ['ALL'], theme: ['#616161', '#9E9E9E'], tagline: 'Swadeshi shopping — Made in India', sale: 'Swadeshi Value Sale', govtHoliday: true },
  { id: 'navratri', name: 'Navratri', emoji: '💃', month: 10, day: 11, states: ['GJ', 'ALL'], theme: ['#6A1B9A', '#EC407A'], tagline: '9 nights of garba & ethnic fashion', sale: 'Navratri Nights Sale' },
  { id: 'durga-puja', name: 'Durga Puja', emoji: '🛕', month: 10, day: 16, states: ['WB', 'AS', 'TR'], theme: ['#B71C1C', '#FF5252'], tagline: 'Pandal-hopping in new ethnic wear', sale: 'Pujo Fashion Fiesta' },
  { id: 'dussehra', name: 'Dussehra', emoji: '🏹', month: 10, day: 20, states: ['ALL'], theme: ['#4A148C', '#7B1FA2'], tagline: 'Victory of good deals over evil prices', sale: 'Dussehra Victory Sale', govtHoliday: true },
  { id: 'karva', name: 'Karva Chauth', emoji: '🌝', month: 10, day: 28, states: ['UP', 'PB', 'HR', 'RJ', 'DL', 'MP'], theme: ['#880E4F', '#F06292'], tagline: 'Sargi specials & festive jewellery', sale: 'Karva Chauth Glow Sale' },
  { id: 'dhanteras', name: 'Dhanteras', emoji: '🪙', month: 11, day: 6, states: ['ALL'], theme: ['#FF8F00', '#FFD54F'], tagline: 'Shubh gold, gadgets & new beginnings', sale: 'Dhanteras Gold Rush Bonanza', mega: true },
  { id: 'diwali', name: 'Diwali', emoji: '🪔', month: 11, day: 8, states: ['ALL'], theme: ['#E65100', '#FFCA28'], tagline: 'The BIGGEST sale of the year — lights, gifts & everything', sale: 'Diwali Dhamaka Mega Bonanza', mega: true },
  { id: 'chhath', name: 'Chhath Puja', emoji: '🌅', month: 11, day: 13, states: ['BR', 'UP', 'JH'], theme: ['#EF6C00', '#FFAB40'], tagline: 'Sun god blessings & festive essentials', sale: 'Chhath Festive Sale' },
  { id: 'lakshmi-puja', name: 'Lakshmi Puja', emoji: '💰', month: 11, day: 8, states: ['ALL'], theme: ['#B8860B', '#FFD700'], tagline: 'Wealth & prosperity — gold, gadgets & shubh beginnings', sale: 'Lakshmi Puja Gold Bonanza', mega: true },
  { id: 'gurpurab', name: 'Guru Nanak Gurpurab', emoji: '🙏', month: 11, day: 24, states: ['ALL'], theme: ['#1E88E5', '#FFC107'], tagline: 'Blessings of Guru Nanak Dev Ji — gifts, langar specials & winter wear', sale: 'Gurpurab Blessings Bonanza', mega: true },
  { id: 'buddha-purnima', name: 'Buddha Purnima', emoji: '🪷', month: 5, day: 1, states: ['ALL'], theme: ['#6A1B9A', '#CE93D8'], tagline: 'Peace, wisdom & mindful shopping', sale: 'Buddha Purnima Big Bonanza', mega: true },
  { id: 'christmas', name: 'Christmas', emoji: '🎄', month: 12, day: 25, states: ['ALL'], theme: ['#B71C1C', '#2E7D32'], tagline: 'Secret Santa gifting & winter wear', sale: 'Christmas Carnival Mega Bonanza', govtHoliday: true, mega: true },
];

/** Next occurrence of a festival on/after `from`. */
export function festivalDate(f: Festival, from: Date = new Date()): Date {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let d = new Date(from.getFullYear(), f.month - 1, f.day);
  if (d < start) d = new Date(from.getFullYear() + 1, f.month - 1, f.day);
  return d;
}

export function getUpcomingFestivals(limit = 6, from: Date = new Date()): Festival[] {
  return [...FESTIVALS]
    .sort((a, b) => festivalDate(a, from).getTime() - festivalDate(b, from).getTime())
    .slice(0, limit);
}

export function getNextFestival(from: Date = new Date()): Festival | undefined {
  return getUpcomingFestivals(1, from)[0];
}

export function getFestivalsForState(code: string): Festival[] {
  return FESTIVALS.filter(f => f.states.includes('ALL') || f.states.includes(code));
}

export function formatFestivalDate(f: Festival, from: Date = new Date()): string {
  return festivalDate(f, from).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function countdownParts(target: Date, now: Date = new Date()): {
  days: number; hours: number; mins: number; secs: number;
} {
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    mins: Math.floor(diff / 60000) % 60,
    secs: Math.floor(diff / 1000) % 60,
  };
}
