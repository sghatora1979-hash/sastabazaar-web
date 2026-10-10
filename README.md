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
