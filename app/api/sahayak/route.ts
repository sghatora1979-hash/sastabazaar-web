import { NextResponse } from 'next/server';
import { answerFor, langName, SITE_CONTEXT, type LangCode } from '@/components/sasta-chatbot/sahayak-kb';

/*
 * Sasta Sahayak AI — server route (v2).
 * POST /api/sahayak  { question, lang, history?, userEmail?, sizeProfile?, image?, ping? }
 *
 * Uses ONLY server-side env vars: AI_PROVIDER (default "gemini"), AI_API_KEY,
 * optional AI_MODEL, AI_BASE_URL. The key NEVER leaves the server, is never
 * logged, never stored.
 *
 * REAL CATALOG: product questions are answered from live Supabase `products`
 * rows (active only). The AI is instructed to use ONLY those fields; when a
 * detail (fabric, size, dimensions, medicine indication…) is missing it must
 * say the seller has not provided it — never invent.
 *
 * PHOTO PRIVACY: an attached photo is forwarded to the vision model for that
 * single request only. It is never stored on the server, never logged, never
 * shared.
 */

const MAX_Q = 500;
const MAX_HISTORY = 6;
const MAX_IMAGE_BYTES = 2_000_000; // ~2MB base64

type Provider = 'gemini' | 'openai-compatible';

type CatalogProduct = {
  title: string; title_hi: string | null; description: string | null;
  highlights: string[] | null; price: number; mrp: number;
  category_slug: string | null; subcategory: string | null; section: string;
  slug: string; condition: string | null; stock_age: string | null;
  seller_guarantee: string | null; city: string | null;
};

const STOP = new Set([
  'kya','hai','hain','ke','ka','ki','ko','me','mein','par','aur','ye','yeh','woh','wo','kaun','kaise','kahan','kab','kitna','kitne','dikhao','dikhado','batao','bataiye','kholo','khol','chahiye','wala','wali','mujhe','mere','mera','meri','aap','aapka','the','and','for','with','from','show','open','please','tell','what','which','this','that','sasta','bazaar',
]);

function keywordsOf(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[^a-z\u0900-\u097F0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, 4);
}

async function searchCatalog(question: string): Promise<CatalogProduct[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const words = keywordsOf(question);
  if (!words.length) return [];
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, key);
    const ors = words.map((w) => `title.ilike.%${w}%,description.ilike.%${w}%`).join(',');
    const { data, error } = await sb
      .from('products')
      .select('title,title_hi,description,highlights,price,mrp,category_slug,subcategory,section,slug,condition,stock_age,seller_guarantee,city')
      .eq('status', 'active')
      .or(ors)
      .limit(8);
    if (error || !data) return [];
    return data as CatalogProduct[];
  } catch {
    return [];
  }
}

function catalogBlock(products: CatalogProduct[]): string {
  if (!products.length) return 'REAL CATALOG: no matching products found for this question.';
  const lines = products.map((p, i) => {
    const bits = [
      `#${i + 1} "${p.title}"`,
      p.title_hi ? `(HI: ${p.title_hi})` : '',
      `price ₹${p.price} (MRP ₹${p.mrp})`,
      p.category_slug ? `category: ${p.category_slug}` : '',
      p.subcategory ? `subcategory: ${p.subcategory}` : '',
      `section: ${p.section}`,
      p.description ? `description: ${p.description.slice(0, 300)}` : '',
      p.highlights && p.highlights.length ? `highlights: ${p.highlights.join('; ')}` : '',
      p.condition ? `condition: ${p.condition}` : '',
      p.stock_age ? `stock age: ${p.stock_age}` : '',
      p.seller_guarantee ? `seller guarantee: ${p.seller_guarantee}` : '',
      p.city ? `city: ${p.city}` : '',
      `link: /product/${p.slug}`,
    ].filter(Boolean);
    return bits.join(' | ');
  });
  return `REAL CATALOG PRODUCTS (these are the ONLY products you may recommend or describe — never invent others):\n${lines.join('\n')}`;
}

function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  return p === 'openai-compatible' ? 'openai-compatible' : 'gemini';
}

function systemPrompt(
  lang: LangCode, userEmail: string | undefined,
  sizeProfile: string | undefined, hasImage: boolean, catalog: string,
): string {
  return `You are "Sasta Sahayak", the friendly help assistant for the SastaBazaar website (an Indian online marketplace).
Answer in ${langName(lang)} ONLY. Keep answers SHORT: 2-4 lines, simple words a non-technical person understands.
You may use a few <b>bold</b> tags and <br> line breaks, and product links like <a href="/product/slug">name</a>. Do NOT use markdown.
${userEmail ? `The logged-in user is ${userEmail}. You may greet them by email and point sellers to /seller and delivery partners to /delivery/vehicles. Never reveal anyone else's data.` : `The user is not logged in. If they ask about selling or delivery work, mention they can register via /account first.`}
${sizeProfile ? `USER'S SIZE PROFILE (use for size/color advice): ${sizeProfile}` : ''}
${hasImage ? `The user attached a PHOTO. First describe briefly what you see (person's apparent clothing/style), then recommend 2-3 matching outfits or colors from the REAL CATALOG below. The photo is used only for this one answer — mention that it is not stored.` : ''}
SITE KNOWLEDGE:
${SITE_CONTEXT}
${catalog}
STRICT PRODUCT RULES (never break):
- Answer product questions (fabric cotton/polyester/terrycot? dimensions? size? what illness is a medicine for? material?) ONLY from the REAL CATALOG PRODUCTS above.
- If the catalog does not list a detail, say plainly in the user's language that "the seller has not provided this information" (e.g. Hindi: "seller ne ye jaankari nahi di hai") — NEVER invent fabric, size, dimensions, or medical uses.
- Recommend ONLY products from the catalog above, with their real price and a link like <a href="/product/slug">title</a>.
- Regional/style suggestions (Gujarati, Punjabi…) are allowed only when the catalog data supports them.
HONESTY RULES: order tracking and rider/driver details are DEMO until real courier APIs connect (Phase 2) — always say "(demo)". Never invent tracking data, prices, phone numbers, or delivery dates. If you don't know, say so and point to care@sastabazaar.in.`;
}

