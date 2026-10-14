'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PackageSearch, Truck, CheckCircle2, Clock } from 'lucide-react';
import { ensureSeed, getOrderById, Order } from '@/lib/seller';
import { formatINR } from '@/lib/utils';

const STEPS = ['new', 'shipped', 'delivered'] as const;

export default function TrackPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => { ensureSeed(); }, []);

  const lookup = () => {
    setError('');
    if (!orderId.trim()) { setError('Enter your order ID (e.g. SB-482913).'); return; }
    const o = getOrderById(orderId.trim());
    if (!o) { setError('Order not found. Check the ID and try again.'); setOrder(null); return; }
    setOrder(o);
  };

  const stepIdx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center">
        <span className="inline-flex w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] items-center justify-center">
          <PackageSearch size={24} />
        </span>
        <h1 className="text-3xl font-black text-gray-900 mt-3">Track Your Order</h1>
        <p className="text-sm text-gray-500 mt-1">Sellers ship directly — tracking appears here as soon as they dispatch.</p>
      </div>

      <div className="mt-6 flex gap-2">
        <input
          value={orderId}
          onChange={e => setOrderId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="Order ID, e.g. SB-482913"
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        />
        <button onClick={lookup} className="btn-primary font-bold px-6 py-3 rounded-2xl">Track</button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
      <p className="text-xs text-gray-400 text-center mt-2">Try the demo order: <b>SB-482913</b></p>

      {order && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <span className="font-black text-lg text-gray-900">{order.id}</span>
            <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
          </div>

          {/* progress */}
          <div className="mt-6 flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center ${i <= stepIdx ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i === 0 ? <Clock size={17} /> : i === 1 ? <Truck size={17} /> : <CheckCircle2 size={17} />}
                  </span>
                  <span className="text-[11px] font-semibold mt-1 capitalize text-gray-600">{s === 'new' ? 'Placed' : s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${i < stepIdx ? 'bg-[var(--primary)]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {order.trackingId ? (
            <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm">
              <span className="font-bold text-green-800">Tracking ID: </span>
              <span className="font-mono font-bold text-green-900">{order.trackingId}</span>
              <div className="text-xs text-green-700 mt-1">Shipped by {order.items[0]?.sellerName}. Track on the courier website.</div>
            </div>
          ) : (
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              Seller is packing your order. Tracking ID will appear here once dispatched.
            </div>
          )}

          <div className="mt-5 space-y-2">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                <span className="relative w-12 h-12 shrink-0">
                  <Image src={i.image} alt="" fill className="object-cover rounded-lg" unoptimized />
                </span>
                <div className="flex-1 text-sm">
                  <div className="font-bold text-gray-800">{i.titleHi || i.title}</div>
                  {i.title && <div className="text-xs text-gray-500">{i.title}</div>}
                  <div className="text-gray-500 text-xs">Qty {i.qty} · Sold by {i.sellerName}</div>
                </div>
                <div className="text-sm font-bold">{formatINR(i.price * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t text-sm space-y-1">
            <div className="flex justify-between text-gray-500"><span>Deliver to</span><span className="text-right max-w-[60%]">{order.customer.name}, {order.customer.address}</span></div>
            <div className="flex justify-between font-extrabold text-gray-900"><span>Total paid</span><span>{formatINR(order.total)}</span></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
