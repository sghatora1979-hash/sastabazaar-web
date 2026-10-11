// AI Marketplace Manager — storefront campaign-price lookup (Update 24).
// Returns the seller-APPROVED override price only while the campaign is
// active and inside its date window. Base prices are never overwritten.
import { getSupabase } from '../supabase';

export type CampaignPrice = { price: number; campaignName: string; endsAt: string } | null;

export async function getActiveCampaignPrice(productId: string): Promise<CampaignPrice> {
  const sb = getSupabase();
  if (!sb) return null;
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('ai_campaign_prices')
    .select('override_price, ends_at, ai_campaigns!inner(name, status)')
    .eq('product_id', productId)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .eq('ai_campaigns.status', 'active')
    .order('override_price', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const camp = data.ai_campaigns as unknown as { name: string; status: string } | null;
  return {
    price: Number((data as { override_price: number }).override_price),
    campaignName: camp?.name ?? 'AI Campaign',
    endsAt: String((data as { ends_at: string }).ends_at),
  };
}
