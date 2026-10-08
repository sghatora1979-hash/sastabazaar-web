'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PRODUCTS, Product } from '@/lib/products';
import { getCart, setQty, removeFromCart, clearCart } from '@/lib/cart';
import { formatINR } from '@/lib/utils';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';

type Row = { product: Product; qty: number };

export default function CartPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ordered, setOrdered] = useState(false);

  const reload = () => {
    const items = getCart();
    setRows(
      items
        .map(i => ({ product: PRODUCTS.find(p => p.id === i.id)!, qty: i.qty }))
        .filter(r => r.product)
    );
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

  const subtotal = rows.reduce((s, r) => s + r.product.price * r.qty, 0);
  const mrpTotal = rows.reduce((s, r) => s + r.product.mrp * r.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 49;

  const checkout = () => {
    clearCart();
    setRows([]);
    setOrdered(true);
  };

  if (ordered) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Order placed!</h1>
          <p className="text-gray-500 mt-2">
            Thank you for shopping with Sastabazaar. Your order is confirmed and will be dispatched soon.
            (Demo checkout — connect a payment gateway to go live.)
          </p>
          <Link href="/" className="btn-primary inline-block mt-6 font-bold px-8 py-3 rounded-full">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  if (rows.length === 0) {
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
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Your Cart ({rows.length})</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {rows.map(({ product, qty }) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 bg-white rounded-2xl p-4 shadow-md border border-gray-100"
            >
              <Link href={`/product/${product.slug}`} className="relative w-24 h-24 shrink-0">
                <Image src={product.image} alt={product.title} fill className="object-cover rounded-xl" unoptimized />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${product.slug}`} className="font-semibold text-gray-900 line-clamp-2 hover:text-[var(--primary)]">
                  {product.title}
                </Link>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-extrabold text-[var(--primary)]">{formatINR(product.price)}</span>
                  <span className="text-xs line-through text-gray-400">{formatINR(product.mrp)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                    <button onClick={() => setQty(product.id, qty - 1)} className="p-1 hover:bg-white rounded-full" aria-label="Decrease">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{qty}</span>
                    <button onClick={() => setQty(product.id, qty + 1)} className="p-1 hover:bg-white rounded-full" aria-label="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full" aria-label="Remove">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal (MRP)</span><span>{formatINR(mrpTotal)}</span>
            </div>
            <div className="flex justify-between text-green-600 font-medium">
              <span>Discount</span><span>− {formatINR(mrpTotal - subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatINR(shipping)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-extrabold text-lg text-gray-900">
              <span>Total</span><span>{formatINR(subtotal + shipping)}</span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={checkout}
            className="btn-primary w-full mt-6 font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2"
          >
            Checkout <ArrowRight size={18} />
          </motion.button>
          <p className="text-xs text-gray-400 text-center mt-3">UPI · COD · Card · Escrow Protected</p>
        </div>
      </div>
    </div>
  );
}
