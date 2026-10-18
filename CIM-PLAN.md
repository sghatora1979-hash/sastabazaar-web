# SastaBazaar — Continuous Improvement Management (CIM) Plan

> Site: https://sastabazaarindia.com (repo: sghatora1979-hash/sastabazaar-web)
> Owner: Sandeep Singh, sole proprietor. Maintainer: Jinny.
> Status: ACTIVE — this file is the standing instruction. It is never deleted,
> only updated.

## Purpose

SastaBazaar is never "finished". This plan keeps the website improving on a
fixed rhythm: what gets watched, how often, and how updates reach the live
site. It covers the website improvement program (not customer relations).

## The 5 watch tracks

### 1. UI / UX health
Buttons, switches, colors, effects, mobile layout, broken links/images,
page-load speed. The site must always look right and work on phones first.

### 2. Technology watch
New web technology as it appears in the market — framework updates, PWA,
performance, SEO, AI features. Evaluate; adopt what genuinely helps buyers.

### 3. Payments watch
New payment features and options — UPI, Razorpay, PhonePe, Paytm, PayPal,
cards, EMI, COD tooling, settlement/reporting improvements.
**Hard rule (owner's order): real payment integration happens LAST, only
after the sole-proprietorship business registration.** Until then this track
is watch-and-prepare only; checkout stays in testing mode, labeled honestly.

### 4. Messaging watch
WhatsApp Business API, Telegram, SMS gateways (MSG91 / 2Factor for India),
RCS, and customer-care tooling. Track API changes, pricing, and new
features; keep SastaBazaar's messaging integrations current.
(Current honest state: email OTP real via Supabase; SMS OTP demo-only;
KYC demo auto-verified; WhatsApp/Telegram share-links only.)

### 5. Logistics / shipping watch
Courier services and shipping facilities — Delhivery, BlueDart, DTDC,
Ecom Express, XpressBees, Ekart, Shadowfax, India Post, Gati, Shiprocket,
DHL, FedEx, UPS, Aramex, plus any new courier entering the market. Track
new services, rates, coverage, and D2C/shipping tools; keep the on-site
courier directory (/couriers) current. Indicative rates stay labeled as
indicative; sellers ship from their own accounts.

## Cadence (honest)

- **Daily (automated, lightweight):** is the live site reachable? Homepage
  and key pages return 200? No abusive polling — one quick health pass.
- **Weekly (Jinny review):** market scan across the 5 tracks — tech,
  payments, messaging, couriers. Report to the owner ONLY when something is
  actually worth updating. No noise.
- **On demand:** whenever the owner reports an issue or asks for a feature.
- **Not hourly:** button colors don't change hourly. Checks run on a rhythm
  where they can actually find something.

## How an update ships

1. Jinny builds it: changed/new files, or a FULL flat zip (one flat zip,
   no nested zips — phone-friendly). File links always state their expiry.
2. Sandeep uploads to GitHub (repo `sastabazaar-web`). Jinny cannot push.
3. Vercel auto-rebuilds (~2 min). Jinny verifies the live site before
   calling anything done.

## Standing rules (never broken)

- Updates are ADDITIONS. Never delete or break a working feature.
- Demo vs live is labeled honestly. No fake "real" badges.
- No invented prices, guarantees, or seller data.
- Payments stay LAST (after business registration).
- Nothing is called "done" until the commit and the live bytes are checked.

## Log

- 2026-10-17: CIM plan created (v1) at owner's order. Weekly review
  scheduled; daily health check scheduled.
- 2026-10-17: Paid Advertisement Bar added (lib/ads.ts + components/ads/AdBar.tsx,
  homepage top, 2 partitions: rotating ads + booking panel; SAMPLE placeholders
  labeled, paid slots 15/20/30 sec, booking via customer care).
