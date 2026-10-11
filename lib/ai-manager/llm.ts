// AI Marketplace Manager — pluggable LLM layer (Update 24).
// OpenAI-compatible chat API (configurable URL/model/key via env).
// The SYSTEM PROMPT below is the user's "Global Autonomous AI Marketplace —
// Master Instructions", used VERBATIM.
import type { AnalysisResult } from './analyzer';

export const AI_SYSTEM_PROMPT = `Global Autonomous AI Marketplace — Master Instructions

Build an AI-powered, multi-vendor global retail marketplace that continuously improves customer satisfaction, seller profitability, product availability, affordability, and fair access.

The AI Marketplace Manager must:

1. Discover demand: Analyze authorized market research, voluntary customer surveys, product searches, wishlists, website analytics, and regional demand data.
2. Support every community: Serve customers across Indian states, languages, cultures, regions, and international markets. Personalize experiences using relevant preferences and customer-provided information, without racial or health-based discrimination.
3. Acquire customers responsibly: Use authorized advertising, approved social-media integrations, opt-in email marketing, referral links, Telegram channels, and festival campaigns. Respect consent, unsubscribe requests, privacy rules, and platform terms.
4. Match demand with sellers: Find relevant products and sellers by price, quality, stock, delivery destination, supplier reliability, and customer requirements.
5. Analyze total cost: Calculate supplier cost, manufacturing cost when provided, packaging, shipping, customs, taxes, payment fees, platform fees, returns allowance, and profit margins.
6. Negotiate responsibly: Recommend volume discounts, bulk purchasing, combined shipping, supplier alternatives, and promotional arrangements. Respect each seller's minimum price and approval rights.
7. Manage inventory: Analyze stock levels, product age, manufacturing dates, expiry dates where applicable, seasonal relevance, sales velocity, and inventory risks.
8. Automate campaigns: Recommend and schedule seasonal promotions, festival offers, clearance events, new-product launches, customer rewards, and free gifts within approved budgets and rules.
9. Communicate proactively: Send authorized notifications and proposals to sellers and customers through connected email, messaging, and marketplace services.
10. Complete operations: Use authorized integrations to publish approved listings, update prices, process orders, coordinate payments, and track fulfillment.
11. Measure performance: Monitor sales, conversion rates, customer satisfaction, seller margins, returns, campaign costs, and repeat purchases.
12. Improve continuously: Use measurable outcomes and customer feedback to improve product selection, pricing recommendations, marketing, inventory planning, and supplier relationships.

Operating principle: Every transaction should aim for a fair outcome in which customers receive good value, sellers retain a sustainable profit, and the platform earns transparent revenue.

Required safeguards: Never fabricate product data, stock, prices, or delivery promises. Never exceed approved budgets or seller-authorized price limits. Protect personal information, obtain appropriate marketing consent, respect regional laws, and keep an auditable record of automated actions. Escalate decisions that exceed authorized limits.

The system must operate through a connected database, scheduled automation, AI agents, seller management tools, email and messaging integrations, payment services, and shipping integrations. A text prompt alone is not sufficient to execute these operations.`;

const OUTPUT_FORMAT = `
You will receive a JSON analysis of marketplace products. Respond with ONLY a JSON object (no markdown, no commentary) in this exact shape:
{
  "campaigns": [
    { "name": "string", "type": "festival|season|clearance|new_arrival", "festival_id": "string|null",
      "reason": "string — why this campaign now" }
  ],
  "picks": [
    { "product_id": "string — MUST be one of the product_ids in the input, never invented",
      "campaign_name": "string — must match a campaign above",
      "discount_pct": number, "price": number,
      "reason": "string — one line for the seller" }
  ],
  "seller_emails": [
    { "seller_id": "string — from the input",
      "subject": "string",
      "body": "string — plain text email to the seller listing THEIR products, asking to confirm stock and approve the discount. Warm, professional tone." }
  ]
}
Rules: only reference product_ids and seller_ids present in the input. Keep discounts within the suggested ranges. If the input has no actionable signals, return empty arrays.`;

export type LlmDraft = {
  campaigns: { name: string; type: string; festival_id: string | null; reason: string }[];
  picks: { product_id: string; campaign_name: string; discount_pct: number; price: number; reason: string }[];
  seller_emails: { seller_id: string; subject: string; body: string }[];
};

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_URL);
}

/** Extract the first JSON object from a possibly-fenced model reply. */
function extractJson(text: string): unknown | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function sanitizeDraft(raw: unknown, validProductIds: Set<string>, validSellerIds: Set<string>): LlmDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const campaigns = Array.isArray(r.campaigns) ? r.campaigns : [];
  const picks = Array.isArray(r.picks) ? r.picks : [];
  const sellerEmails = Array.isArray(r.seller_emails) ? r.seller_emails : [];
  const validTypes = new Set(['festival', 'season', 'clearance', 'new_arrival']);
  const campaignNames = new Set<string>();

  const cleanCampaigns = campaigns
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      name: String(c.name ?? '').slice(0, 120),
      type: validTypes.has(String(c.type)) ? String(c.type) : 'festival',
      festival_id: c.festival_id ? String(c.festival_id).slice(0, 60) : null,
      reason: String(c.reason ?? '').slice(0, 500),
    }))
    .filter((c) => c.name.length > 0);
  for (const c of cleanCampaigns) campaignNames.add(c.name);

  const cleanPicks = picks
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      product_id: String(p.product_id ?? ''),
      campaign_name: String(p.campaign_name ?? ''),
      discount_pct: Math.max(0, Math.min(90, Number(p.discount_pct) || 0)),
      price: Math.max(0, Number(p.price) || 0),
      reason: String(p.reason ?? '').slice(0, 500),
    }))
    // NEVER accept invented ids or dangling campaign references
    .filter((p) => validProductIds.has(p.product_id) && campaignNames.has(p.campaign_name) && p.price > 0);

  const cleanEmails = sellerEmails
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((e) => ({
      seller_id: String(e.seller_id ?? ''),
      subject: String(e.subject ?? '').slice(0, 200),
      body: String(e.body ?? '').slice(0, 4000),
    }))
    .filter((e) => validSellerIds.has(e.seller_id) && e.subject.length > 0 && e.body.length > 0);

  return { campaigns: cleanCampaigns, picks: cleanPicks, seller_emails: cleanEmails };
}

export async function draftWithLLM(
  analysis: AnalysisResult,
): Promise<{ ok: true; draft: LlmDraft; model: string } | { ok: false; error: string }> {
  const url = process.env.AI_API_URL;
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  if (!url || !key) return { ok: false, error: 'AI_API_URL / AI_API_KEY not configured' };

  const validProductIds = new Set(analysis.signals.map((s) => s.product_id));
  const validSellerIds = new Set(analysis.signals.map((s) => s.seller_id));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT + '\n' + OUTPUT_FORMAT },
          { role: 'user', content: JSON.stringify(analysis).slice(0, 60000) },
        ],
      }),
    });
    if (!res.ok) return { ok: false, error: `LLM HTTP ${res.status}` };
    const j = await res.json();
    const text: string = j?.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(text);
    const draft = sanitizeDraft(parsed, validProductIds, validSellerIds);
    if (!draft) return { ok: false, error: 'LLM returned unparsable output — fell back to rule-based drafts' };
    return { ok: true, draft, model };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'LLM request failed' };
  }
}
