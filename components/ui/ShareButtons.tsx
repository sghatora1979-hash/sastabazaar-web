'use client';
/**
 * Product/shop sharing: WhatsApp, Facebook, Telegram, Copy link,
 * Instagram (copy link — no web share URL exists), YouTube description kit
 * (copies ready-made promo text to paste under a video — YouTube has no
 * authorized share API, so we never claim to "post" anything), and the
 * native Web Share sheet when the browser supports it.
 */
import { useState } from 'react';
import { Share2, MessageCircle, Send, Facebook, Instagram, Link2, Check, Youtube } from 'lucide-react';

export function ShareButtons({
  title,
  titleHi,
  priceText,
  compact = false,
}: {
  title: string;
  titleHi?: string;
  priceText?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const label = `${titleHi ? titleHi + ' | ' : ''}${title}${priceText ? ` — ${priceText}` : ''}`;
  const text = encodeURIComponent(`${label} — on SastaBazaar 🛒`);
  const url = encodeURIComponent(pageUrl);

  const copyText = async (t: string, which: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(which);
    setTimeout(() => setCopied(null), 1600);
  };

  const ytKit = `🛍️ ${label} — on SastaBazaar\n\n👉 ${pageUrl}\n\n#SastaBazaar #LocalBazaar #OnlineShoppingIndia`;

  const nativeShare = async () => {
    if ((navigator as unknown as { share?: unknown }).share) {
      try {
        await (navigator as unknown as { share: (d: object) => Promise<void> }).share({
          title: label,
          text: `${label} — on SastaBazaar 🛒`,
          url: pageUrl,
        });
      } catch {
        /* dismissed */
      }
    }
  };

  const btn = 'flex items-center justify-center rounded-full transition hover:scale-105 active:scale-95';
  const full = 'w-10 h-10 text-white';
  const mini = 'w-8 h-8 text-white';
  const size = compact ? mini : full;
  const icon = compact ? 15 : 18;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? '' : 'mt-2'}`}>
      {!compact && (
        <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1 mr-1">
          <Share2 size={14} /> Share:
        </span>
      )}
      <a href={`https://wa.me/?text=${text}%20${url}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
        className={`${btn} ${size} bg-[#25D366]`}>
        <MessageCircle size={icon} />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"
        className={`${btn} ${size} bg-[#1877F2]`}>
        <Facebook size={icon} />
      </a>
      <a href={`https://t.me/share/url?url=${url}&text=${text}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"
        className={`${btn} ${size} bg-[#229ED9]`}>
        <Send size={icon} />
      </a>
      {/* Instagram has no web share URL — copy link for Instagram */}
      <button onClick={() => copyText(pageUrl, 'ig')} aria-label="Copy link for Instagram"
        title="Copy link to share on Instagram"
        className={`${btn} ${size} bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]`}>
        {copied === 'ig' ? <Check size={icon} /> : <Instagram size={icon} />}
      </button>
      {/* YouTube: no authorized share API — copies a description kit instead */}
      <button onClick={() => copyText(ytKit, 'yt')} aria-label="Copy YouTube description kit"
        title="Copies promo text to paste in your YouTube video description"
        className={`${btn} ${size} bg-[#FF0000]`}>
        {copied === 'yt' ? <Check size={icon} /> : <Youtube size={icon} />}
      </button>
      {(navigator as unknown as { share?: unknown }).share !== undefined && (
        <button onClick={nativeShare} aria-label="More share options"
          className={`${btn} ${size} bg-purple-600`}>
          <Share2 size={icon} />
        </button>
      )}
      {!compact && (
        <button onClick={() => copyText(pageUrl, 'link')} className="text-xs text-gray-500 inline-flex items-center gap-1 hover:text-gray-800">
          <Link2 size={13} /> {copied === 'link' ? 'Copied!' : 'Copy link'}
        </button>
      )}
    </div>
  );
}
