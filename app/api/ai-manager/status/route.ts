// GET /api/ai-manager/status — last run + queue counts (admin console).
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/ai-manager/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });

  const { data: lastRun } = await sb.from('ai_run_history')
    .select('*').order('started_at', { ascending: false }).limit(1).maybeSingle();

  const counts: Record<string, number> = {};
  const { count: pending } = await sb.from('ai_recommendations').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: approved } = await sb.from('ai_recommendations').select('id', { count: 'exact', head: true }).eq('status', 'approved');
  const { count: campaigns } = await sb.from('ai_campaigns').select('id', { count: 'exact', head: true });
  const { count: emailsQueued } = await sb.from('ai_seller_emails').select('id', { count: 'exact', head: true }).eq('status', 'queued');
  const { count: emailsDemo } = await sb.from('ai_seller_emails').select('id', { count: 'exact', head: true }).eq('status', 'demo_logged');
  const { count: emailsSent } = await sb.from('ai_seller_emails').select('id', { count: 'exact', head: true }).eq('status', 'sent');
  counts.pending_recommendations = pending ?? 0;
  counts.approved_recommendations = approved ?? 0;
  counts.campaigns = campaigns ?? 0;
  counts.emails_queued = emailsQueued ?? 0;
  counts.emails_demo_logged = emailsDemo ?? 0;
  counts.emails_sent = emailsSent ?? 0;

  return NextResponse.json({
    ok: true,
    last_run: lastRun ?? null,
    counts,
    ai_configured: Boolean(process.env.AI_API_KEY && process.env.AI_API_URL),
    email_provider: (process.env.EMAIL_PROVIDER || 'demo').toLowerCase(),
    cron_configured: Boolean(process.env.CRON_SECRET),
  });
}
