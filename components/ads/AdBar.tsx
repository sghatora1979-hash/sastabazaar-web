'use client';
/**
 * Paid Advertisement Bar — sits directly below the header on the homepage.
 * Vertical stack (owner's layout):
 *  Row 1 — SastaBazaar brand strip (on top).
 *  Row 2 — continuous rotating ad stage (paid ads first, SAMPLE placeholders fill in).
 *  Row 3 — "Paid Space for Advertisement" booking panel (below).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, BadgeCheck, Clock3, PhoneCall } from 'lucide-react';
import { activeAds, slotsPerDay, SLOT_MENU, AD_CATEGORIES } from '@/lib/ads';

export function AdBar() {
  const ads = activeAds();
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0); // progress re-render driver

  const current = ads.length ? ads[idx % ads.length] : null;
  const durationMs = (current?.durationSec ?? 30) * 1000;

  useEffect(() => {
    if (!ads.length) return;
    setTick(0);
    const step = 250;
    const timer = setInterval(() => {
      setTick((t) => {
        const next = t + step;
        if (next >= durationMs) {
          setIdx((i) => (i + 1) % ads.length);
          return 0;
        }
        return next;
      });
    }, step);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, ads.length, durationMs]);

  const progress = Math.min(100, (tick / durationMs) * 100);

  return (
    <section aria-label="Advertisements" className="w-full bg-gray-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 space-y-3">
        {/* Row 1 — SastaBazaar brand strip on top */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-700 via-orange-600 to-amber-500 px-4 sm:px-6 py-2.5 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-white text-orange-700 font-black text-xl flex items-center justify-center shrink-0">
            S
          </span>
          <div className="min-w-0">
            <p className="font-black text-white text-lg leading-none">
              SastaBazaar
            </p>
            <p className="text-white/85 text-[11px] sm:text-xs truncate">
              सस्ते सामान का बाज़ार — India&apos;s own marketplace
            </p>
          </div>
          <span className="ml-auto text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/80 border border-white/40 rounded-full px-2.5 py-1 shrink-0">
            Advertisement
          </span>
        </div>

        {/* Row 2 — continuous rotating ad stage */}
        <div className="relative overflow-hidden rounded-2xl min-h-[132px] flex">
          {current ? (
            <AdCreativeView
              key={current.id}
              brand={current.brand}
              tagline={current.tagline}
              category={current.category}
              bg={current.bg}
              accent={current.accent}
              link={current.link}
              sample={current.sample}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-6">
              Advertisement space loading…
            </div>
          )}
          {/* rotation progress */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
            <div
              className="h-full bg-amber-400 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* ad counter */}
          <div className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-white/90">
            {ads.length ? `${(idx % ads.length) + 1} / ${ads.length}` : ''}
          </div>
        </div>

        {/* Row 3 — paid space booking panel below */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-dashed border-amber-500 p-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-700" />
            <h2 className="font-extrabold text-amber-900 text-base leading-tight">
              Paid Space for Advertisement
            </h2>
          </div>
          <p className="mt-1 text-sm text-amber-900/90 font-medium">
            Place for Advertisement — please put your advertisement here.
          </p>
          <div className="mt-2 text-xs text-amber-900/80 space-y-1">
            <p className="flex items-center gap-1.5">
              <Clock3 className="w-3.5 h-3.5 shrink-0" />
              Slots: 15 / 20 / 30 sec per ad (max 1 min) — up to{' '}
              {slotsPerDay(30).toLocaleString('en-IN')} ads per 24 hours.
            </p>
            <p className="flex items-start gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Hotels • Shipping • Transport • Railways • Tourism • Voting /
                Election • Public / Govt ads — from all over India.
              </span>
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SLOT_MENU.map((s) => (
              <span
                key={s.durationSec}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white"
              >
                {s.label} • {slotsPerDay(s.durationSec).toLocaleString('en-IN')}/day
              </span>
            ))}
          </div>
          <Link
            href="/contact"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-4 py-2.5 transition-colors w-full sm:w-auto"
          >
            <PhoneCall className="w-4 h-4" />
            Book Ad Space — Contact Customer Care
          </Link>
          <p className="mt-1.5 text-[11px] text-amber-900/70">
            Send your ad creative on WhatsApp via customer care — we place your
            script for your chosen duration.
          </p>
          <p className="sr-only">{AD_CATEGORIES.join(', ')}</p>
        </div>
      </div>
    </section>
  );
}

function AdCreativeView(props: {
  brand: string;
  tagline: string;
  category: string;
  bg: string;
  accent: string;
  link?: string;
  sample: boolean;
}) {
  const inner = (
    <div
      className="flex-1 flex flex-col justify-center px-5 sm:px-8 py-4"
      style={{ background: props.bg }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40"
          style={{ color: props.accent }}
        >
          {props.category}
        </span>
        {props.sample && (
          <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/90 text-gray-800">
            Sample
          </span>
        )}
      </div>
      <p
        className="mt-1 text-2xl sm:text-3xl font-black leading-tight"
        style={{ color: props.accent }}
      >
        {props.brand}
      </p>
      <p
        className="text-sm sm:text-base font-medium opacity-90"
        style={{ color: props.accent }}
      >
        {props.tagline}
      </p>
      {props.sample && (
        <p className="mt-1 text-[11px] text-white/70">
          Sample placeholder — your brand can appear here.
        </p>
      )}
    </div>
  );
  return props.link ? (
    <a
      href={props.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex-1 flex"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}
