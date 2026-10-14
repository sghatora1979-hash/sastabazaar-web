import { NextResponse } from 'next/server';

const PRIZES = [
  { label: '10% OFF', weight: 20 },
  { label: 'Free Shipping', weight: 20 },
  { label: '5% OFF', weight: 20 },
  { label: 'Try Again', weight: 15 },
  { label: '20% OFF', weight: 10 },
  { label: '15% OFF', weight: 10 },
  { label: 'Jackpot: 30% OFF', weight: 5 },
];

// Server-side spin result (weighted). The interactive wheel runs client-side;
// call this endpoint at spin time to make results authoritative.
export async function POST() {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  let prize = PRIZES[0].label;
  for (const p of PRIZES) {
    roll -= p.weight;
    if (roll <= 0) { prize = p.label; break; }
  }
  return NextResponse.json({
    prize,
    coupon: prize === 'Try Again' ? null : prize.replace(/\s+/g, '_').toUpperCase(),
    at: new Date().toISOString()
  });
}
