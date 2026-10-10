'use client';

// SastaBazaar DB shop layer (Phase 0B): carts, orders, seller products/orders.
// All calls go through Supabase with the SIGNED-IN user's JWT — Row-Level
// Security enforces ownership. Prices/stock are validated server-side inside
// the place_order() RPC; the browser never decides what an order costs.
import { getSupabase } from '../supabase';
import { mapDbProduct } from './products';
import type { Product } from '../products';

export type DbCartLine = { product_id: string; qty: number; product: Product | null };

function sbOrThrow() {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured');
  return sb;
}

// ---------------------------------------------------------------- cart ---
export async function getDbCart(): Promise<DbCartLine[]> {
  const sb = sbOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from('cart_items')
    .select('product_id, qty, products(*)')
    .eq('profile_id', user.id);
  if (error || !data) return [];
  return (data as any[]).map(r => ({
    product_id: r.product_id,
    qty: r.qty,
    product: r.products ? mapDbProduct(r.products) : null,
  }));
}

export async function setDbCartQty(productId: string, qty: number): Promise<void> {
  const sb = sbOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('not signed in');
  if (qty <= 0) {
    await sb.from('cart_items').delete().eq('profile_id', user.id).eq('product_id', productId);
    return;
  }
  const { error } = await sb.from('cart_items').upsert(
    { profile_id: user.id, product_id: productId, qty },
    { onConflict: 'profile_id,product_id' }
  );
  if (error) throw new Error(error.message);
}

export async function clearDbCart(): Promise<void> {
  const sb = sbOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('cart_items').delete().eq('profile_id', user.id);
}

/** Move guest (localStorage) lines into the DB cart on sign-in. Only lines
 *  whose product still exists and is active in the DB are migrated. */
export async function mergeGuestCartToDb(guest: { id: string; qty: number }[]): Promise<void> {
  const sb = sbOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user || guest.length === 0) return;
  const ids = guest.map(g => g.id);
  const { data: valid } = await sb.from('products').select('id').in('id', ids).eq('status', 'active');
  const validIds = new Set((valid ?? []).map((r: any) => r.id as string));
  for (const g of guest) {
    if (!validIds.has(g.id)) continue;
    const qty = Math.max(1, Math.min(100, g.qty | 0));
    await sb.from('cart_items').upsert(
      { profile_id: user.id, product_id: g.id, qty },
      { onConflict: 'profile_id,product_id' }
    );
  }
}

// --------------------------------------------------------------- orders ---
export type DbOrder = {
  id: string; status: string; subtotal: number; commission: number; total: number;
  payment_status: string; created_at: string;
  items: { product_id: string; qty: number; price: number; title: string; image: string }[];
};

/** Places a real order. Prices come from the DB inside the RPC — the `items`
 *  argument only carries product ids + quantities. Idempotent via key. */
export async function placeDbOrder(
  items: { product_id: string; qty: number }[],
  addressId: string | null,
  idempotencyKey: string,
): Promise<{ ok: boolean; orderId?: string; error?: string }> {
  try {
    const sb = sbOrThrow();
    const { data, error } = await sb.rpc('place_order', {
      p_items: items,
      p_address_id: addressId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, orderId: data as string };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Order failed' };
  }
}

export async function getMyOrders(): Promise<DbOrder[]> {
  const sb = sbOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from('orders')
    .select('id,status,subtotal,commission,total,payment_status,created_at, order_items(product_id,qty,price, products(title,image))')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as any[]).map(o => ({
    id: o.id, status: o.status, subtotal: Number(o.subtotal), commission: Number(o.commission),
    total: Number(o.total), payment_status: o.payment_status, created_at: o.created_at,
    items: (o.order_items ?? []).map((it: any) => ({
      product_id: it.product_id, qty: it.qty, price: Number(it.price),
      title: it.products?.title ?? 'Product', image: it.products?.image ?? '',
    })),
  }));
}

// --------------------------------------------------------------- sellers ---
export type MySeller = { id: string; business_name: string; status: string; kyc_status: string };

/** The approved seller record for the signed-in user, or null. */
export async function getMySeller(): Promise<MySeller | null> {
  const sb = sbOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('sellers')
    .select('id,business_name,status,kyc_status')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as MySeller | null) ?? null;
}

