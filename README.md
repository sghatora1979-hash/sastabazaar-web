# SastaBazaar — सस्ते सामान का बाज़ार

A production-ready Next.js 14 storefront: 4 bazaars (Naya, Purana, Clearance, Local),
3D product cards, daily color-theme rotation, like/dislike personalization,
Spin & Win rewards, cart, search, categories and product pages.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Build for production

```bash
npm run build
npm start
```

## Deploy — easiest way (Vercel, free)

1. Create a free account at https://vercel.com
2. Push this folder to a GitHub repo (or drag the folder into Vercel's import screen)
3. Click **Import → Deploy**. No environment variables are required for the demo.
4. Your site goes live at `https://sastabazaar.vercel.app` (rename to your domain in settings).

## Deploy — any Node host

```bash
npm install
npm run build
npm start        # serves on port 3000
```

## What's inside

- `app/` — home, 4 bazaar pages, category, product, cart, search, spin-and-win, account, policy pages, API routes
- `components/3d/` — 3D tilt product cards, parallax hero, 3D spin wheel
- `components/home/` — hero, bazaar selector, personalized feed, deal of the day, category grid
- `components/layout/` — header (live search), footer, mobile bottom nav
- `components/ui/` — daily theme provider, like/dislike, section badges
- `lib/` — theme engine (7 rotating daily themes), 400 demo products across 20 categories,
  cart, interactions, recommendations

## Going live checklist

- [ ] Replace `picsum.photos` demo images in `lib/products.ts` with real product photos
- [ ] Connect a real database (Supabase/Postgres) — wire up `app/api/recommend`, `interact`, `spin`
- [ ] Add a payment gateway (Razorpay/Stripe) in the cart checkout
- [ ] Update WhatsApp number in `Header.tsx`, `Footer.tsx`, policy pages
- [ ] Point `NEXT_PUBLIC_SITE_URL` in `.env.local` at your real domain

---

## Update 21 — 🚴 Bikers & Home Delivery (2026-10-10)

One unified marketplace: customers, local shops, sellers **and** verified delivery
partners in a single system. Additive only — no existing feature was changed.

### New pages
- `/delivery` — customer Home Delivery landing + PIN serviceability checker
- `/delivery/become-partner` — biker recruitment info
- `/delivery/track/[id]` — live delivery tracking (biker name/photo, status timeline, ETA, OTP, secure chat)
- `/delivery/support` — disputes & help
- `/biker/register` — 5-step KYC form (profile, licence+vehicle, Aadhaar/PAN consent, service zone, payout+terms)
- `/biker/login` — biker entry (uses the normal SastaBazaar email-OTP account)
- `/biker/dashboard` — online/offline toggle, job offers (accept/reject), pickup/delivery OTP, earnings, notifications
- `/biker/jobs` — available offers + delivery history
- `/biker/earnings` — earnings ledger
- `/admin/bikers` — applications, KYC review, approve/reject/suspend, disputes
- Header nav: 🚴 Delivery (desktop) + "Bikers & Home Delivery" (mobile menu)
- PWA: installable (`/manifest.webmanifest`, icons, `/sw.js` service worker)

### Setup
1. Supabase SQL Editor → run `supabase/migrations/004_bikers_delivery.sql` → "Success".
   This creates 12 tables, the `biker_public_profile()` secure function
   (approved bikers, public fields only), the **private** `biker-docs`
   storage bucket, RLS policies, and 6 RPCs (atomic job claim, OTP, job creation).
2. No new env vars. Existing `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are reused.
3. Deploy via the normal GitHub → Vercel flow.

### Demo vs real — honest status
| Feature | Status |
|---|---|
| Phone/OTP codes | **DEMO** — codes shown on screen; no SMS provider configured |
| KYC document review | Manual by admin ("pending verification"); **no auto-verification provider** |
| Aadhaar/PAN/licence/bank docs | Private bucket, masked display, owner+admin only — never public |
| Delivery fee / payouts | **Demo ledger** (₹40 base fee); real payouts need a payout provider |
| GPS tracking | Status + ETA text only; **no live map** (maps link opens Google Maps) |
| Payments | Reuses existing checkout; still demo until Razorpay/PhonePe/PayPal wired |
| Native Android/iOS app | **Not built** — this is an installable PWA (responsive web app) |

### Verification checklist (from the spec)
- [ ] Header shows "🚴 Delivery"; mobile menu shows "Bikers & Home Delivery"
- [ ] `/biker/register` completes 5 steps → status becomes `pending_verification`
- [ ] Admin (`/admin/bikers`) approves → biker can go online
- [ ] Shop/admin creates a delivery job from a real order (RPC `create_delivery_job_from_order`)
- [ ] Two bikers racing to accept → exactly **one** wins (`claim_delivery_job` row lock)
- [ ] Customer `/delivery/track/[id]` shows biker name, photo, status, ETA
- [ ] Pickup + delivery OTP flow completes; earnings row appears
- [ ] RLS: customer sees only own jobs; biker sees only own offers/jobs; docs never public
- [ ] Mobile: pages usable at 360px; "Install app" offered by the browser (PWA)

### Security notes
- OTP codes stored as SHA-256 hashes, 5-attempt limit, 10-minute expiry.
- Bikers cannot self-approve (`guard_biker_status` trigger); only admins change status.
- Job writes go through `SECURITY DEFINER` RPCs — no direct client writes.
- `biker-docs` bucket is private; access via short-lived signed URLs only.

---

## Update 22 — International Sellers & Sourcing (China → India flagship)

**Country-agnostic:** suppliers from ANY country can list; ANY destination can be served.
China → India is the seeded flagship corridor; Canada (CAD) is the secondary destination.
Matrix rain was also made darker/more visible (~2.5x alpha, Update 22 visual tweak).

### New routes
| Route | Purpose |
|---|---|
| `/international` | Storefront: "International Sellers — Shop Worldwide, Delivered to Your Door", INR/CAD switcher, flagship China→India section |
| `/international/product/[id]` | Detail: specs, origin, availability, processing time, ETA, warranty/returns, full landed-cost breakdown, honest checkout |
| `/supplier/register` | International supplier registration (any origin country) |
| `/supplier/dashboard` | PRIVATE: wholesale catalogue (CNY), MOQ/price breaks, quotations, CSV import, payouts |
| `/admin/sourcing` | Supplier approval, publish-to-storefront, HS-code review, FX monitor, lanes, DDP, audit |

### New API routes (server-side pricing — never trusts the browser)
| Route | Purpose |
|---|---|
| `GET /api/rates` | Live INR-base rates from `open.er-api.com` (no key); caches to `exchange_rate_cache`; every response carries provider + timestamp + staleness. Never hardcoded. |
| `POST /api/landed-cost` | Itemized landed cost: product, freight, consolidation, packing, insurance, HS-based duty, GST/HST, brokerage, last-mile, 10% marketplace fee, disclosed margin. Unsupported lines marked `estimate`. DDP messaging only when verified. |

### Setup
1. Supabase SQL Editor → run `supabase/migrations/005_international_sourcing.sql` **after** 004 → "Success".
2. No new env vars — the FX provider needs no API key.
3. Deploy via the normal GitHub → Vercel flow.

### Demo vs real — honest status
| Feature | Status |
|---|---|
| Exchange rates | **REAL** live rates (open.er-api.com) with 12h cache + stale labelling |
| Customs duty / taxes | **ESTIMATES** from the HS table (indicative — confirm with a customs broker) |
| DDP | Shown only where verified; demo seed row is **unverified** (honest state) |
| Wholesale CNY / quotations / margins | **Private** — supplier owner + admin only; retail sees INR retail price only |
| Checkout payment | **DEMO** — saves an order summary; Razorpay/PhonePe/PayPal not connected |
| Live GPS tracking | Not built — ETA text only |
| Supplier catalogue import | CSV upload / manual only — **never scraped** |
| KYC verification provider | Not connected — manual admin review |

### Verification checklist (from the spec)
- [ ] Header shows "🌍 Global"; mobile menu shows "International Sellers"
- [ ] `/international` leads with the China → India flagship section; INR/CAD switcher converts prices
- [ ] Product page shows itemized landed cost with ESTIMATE badges; FX line shows provider + timestamp
- [ ] Duty differs per HS code (not one universal %) — compare earbuds (8517.62) vs toys (9503.00)
- [ ] DDP block shows "not confirmed" warning for demo products
- [ ] `/supplier/register` accepts any origin country; wholesale stays invisible to retail (check as logged-out user)
- [ ] Supplier dashboard: add product → draft → submit → admin publishes → appears on storefront
- [ ] `/admin/sourcing`: approve supplier, publish product, edit HS rates, toggle lane, verify DDP, view audit
- [ ] RLS: retail cannot read `supplier_products`; supplier cannot read others' rows
- [ ] `/api/rates` returns live rates; kill network → returns cached with `stale: true`
- [ ] Matrix rain visibly darker on cream; content still paints above it

### To go fully live, Sandeep still needs
- SMS provider (for real OTPs — bikers module), KYC verification provider, payout provider
- Payment gateway credentials (Razorpay / PhonePe / PayPal Business)
- Customs broker review of the HS duty table before promising figures
- Confirmed DDP contracts before showing "DDP included"

## Update 24 — 🤖 AI Marketplace Manager (2026-10-10)

Scheduled analysis + recommendation + seller-approval engine. The AI **reads** data, **drafts** emails/campaigns and **suggests** discounts. It NEVER auto-changes a seller's price and NEVER publishes unapproved discounts ("everything by seller").

### What it does
1. **Daily analysis** (`POST /api/ai-manager/run`): reads products, 90-day sales, expiry dates, stock age → flags expiry risk (≤7/30/90 days), slow movers, festival matches (21 festivals, 45-day window), clearance candidates.
2. **Drafts**: creates draft campaigns + per-product discount recommendations (respecting seller min-price and margin floor from `ai_settings`) + seller emails.
3. **LLM (optional)**: if `AI_API_URL` + `AI_API_KEY` are set, an OpenAI-compatible model refines picks/emails using the Core System Instructions; any failure falls back to rule-based drafts (labeled honestly).
4. **Seller approval** (`/seller/ai-suggestions`): sellers approve/reject each suggestion. Approve writes a time-boxed `ai_campaign_prices` override — base price untouched. Storefront shows the AI price only while the campaign is active (see `CampaignPriceTag` on product pages).
5. **Admin console** (`/admin/ai-manager`): overview, recommendations, campaign CRUD, email log (sent / demo_logged / error), full audit log, settings editor, "Run analysis now".

### Setup
1. Supabase → SQL Editor → run `supabase/migrations/006_ai_manager.sql` (after 005) → "Success".
2. Vercel → Environment Variables → add (all optional for demo):
   - `AI_API_URL` (e.g. `https://api.openai.com/v1/chat/completions`), `AI_API_KEY`, `AI_MODEL` (default `gpt-4o-mini`)
   - `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM_ADDR`, `EMAIL_FROM_NAME`
   - `CRON_SECRET` (any long random string) — authorizes the scheduled run
   - `SUPABASE_SERVICE_ROLE_KEY` — lets the cron write across RLS (server-side only, never shipped to browsers)
3. Redeploy. Vercel Cron runs `/api/ai-manager/run` daily at 02:00 IST (`vercel.json`). No Vercel Cron? Use any external cron (e.g. cron-job.org) hitting the same URL with header `Authorization: Bearer <CRON_SECRET>`.
4. Sellers: open `/seller/ai-suggestions` → fill **Product data for AI** (costs stay private) → approve suggestions as they arrive.

### Demo vs real — honest status
| Area | Status |
|---|---|
| Analysis engine | Real (rule-based, runs on your DB) |
| LLM drafting | Real when `AI_API_KEY` set; otherwise rule-based drafts, clearly labeled |
| Seller emails | Demo-logged until `EMAIL_PROVIDER=resend` + key; sellers table has no email column yet — add one or map auth emails before real sends |
| Campaign prices | Real (seller-approved overrides, time-boxed) |
| Scheduler | Real via Vercel Cron (needs deploy); "Run now" button works without `CRON_SECRET` in demo mode |
| Festival dates | Lunar dates shift yearly — verify each January (existing note) |

### Cost notes
- LLM: pay-per-run to your provider (a daily run over a few hundred products ≈ a few thousand tokens — cents per run on `gpt-4o-mini`-class models; check your provider's pricing).
- Email: Resend free tier covers low volume; paid tiers scale with sends.
- No AI key / no email key = ₹0: the engine still runs fully in rule-based + demo-logged mode.

### What the AI will NEVER do
- Change a seller's base price without that seller's approval
- Publish a discount the seller (or admin) didn't approve
- Invent stock quantities, manufacturing/expiry dates, supplier prices, or shipping costs
- Send email from an unconfigured provider (demo-logs instead, visibly)

### Verification checklist
- [ ] Run `006_ai_manager.sql` → 8 new tables + `ai_log()` function exist
- [ ] `/admin/ai-manager` → Overview shows counts; "Run analysis now" completes (demo mode if no secrets)
- [ ] Recommendations appear with reasons; emails land in Email log as `demo_logged` with full bodies
- [ ] `/seller/ai-suggestions` (as a seller) → approve → `ai_campaign_prices` row created; product page shows AI Campaign price badge
- [ ] Reject → no price row; audit log records both actions
- [ ] RLS: logged-out users see nothing except active campaign prices; sellers see only own rows
- [ ] Set `AI_API_KEY` → next run shows mode `ai_llm` (or honest fallback note if the provider fails)

### Update 24b — Customer-side AI: demand, matching, negotiation, outreach (same update)

**New pages**
- `/demand` — "What are you looking for?": customers post demand (category, description, budget, Indian state incl. Northeast, language). Region/language are customer-provided only — saved to `ai_customer_prefs`, no tracking. Includes "My demands & matches" + notifications inbox + outreach opt-in checkboxes.

**New engine (`lib/ai-manager/`)**
- `matcher.ts` — scores open demands against seller products. HARD SAFEGUARD: uses ONLY category, budget, region, language — never race/health/inferred attributes (see code comment). Seller min price is a hard floor: matches that can never fit the budget are dropped, never promised.
- `customer.ts` — `runCustomerCycle()` called by the scheduled run: (1) matches demands → `ai_matches`, marks demands `matched`, notifies customers in-app + queues seller digest emails; (2) clusters demands by category+region (min cluster size in `ai_settings.negotiation_cluster_min`, default 5) → `ai_negotiations` bulk proposals with transparent estimate-labeled math; (3) consent-first outreach — festival greetings/surveys ONLY to opted-in, non-unsubscribed customers.
- `POST /api/ai-manager/match` — immediate matching when a demand is posted (spam-guarded: skips if matched in the last 6h).

**Negotiation (win-win)**
- Sellers see bulk proposals in `/seller/ai-suggestions` → **Bulk proposals** tab: customer count, region, proposed ₹/unit, expandable "how this price was computed" (all assumptions labeled estimates). Accept → 30-day campaign price override. Counter → enter your price → override at your price. Reject → nothing happens. Every action audit-logged.

**Outreach — consent-first (never faked)**
- `ai_outreach_consents(customer_id, channel, opted_in, unsubscribed_at)` — email | telegram | facebook | instagram.
- The scheduled run checks `opted_in = true AND unsubscribed_at IS NULL` before every send (SAFEGUARD a).
- Email: in-app notification always; real email only when `EMAIL_PROVIDER=resend` + key + customer email on file (sellers/customers tables currently lack email columns — add before real sends).
- Telegram / Facebook / Instagram: shown in `/admin/ai-manager` → **Outreach** tab as "not connected — connect your account to activate" with per-channel setup hints. Attempts are logged as `not_connected` — the system NEVER fakes a sent message.
- Every attempt lands in `ai_outreach_log` with honest status.

**Regional personalization**
- Homepage "Popular in your region" shelf (`components/ai-manager/PopularInRegion.tsx`) — driven by the privacy-safe `ai_demand_trends(region)` aggregate (counts only, no customer data leaks). Falls back to national trends when no region is set.

**Setup (extends Update 24)**
1. Run migration `006_ai_manager.sql` (it now includes tables 9–15 + `ai_demand_trends()` + demo demands) — after 005.
2. New settings keys (seeded): `negotiation_cluster_min=5`, `outreach_festival_window_days=14`.
3. Channel credentials (all optional): Resend for email; Telegram/FB/IG tokens later — see admin Outreach tab.

**Demo vs real — additions**
| Area | Status |
|---|---|
| Demand matching | Real logic (category/budget/region), runs on post + daily |
| Bulk negotiation math | Real logic, estimate-labeled assumptions; seller decision required |
| Festival outreach | Real for opted-in customers (in-app); email/Telegram/FB/IG need credentials + customer contact data |
| Regional shelf | Real, demand-driven |
| Demo seeds | 4 labeled demo demands (PB/TN/AS/MZ) so matching UI isn't empty |

**Hard safeguards (implemented)**
- (a) Every outreach checks opt-in + unsubscribe — in code (`customer.ts`), not just docs.
- (b) Offer/match logic inputs: category, budget, region, language ONLY — see `matcher.ts` header comment.
- (c) No harvesting: inputs are customer-entered demands + public product/seller data. No private emails/social data collected.
- (d) `ai_audit_log` covers matching, negotiation decisions, and outreach attempts.
