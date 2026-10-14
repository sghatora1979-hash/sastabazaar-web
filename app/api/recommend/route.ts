import { NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/products';

// Server-side recommendation fallback: top deals by discount, excluding disliked ids.
// The rich personalized feed runs client-side via lib/recommendations.ts.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const disliked: string[] = Array.isArray(body.dislikedIds) ? body.dislikedIds : [];
    const limit = typeof body.limit === 'number' ? Math.min(body.limit, 40) : 12;

    const picks = PRODUCTS
      .filter(p => !disliked.includes(p.id))
      .sort((a, b) => (b.discountPercent + b.dealScore / 10) - (a.discountPercent + a.dealScore / 10))
      .slice(0, limit);

    return NextResponse.json({ products: picks });
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
}

export async function GET() {
  const picks = [...PRODUCTS]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 12);
  return NextResponse.json({ products: picks });
}
