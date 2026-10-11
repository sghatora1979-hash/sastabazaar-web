// POST /api/ai-manager/run — scheduled AI analysis + recommendation engine.
// Auth: Bearer CRON_SECRET. If CRON_SECRET is not configured, the run is
// allowed but flagged as demo (audit-logged) so Sandeep can test from the
// admin "Run now" button before wiring secrets.
// The AI READS data, DRAFTS emails/campaigns, SUGGESTS discounts.
// It NEVER changes a seller's price and NEVER publishes unapproved discounts.
import { NextResponse } from 'next/server';
import { getServiceClient, hasServiceRole } from '@/lib/ai-manager/db';
import { analyzeProducts, groupBySeller, type AnalysisResult } from '@/lib/ai-manager/analyzer';
import { draftWithLLM, isAiConfigured, type LlmDraft } from '@/lib/ai-manager/llm';
import { sendSellerEmail } from '@/lib/ai-manager/emailer';
import { runCustomerCycle } from '@/lib/ai-manager/customer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Settings = {
  margin_floor_pct: number; max_discount_pct: number;
  lookback_days: number; festival_window_days: number;
};

async function audit(sb: NonNullable<ReturnType<typeof getServiceClient>>, entry: {
  actor: string; action: string; entity: string; entity_id?: string | null; detail?: Record<string, unknown>;
}) {
  await sb.from('ai_audit_log').insert({
    actor: entry.actor, action: entry.action, entity: entry.entity,
    entity_id: entry.entity_id ?? null, detail: entry.detail ?? {},
  });
}

function ruleBasedDraft(analysis: AnalysisResult): LlmDraft {
  const campaigns: LlmDraft['campaigns'] = [];
  const picks: LlmDraft['picks'] = [];
  const festCounts = new Map<string, { name: string; n: number }>();
  for (const s of analysis.signals) {
    for (const fm of s.festival_matches) {
      const e = festCounts.get(fm.festival_id) ?? { name: fm.festival_name, n: 0 };
      e.n += 1; festCounts.set(fm.festival_id, e);
    }
  }
  const topFests = [...festCounts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3);
  for (const [fid, info] of topFests) {
    campaigns.push({
      name: `${info.name} — AI picks`, type: 'festival', festival_id: fid,
      reason: `${info.n} products match this festival in the next 45 days`,
    });
  }
  const clearance = analysis.signals.filter(
    (s) => s.expiry_risk !== 'none' || s.reasons.some((r) => r.startsWith('Slow mover') || r.startsWith('Ageing'))
  );
  if (clearance.length > 0) {
    campaigns.push({
      name: 'Clearance — AI picks', type: 'clearance', festival_id: null,
      reason: `${clearance.length} products need stock clearance (expiry / slow / ageing)`,
    });
  }
  for (const s of analysis.signals) {
    const fest = s.festival_matches[0];
    const campaignName = fest
      ? `${fest.festival_name} — AI picks`
      : 'Clearance — AI picks';
    if (!campaigns.some((c) => c.name === campaignName)) continue;
    picks.push({
      product_id: s.product_id, campaign_name: campaignName,
      discount_pct: s.suggested_discount_pct, price: s.suggested_price,
      reason: s.reasons.join(' · '),
    });
  }
  return { campaigns, picks, seller_emails: [] };
}

function sellerEmailBody(sellerName: string, signals: { title: string; suggested_discount_pct: number; suggested_price: number; reasons: string[] }[], festivalLine: string): { subject: string; body: string } {
  const lines = signals.map(
    (s, i) => `${i + 1}. ${s.title} — suggested ${s.suggested_discount_pct}% off → ₹${s.suggested_price} (${s.reasons.join('; ')})`
  );
  return {
    subject: `${festivalLine} — SastaBazaar AI picked ${signals.length} of your products`,
    body: [
      `Namaste ${sellerName},`,
      ``,
      `SastaBazaar AI Manager analysed your catalogue and picked ${signals.length} products for upcoming promotions:`,
      ``,
      ...lines,
      ``,
      `Please confirm stock availability and approve (or reject) each suggested discount here:`,
      `https://sastabazaar-web-five.vercel.app/seller/ai-suggestions`,
      ``,
      `Nothing changes on your listings until YOU approve. Your base prices stay untouched.`,
      ``,
      `— SastaBazaar AI Manager (rule-based draft — no AI key configured)`,
    ].join('\n'),
  };
}

