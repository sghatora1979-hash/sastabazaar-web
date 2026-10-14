'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Package, Ticket, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { getInteractions } from '@/lib/interactions';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { useAuth } from '@/lib/auth';
import { getMyOrders, type DbOrder } from '@/lib/db/shop';
import { mergeGuestCartToDb } from '@/lib/db/shop';
import { getCart as getGuestCart, clearCart as clearGuestCart } from '@/lib/cart';

const COUPON_KEY = 'sb-coupons';

function LoginCard() {
  const { configured, sendOtp, verifyOtp, sendRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  if (!configured) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-2 font-bold text-gray-900 mb-2">
          <Mail size={18} className="text-[var(--primary)]" /> Login
        </div>
        <p className="text-sm text-gray-500">Online login is not connected yet. You can still browse as a guest.</p>
      </div>
    );
  }

  const doSend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMsg('Enter a valid email address.'); return; }
    setBusy(true); setMsg('');
    const r = await sendOtp(email);
    setBusy(false);
    if (r.ok) { setCodeSent(true); setMsg('Code sent! Check your email (and spam folder).'); }
    else setMsg(r.error ?? 'Could not send code.');
  };

  const doVerify = async () => {
    if (code.trim().length < 6) { setMsg('Enter the 6-digit code.'); return; }
    setBusy(true); setMsg('');
    const r = await verifyOtp(email, code);
    if (r.ok) {
      // move any guest cart into the account
      try {
        const guest = getGuestCart();
        if (guest.length) { await mergeGuestCartToDb(guest); clearGuestCart(); }
      } catch { /* non-fatal */ }
      window.location.reload();
    } else { setBusy(false); setMsg(r.error ?? 'Wrong or expired code.'); }
  };

  const doRecovery = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMsg('Enter your email first.'); return; }
    setBusy(true);
    const r = await sendRecovery(email);
    setBusy(false);
    if (r.ok) setRecoverySent(true);
    else setMsg(r.error ?? 'Could not send recovery email.');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-2 font-bold text-gray-900 mb-1">
        <Mail size={18} className="text-[var(--primary)]" /> Login
      </div>
      <p className="text-xs text-gray-500 mb-3">We email you a 6-digit code — no password to remember.</p>
      {!codeSent ? (
        <>
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" inputMode="email" autoComplete="email"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
          <motion.button whileTap={{ scale: 0.97 }} onClick={doSend} disabled={busy}
            className="btn-primary mt-3 w-full font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {busy ? 'Sending…' : 'Send login code'}
          </motion.button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2">Code sent to <b>{email}</b> <button onClick={() => setCodeSent(false)} className="text-[var(--primary)] font-semibold">change</button></p>
          <input
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code" inputMode="numeric"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm tracking-[0.3em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
          <motion.button whileTap={{ scale: 0.97 }} onClick={doVerify} disabled={busy}
            className="btn-primary mt-3 w-full font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {busy ? 'Verifying…' : 'Verify & log in'}
          </motion.button>
          <button onClick={doSend} className="mt-2 text-xs text-[var(--primary)] font-semibold">Resend code</button>
        </>
      )}
      {msg && <p className="mt-2 text-xs text-gray-600">{msg}</p>}
      {!recoverySent ? (
        <button onClick={doRecovery} className="mt-3 text-xs text-gray-400 underline">Trouble logging in? Email me a recovery link</button>
      ) : (
        <p className="mt-3 text-xs text-green-700">Recovery email sent — check your inbox.</p>
      )}
    </div>
  );
}

function OrdersCard() {
  const { user, configured } = useAuth();
  const [orders, setOrders] = useState<DbOrder[] | null>(null);

  useEffect(() => {
    if (user && configured) getMyOrders().then(setOrders).catch(() => setOrders([]));
    else setOrders(null);
  }, [user, configured]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
        <Package size={18} className="text-[var(--primary)]" /> Orders
      </div>
      {!user ? (
        <p className="text-sm text-gray-500">Log in to see your orders across devices.</p>
      ) : orders === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders yet. Your orders will appear here after checkout.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {orders.map(o => (
            <div key={o.id} className="border border-gray-100 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-[var(--primary)]">#{o.id.slice(0, 8)}</span>
                <span className="font-bold text-gray-700 capitalize">{o.status}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {o.items.length} item(s) · ₹{o.total.toLocaleString('en-IN')}
                {o.shipping > 0 ? ` (incl. ₹${o.shipping} shipping)` : ' (free shipping)'} · {new Date(o.created_at).toLocaleDateString('en-IN')}
              </div>
              <div className="text-xs text-gray-500">Payment: {o.payment_status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { ready, user, profile, role, signOut } = useAuth();
  const [liked, setLiked] = useState<typeof PRODUCTS>([]);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const store = getInteractions();
    setLiked(PRODUCTS.filter(p => store.likes.includes(p.id)).slice(0, 8));
    try {
      setName(localStorage.getItem('sb-name') || '');
      const raw = localStorage.getItem(COUPON_KEY);
      setCoupons(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }, []);

  const saveName = () => {
    localStorage.setItem('sb-name', name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">My Account</h1>

      {!ready ? (
        <p className="text-sm text-gray-500 mb-6">Loading…</p>
      ) : user ? (
        <div className="mb-6 bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-600" /> {user.email}
            </div>
            <div className="text-xs text-gray-500 mt-1 capitalize">
              Logged in as {role}{profile?.name ? ` · ${profile.name}` : ''}
            </div>
          </div>
          <button onClick={() => { void signOut().then(() => window.location.reload()); }}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-red-500 border border-red-200 rounded-xl px-4 py-2">
            <LogOut size={14} /> Log out
          </button>
        </div>
      ) : (
        <div className="mb-6 max-w-md"><LoginCard /></div>
      )}

      <h2 className="text-lg font-extrabold text-gray-900 mb-3">Display · डिस्प्ले</h2>
      <div className="mb-8 max-w-2xl">
        <DisplaySettings />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
            <User size={18} className="text-[var(--primary)]" /> Profile
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
          <motion.button whileTap={{ scale: 0.97 }} onClick={saveName} className="btn-primary mt-3 w-full font-bold py-2.5 rounded-xl text-sm">
            {saved ? 'Saved ✓' : 'Save'}
          </motion.button>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
            <Ticket size={18} className="text-[var(--primary)]" /> My Coupons ({coupons.length})
          </div>
          {coupons.length === 0 ? (
            <p className="text-sm text-gray-500">No coupons yet. <a href="/spin-and-win" className="text-[var(--primary)] font-semibold">Spin &amp; Win</a> to earn some!</p>
          ) : (
            <div className="space-y-2">
              {coupons.map((c, i) => (
                <div key={i} className="bg-[var(--primary)]/10 border border-dashed border-[var(--primary)]/40 rounded-xl px-3 py-2 text-sm font-bold text-[var(--primary)]">
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        <OrdersCard />
      </div>

      <div className="flex items-center gap-2 mb-5">
        <Heart size={20} className="text-red-500" fill="currentColor" />
        <h2 className="text-xl font-extrabold text-gray-900">Liked by you</h2>
      </div>
      {liked.length === 0 ? (
        <p className="text-sm text-gray-500">Tap the heart on any product and it will show up here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {liked.map((p, i) => (
            <ProductCard3D key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
