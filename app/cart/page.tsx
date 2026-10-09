'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PRODUCTS } from '@/lib/products';
import { getCart, setQty, removeFromCart, clearCart } from '@/lib/cart';
import { formatINR } from '@/lib/utils';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, PackageCheck, Smartphone, CreditCard, Banknote, Loader2, Landmark, QrCode, Wallet } from 'lucide-react';
import {
  ensureSeed, getAnyProduct, createOrder, calcCommissionForItems, OrderItem, COMMISSION_MAX_PER_ORDER,
  COMMISSION_OLD_FLAT, COMMISSION_RATE, CONDITION_LABELS, ProductCondition,
  PaymentMethod, Order,
} from '@/lib/seller';
import { notifyNewOrder } from '@/lib/notify';

type Row = {
  id: string; title: string; titleHi?: string; price: number; mrp: number; image: string; href: string;
  sellerId: string; sellerName: string; qty: number; condition: ProductCondition;
};

type Step = 'cart' | 'details' | 'payment';

const METHODS: { id: PaymentMethod; label: string; hint: string; icon: typeof Smartphone }[] = [
  { id: 'upi', label: 'UPI ID', hint: 'PhonePe · GPay · Paytm — enter your UPI ID', icon: Smartphone },
  { id: 'phonepe', label: 'PhonePe QR Code', hint: 'Scan & pay with any UPI app', icon: QrCode },
  { id: 'paypal', label: 'PayPal', hint: 'International cards & PayPal balance', icon: Wallet },
  { id: 'card', label: 'Card', hint: 'Credit / Debit', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', hint: 'Pay at your door', icon: Banknote },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI', phonepe: 'PhonePe QR', paypal: 'PayPal', card: 'Card', cod: 'Cash on Delivery',
};

export default function CartPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [step, setStep] = useState<Step>('cart');
  const [placed, setPlaced] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');

  const reload = () => {
    ensureSeed();
    const items = getCart();
    const resolved: Row[] = [];
    for (const i of items) {
      const p = PRODUCTS.find(p => p.id === i.id);
      if (p) {
        resolved.push({
          id: p.id, title: p.title, titleHi: p.titleHi, price: p.price, mrp: p.mrp, image: p.image,
          href: `/product/${p.slug}`, sellerId: 'platform', sellerName: 'Sastabazaar', qty: i.qty, condition: 'new',
        });
        continue;
      }
      const sp = getAnyProduct(i.id);
      if (sp) {
        resolved.push({
          id: sp.id, title: sp.title, titleHi: sp.titleHi, price: sp.price, mrp: sp.mrp, image: sp.image,
          href: sp.href, sellerId: sp.sellerId, sellerName: sp.sellerName, qty: i.qty, condition: sp.condition,
        });
      }
    }
    setRows(resolved);
  };

  useEffect(() => {
    reload();
    window.addEventListener('sb-cart', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('sb-cart', reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  const subtotal = rows.reduce((s, r) => s + r.price * r.qty, 0);
  const mrpTotal = rows.reduce((s, r) => s + r.mrp * r.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  const { fee: platformFee, sbDiscount, oldUnits } = calcCommissionForItems(rows.map(r => ({ price: r.price, qty: r.qty, condition: r.condition })));
  const total = subtotal + shipping;

  const goPayment = () => {
    setFormError('');
    if (name.trim().length < 2) { setFormError('Please enter your name.'); return; }
    if (phone.trim().replace(/\D/g, '').length < 10) { setFormError('Please enter a valid phone number.'); return; }
    if (address.trim().length < 10) { setFormError('Please enter your full delivery address.'); return; }
    setStep('payment');
  };

  const pay = () => {
    if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      setFormError('Enter a valid UPI ID (e.g. name@okhdfc).');
      return;
    }
    setFormError('');
    setPaying(true);
    // DEMO payment: simulate a 1.5s gateway round-trip. Real launch -> Razorpay.
    setTimeout(() => {
      const items: OrderItem[] = rows.map(r => ({
        productId: r.id, title: r.title, titleHi: r.titleHi, price: r.price, qty: r.qty,
        image: r.image, sellerId: r.sellerId, sellerName: r.sellerName, condition: r.condition,
      }));
      const order = createOrder(
        { name: name.trim(), phone: phone.trim(), address: address.trim() },
        items, shipping,
        {
          method,
          upiId: method === 'upi' ? upiId.trim() : undefined,
          status: method === 'cod' ? 'pending-cod' : 'demo-paid',
        }
      );
      // ping each seller (Telegram if configured, else demo log)
      const sellerIds = [...new Set(items.map(i => i.sellerId).filter(s => s !== 'platform'))];
      sellerIds.forEach(sid => { void notifyNewOrder(sid, order); });
      clearCart();
      setRows([]);
      setPaying(false);
      setPlaced(order);
    }, 1500);
  };

  if (placed) {
    const sellerPayout = placed.subtotal - placed.platformFee;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <PackageCheck size={72} className="mx-auto text-green-500" />
          <h1 className="text-3xl font-extrabold text-gray-900 mt-4">
            {placed.payment?.method === 'cod' ? 'Order placed!' : 'Payment successful!'}
          </h1>
          <p className="text-gray-500 mt-2">Order ID</p>
          <p className="text-2xl font-black font-mono text-[var(--primary)]">{placed.id}</p>
          {placed.payment?.method === 'upi' && (
            <p className="text-sm text-gray-500 mt-1">Paid {formatINR(placed.total)} via UPI {placed.payment.upiId} (demo)</p>
          )}
          {placed.payment && placed.payment.method !== 'upi' && placed.payment.method !== 'cod' && (
            <p className="text-sm text-gray-500 mt-1">Paid {formatINR(placed.total)} via {METHOD_LABELS[placed.payment.method]} (demo)</p>
          )}
        </motion.div>

        {/* money split */}
        <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-md p-6">
          <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
            <Landmark size={18} /> Where your money goes
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">You paid</span><span className="font-bold">{formatINR(placed.total)}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">SastaBazaar commission ({Math.round(COMMISSION_RATE * 100)}% on new, max {formatINR(COMMISSION_MAX_PER_ORDER)}/order · {formatINR(COMMISSION_OLD_FLAT)}/pc old & clearance) → Sandeep's account</span>
              <span className="font-bold text-[var(--primary)]">{formatINR(placed.platformFee)}</span>
            </div>
            {placed.sbDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount from SastaBazaar's side</span><span>− {formatINR(placed.sbDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Seller payout</span><span className="font-bold">{formatINR(sellerPayout)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Demo mode — no real money moved. Real launch needs Razorpay (UPI/cards), PhonePe Business (QR)
            and PayPal connected, with automatic split settlement to your bank account.
          </p>
        </div>

        <div className="flex gap-3 justify-center mt-6">
          <Link href="/track" className="btn-primary font-bold px-8 py-3 rounded-full">Track Order</Link>
          <Link href="/" className="font-bold px-8 py-3 rounded-full border border-gray-300">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (rows.length === 0 && step === 'cart') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300" />
        <h1 className="text-2xl font-extrabold text-gray-900 mt-4">Your cart is empty</h1>
        <p className="text-gray-500 mt-2">Add some deals to get started.</p>
        <Link href="/" className="btn-primary inline-block mt-6 font-bold px-8 py-3 rounded-full">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        {step === 'cart' ? `Your Cart (${rows.length})` : step === 'details' ? 'Delivery Details' : 'Payment'}
      </h1>
      <div className="flex items-center gap-2 mb-6 text-xs font-bold">
        {(['cart', 'details', 'payment'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${(['cart', 'details', 'payment'].indexOf(step) >= i) ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
            <span className="capitalize text-gray-600">{s}</span>
            {i < 2 && <span className="w-6 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 'cart' && (
            <div className="space-y-4">
              {rows.map((r) => (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                  <Link href={r.href} className="relative w-24 h-24 shrink-0">
                    <Image src={r.image} alt={r.title} fill className="object-cover rounded-xl" unoptimized />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={r.href} className="font-bold text-gray-900 line-clamp-2 hover:text-[var(--primary)]">{r.titleHi || r.title}</Link>
                    {r.title && <div className="text-[11px] text-gray-500 truncate">{r.title}</div>}
                    <div className="text-[11px] text-gray-500 mt-0.5">Sold by {r.sellerName}{r.condition !== 'new' && <span className="ml-1 font-bold text-amber-600">· {CONDITION_LABELS[r.condition]}</span>}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-extrabold text-[var(--primary)]">{formatINR(r.price)}</span>
                      <span className="text-xs line-through text-gray-400">{formatINR(r.mrp)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                        <button onClick={() => setQty(r.id, r.qty - 1)} className="p-1 hover:bg-white rounded-full" aria-label="Decrease"><Minus size={14} /></button>
                        <span className="text-sm font-bold w-6 text-center">{r.qty}</span>
                        <button onClick={() => setQty(r.id, r.qty + 1)} className="p-1 hover:bg-white rounded-full" aria-label="Increase"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full" aria-label="Remove"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {step === 'details' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel"
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address with PIN code" rows={3}
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('cart')} className="font-bold px-6 py-3 rounded-2xl border border-gray-300 text-sm">Back</button>
                <button onClick={goPayment} className="btn-primary flex-1 font-bold py-3 rounded-2xl inline-flex items-center justify-center gap-2">
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 mb-4">
                <b>Demo mode:</b> no real money moves. Real launch connects Razorpay (UPI/cards),
                PhonePe Business (QR) and PayPal — with automatic commission split to your bank account.
              </div>
              <div className="space-y-3">
                {METHODS.map(({ id, label, hint, icon: Icon }) => (
                  <button key={id} onClick={() => setMethod(id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition ${method === id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${method === id ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon size={20} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold text-sm text-gray-900">{label}</span>
                      <span className="block text-xs text-gray-500">{hint}</span>
                    </span>
                    <span className={`w-5 h-5 rounded-full border-2 ${method === id ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-gray-300'}`} />
                  </button>
                ))}
              </div>
              {method === 'upi' && (
                <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@okhdfc"
                  className="mt-4 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
              )}
              {method === 'phonepe' && (
                <div className="mt-4 text-center bg-gray-50 rounded-2xl p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=sastabazaar@upi&pn=SastaBazaar&am=${total.toFixed(2)}&cu=INR&tn=SastaBazaarOrder`)}`}
                    alt="PhonePe demo QR code"
                    className="w-52 h-52 mx-auto rounded-2xl border-4 border-white shadow-md"
                  />
                  <p className="font-bold text-sm text-gray-800 mt-3">Scan with PhonePe / GPay / Paytm</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Demo QR for {formatINR(total)}. At launch this encodes your PhonePe Business UPI ID.
                  </p>
                </div>
              )}
              {method === 'paypal' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
                  <b>Demo:</b> you would be redirected to PayPal to pay {formatINR(total)}
                  {' '}(≈ ${(total / 83).toFixed(2)} USD). At launch, connect your PayPal Business account.
                </div>
              )}
              {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('details')} disabled={paying}
                  className="font-bold px-6 py-3 rounded-2xl border border-gray-300 text-sm disabled:opacity-50">Back</button>
                <button onClick={pay} disabled={paying}
                  className="btn-primary flex-1 font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2 disabled:opacity-60">
                  {paying ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>{method === 'cod' ? 'Place Order' : `Pay ${formatINR(total)}`}</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal (MRP)</span><span>{formatINR(mrpTotal)}</span></div>
            <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>− {formatINR(mrpTotal - subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatINR(shipping)}</span></div>
            <div className="border-t pt-2 flex justify-between font-extrabold text-lg text-gray-900">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
            {step === 'payment' && (
              <div className="text-xs text-gray-400 pt-1">
                incl. {formatINR(platformFee)} SastaBazaar fee ({Math.round(COMMISSION_RATE * 100)}% on new, max {formatINR(COMMISSION_MAX_PER_ORDER)}/order{oldUnits > 0 ? ` + ${formatINR(COMMISSION_OLD_FLAT)} × ${oldUnits} old/clearance pc` : ''}) → Sandeep's account
              </div>
            )}
          </div>
          {step === 'cart' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('details')}
              className="btn-primary w-full mt-6 font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2">
              Checkout <ArrowRight size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
