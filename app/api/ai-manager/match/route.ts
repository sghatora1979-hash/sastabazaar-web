// POST /api/ai-manager/match — match ONE demand immediately after posting.
// Body: { demand_id }. Safe to call repeatedly: skips when the demand was
// matched within the last 6 hours. No caller auth needed — the operation only
// creates matches/notifications for a real, open demand (spam-guarded).
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/ai-manager/db';
import { scoreDemand, type Demand, type MatchProduct } from '@/lib/ai-manager/matcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SIX_HOURS = 6 * 3600000;

export async function POST(req: Request) {
  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  let demandId = '';
  try {
    demandId = String((await req.json()).demand_id ?? '');
  } catch { /* ignore */ }
  if (!demandId) return NextResponse.json({ ok: false, error: 'demand_id required' }, { status: 400 });

  const { data: dRow } = await sb.from('ai_customer_demands').select('*').eq('id', demandId).maybeSingle();
  const demand = (dRow as unknown) as Demand | null;
  if (!demand || demand.status !== 'open') {
    return NextResponse.json({ ok: false, error: 'Demand not found or not open' }, { status: 404 });
  }

  // spam guard: already matched recently?
  const { data: recent } = await sb.from('ai_matches').select('id')
    .eq('demand_id', demandId)
    .gte('created_at', new Date(Date.now() - SIX_HOURS).toISOString())
    .limit(1);
  if (recent && (recent as unknown[]).length > 0) {
    return NextResponse.json({ ok: true, skipped: 'matched_recently' });
  }

  const { data: productRows } = await sb.from('products')
    .select('id,title,category_slug,price,mrp,stock,seller_id').eq('status', 'active')
    .eq('category_slug', demand.category).gt('stock', 0).limit(200);
  const { data: sellerRows } = await sb.from('sellers').select('id,state');
  const sellerState: Record<string, string | null> = {};
  for (const s of ((sellerRows ?? []) as unknown as { id: string; state: string | null }[])) sellerState[s.id] = s.state;
  const { data: profRows } = await sb.from('ai_product_profile').select('product_id,min_selling_price');
  const minPrice: Record<string, number | null> = {};
  for (const p of ((profRows ?? []) as unknown as { product_id: string; min_selling_price: number | null }[])) minPrice[p.product_id] = p.min_selling_price;

  const products: MatchProduct[] = (((productRows ?? []) as unknown as {
    id: string; title: string; category_slug: string | null; price: number; mrp: number; stock: number; seller_id: string;
  }[])).map((p) => ({ ...p, seller_state: sellerState[p.seller_id] ?? null, min_selling_price: minPrice[p.id] ?? null }));

  const scored = products
    .map((p) => scoreDemand(demand, p))
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  let created = 0;
  for (const m of scored) {
    const { error } = await sb.from('ai_matches').upsert({
      demand_id: demandId, product_id: m.product_id, seller_id: m.seller_id,
      match_score: m.score, reason: m.reasons.join(' · '),
    }, { onConflict: 'demand_id,product_id' });
    if (!error) created += 1;
  }
  if (created > 0) {
    await sb.from('ai_customer_demands').update({ status: 'matched' }).eq('id', demandId);
    if (demand.customer_id) {
      await sb.from('ai_customer_notifications').insert({
        customer_id: demand.customer_id, type: 'match',
        title: `${created} products match your demand`,
        body: `Sellers have what you're looking for: "${demand.description.slice(0, 80)}".`,
        link: '/demand',
      });
    }
  }
  await sb.from('ai_audit_log').insert({
    actor: 'ai_system', action: 'demand_matched_on_post', entity: 'ai_customer_demands',
    entity_id: demandId, detail: { matches: created },
  });

  return NextResponse.json({ ok: true, matches: created });
}
