'use client';

export type CartItem = { id: string; qty: number };

const KEY = 'sb-cart';

function read(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('sb-cart'));
}

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(id: string, qty = 1) {
  const items = read();
  const existing = items.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else items.push({ id, qty });
  write(items);
}

export function removeFromCart(id: string) {
  write(read().filter(i => i.id !== id));
}

export function setQty(id: string, qty: number) {
  if (qty <= 0) return removeFromCart(id);
  const items = read();
  const existing = items.find(i => i.id === id);
  if (existing) existing.qty = qty;
  write(items);
}

export function clearCart() {
  write([]);
}
