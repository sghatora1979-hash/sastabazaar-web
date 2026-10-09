'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Wallet, Plus, Trash2, Truck, LogOut, CheckCircle2, Clock, Bell, Send, ImagePlus, X, Sparkles, Ruler } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { formatINR } from '@/lib/utils';
import {
  ensureSeed, getSessionSeller, setSessionSeller, Seller,
  getSellerProductsBySeller, addSellerProduct, deleteSellerProduct,
  getOrdersForSeller, markShipped, sellerStats, SellerProduct, Order,
  COMMISSION_RATE, COMMISSION_MAX_PER_ORDER, COMMISSION_OLD_FLAT,
  CONDITION_LABELS, ProductCondition, CLOTH_SIZES, SHOE_SIZES,
} from '@/lib/seller';
import { getTgSettings, saveTgSettings, getAlertLog, sendTelegramMessage, AlertLogEntry } from '@/lib/notify';

const IMG_FOR: Record<string, string> = {
  mobiles: '/images/mobiles-1.jpg', electronics: '/images/electronics-1.png',
  'fashion-women': '/images/fashion-women-1.jpg', 'fashion-men': '/images/fashion-men-1.jpg',
  footwear: '/images/footwear-1.webp', beauty: '/images/beauty-1.png',
  home: '/images/home-1.jpg', furniture: '/images/furniture-1.jpg',
  appliances: '/images/appliances-1.png', books: '/images/books-1.jpg',
  toys: '/images/toys-1.png', sports: '/images/sports-1.jpg',
  grocery: '/images/grocery-1.webp', jewellery: '/images/jewellery-1.jpg',
  bags: '/images/bags-1.png', automotive: '/images/automotive-1.png',
  office: '/images/office-1.webp', musical: '/images/musical-1.jpg',
  pet: '/images/pet-1.jpg', handicraft: '/images/handicraft-1.webp',
};

type Tab = 'products' | 'orders' | 'earnings' | 'alerts';

