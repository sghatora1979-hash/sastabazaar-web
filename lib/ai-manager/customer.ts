// AI Marketplace Manager — customer-side cycle (Update 24b).
// Runs inside the scheduled run: demand matching, bulk negotiation proposals,
// and consent-first outreach. Every action is audit-logged.
//
// HARD SAFEGUARDS:
// (a) outreach only to opted-in, non-unsubscribed customers;
// (b) matching uses ONLY category/budget/region/language;
// (c) inputs are customer-entered + public data only — no harvesting.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFestivalsInWindow } from './festivals';
import {
  scoreDemand, clusterDemands, proposeBulk,
  type Demand, type MatchProduct,
} from './matcher';
import { sendSellerEmail } from './emailer';

type Summary = {
  demands_open: number; matches_created: number;
  negotiations_created: number; outreach_attempted: number; outreach_sent: number;
};

async function audit(sb: SupabaseClient, action: string, entity: string, entityId: string | null, detail: Record<string, unknown>) {
  await sb.from('ai_audit_log').insert({
    actor: 'ai_system', action, entity, entity_id: entityId, detail,
  });
}

export async function runCustomerCycle(
  sb: SupabaseClient,
  settings: { negotiation_cluster_min: number; outreach_festival_window_days: number },
  runId: string | null,
): Promise<Summary> {
  const summary: Summary = {
    demands_open: 0, matches_created: 0,
    negotiations_created: 0, outreach_attempted: 0, outreach_sent: 0,
  };

  // ---- load open demands ----
  const { data: demandRows } = await sb.from('ai_customer_demands')
    .select('*').eq('status', 'open').eq('is_demo', false).limit(200);
  const demands = ((demandRows ?? []) as unknown) as Demand[];
  summary.demands_open = demands.length;

  // ---- load active products + seller states + min prices ----
  const { data: productRows } = await sb.from('products')
    .select('id,title,category_slug,price,mrp,stock,seller_id').eq('status', 'active')
    .not('seller_id', 'is', null).limit(500);
  const { data: sellerRows } = await sb.from('sellers').select('id,state,business_name');
  const sellerState: Record<string, string | null> = {};
  const sellerName: Record<string, string> = {};
  for (const s of ((sellerRows ?? []) as unknown as { id: string; state: string | null; business_name: string }[])) {
    sellerState[s.id] = s.state; sellerName[s.id] = s.business_name;
  }
  const { data: profRows } = await sb.from('ai_product_profile').select('product_id,min_selling_price');
  const minPrice: Record<string, number | null> = {};
  for (const p of ((profRows ?? []) as unknown as { product_id: string; min_selling_price: number | null }[])) {
    minPrice[p.product_id] = p.min_selling_price;
  }
  const products: MatchProduct[] = (((productRows ?? []) as unknown as {
    id: string; title: string; category_slug: string | null; price: number; mrp: number; stock: number; seller_id: string;
  }[])).map((p) => ({
    ...p, seller_state: sellerState[p.seller_id] ?? null,
    min_selling_price: minPrice[p.id] ?? null,
  }));

  // ---- 1. match each demand ----
  const sellerHits = new Map<string, { regions: Set<string>; categories: Set<string>; count: number }>();
  for (const d of demands) {
    const scored = products
      .map((p) => scoreDemand(d, p))
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (scored.length === 0) continue;
    for (const m of scored) {
      const { error } = await sb.from('ai_matches').upsert({
        demand_id: d.id, product_id: m.product_id, seller_id: m.seller_id,
        match_score: m.score, reason: m.reasons.join(' · '),
      }, { onConflict: 'demand_id,product_id' });
      if (!error) {
        summary.matches_created += 1;
        const h = sellerHits.get(m.seller_id) ?? { regions: new Set<string>(), categories: new Set<string>(), count: 0 };
        if (d.region) h.regions.add(d.region);
        h.categories.add(d.category); h.count += 1;
        sellerHits.set(m.seller_id, h);
      }
    }
    await sb.from('ai_customer_demands').update({ status: 'matched' }).eq('id', d.id);
    if (d.customer_id) {
      await sb.from('ai_customer_notifications').insert({
        customer_id: d.customer_id, type: 'match',
        title: `${scored.length} products match your demand`,
        body: `Good news! ${scored.length} seller products match "${d.description.slice(0, 80)}" within your budget.`,
        link: '/demand',
      });
    }
  }
  await audit(sb, 'demand_matching_completed', 'ai_run_history', runId, {
    demands_open: summary.demands_open, matches_created: summary.matches_created,
  });

  // ---- seller digest emails for matches ----
  for (const [sellerId, h] of sellerHits) {
    const regions = [...h.regions].join(', ') || 'various regions';
    const cats = [...h.categories].join(', ');
    const row = await sb.from('ai_seller_emails').insert({
      seller_id: sellerId, to_email: null,
      subject: `${h.count} customer(s) in ${regions} want ${cats} — in your price range`,
      body: [
        `Namaste ${sellerName[sellerId] ?? 'Seller'},`,
        ``,
        `SastaBazaar AI matched ${h.count} customer demand(s) to your products:`,
        `Categories: ${cats}`,
        `Regions: ${regions}`,
        ``,
        `These customers posted what they are looking for, and your products fit their budgets.`,
        `Review and confirm stock here: https://sastabazaar-web-five.vercel.app/seller/ai-suggestions`,
        ``,
        `— SastaBazaar AI Manager`,
      ].join('\n'),
      status: 'queued', provider: 'demo',
    }).select('id').single();
    const emailId = (row.data as { id: string } | null)?.id;
    if (emailId) {
      const res = await sendSellerEmail({ to: null, subject: '', body: '' });
      await sb.from('ai_seller_emails').update({
        status: res.ok && res.status === 'sent' ? 'sent' : 'demo_logged',
        provider: 'demo',
      }).eq('id', emailId);
    }
  }

  // ---- 2. negotiation clusters ----
  const clusters = clusterDemands(demands, settings.negotiation_cluster_min);
  for (const c of clusters) {
    const candidates = products.filter((p) => p.category_slug === c.category && p.stock >= c.demands.length);
    for (const p of candidates.slice(0, 3)) {
      const proposal = proposeBulk(c, {
        id: p.id, price: p.price, mrp: p.mrp, stock: p.stock,
        seller_id: p.seller_id, min_selling_price: p.min_selling_price,
      });
      if (!proposal) continue;
      const { error } = await sb.from('ai_negotiations').insert({
        cluster_key: proposal.cluster_key, category: proposal.category, region: proposal.region,
        demand_count: proposal.demand_count, total_qty: proposal.total_qty,
        product_id: proposal.product_id, seller_id: proposal.seller_id,
        proposed_price: proposal.proposed_price, currency: 'INR', econ: proposal.econ,
        status: 'pending',
      });
      if (!error) {
        summary.negotiations_created += 1;
        const row = await sb.from('ai_seller_emails').insert({
          seller_id: p.seller_id, to_email: null,
          subject: `Bulk proposal: ${proposal.demand_count} customers want ${proposal.category} — accept ₹${proposal.proposed_price}/unit?`,
          body: [
            `Namaste ${sellerName[p.seller_id] ?? 'Seller'},`,
            ``,
            `${proposal.demand_count} customers${proposal.region ? ` in ${proposal.region}` : ''} are looking for ${proposal.category}.`,
            `AI proposal: accept ₹${proposal.proposed_price} per unit for ~${proposal.total_qty} units?`,
            ``,
            `Transparent math:`,
            `- Your current price: ₹${p.price} → proposed: ₹${proposal.proposed_price}`,
            `- Your minimum price floor (₹${proposal.econ.seller_floor_respected}) respected — never below it.`,
            `- Assumptions are estimates: ${(proposal.econ.assumptions as string[]).join(' ')}`,
            ``,
            `Accept, propose a counter-price, or reject here:`,
            `https://sastabazaar-web-five.vercel.app/seller/ai-suggestions`,
            ``,
            `Nothing changes until you decide.`,
            `— SastaBazaar AI Manager`,
          ].join('\n'),
          status: 'demo_logged', provider: 'demo',
        }).select('id').single();
        void row;
      }
    }
  }
  await audit(sb, 'negotiation_proposals_created', 'ai_run_history', runId, {
    clusters: clusters.length, proposals: summary.negotiations_created,
  });

  // ---- 3. consent-first outreach (festival greetings + surveys) ----
  const festivals = getFestivalsInWindow(settings.outreach_festival_window_days);
  if (festivals.length > 0) {
    const { data: consentRows } = await sb.from('ai_outreach_consents')
      .select('customer_id,channel').eq('opted_in', true).is('unsubscribed_at', null);
    const consents = ((consentRows ?? []) as unknown as { customer_id: string; channel: string }[]);
    for (const fest of festivals.slice(0, 3)) {
      for (const c of consents) {
        summary.outreach_attempted += 1;
        // SAFEGUARD (a): opted_in=true AND unsubscribed_at IS NULL checked above.
        if (c.channel === 'email') {
          // In-app notification always; email only when a provider + address exists.
          await sb.from('ai_customer_notifications').insert({
            customer_id: c.customer_id, type: 'festival',
            title: `${fest.emoji} ${fest.name} is coming!`,
            body: `${fest.tagline}. ${fest.sale} starts soon — tell us what you're looking for and sellers will match it.`,
            link: '/demand',
          });
          await sb.from('ai_outreach_log').insert({
            customer_id: c.customer_id, channel: 'email', kind: 'festival_greeting',
            festival_id: fest.id, status: 'demo_logged',
            detail: 'In-app notification created. Email not sent — no customer email on file / no provider configured.',
          });
          summary.outreach_sent += 1;
        } else {
          // Telegram / Facebook / Instagram: NEVER fake a sent message.
          await sb.from('ai_outreach_log').insert({
            customer_id: c.customer_id, channel: c.channel, kind: 'festival_greeting',
            festival_id: fest.id, status: 'not_connected',
            detail: `${c.channel} channel not connected — connect the account in /admin/ai-manager to activate.`,
          });
        }
      }
    }
  }
  await audit(sb, 'outreach_completed', 'ai_run_history', runId, {
    attempted: summary.outreach_attempted, sent: summary.outreach_sent,
  });

  return summary;
}
