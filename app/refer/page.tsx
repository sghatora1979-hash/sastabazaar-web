'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Copy, Check, Users, Wallet, ShoppingBag, Share2, MessageCircle, Mail, Send, Link2, Info
} from 'lucide-react';
import {
  getMyCode, getMyReferralLink, getReferrals, getEarnings, addReferral,
  simulateFriendPurchase, shareLinks, REWARD_JOIN, REWARD_FIRST_PURCHASE,
  type Referral
} from '@/lib/referral';
import { formatINR } from '@/lib/utils';
import { BRAND } from '@/components/store/ProductCard';

export default function ReferPage() {
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(getMyCode());
    setLink(getMyReferralLink());
    setReferrals(getReferrals());
  }, []);

  const refresh = () => setReferrals(getReferrals());
  const earnings = getEarnings();
  const shares = shareLinks(link || getMyReferralLink());

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const shareBtn =
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white shadow-md active:scale-95 transition';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.75rem] p-6 sm:p-10 text-white text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #191919 0%, #7A2E00 60%, ${BRAND} 130%)` }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: BRAND }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-bold mb-4">
            <Gift size={16} /> Refer &amp; Earn
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Invite friends. Earn up to {formatINR(REWARD_JOIN + REWARD_FIRST_PURCHASE)} each.</h1>
          <p className="mt-3 text-white/80 max-w-lg mx-auto text-sm sm:text-base">
            Share your link. Your friend gets {formatINR(REWARD_JOIN)} off their first order.
            You get {formatINR(REWARD_JOIN)} when they join and {formatINR(REWARD_FIRST_PURCHASE)} more when they shop.
          </p>
        </div>
      </motion.div>

      {/* Link card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5 sm:p-6"
      >
        <div className="text-sm font-bold text-gray-900 mb-1">Your personal referral link</div>
        <div className="text-xs text-gray-500 mb-3">Your code: <span className="font-extrabold" style={{ color: BRAND }}>{code}</span></div>
        <div className="flex gap-2">
          <input
            readOnly value={link}
            className="flex-1 min-w-0 px-4 py-3 bg-gray-100 rounded-2xl text-sm font-mono text-gray-700 focus:outline-none"
            onFocus={e => e.target.select()}
          />
          <button onClick={copyLink} className="shrink-0 inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-md active:scale-95 transition" style={{ background: BRAND }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs font-bold text-gray-500 mb-2 inline-flex items-center gap-1.5"><Share2 size={13} /> Share via</div>
          <div className="flex flex-wrap gap-2">
            <a href={shares.whatsapp} target="_blank" rel="noopener" className={shareBtn} style={{ background: '#25D366' }}>
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href={shares.sms} className={shareBtn} style={{ background: '#0A84FF' }}>
              <MessageCircle size={16} /> SMS
            </a>
            <a href={shares.telegram} target="_blank" rel="noopener" className={shareBtn} style={{ background: '#229ED9' }}>
              <Send size={16} /> Telegram
            </a>
            <a href={shares.email} className={shareBtn} style={{ background: '#6B7280' }}>
              <Mail size={16} /> Email
            </a>
            <button onClick={copyLink} className={shareBtn} style={{ background: BRAND }}>
              <Link2 size={16} /> Copy link
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { icon: Users, label: 'Friends joined', value: String(earnings.joins) },
          { icon: ShoppingBag, label: 'First purchases', value: String(earnings.purchases) },
          { icon: Wallet, label: 'Total earnings', value: formatINR(earnings.total) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <Icon size={20} className="mx-auto mb-1.5" style={{ color: BRAND }} />
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900">{value}</div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Referrals list */}
      <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900">Your referrals</h2>
          <button
            onClick={() => { addReferral(); refresh(); }}
            className="text-xs font-bold text-white px-3.5 py-2 rounded-full active:scale-95 transition"
            style={{ background: BRAND }}
          >
            + Demo: simulate a friend joining
          </button>
        </div>
        {referrals.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No referrals yet. Share your link above — when a friend joins with it, they appear here.
          </p>
        ) : (
          <div className="space-y-2.5">
            {referrals.map(r => (
              <div key={r.joinedAt} className="flex items-center justify-between gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-gray-900 truncate">{r.friendLabel}</div>
                  <div className="text-[11px] text-gray-500">
                    Joined {new Date(r.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {r.firstPurchase ? (
                  <span className="shrink-0 text-[11px] font-extrabold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                    Purchased · +{formatINR(REWARD_JOIN + REWARD_FIRST_PURCHASE)}
                  </span>
                ) : (
                  <button
                    onClick={() => { simulateFriendPurchase(r.joinedAt); refresh(); }}
                    className="shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                    title="Demo: pretend this friend made their first purchase"
                  >
                    Joined · +{formatINR(REWARD_JOIN)} — demo: mark purchased
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="font-extrabold text-gray-900 mb-4">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { n: '1', t: 'Share your link', d: 'Send it on WhatsApp, SMS, Telegram or email.' },
            { n: '2', t: 'Friend joins', d: `They get ${formatINR(REWARD_JOIN)} off. You earn ${formatINR(REWARD_JOIN)}.` },
            { n: '3', t: 'Friend shops', d: `You earn ${formatINR(REWARD_FIRST_PURCHASE)} more on their first purchase.` },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full text-white font-extrabold flex items-center justify-center text-sm" style={{ background: BRAND }}>{s.n}</span>
              <div>
                <div className="font-bold text-gray-900">{s.t}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11px] text-gray-400 flex gap-1.5 items-start">
          <Info size={13} className="shrink-0 mt-0.5" />
          Demo version: referrals and earnings are stored in this browser only. Real launch needs a server for
          tracking, fraud prevention and credit settlement — share buttons open your own apps and work for real.
        </p>
      </div>
    </div>
  );
}