export async function POST(req: Request) {
  const startedAt = new Date().toISOString();
  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  // --- auth ---
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';
  const demoAuth = !cronSecret; // no secret configured → demo mode, audit-logged
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const runRow = await sb.from('ai_run_history').insert({
    status: demoAuth ? 'demo' : 'running',
    mode: 'rule_based',
    error: demoAuth ? 'CRON_SECRET not configured — demo run (no auth enforced). Set CRON_SECRET for production.' : null,
  }).select('id').single();
  const runId = (runRow.data as { id: string } | null)?.id ?? null;

  await audit(sb, {
    actor: 'cron', action: 'run_started', entity: 'ai_run_history', entity_id: runId,
    detail: { demo_auth: demoAuth, service_role: hasServiceRole() },
  });

  try {
    // --- settings ---
    const { data: settingsRows } = await sb.from('ai_settings').select('key,value');
    const sm: Record<string, string> = {};
    for (const r of (settingsRows ?? []) as { key: string; value: string }[]) sm[r.key] = r.value;
    const settings: Settings = {
      margin_floor_pct: Number(sm.margin_floor_pct ?? 15) || 15,
      max_discount_pct: Math.min(90, Number(sm.max_discount_pct ?? 40) || 40),
      lookback_days: Number(sm.analysis_lookback_days ?? 90) || 90,
      festival_window_days: Number(sm.festival_window_days ?? 45) || 45,
    };

    // --- load data ---
    const { data: products } = await sb.from('products')
      .select('id,title,category_slug,price,mrp,stock,seller_id,status,created_at')
      .eq('status', 'active').not('seller_id', 'is', null).limit(500);
    const { data: sellersRows } = await sb.from('sellers').select('id,business_name');
    const { data: profileRows } = await sb.from('ai_product_profile')
      .select('product_id,manufacturing_date,expiry_date,purchase_cost,min_selling_price,season_tags,festival_tags');

    const since = new Date(Date.now() - settings.lookback_days * 86400000).toISOString();
    const { data: itemRows } = await sb.from('order_items')
      .select('product_id,qty,orders!inner(created_at,status)')
      .gte('orders.created_at', since);
    const salesByProduct: Record<string, number> = {};
    for (const r of ((itemRows ?? []) as unknown as { product_id: string; qty: number; orders: { status: string } | { status: string }[] }[])) {
      const ord = Array.isArray(r.orders) ? r.orders[0] : r.orders;
      if (!ord || ord.status === 'cancelled' || ord.status === 'refunded') continue;
      salesByProduct[r.product_id] = (salesByProduct[r.product_id] ?? 0) + r.qty;
    }

    const sellers: Record<string, { id: string; business_name: string }> = {};
    for (const s of ((sellersRows ?? []) as unknown as { id: string; business_name: string }[])) sellers[s.id] = s;
    type ProfileRow = {
      product_id: string; manufacturing_date: string | null; expiry_date: string | null;
      purchase_cost: number | null; min_selling_price: number | null;
      season_tags: string[]; festival_tags: string[];
    };
    const profiles: Record<string, Omit<ProfileRow, 'product_id'>> = {};
    for (const p of ((profileRows ?? []) as unknown as ProfileRow[])) {
      const { product_id, ...rest } = p;
      profiles[product_id] = rest;
    }

    // --- analyze ---
    const analysis = analyzeProducts(
      ((products ?? []) as Parameters<typeof analyzeProducts>[0]),
      salesByProduct, profiles, sellers, settings,
    );
    await audit(sb, {
      actor: 'ai_system', action: 'analysis_completed', entity: 'ai_run_history', entity_id: runId,
      detail: { products_analyzed: analysis.products_analyzed, signals: analysis.signals.length, summary: analysis.summary },
    });

    // --- draft (LLM if configured, else rule-based) ---
    let mode: 'ai_llm' | 'rule_based' = 'rule_based';
    let draft: LlmDraft = ruleBasedDraft(analysis);
    let llmNote: string | null = 'Rule-based drafts (AI_API_KEY not configured).';
    if (isAiConfigured() && analysis.signals.length > 0) {
      const llm = await draftWithLLM(analysis);
      if (llm.ok) {
        mode = 'ai_llm'; draft = llm.draft; llmNote = `Drafted by ${llm.model}.`;
      } else {
        llmNote = `LLM failed (${llm.error}) — rule-based drafts used.`;
      }
    }

    // --- campaigns (draft status) ---
    const campaignIds: Record<string, string> = {};
    for (const c of draft.campaigns) {
      const { data } = await sb.from('ai_campaigns').insert({
        name: c.name, type: c.type, festival_id: c.festival_id,
        status: 'draft', created_by: mode === 'ai_llm' ? 'ai' : 'ai',
        notes: c.reason,
      }).select('id').single();
      const id = (data as { id: string } | null)?.id;
      if (id) campaignIds[c.name] = id;
    }
    await audit(sb, {
      actor: 'ai_system', action: 'campaigns_drafted', entity: 'ai_run_history', entity_id: runId,
      detail: { count: Object.keys(campaignIds).length, names: Object.keys(campaignIds) },
    });

    // --- recommendations (upsert per product+campaign) ---
    let recCount = 0;
    for (const p of draft.picks) {
      const cid = campaignIds[p.campaign_name];
      if (!cid) continue;
      const sig = analysis.signals.find((s) => s.product_id === p.product_id);
      if (!sig) continue;
      const { error } = await sb.from('ai_recommendations').upsert({
        product_id: p.product_id, seller_id: sig.seller_id, campaign_id: cid,
        recommended_discount_pct: p.discount_pct, recommended_price: p.price,
        reason: { text: p.reason, signals: sig.reasons }, source: mode, status: 'pending',
      }, { onConflict: 'product_id,campaign_id' });
      if (!error) recCount += 1;
    }

    // --- seller emails (rule-based bodies if LLM didn't draft) ---
    const bySeller = groupBySeller(analysis, sellers);
    const emailJobs: { seller_id: string; subject: string; body: string; campaign_id: string | null }[] = [];
    if (draft.seller_emails.length > 0) {
      for (const e of draft.seller_emails) {
        emailJobs.push({ seller_id: e.seller_id, subject: e.subject, body: e.body, campaign_id: null });
      }
    } else {
      const firstFest = analysis.upcoming_festivals[0]?.name ?? 'Upcoming promotions';
      for (const [sid, g] of Object.entries(bySeller)) {
        const { subject, body } = sellerEmailBody(
          g.seller.business_name,
          g.signals.map((s) => ({
            title: s.title, suggested_discount_pct: s.suggested_discount_pct,
            suggested_price: s.suggested_price, reasons: s.reasons,
          })),
          firstFest,
        );
        emailJobs.push({ seller_id: sid, subject, body, campaign_id: null });
      }
    }

    let queued = 0, sent = 0;
    for (const job of emailJobs) {
      const row = await sb.from('ai_seller_emails').insert({
        seller_id: job.seller_id, to_email: null, subject: job.subject, body: job.body,
        related_campaign_id: job.campaign_id, status: 'queued', provider: 'demo',
      }).select('id').single();
      const emailId = (row.data as { id: string } | null)?.id;
      if (!emailId) continue;
      queued += 1;
      const result = await sendSellerEmail({ to: null, subject: job.subject, body: job.body });
      if (result.ok && result.status === 'sent') {
        sent += 1;
        await sb.from('ai_seller_emails').update({
          status: 'sent', provider: 'resend', provider_msg_id: result.providerMsgId,
        }).eq('id', emailId);
      } else if (result.ok) {
        await sb.from('ai_seller_emails').update({ status: 'demo_logged', provider: 'demo' }).eq('id', emailId);
      } else {
        await sb.from('ai_seller_emails').update({
          status: 'error', error_text: result.error,
        }).eq('id', emailId);
      }
    }
    await audit(sb, {
      actor: 'ai_system', action: 'emails_processed', entity: 'ai_run_history', entity_id: runId,
      detail: { queued, sent, demo_logged: queued - sent, note: llmNote },
    });

    // ---- customer-side cycle: matching + negotiation + consent-first outreach ----
    const custSummary = await runCustomerCycle(sb, {
      negotiation_cluster_min: Number(sm.negotiation_cluster_min ?? 5) || 5,
      outreach_festival_window_days: Number(sm.outreach_festival_window_days ?? 14) || 14,
    }, runId);

    if (runId) {
      await sb.from('ai_run_history').update({
        finished_at: new Date().toISOString(),
        status: demoAuth ? 'demo' : 'completed',
        mode, products_analyzed: analysis.products_analyzed,
        recommendations_created: recCount, emails_queued: queued, emails_sent: sent,
      }).eq('id', runId);
    }

    return NextResponse.json({
      ok: true, demo_auth: demoAuth, mode, llm_note: llmNote,
      products_analyzed: analysis.products_analyzed,
      signals: analysis.signals.length,
      campaigns_created: Object.keys(campaignIds).length,
      recommendations_created: recCount,
      emails_queued: queued, emails_sent: sent,
      customer_cycle: custSummary,
      summary: analysis.summary,
      upcoming_festivals: analysis.upcoming_festivals,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Run failed';
    if (runId) {
      await sb.from('ai_run_history').update({
        finished_at: new Date().toISOString(), status: 'failed', error: msg,
      }).eq('id', runId);
    }
    await audit(sb, { actor: 'cron', action: 'run_failed', entity: 'ai_run_history', entity_id: runId, detail: { error: msg } });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
