'use client';
// Client-side helpers for the International Sellers module (Update 22).
// Retail-safe: this layer only ever touches public tables (retail_listings,
// hs_code_duties, shipping_lanes, ddp_coverage) and the server-side
// /api/landed-cost route. Wholesale CNY never reaches the browser.
import { useEffect, useState } from 'react';
import { getSupabase } from './supabase';

export type Currency = 'INR' | 'CAD';
const CUR_KEY = 'sb-intl-currency';

export function useCurrency(): [Currency, (c: Currency) => void] {
  const [cur, setCur] = useState<Currency>('INR');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUR_KEY);
      if (saved === 'INR' || saved === 'CAD') setCur(saved);
    } catch { /* ignore */ }
  }, []);
  const set = (c: Currency) => {
    setCur(c);
    try { localStorage.setItem(CUR_KEY, c); } catch { /* ignore */ }
  };
  return [cur, set];
}

export function formatMoney(amount: number, currency: Currency): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-CA';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(amount);
}

export type RetailListing = {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  specs: Record<string, unknown>;
  country_of_origin: string;
  hs_code: string | null;
  weight_kg: number;
  retail_price_inr: number;
  disclosed_margin_inr: number;
  availability: string;
  processing_days: number;
  warranty_text: string | null;
  returns_text: string | null;
  restrictions_text: string | null;
  ddp_available: boolean;
  ddp_note: string | null;
  supplier_display_name: string;
  supplier_country: string;
  status: string;
};

export type ChargeLine = {
  label: string;
  amount: number;
  currency: Currency;
  estimate: boolean;
  note?: string;
};

export type LandedCost = {
  ok: boolean;
  currency: Currency;
  lines: ChargeLine[];
  total: number;
  eta: { from: string; to: string; label: string };
  fx: { rate: number; timestamp: string; provider: string; stale: boolean };
  ddp: { confirmed: boolean; note: string };
  warnings: string[];
  reason?: string;
};

export async function fetchListings(): Promise<RetailListing[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('retail_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as RetailListing[];
  }
  return DEMO_LISTINGS;
}

export async function fetchListing(id: string): Promise<RetailListing | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('retail_listings')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    if (!error && data) return data as RetailListing;
  }
  return DEMO_LISTINGS.find(l => l.id === id) ?? null;
}

export async function getLandedCost(
  listingId: string, destCountry: 'IN' | 'CA', currency: Currency, qty = 1, pin = ''
): Promise<LandedCost> {
  const res = await fetch('/api/landed-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, dest_country: destCountry, currency, qty, pin }),
  });
  return (await res.json()) as LandedCost;
}

// Country suggestions for supplier registration (free-text input — ANY country works).
export const COUNTRY_SUGGESTIONS = [
  'China', 'India', 'United States', 'United Arab Emirates', 'United Kingdom',
  'Germany', 'Japan', 'South Korea', 'Vietnam', 'Thailand', 'Malaysia',
  'Singapore', 'Indonesia', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Turkey',
  'Italy', 'France', 'Netherlands', 'Canada', 'Australia', 'Brazil',
  'Mexico', 'South Africa', 'Egypt', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'Hong Kong', 'Taiwan', 'Philippines', 'Cambodia', 'Myanmar', 'Pakistan',
];

// Demo catalogue mirrors the SQL seed (flagship corridor: China -> India).
// Shown only when Supabase is not configured or has no listings yet.
export const DEMO_LISTINGS: RetailListing[] = [
  {
    id: 'demo-earbuds', title: 'TWS Bluetooth Earbuds Pro',
    description: 'True wireless earbuds with 36-hour case battery, Bluetooth 5.3.',
    images: [], specs: { bluetooth: '5.3', battery: '36h with case', warranty: '6 months' },
    country_of_origin: 'China', hs_code: '8517.62', weight_kg: 0.4,
    retail_price_inr: 1299, disclosed_margin_inr: 180,
    availability: 'In stock', processing_days: 3,
    warranty_text: '6-month replacement warranty against manufacturing defects.',
    returns_text: '7-day replacement for damaged/defective items. No returns on opened hygiene-sealed packs unless defective.',
    restrictions_text: 'Batteries ship under DG rules; delivery timeline may extend by 2-3 days.',
    ddp_available: false,
    ddp_note: 'DDP not confirmed for this product — duties & taxes below are estimates.',
    supplier_display_name: 'Shenzhen BrightStar Electronics Co., Ltd.',
    supplier_country: 'China', status: 'active',
  },
  {
    id: 'demo-led', title: 'LED Strip Light 5m RGB',
    description: '5-metre RGB LED strip, USB powered with remote.',
    images: [], specs: { length: '5m', power: 'USB 5V', colors: 'RGB 16M' },
    country_of_origin: 'China', hs_code: '9405.40', weight_kg: 0.3,
    retail_price_inr: 799, disclosed_margin_inr: 120,
    availability: 'In stock', processing_days: 3,
    warranty_text: '6-month replacement warranty against manufacturing defects.',
    returns_text: '7-day replacement for damaged/defective items.',
    restrictions_text: 'None.',
    ddp_available: false,
    ddp_note: 'DDP not confirmed for this product — duties & taxes below are estimates.',
    supplier_display_name: 'Shenzhen BrightStar Electronics Co., Ltd.',
    supplier_country: 'China', status: 'active',
  },
  {
    id: 'demo-lunchbox', title: 'Stainless Steel Lunch Box 1.2L',
    description: 'Food-grade 304 stainless-steel lunch box, leak-proof.',
    images: [], specs: { capacity: '1.2L', material: 'SS304', leak_proof: true },
    country_of_origin: 'China', hs_code: '7323.93', weight_kg: 0.6,
    retail_price_inr: 649, disclosed_margin_inr: 95,
    availability: 'In stock', processing_days: 4,
    warranty_text: '6-month replacement warranty against manufacturing defects.',
    returns_text: '7-day replacement for damaged/defective items.',
    restrictions_text: 'None.',
    ddp_available: false,
    ddp_note: 'DDP not confirmed for this product — duties & taxes below are estimates.',
    supplier_display_name: 'Shenzhen BrightStar Electronics Co., Ltd.',
    supplier_country: 'China', status: 'active',
  },
];