type ImgPart = { mime: string; data: string } | null;

async function callGemini(question: string, history: string[], lang: LangCode, userEmail: string | undefined, sizeProfile: string | undefined, img: ImgPart, catalog: string): Promise<string> {
  const key = process.env.AI_API_KEY!;
  const model = process.env.AI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
  if (img) userParts.push({ inlineData: { mimeType: img.mime, data: img.data } });
  userParts.push({ text: question });
  const contents = [
    ...history.slice(-MAX_HISTORY).map((h) => ({ role: 'user' as const, parts: [{ text: h }] })),
    { role: 'user' as const, parts: userParts },
  ];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(lang, userEmail, sizeProfile, !!img, catalog) }] },
      contents,
      generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('');
  if (!text) throw new Error('gemini empty');
  return text.trim();
}

async function callOpenAICompatible(question: string, history: string[], lang: LangCode, userEmail: string | undefined, sizeProfile: string | undefined, img: ImgPart, catalog: string): Promise<string> {
  const key = process.env.AI_API_KEY!;
  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const userContent: ({ type: string; text?: string; image_url?: { url: string } })[] = [];
  if (img) userContent.push({ type: 'image_url', image_url: { url: `data:${img.mime};base64,${img.data}` } });
  userContent.push({ type: 'text', text: question });
  const messages = [
    { role: 'system', content: systemPrompt(lang, userEmail, sizeProfile, !!img, catalog) },
    ...history.slice(-MAX_HISTORY).map((h) => ({ role: 'user', content: h })),
    { role: 'user', content: userContent },
  ];
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`provider ${res.status}`);
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('provider empty');
  return String(text).trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = process.env.AI_API_KEY;

    if (body.ping) {
      return NextResponse.json({ ai: !!key, provider: getProvider() });
    }

    const question = String(body.question || '').slice(0, MAX_Q).trim();
    const lang: LangCode = typeof body.lang === 'string' ? body.lang : 'en';
    const history: string[] = Array.isArray(body.history)
      ? body.history.map(String).slice(-MAX_HISTORY)
      : [];
    const userEmail = typeof body.userEmail === 'string' ? body.userEmail.slice(0, 120) : undefined;
    const sizeProfile = typeof body.sizeProfile === 'string' ? body.sizeProfile.slice(0, 300) : undefined;

    // Optional photo (data URL). Validated, never stored, never logged.
    let img: ImgPart = null;
    if (typeof body.image === 'string' && body.image.startsWith('data:image/')) {
      const m = body.image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (m && m[2].length < MAX_IMAGE_BYTES) img = { mime: m[1], data: m[2] };
    }

    if (!question && !img) return NextResponse.json({ error: 'empty question' }, { status: 400 });

    // Real catalog lookup for product questions (also powers links).
    const products = await searchCatalog(question || 'kapde');
    const catalog = catalogBlock(products);

    // Basic mode: no key configured → honest rule-based fallback.
    if (!key) {
      return NextResponse.json({
        mode: 'basic',
        answer: answerFor(question || 'photo', lang === 'hi' ? 'hi' : 'en'),
        notice:
          lang === 'hi'
            ? '⚠️ AI key configured नहीं है — basic mode में जवाब दे रहा हूँ।'
            : '⚠️ AI key is not configured — answering in basic mode.',
      });
    }

    try {
      const q = question || (lang === 'hi'
        ? 'Meri photo dekho aur mujhe outfit/color suggest karo (catalog se).'
        : 'Look at my photo and suggest outfits/colors (from the catalog).');
      const answer =
        getProvider() === 'gemini'
          ? await callGemini(q, history, lang, userEmail, sizeProfile, img, catalog)
          : await callOpenAICompatible(q, history, lang, userEmail, sizeProfile, img, catalog);
      return NextResponse.json({ mode: 'ai', answer });
    } catch {
      return NextResponse.json({
        mode: 'basic',
        answer: answerFor(question || 'photo', lang === 'hi' ? 'hi' : 'en'),
        notice:
          lang === 'hi'
            ? '⚠️ AI से जुड़ नहीं पाया — basic mode में जवाब दे रहा हूँ।'
            : '⚠️ Could not reach the AI — answering in basic mode.',
      });
    }
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    ai: !!process.env.AI_API_KEY,
    provider: getProvider(),
    usage: 'POST { question, lang, history?, userEmail?, sizeProfile?, image? (data URL) }',
  });
}
