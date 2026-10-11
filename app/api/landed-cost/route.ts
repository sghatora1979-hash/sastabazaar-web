import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getRates, convert } from '@/lib/fx';

// Server-side only — never pre-render at build time.
export const dynamic = 'force-dynamic';

// POST /api/landed-cost — server-side total landed-cost calculation.
// Body: { listing_id, dest_country: 'IN'|'CA'|<any>, currency: 'INR'|'CAD',
//         qty?, pin? }
// Pricing math NEVER trusts the browser: every figure is computed here from
// DB rows (retail_listings, hs_code_duties, shipping_lanes, ddp_coverage)
// plus live/cached FX. Lines the data cannot support are marked estimate=true
// and explained in `warnings`. Never presented as guaranteed.
type Req = {
  listing_id?: string;
  dest_country?: string;
  currency?: 'INR' | 'CAD';
  qty?: number;
  pin?: string;
};

type Line = {
  label: string;
  amount: number;
  currency: 'INR' | 'CAD';
  estimate: boolean;
  note?: string;
};

export async function POST(req: Request) {
  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON body' }, { status: 400 });
  }
  const listingId = String(body.listing_id ?? '').trim();
  const dest = String(body.dest_country ?? 'IN').toUpperCase();
  const currency: 'INR' | 'CAD' = body.currency === 'CAD' ? 'CAD' : 'INR';
  const qty = Math.max(1, Math.min(99, Math.floor(Number(body.qty) || 1)));

  if (!listingId) {
    return NextResponse.json({ ok: false, reason: 'listing_id is required' }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      reason: 'Database not configured — landed-cost needs live catalogue, duty and lane data.',
    }, { status: 503 });
  }
  const sb = getSupabase()!;

  // 1. Retail listing (public, retail-safe fields only)
  const { data: listing, error: lerr } = await sb
    .from('retail_listings')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();
  if (lerr || !listing) {
    return NextResponse.json({ ok: false, reason: 'Product not found or not available.' }, { status: 404 });
  }

  // 2. FX (live preferred, cached fallback, staleness labelled)
  const fx = await getRates();
  if (!fx.ok) {
    return NextResponse.json({ ok: false, reason: fx.reason }, { status: 503 });
  }
  const rates = fx.rates;
  const inTarget = (inr: number) =>
    Math.round(convert(inr, 'INR', currency, rates) * 100) / 100;
  const fromFxCur = (amount: number, cur: string) => convert(amount, cur, 'INR', rates);

  // 3. Best shipping lane: prefer exact origin match, then any active lane to dest
  const { data: lanes } = await sb
    .from('shipping_lanes')
    .select('*')
    .eq('dest_country', dest)
    .eq('active', true)
    .order('base_freight', { ascending: true });
  const laneList = (lanes ?? []) as Array<Record<string, unknown>>;
  const lane =
    laneList.find(l => String(l.origin_country) === String(listing.country_of_origin)) ??
    laneList[0] ??
    null;

  // 4. HS-code duty row for this destination
  let hs: Record<string, unknown> | null = null;
  if (listing.hs_code) {
    const { data } = await sb
      .from('hs_code_duties')
      .select('*')
      .eq('hs_code', listing.hs_code)
      .eq('dest_country', dest)
      .single();
    if (data) hs = data as Record<string, unknown>;
  }

  // 5. DDP coverage confirmation
  const { data: ddpRows } = await sb
    .from('ddp_coverage')
    .select('*')
    .eq('listing_id', listingId)
    .eq('dest_country', dest)
    .eq('verified', true);
  const ddpConfirmed = (ddpRows ?? []).length > 0;

  const lines: Line[] = [];
  const warnings: string[] = [];
  const L = (label: string, inr: number, estimate: boolean, note?: string): void => {
    lines.push({ label, amount: inTarget(inr), currency, estimate, note });
  };

  // --- Goods value (retail, INR base) ---
  const goodsInr = Number(listing.retail_price_inr) * qty;
  L(`Product price${qty > 1 ? ` × ${qty}` : ''}`, goodsInr, false);

  // --- Freight ---
  let freightInr = 0;
  let freightNote: string | undefined;
  if (lane) {
    const weight = Number(listing.weight_kg) * qty;
    const perKg = fromFxCur(Number(lane.base_freight), String(lane.freight_currency));
    const minCh = fromFxCur(Number(lane.min_charge), String(lane.min_charge_currency));
    freightInr = Math.max(perKg * weight, minCh);
    freightNote = `${lane.origin_city ? lane.origin_city + ', ' : ''}${lane.origin_country} → ${lane.dest_city ? lane.dest_city + ', ' : ''}${dest} · ${lane.carrier} · ${lane.transit_days_min}-${lane.transit_days_max} days`;
    if (!isFinite(freightInr)) {
      freightInr = 0;
      warnings.push('Freight could not be converted with current FX data — shown as pending.');
    }
  } else {
    warnings.push('No shipping lane configured for this destination — freight pending confirmation.');
    freightNote = 'Pending confirmation';
  }
  L('International freight', freightInr, true, freightNote);

  // --- Consolidation / inspection / packing (flat honest estimates) ---
  L('Consolidation & inspection', 300, true, 'Flat estimate — varies by shipment');
  L('Export packing', 180, true, 'Flat estimate — wooden crate extra if required');

  // --- Insurance: 2% of goods value ---
  const insuranceInr = goodsInr * 0.02;
  L('Transit insurance (2%)', insuranceInr, true);

  // --- Customs value (CIF basis) ---
  const cifInr = goodsInr + freightInr + insuranceInr;

  // --- Duty: NEVER one universal percentage — per HS-code row only ---
  let dutyRate = 0;
  let dutyEstimate = true;
  let dutyNote = 'No HS classification on file — duty pending confirmation.';
  if (hs) {
    dutyRate = Number(hs.duty_rate);
    dutyEstimate = Boolean(hs.estimate);
    dutyNote = `${hs.hs_code} · ${hs.category_name} · ${(dutyRate * 100).toFixed(1)}%${dutyEstimate ? ' (indicative)' : ''}`;
  } else if (listing.hs_code) {
    warnings.push(`No duty data for HS ${listing.hs_code} → ${dest}. Duty shown as pending — confirm with a customs broker before payment.`);
  }
  const dutyInr = cifInr * dutyRate;
  L(`Import customs duty`, dutyInr, dutyEstimate, dutyNote);

  // --- Destination tax ---
  let taxRate = 0;
  let taxName = 'Tax';
  let taxEstimate = true;
  let taxNote: string | undefined;
  if (hs) {
    taxRate = Number(hs.tax_rate);
    taxName = String(hs.tax_name);
    taxEstimate = Boolean(hs.estimate);
    if (dest === 'CA') {
      taxNote = '5% federal GST shown — HST/PST varies by province; final tax may differ.';
    }
  } else {
    taxNote = 'Rate pending confirmation.';
  }
  const taxInr = (cifInr + dutyInr) * taxRate;
  L(`${taxName}`, taxInr, taxEstimate, taxNote);

  // --- Brokerage / handling ---
  const brokerageInr = dest === 'CA' ? 1200 : 450;
  L('Brokerage & handling', brokerageInr, true, 'Flat estimate');

  // --- Last-mile delivery ---
  const lastMileInr = dest === 'CA' ? fromFxCur(9, 'CAD') : 99;
  L('Last-mile delivery', isFinite(lastMileInr) ? lastMileInr : 99, true);

  // --- Marketplace fee: 10% of goods, disclosed (matches SastaBazaar commission) ---
  const feeInr = goodsInr * 0.1;
  L('Marketplace fee (10% — disclosed)', feeInr, false);

  // --- Disclosed sourcing margin (admin-set, included in product price) ---
  const marginInr = Number(listing.disclosed_margin_inr) * qty;
  if (marginInr > 0) {
    lines.push({
      label: 'Sourcing margin (disclosed, included in price)',
      amount: 0, currency, estimate: false,
      note: `${inTarget(marginInr).toLocaleString()} included in product price`,
    });
  }

  // Recompute total from INR to avoid rounding drift:
  const totalInrExact =
    goodsInr + freightInr + 300 + 180 + insuranceInr + dutyInr + taxInr + brokerageInr +
    (isFinite(lastMileInr) ? lastMileInr : 99) + feeInr;

  // --- ETA ---
  const procDays = Number(listing.processing_days) || 3;
  const tMin = lane ? Number(lane.transit_days_min) : 14;
  const tMax = lane ? Number(lane.transit_days_max) : 28;
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const from = new Date(Date.now() + (procDays + tMin) * 86400000);
  const to = new Date(Date.now() + (procDays + tMax) * 86400000);

  // --- DDP messaging: ONLY when verified ---
  const ddp = ddpConfirmed
    ? {
        confirmed: true,
        note: 'DDP confirmed by the logistics provider: import duties, taxes, customs clearance and final delivery are INCLUDED — no extra charges at the door.',
      }
    : {
        confirmed: false,
        note: String(listing.ddp_note ?? 'DDP not confirmed — duties & taxes above are estimates; final customs charges may vary.'),
      };
  if (!ddpConfirmed) {
    warnings.push('DDP is not confirmed for this product. The duty and tax figures above are estimates — actual customs charges are set by the destination customs authority.');
  }

  return NextResponse.json({
    ok: true,
    currency,
    lines,
    total: inTarget(totalInrExact),
    eta: { from: fmt(from), to: fmt(to), label: `${fmt(from)} – ${fmt(to)}` },
    fx: {
      rate: currency === 'INR' ? 1 : rates['CAD'],
      timestamp: fx.timestamp,
      provider: fx.provider,
      stale: fx.stale,
    },
    ddp,
    warnings,
    _debug_inr_total: Math.round(totalInrExact * 100) / 100,
  });
}
