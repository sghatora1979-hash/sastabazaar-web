import { NextResponse } from 'next/server';

// Interaction logging endpoint (demo: echoes back).
// Wire this to a real database (e.g. Postgres/Supabase) to persist likes,
// dislikes and views per user account in production.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, action } = body ?? {};
    if (!productId || !['like', 'dislike', 'view'].includes(action)) {
      return NextResponse.json({ error: 'productId and valid action required' }, { status: 400 });
    }
    // TODO: persist to DB
    return NextResponse.json({ ok: true, productId, action, at: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
}
