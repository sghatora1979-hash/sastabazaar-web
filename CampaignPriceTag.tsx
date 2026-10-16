// Campaign price tag (Update 24).
// Shows the seller-APPROVED AI campaign price when a campaign is active.
// Renders NOTHING when there is no active campaign — the normal price stands.
// Reads via the public anon-safe policy (active campaigns only).
'use client';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CampaignPriceTag({ productId }: { productId: string }) {
  const [deal, setDeal] = useState<{ price: number; campaignName: string; endsAt: string } | null>(null);

  useEffect(() => {
    if (!UUID_RE.test(productId)) return; // demo-catalog ids are not DB uuids
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const now = new Date().toISOString();
      const { data } = await sb
        .from('ai_campaign_prices')
        .select('override_price, ends_at, ai_campaigns!inner(name, status)')
        .eq('product_id', productId)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .eq('ai_campaigns.status', 'active')
        .order('override_price', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      const raw = (data as unknown as { ai_campaigns: { name: string } | { name: string }[] }).ai_campaigns;
      const camp = Array.isArray(raw) ? raw[0] : raw;
      setDeal({
        price: Number((data as unknown as { override_price: number }).override_price),
        campaignName: camp?.name ?? 'AI Campaign',
        endsAt: String((data as unknown as { ends_at: string }).ends_at),
      });
    })();
    return () => { cancelled = true; };
  }, [productId]);

  if (!deal) return null;
  return (
    <div className="mt-3 rounded-2xl border-2 border-dashed border-violet-400 bg-violet-50 px-4 py-3">
      <div className="flex items-center gap-2 text-violet-800 text-xs font-extrabold uppercase tracking-wide">
        <Sparkles size={14} /> AI Campaign price · {deal.campaignName}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-black text-violet-900">{formatINR(deal.price)}</span>
        <span className="text-[11px] text-violet-700">
          Seller-approved · ends {new Date(deal.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
