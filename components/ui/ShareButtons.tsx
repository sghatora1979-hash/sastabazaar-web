'use client';
import { useState } from 'react';
import { Share2, MessageCircle, Send, Facebook, Instagram, Link2, Check } from 'lucide-react';

export function ShareButtons({ title, compact = false }: { title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const text = encodeURIComponent(`${title} — on Sastabazaar 🛒`);
  const url = encodeURIComponent(pageUrl);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const btn = 'flex items-center justify-center rounded-full transition hover:scale-105';
  const full = 'w-10 h-10 text-white';
  const mini = 'w-8 h-8 text-white';

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mt-2'}`}>
      {!compact && (
        <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1 mr-1">
          <Share2 size={14} /> Share:
        </span>
      )}
      <a href={`https://wa.me/?text=${text}%20${url}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
        className={`${btn} ${compact ? mini : full} bg-[#25D366]`}>
        <MessageCircle size={compact ? 15 : 18} />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"
        className={`${btn} ${compact ? mini : full} bg-[#1877F2]`}>
        <Facebook size={compact ? 15 : 18} />
      </a>
      <a href={`https://t.me/share/url?url=${url}&text=${text}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"
        className={`${btn} ${compact ? mini : full} bg-[#229ED9]`}>
        <Send size={compact ? 15 : 18} />
      </a>
      {/* Instagram has no web share URL — copy link for Instagram */}
      <button onClick={copy} aria-label="Copy link for Instagram"
        title="Copy link to share on Instagram"
        className={`${btn} ${compact ? mini : full} bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]`}>
        {copied ? <Check size={compact ? 15 : 18} /> : <Instagram size={compact ? 15 : 18} />}
      </button>
      {!compact && (
        <button onClick={copy} className="text-xs text-gray-500 inline-flex items-center gap-1 hover:text-gray-800">
          <Link2 size={13} /> {copied ? 'Copied!' : 'Copy link'}
        </button>
      )}
    </div>
  );
}
