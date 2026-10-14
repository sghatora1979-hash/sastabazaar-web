// "Popular in your region" shelf (Update 24b).
// Rule-based and privacy-safe: uses the ai_demand_trends() aggregate
// (category counts for open demands — no customer identifiers leak).
// Region + language come ONLY from what the customer provided
// (ai_customer_prefs) — no tracking beyond that.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { CATEGORIES } from '@/lib/categories';
import { stateName } from '@/lib/festivals';

type Trend = { category: string; demand_count: number };

export function PopularInRegion() {
  const { ready, user } = useAuth();
  const [region, setRegion] = useState<string | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const sb = getSupabase();
      if (!sb) { setDone(true); return; }
      let reg: string | null = null;
      if (user) {
        const { data } = await sb.from('ai_customer_prefs')
          .select('region').eq('customer_id', user.id).maybeSingle();
        reg = (data as { region: string | null } | null)?.region ?? null;
      }
      setRegion(reg);
      const { data } = await sb.rpc('ai_demand_trends', { p_region: reg });
      setTrends(((data ?? []) as unknown) as Trend[]);
      setDone(true);
    })();
  }, [ready, user]);

  if (!done || trends.length === 0) return null;

  const catMeta = (slug: string) => {
    const c = CATEGORIES.find((x) => x.slug === slug);
    return { emoji: c?.emoji ?? '🛍️', name: c?.name ?? slug };
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={18} className="text-orange-600" />
        <h2 className="text-lg font-extrabold text-gray-900">
          Popular {region ? `in ${stateName(region)}` : 'across India'}
        </h2>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          based on shopper demand
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {trends.map((t) => {
          const m = catMeta(t.category);
          return (
            <Link
              key={t.category}
              href={`/category/${t.category}`}
              className="shrink-0 flex items-center gap-2 bg-white border border-orange-200 rounded-full pl-3 pr-4 py-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-sm font-bold text-gray-800">{m.name}</span>
              <span className="text-[11px] font-bold text-orange-700 bg-orange-50 rounded-full px-2 py-0.5">
                {t.demand_count} wanted
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