/** File a seller application (status starts as 'pending'; only admins approve). */
export async function applyAsSeller(input: {
  business_name: string; phone: string; category?: string;
  city?: string; area?: string; pin?: string; state?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = sbOrThrow();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'Please log in first.' };
    const { error } = await sb.from('sellers').insert({
      profile_id: user.id,
      business_name: input.business_name,
      phone: input.phone,
      category: input.category ?? null,
      city: input.city ?? null,
      area: input.area ?? null,
      pin: input.pin ?? null,
      state: input.state ?? null,
      status: 'pending',
      kyc_status: 'pending',
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Application failed' };
  }
}

export async function getMySellerProducts(sellerId: string): Promise<Product[]> {
  const sb = sbOrThrow();
  const { data, error } = await sb.from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map(mapDbProduct);
}

export type NewDbProduct = {
  title: string; titleHi?: string; description?: string;
  price: number; mrp: number; categorySlug: string;
  image?: string; images?: string[]; stock: number;
  condition: 'new' | 'refurbished' | 'clearance';
};

const SECTION_BY_CONDITION = { new: 'naya', refurbished: 'purana', clearance: 'clearance' } as const;

export async function createSellerProductDb(
  sellerId: string, p: NewDbProduct,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const sb = sbOrThrow();
    const slugBase = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'product';
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const section = SECTION_BY_CONDITION[p.condition];
    const { data, error } = await sb.from('products').insert({
      slug,
      title: p.title,
      title_hi: p.titleHi || null,
      description: p.description || null,
      section,
      category_slug: p.categorySlug,
      price: p.price,
      mrp: p.mrp,
      discount_percent: p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0,
      image: p.image || null,
      images: p.images ?? [],
      seller_id: sellerId,
      stock: Math.max(0, p.stock | 0),
      condition: p.condition === 'new' ? null : p.condition === 'refurbished' ? 'Good' : 'Fair',
      status: 'active',
    }).select('id').single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: (data as any).id as string };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Could not add product' };
  }
}

export async function deleteSellerProductDb(productId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = sbOrThrow();
    // Soft-remove so past order history stays intact.
    const { error } = await sb.from('products').update({ status: 'removed' }).eq('id', productId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Could not delete product' };
  }
}

export async function updateSellerStockDb(productId: string, stock: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = sbOrThrow();
    const { error } = await sb.from('products').update({ stock: Math.max(0, stock | 0) }).eq('id', productId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Could not update stock' };
  }
}

/** Upload a data-URL photo to the public product-images bucket (Phase 0).
 *  Returns the public URL, or the original value when upload isn't possible. */
export async function uploadProductImage(dataUrl: string): Promise<string> {
  try {
    if (/^https?:\/\//.test(dataUrl) || dataUrl.startsWith('/')) return dataUrl;
    const sb = sbOrThrow();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return dataUrl;
    const m = dataUrl.match(/^data:(image\/(\w+));base64,(.+)$/);
    if (!m) return dataUrl;
    const bin = atob(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: m[1] });
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: m[1] });
    if (error) return dataUrl;
    const { data } = sb.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl || dataUrl;
  } catch {
    return dataUrl;
  }
}

export type SellerOrderLine = {
  order_id: string; status: string; created_at: string;
  qty: number; price: number; title: string; image: string;
  customer_email: string;
};

/** Order lines containing this seller's products (RLS restricts to own items). */
export async function getMySellerOrderLines(sellerId: string): Promise<SellerOrderLine[]> {
  const sb = sbOrThrow();
  const { data, error } = await sb
    .from('order_items')
    .select('order_id,qty,price, products(title,image), orders!inner(status,created_at)')
    .eq('seller_id', sellerId)
    .limit(200);
  if (error || !data) return [];
  const lines = (data as any[]).map(r => ({
    order_id: r.order_id, qty: r.qty, price: Number(r.price),
    title: r.products?.title ?? 'Product', image: r.products?.image ?? '',
    status: r.orders?.status ?? 'placed', created_at: r.orders?.created_at ?? '',
    customer_email: '',
  }));
  lines.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return lines;
}

export async function setOrderStatusDb(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = sbOrThrow();
    const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Could not update order' };
  }
}
