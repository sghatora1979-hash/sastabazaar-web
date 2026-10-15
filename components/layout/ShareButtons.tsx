'use client';

import { useState } from 'react';
import { Facebook, Instagram, Linkedin, Mail, Share2, Send, MessageCircle, Check, X, Link2, Smartphone } from 'lucide-react';

const SITE_URL = 'https://sastabazaarindia.com/';
const SHARE_TEXT = 'SastaBazaar — सस्ते सामान का बाज़ार! Naya bhi, Purana bhi, Sabse sastey. 🛒';

/**
 * Footer share — Update 23.
 * Ek button dabao → share panel khulta hai: Copy Link + saare apps.
 * WhatsApp / Telegram / Facebook / LinkedIn / Skype / Email = direct share.
 * Instagram / TikTok / Messenger me web se direct share nahi hota,
 * isliye wahan link copy hota hai (app me paste karo).
 * Email button aapke phone/computer ka email app kholta hai —
 * subject aur link pehle se likha hota hai, bas Send dabana hai.
 */
export function ShareButtons() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const enc = encodeURIComponent;
  const msg = enc(SHARE_TEXT + ' ' + SITE_URL);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = SITE_URL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'SastaBazaar', text: SHARE_TEXT, url: SITE_URL });
        setOpen(false);
      } catch { /* dismissed */ }
    } else {
      copyLink();
    }
  };

  const apps: { name: string; href: string; bg: string; icon: React.ReactNode; label: string }[] = [
    { name: 'whatsapp', href: `https://wa.me/?text=${msg}`, bg: '#25D366', label: 'WhatsApp',
      icon: <MessageCircle size={20} /> },
    { name: 'telegram', href: `https://t.me/share/url?url=${enc(SITE_URL)}&text=${enc(SHARE_TEXT)}`, bg: '#229ED9', label: 'Telegram',
      icon: <Send size={20} /> },
    { name: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(SITE_URL)}`, bg: '#1877F2', label: 'Facebook',
      icon: <Facebook size={20} /> },
    { name: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(SITE_URL)}`, bg: '#0A66C2', label: 'LinkedIn',
      icon: <Linkedin size={20} /> },
    { name: 'skype', href: `https://web.skype.com/share?url=${enc(SITE_URL)}&text=${enc(SHARE_TEXT)}`, bg: '#00AFF0', label: 'Skype',
      icon: <span className="text-[17px] font-black">S</span> },
    { name: 'email', href: `mailto:?subject=${enc('SastaBazaar — सस्ते सामान का बाज़ार')}&body=${enc(SHARE_TEXT + '\n' + SITE_URL)}`, bg: '#6B7280', label: 'Email',
      icon: <Mail size={20} /> },
    { name: 'instagram', href: '', bg: 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)', label: 'Instagram',
      icon: <Instagram size={20} /> },
    { name: 'tiktok', href: '', bg: '#010101', label: 'TikTok',
      icon: <span className="text-[18px]">🎵</span> },
    { name: 'messenger', href: '', bg: 'linear-gradient(135deg,#0099FF,#A033FF)', label: 'Messenger',
      icon: <span className="text-[18px]">💬</span> },
  ];

  const tile = 'flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:scale-105 active:scale-95 transition-transform';

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition"
        style={{ background: 'linear-gradient(135deg,#FB7701,#E05E00)' }}
      >
        <Share2 size={16} /> Share karo 📣
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
             onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 pb-8 text-gray-900"
               onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Close"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} />
            </button>
            <h3 className="text-lg font-extrabold mb-1">Share SastaBazaar 📣</h3>
            <p className="text-xs text-gray-500 mb-4">Doston ko batao — link copy karo ya direct share karo</p>

            <button onClick={copyLink}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white mb-4 active:scale-95 transition"
                    style={{ background: 'linear-gradient(135deg,#FB7701,#E05E00)' }}>
              {copied ? <Check size={18} /> : <Link2 size={18} />}
              {copied ? 'Link Copied! ✅' : 'Copy Link'}
            </button>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {apps.map((a) =>
                a.href ? (
                  <a key={a.name} href={a.href} target="_blank" rel="noopener noreferrer"
                     className={tile} style={{ background: '#F3F4F6' }}>
                    <span className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow"
                          style={{ background: a.bg }}>{a.icon}</span>
                    <span className="text-[11px] font-semibold text-gray-700">{a.label}</span>
                  </a>
                ) : (
                  <button key={a.name} onClick={copyLink}
                     className={tile} style={{ background: '#F3F4F6' }}>
                    <span className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow"
                          style={{ background: a.bg }}>
                      {copied ? <Check size={20} /> : a.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-700">{a.label}*</span>
                  </button>
                )
              )}
            </div>

            <button onClick={nativeShare}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold bg-gray-900 text-white active:scale-95 transition">
              <Smartphone size={18} /> Phone ka Share Menu
            </button>
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              *Instagram / TikTok / Messenger web se direct share nahi karte — button dabane par link copy ho jayega, app me paste kar dena.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