export default function SellerDashboard() {
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  // telegram alerts
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgSaved, setTgSaved] = useState(false);
  const [tgTesting, setTgTesting] = useState(false);
  const [tgTestMsg, setTgTestMsg] = useState('');
  const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([]);

  // add-product form
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [cat, setCat] = useState('fashion-men');
  const [stock, setStock] = useState('10');
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [aiWriting, setAiWriting] = useState(false);
  const [formError, setFormError] = useState('');

  const reload = (s: Seller) => {
    setProducts(getSellerProductsBySeller(s.id));
    setOrders(getOrdersForSeller(s.id));
    const tg = getTgSettings(s.id);
    setTgToken(tg.botToken); setTgChatId(tg.chatId); setTgEnabled(tg.enabled);
    setAlertLog(getAlertLog(s.id));
  };

  useEffect(() => {
    ensureSeed();
    const s = getSessionSeller();
    if (!s) { router.replace('/seller'); return; }
    if (s.kycStatus !== 'verified') { router.replace('/seller/kyc'); return; }
    if (!s.agreement) { router.replace('/seller/agreement'); return; }
    setSeller(s);
    reload(s);
  }, [router]);

  if (!seller) return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</div>;

  const stats = sellerStats(seller.id);

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const pickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = 6 - photos.length;
    const chosen = Array.from(files).slice(0, room);
    const urls = await Promise.all(chosen.map(fileToDataUrl));
    setPhotos([...photos, ...urls]);
  };

  const toggleSize = (sz: string) =>
    setSizes(sizes.includes(sz) ? sizes.filter(x => x !== sz) : [...sizes, sz]);

  const aiWrite = () => {
    setFormError('');
    if (title.trim().length < 3) { setFormError('Enter a product title first, then AI will write.'); return; }
    setAiWriting(true);
    // DEMO AI writer: template-based. Real launch -> AI API that reads your photos.
    setTimeout(() => {
      const catName = CATEGORIES.find(c => c.slug === cat)?.name ?? 'product';
      const cond = CONDITION_LABELS[condition].toLowerCase();
      const p = Number(price) || 0, m = Number(mrp) || 0;
      const save = m > p ? ` You save ${formatINR(m - p)} vs MRP ${formatINR(m)}!` : '';
      const sizeLine = sizes.length ? `Available sizes: ${sizes.join(', ')}. ` : '';
      setDescription(
        `${title.trim()} \u2014 quality ${cond} ${catName.toLowerCase()} at SastaBazaar's honest price of ${formatINR(p)}.${save}\n\n` +
        `\u2713 Quality-checked before dispatch\n` +
        `\u2713 Ships in 48 hours with live tracking\n` +
        `\u2713 7-day easy returns\n\n` +
        sizeLine + `Order now \u2014 limited stock!`
      );
      setAiWriting(false);
    }, 900);
  };

  const addProduct = () => {
    setFormError('');
    const p = Number(price), m = Number(mrp || price), st = Number(stock);
    if (title.trim().length < 3) { setFormError('Enter a product title.'); return; }
    if (!p || p <= 0) { setFormError('Enter a valid selling price.'); return; }
    const imgs = photos.length ? photos : [IMG_FOR[cat] ?? '/images/home-1.jpg'];
    addSellerProduct({
      sellerId: seller.id, title: title.trim(), price: p, mrp: m >= p ? m : p,
      categorySlug: cat, image: imgs[0], images: imgs, sizes, description: description.trim(),
      stock: st > 0 ? st : 1, condition,
    });
    setTitle(''); setPrice(''); setMrp(''); setStock('10'); setCondition('new');
    setPhotos([]); setDescription(''); setSizes([]);
    reload(seller);
  };

  const ship = (orderId: string) => {
    const t = (tracking[orderId] || '').trim();
    if (!t) return;
    markShipped(orderId, t);
    reload(seller);
  };

  const saveTg = () => {
    saveTgSettings(seller.id, { botToken: tgToken.trim(), chatId: tgChatId.trim(), enabled: tgEnabled });
    setTgSaved(true);
    setTimeout(() => setTgSaved(false), 2000);
  };

  const testTg = async () => {
    setTgTesting(true);
    setTgTestMsg('');
    const r = await sendTelegramMessage(tgToken.trim(), tgChatId.trim(), '🔔 <b>SastaBazaar test alert</b>\nYour Telegram order alerts are working!');
    setTgTestMsg(r.ok ? 'Test message sent! Check your Telegram.' : `Failed: ${r.error}`);
    setTgTesting(false);
  };

  const tabs: { id: Tab; label: string; icon: typeof Package; badge?: number }[] = [
    { id: 'products', label: 'My Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: stats.pending },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Namaskar, {seller.name} 🙏</h1>
          <p className="text-sm text-gray-500">Seller dashboard · {seller.phone}</p>
        </div>
        <button
          onClick={() => { setSessionSeller(null); router.replace('/seller'); }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 border border-gray-200 rounded-full px-4 py-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {[
          { l: 'Total sales', v: formatINR(stats.revenue) },
          { l: 'Your payout', v: formatINR(stats.payout) },
          { l: 'SastaBazaar fee', v: formatINR(stats.fee) },
          { l: 'New orders to ship', v: String(stats.pending) },
        ].map(({ l, v }) => (
          <div key={l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500">{l}</div>
            <div className="text-xl font-black text-gray-900 mt-1">{v}</div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="flex gap-2 mt-8 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition ${tab === id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <Icon size={17} /> {label}
            {badge ? (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === 'products' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 h-fit">
              <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2"><Plus size={18} /> Add Product</h2>
              <div className="mt-4 space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product title"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                <div>
                  <span className="text-xs font-bold text-gray-500">Photos — up to 6 (first = cover)</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {photos.map((u, i) => (
                      <span key={i} className="relative w-16 h-16">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt={`photo ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border" />
                        <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center" aria-label="Remove photo">
                          <X size={12} />
                        </button>
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[9px] font-bold bg-black/60 text-white text-center rounded-b-xl">COVER</span>}
                      </span>
                    ))}
                    {photos.length < 6 && (
                      <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-[var(--primary)] hover:text-[var(--primary)]">
                        <ImagePlus size={20} />
                        <span className="text-[9px] font-bold">{photos.length}/6</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => { pickPhotos(e.target.files); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ₹" inputMode="numeric"
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  <input value={mrp} onChange={e => setMrp(e.target.value)} placeholder="MRP ₹" inputMode="numeric"
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                </div>
                <select value={cat} onChange={e => { setCat(e.target.value); setSizes([]); }}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40">
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
                </select>
                {(cat === 'fashion-men' || cat === 'fashion-women') && (
                  <div>
                    <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1"><Ruler size={13} /> Clothing sizes — customer picks at order</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {CLOTH_SIZES.map(sz => (
                        <button key={sz} type="button" onClick={() => toggleSize(sz)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${sizes.includes(sz) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {cat === 'footwear' && (
                  <div>
                    <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1"><Ruler size={13} /> Shoe sizes — customer picks at order</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SHOE_SIZES.map(sz => (
                        <button key={sz} type="button" onClick={() => toggleSize(sz)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${sizes.includes(sz) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="text-xs font-bold text-gray-500">Product type (sets your commission)</span>
                  <select value={condition} onChange={e => setCondition(e.target.value as ProductCondition)}
                    className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40">
                    {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map(c => (
                      <option key={c} value={c}>
                        {CONDITION_LABELS[c]}{c === 'new' ? ` — 10% fee (max ${formatINR(COMMISSION_MAX_PER_ORDER)}/order)` : ` — just ${formatINR(COMMISSION_OLD_FLAT)} fee/piece`}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Description</span>
                    <button type="button" onClick={aiWrite} disabled={aiWriting}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50">
                      <Sparkles size={13} /> {aiWriting ? 'AI writing…' : 'AI: write for me'}
                    </button>
                  </div>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                    placeholder="Or tap 'AI: write for me' above"
                    className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Demo AI writer (template-based). Real launch connects an AI API that reads your photos.</p>
                </div>
                <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock qty" inputMode="numeric"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button onClick={addProduct} className="btn-primary w-full font-bold py-3 rounded-2xl">List Product</button>
                <p className="text-xs text-gray-400">Products appear on the Marketplace page instantly (demo).</p>
              </div>
            </motion.div>

            <div className="lg:col-span-2 space-y-3">
              {products.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                  No products yet — add your first one!
                </div>
              )}
              {products.map(p => (
                <div key={p.id} className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <span className="relative w-20 h-20 shrink-0">
                    <Image src={p.image} alt={p.title} fill className="object-cover rounded-xl" unoptimized />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{p.title}</div>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${(p.condition ?? 'new') === 'new' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {CONDITION_LABELS[(p.condition ?? 'new') as ProductCondition]}
                    </span>
                    <div className="text-sm mt-1">
                      <span className="font-extrabold text-[var(--primary)]">{formatINR(p.price)}</span>{' '}
                      <span className="line-through text-gray-400 text-xs">{formatINR(p.mrp)}</span>{' '}
                      <span className="text-xs text-gray-500">· Stock: {p.stock}</span>
                    </div>
                  </div>
                  <button onClick={() => { deleteSellerProduct(p.id); reload(seller); }}
                    className="self-start p-2 text-red-500 hover:bg-red-50 rounded-full" aria-label="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              📦 When a customer orders, you get the alert here (demo). In production: instant SMS/email to you.
              You ship the parcel yourself and enter the tracking ID — the customer tracks it live.
            </p>
            {orders.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                No orders yet. Share your Marketplace link to get sales!
              </div>
            )}
            {orders.map(o => {
              const mine = o.items.filter(i => i.sellerId === seller.id);
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-black text-gray-900">{o.id}</span>
                      <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${o.status === 'new' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {o.status === 'new' ? '● New — ship me!' : '✓ Shipped'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="font-semibold text-gray-800">{o.customer.name} · {o.customer.phone}</div>
                    <div className="text-gray-500">{o.customer.address}</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {mine.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                        <span className="relative w-12 h-12 shrink-0">
                          <Image src={i.image} alt="" fill className="object-cover rounded-lg" unoptimized />
                        </span>
                        <div className="flex-1 text-sm">
                          <div className="font-semibold text-gray-800">{i.title}</div>
                          <div className="text-gray-500">Qty {i.qty} × {formatINR(i.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {o.status === 'new' ? (
                    <div className="mt-4 flex gap-2">
                      <input
                        value={tracking[o.id] || ''}
                        onChange={e => setTracking({ ...tracking, [o.id]: e.target.value })}
                        placeholder="Enter courier tracking ID"
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                      />
                      <button onClick={() => ship(o.id)}
                        className="btn-primary font-bold px-5 py-2.5 rounded-2xl inline-flex items-center gap-2 text-sm">
                        <Truck size={16} /> Mark Shipped
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-green-700 font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} /> Tracking: {o.trackingId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
              <h2 className="font-extrabold text-lg text-gray-900">Earnings</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total sales ({stats.orders} orders)</span><span className="font-bold">{formatINR(stats.revenue)}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commission — {Math.round(COMMISSION_RATE * 100)}% on new (max {formatINR(COMMISSION_MAX_PER_ORDER)}/order) + {formatINR(COMMISSION_OLD_FLAT)}/pc old & clearance</span>
                  <span className="font-bold text-red-500">− {formatINR(stats.fee)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-extrabold text-gray-900">Your payout</span>
                  <span className="font-black text-green-600">{formatINR(stats.payout)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Demo: payouts are calculated, not transferred. Real launch needs your bank/UPI details
                and a payment gateway for automatic settlement.
              </p>
            </div>
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800 flex gap-2">
              <Clock size={18} className="shrink-0 mt-0.5" />
              <span><b>{stats.pending} order(s)</b> waiting to be shipped. Ship fast — happy customers leave 5-star reviews!</span>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
              <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <Bell size={18} /> Telegram Order Alerts
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Get an instant Telegram message on your phone for every new order. Free forever.
              </p>
              <label className="flex items-center gap-2 mt-4 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={tgEnabled} onChange={e => setTgEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]" />
                Enable Telegram alerts
              </label>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Bot token</span>
                  <input value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456:ABC-DEF..."
                    className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Your Telegram chat ID</span>
                  <input value={tgChatId} onChange={e => setTgChatId(e.target.value)} placeholder="e.g. 987654321" inputMode="numeric"
                    className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                </label>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={saveTg} className="btn-primary font-bold px-6 py-3 rounded-2xl text-sm">
                  {tgSaved ? 'Saved ✓' : 'Save Settings'}
                </button>
                <button onClick={testTg} disabled={tgTesting || !tgToken || !tgChatId}
                  className="font-bold px-6 py-3 rounded-2xl border border-gray-300 text-sm inline-flex items-center gap-2 disabled:opacity-50">
                  <Send size={15} /> {tgTesting ? 'Sending…' : 'Send Test Alert'}
                </button>
              </div>
              {tgTestMsg && <p className="text-sm mt-3 text-gray-600">{tgTestMsg}</p>}
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-sm text-sky-900">
              <div className="font-bold mb-2">📱 How to get your free Telegram bot (2 minutes):</div>
              <ol className="list-decimal ml-5 space-y-1.5 text-sky-800">
                <li>Open Telegram, search <b>@BotFather</b>, tap Start.</li>
                <li>Send <b>/newbot</b>, give it a name (e.g. "My Shop Alerts") and a username ending in <b>bot</b>.</li>
                <li>BotFather gives you a <b>token</b> — paste it above.</li>
                <li>Search <b>@userinfobot</b> on Telegram — it replies with your <b>chat ID</b>. Paste it above.</li>
                <li>Open your new bot's chat and tap <b>Start</b> once. Done!</li>
              </ol>
              <p className="text-xs mt-2 text-sky-700">Demo: until you add a token, alerts are logged below exactly as the seller would receive them.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
              <h3 className="font-extrabold text-gray-900">Recent alerts</h3>
              {alertLog.length === 0 ? (
                <p className="text-sm text-gray-400 mt-2">No alerts yet — they appear here when orders arrive.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {alertLog.map((a, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 capitalize">{a.kind} alert</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.status === 'sent' ? 'bg-green-100 text-green-700' : a.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {a.status === 'demo-logged' ? 'demo' : a.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{a.preview}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{new Date(a.at).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
