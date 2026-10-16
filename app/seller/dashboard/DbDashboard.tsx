'use client';

// Real (Supabase-backed) seller dashboard — used when the seller is logged in
// with an APPROVED seller record. Products, stock, orders and promo placements
// all live in the database; Row-Level Security guarantees a seller only ever
// sees and touches their own rows. (Update 19: promo placements moved from
// browser localStorage to the products.promote_in column — cross-device.)
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';import { useRouter } from 'next/navigation';
import {
  Package, ShoppingBag, Plus, Trash2, LogOut, X, ImagePlus,
  CheckCircle2, Truck, Store, Pencil,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import {
  CONDITION_LABELS, ProductCondition, PROMO_LABELS, PromoKind,
} from '@/lib/seller';
import { BulkImport, type BulkRowProduct } from '@/components/seller/BulkImport';
import { formatINR } from '@/lib/utils';
import type { Product } from '@/lib/products';
import {
  getMySellerProducts, createSellerProductDb, deleteSellerProductDb,
  getMySellerOrderLines, setOrderStatusDb, uploadProductImage,
  setProductPromosDb, updateSellerProductDb,
  type MySeller, type SellerOrderLine, type NewDbProduct,
} from '@/lib/db/shop';

const CONDITIONS = Object.keys(CONDITION_LABELS) as ProductCondition[];
const PROMO_KINDS = Object.keys(PROMO_LABELS) as PromoKind[];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function DbDashboard({ seller, onLogout }: { seller: MySeller; onLogout: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<SellerOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoTick, setPromoTick] = useState(0);

  // add-product form
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [cat, setCat] = useState('fashion-men');
  const [stock, setStock] = useState('10');
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [promos, setPromos] = useState<PromoKind[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Update 25 — optional variant fields (size template, sizes, colors, weight, dimensions)
  const [sizeTemplate, setSizeTemplate] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('');
  const [weight, setWeight] = useState('');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [showVariants, setShowVariants] = useState(false);
  const [subcategory, setSubcategory] = useState('');

  const reload = () => {
    setLoading(true);
    Promise.all([getMySellerProducts(seller.id), getMySellerOrderLines(seller.id)])
      .then(([ps, ls]) => { setProducts(ps); setLines(ls); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const chosen = Array.from(files).slice(0, 6 - photos.length);
    const urls = await Promise.all(chosen.map(fileToDataUrl));
    setPhotos([...photos, ...urls]);
  };

  const resetForm = () => {
    setTitle(''); setTitleHi(''); setPrice(''); setMrp(''); setStock('10');
    setCondition('new'); setPromos([]); setPhotos([]); setDescription('');
    setSizeTemplate(''); setSizes([]); setCustomSize('');
    setColors([]); setCustomColor('');
    setWeight(''); setDimL(''); setDimW(''); setDimH('');
    setShowVariants(false); setEditingId(null); setSubcategory('');
  };

  const startEdit = (prod: Product) => {
    resetForm();
    setEditingId(prod.id);
    setTitle(prod.title); setTitleHi(prod.titleHi === prod.title ? '' : prod.titleHi);
    setPrice(String(prod.price)); setMrp(String(prod.mrp)); setStock(String(prod.stock));
    const catSlug = CATEGORIES.find(c => c.id === prod.categoryId)?.slug;
    if (catSlug) setCat(catSlug);
    setSubcategory(prod.subcategory ?? '');
    setPhotos(prod.images ?? []);
    setDescription(prod.description ?? '');
    setPromos((prod.promoteIn ?? []) as PromoKind[]);
    setSizeTemplate(prod.sizeTemplate ?? '');
    setSizes(prod.sizes ?? []);
    setColors(prod.colors ?? []);
    setWeight(prod.weightKg != null ? String(prod.weightKg) : '');
    const dims = (prod.dimensionsCm ?? '').split('×').map(s => s.trim());
    if (dims.length === 3) { setDimL(dims[0]); setDimW(dims[1]); setDimH(dims[2]); }
    if ((prod.sizes?.length ?? 0) + (prod.colors?.length ?? 0) > 0 || prod.weightKg != null || prod.dimensionsCm) {
      setShowVariants(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildInput = (): NewDbProduct | null => {
    setFormError('');
    const p = Number(price), m = Number(mrp || price), st = Number(stock);
    if (title.trim().length < 3) { setFormError('Enter a product title.'); return null; }
    if (!p || p <= 0) { setFormError('Enter a valid selling price.'); return null; }
    const dims = [dimL.trim(), dimW.trim(), dimH.trim()];
    return {
      title: title.trim(), titleHi: titleHi.trim() || undefined,
      description: description.trim() || undefined,
      price: p, mrp: m >= p ? m : p, categorySlug: cat,
      image: photos[0], images: photos, stock: st > 0 ? st : 1, condition,
      sizes: sizes.length ? sizes : undefined,
      colors: colors.length ? colors : undefined,
      weightKg: weight.trim() && Number(weight) > 0 ? Number(weight) : undefined,
      dimensionsCm: dims.every(d => d) ? dims.join(' × ') : undefined,
      sizeTemplate: sizeTemplate || undefined,
      subcategory: subcategory || undefined,
    };
  };

  const addProduct = async () => {
    const input = buildInput();
    if (!input) return;
    setSaving(true);
    try {
      if (editingId) {
        // Edit mode — update the seller's own product.
        const res = await updateSellerProductDb(editingId, seller.id, input);
        if (!res.ok) { setFormError(res.error ?? 'Could not update product.'); return; }
        resetForm();
        reload();
        return;
      }
      // Upload photos to Supabase Storage so the DB stays light.
      const urls = await Promise.all((input.images ?? []).map(uploadProductImage));
      const res = await createSellerProductDb(seller.id, {
        ...input,
        image: urls[0] || input.image,
        images: urls.length ? urls : (input.images ?? []),
        promoteIn: promos,
      });
      if (!res.ok) { setFormError(res.error ?? 'Could not add product.'); return; }
      setPromoTick(t => t + 1);
      resetForm();
      reload();
    } finally {
      setSaving(false);
    }
  };

  const importRow = async (p: BulkRowProduct) => {
    const urls = await Promise.all([p.image].filter(Boolean).map(uploadProductImage));
    const res = await createSellerProductDb(seller.id, {
      title: p.title, titleHi: p.titleHi, description: p.description,
      price: p.price, mrp: p.mrp, categorySlug: p.categorySlug,
      image: urls[0], images: urls, stock: p.stock, condition: p.condition,
      promoteIn: p.promos,
    });
    return res;
  };

  const removeProduct = async (id: string) => {
    if (!confirm('Remove this product from your shop?')) return;
    const res = await deleteSellerProductDb(id);
    if (res.ok) reload();
    else alert(res.error ?? 'Could not remove product.');
  };

  const togglePromo = async (id: string, kind: PromoKind) => {
    const prod = products.find(p => p.id === id);
    const cur = prod?.promoteIn ?? [];
    const next = cur.includes(kind) ? cur.filter(k => k !== kind) : [...cur, kind];
    // optimistic UI
    setProducts(ps => ps.map(p => p.id === id ? { ...p, promoteIn: next } : p));
    const res = await setProductPromosDb(id, next);
    if (!res.ok) {
      setProducts(ps => ps.map(p => p.id === id ? { ...p, promoteIn: cur } : p));
      alert(res.error ?? 'Could not update promos.');
    }
    setPromoTick(t => t + 1);
  };

  const shipOrder = async (orderId: string, next: string) => {
    const res = await setOrderStatusDb(orderId, next);
    if (res.ok) reload();
    else alert(res.error ?? 'Could not update order.');
  };

  // group order lines by order
  const orders = new Map<string, { status: string; created_at: string; lines: SellerOrderLine[] }>();
  for (const l of lines) {
    const g = orders.get(l.order_id) ?? { status: l.status, created_at: l.created_at, lines: [] };
    g.lines.push(l);
    orders.set(l.order_id, g);
  }
  const orderList = [...orders.entries()];
  const pendingCount = orderList.filter(([, g]) => g.status === 'placed').length;
  const revenue = lines.reduce((s, l) => s + l.price * l.qty, 0);
  void promoTick;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Namaskar, {seller.business_name} 🙏</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              <CheckCircle2 size={12} /> Real account · approved seller
            </span>
            Products & orders are stored securely in the database.
          </p>
        </div>
        <button onClick={onLogout}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 border border-gray-200 rounded-full px-4 py-2">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {[
          { l: 'Live products', v: String(products.length) },
          { l: 'Units in stock', v: String(products.reduce((s, p) => s + (p.stock ?? 0), 0)) },
          { l: 'Orders to ship', v: String(pendingCount) },
          { l: 'Sales revenue', v: formatINR(revenue) },
        ].map(({ l, v }) => (
          <div key={l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500">{l}</div>
            <div className="text-xl font-black mt-1 text-gray-900">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-8 border-b border-gray-200">
        {([
          { id: 'products' as const, label: 'My Products', icon: Package },
          { id: 'orders' as const, label: 'Orders', icon: ShoppingBag, badge: pendingCount },
        ]).map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition ${tab === id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            <Icon size={17} /> {label}
            {badge ? <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="py-6">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading your shop…</p>
        ) : tab === 'products' ? (
          <div className="space-y-6">
            <BulkImport sellerId={seller.id} onImported={reload} importRow={importRow} />
            <div className="grid lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 h-fit">
                <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  {editingId ? <Pencil size={18} /> : <Plus size={18} />} {editingId ? 'Edit Product' : 'Add Product'}
                </h2>
                <div className="mt-4 space-y-3">
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product title"
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  <input value={titleHi} onChange={e => setTitleHi(e.target.value)} placeholder="Hindi name, e.g. मिक्सी (optional)"
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
                  <div className="grid grid-cols-2 gap-3">
                    <select value={cat} onChange={e => { setCat(e.target.value); setSubcategory(''); }}
                      className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40">
                      {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.nameHi} · {c.name}</option>)}
                    </select>
                    <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" inputMode="numeric"
                      className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  </div>
                  {(() => {
                    const subs = CATEGORIES.find(c => c.slug === cat)?.subcategories ?? [];
                    return subs.length > 0 ? (
                      <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40">
                        <option value="">Subcategory (optional) — e.g. {subs[0]}</option>
                        {subs.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : null;
                  })()}
                  <div className="flex gap-2">
                    {CONDITIONS.map(c => (
                      <button key={c} onClick={() => setCondition(c)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 ${condition === c ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                        {CONDITION_LABELS[c]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500">Feature this product in</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {PROMO_KINDS.map(k => (
                        <button key={k} onClick={() => setPromos(promos.includes(k) ? promos.filter(x => x !== k) : [...promos, k])}
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border-2 ${promos.includes(k) ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-400'}`}>
                          {PROMO_LABELS[k].emoji} {PROMO_LABELS[k].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3}
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  {/* Update 25 — optional size / color / weight / dimensions */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button onClick={() => setShowVariants(v => !v)}
                      className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100">
                      <span>📐 Size, colour, weight <span className="font-normal text-gray-400">(optional)</span></span>
                      <span className="text-gray-400">{showVariants ? '▲' : '▼'}</span>
                    </button>
                    {showVariants && (
                      <div className="p-4 space-y-3 bg-white">
                        <div>
                          <span className="text-xs font-bold text-gray-500">Size template</span>
                          <div className="flex gap-2 mt-1">
                            {[
                              { id: '', label: 'No sizes' },
                              { id: 'clothing', label: 'Clothing' },
                              { id: 'footwear', label: 'Footwear' },
                              { id: 'custom', label: 'Custom' },
                            ].map(t => (
                              <button key={t.id} onClick={() => { setSizeTemplate(t.id); setSizes([]); }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 ${sizeTemplate === t.id ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {sizeTemplate === 'clothing' && (
                          <div className="flex flex-wrap gap-1.5">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => (
                              <button key={s} onClick={() => setSizes(sizes.includes(s) ? sizes.filter(x => x !== s) : [...sizes, s])}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${sizes.includes(s) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {sizeTemplate === 'footwear' && (
                          <div className="flex flex-wrap gap-1.5">
                            {['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'].map(s => (
                              <button key={s} onClick={() => setSizes(sizes.includes(s) ? sizes.filter(x => x !== s) : [...sizes, s])}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${sizes.includes(s) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {sizeTemplate === 'custom' && (
                          <div className="flex gap-2">
                            <input value={customSize} onChange={e => setCustomSize(e.target.value)} placeholder="e.g. 42 inch, 500g pack"
                              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                            <button onClick={() => { const v = customSize.trim(); if (v && !sizes.includes(v)) setSizes([...sizes, v]); setCustomSize(''); }}
                              className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold">Add</button>
                          </div>
                        )}
                        {sizes.length > 0 && sizeTemplate === 'custom' && (
                          <div className="flex flex-wrap gap-1.5">
                            {sizes.map(s => (
                              <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center gap-1">
                                {s}
                                <button onClick={() => setSizes(sizes.filter(x => x !== s))} className="font-black" aria-label={`Remove ${s}`}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-gray-500">Colours</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Orange', 'Purple', 'Brown', 'Grey', 'Maroon', 'Navy', 'Beige', 'Multicolour'].map(c => (
                              <button key={c} onClick={() => setColors(colors.includes(c) ? colors.filter(x => x !== c) : [...colors, c])}
                                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border-2 ${colors.includes(c) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-gray-200 text-gray-500'}`}>
                                {c}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <input value={customColor} onChange={e => setCustomColor(e.target.value)} placeholder="Custom colour"
                              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                            <button onClick={() => { const v = customColor.trim(); if (v && !colors.includes(v)) setColors([...colors, v]); setCustomColor(''); }}
                              className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold">Add</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-bold text-gray-500">Weight (kg)</span>
                            <input value={weight} onChange={e => setWeight(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="e.g. 1.5" inputMode="decimal"
                              className="mt-1 w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-500">Dimensions L × W × H (cm)</span>
                            <div className="flex gap-1.5 mt-1">
                              <input value={dimL} onChange={e => setDimL(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="L" inputMode="decimal"
                                className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                              <input value={dimW} onChange={e => setDimW(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="W" inputMode="decimal"
                                className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                              <input value={dimH} onChange={e => setDimH(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="H" inputMode="decimal"
                                className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                  <button onClick={addProduct} disabled={saving}
                    className="btn-primary w-full font-bold py-3.5 rounded-2xl disabled:opacity-60">
                    {saving ? (editingId ? 'Saving…' : 'Adding…') : editingId ? 'Save changes' : 'Add Product — goes live instantly'}
                  </button>
                  {editingId && (
                    <button onClick={resetForm} className="w-full text-sm text-gray-500 font-semibold py-2">
                      Cancel edit
                    </button>
                  )}
                </div>
              </motion.div>

              <div className="lg:col-span-2 space-y-3">
                {products.length === 0 && (
                  <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-500 text-sm">
                    <Store size={40} className="mx-auto text-gray-300 mb-3" />
                    No products yet. Add your first product — it appears in the bazaar immediately.
                  </div>
                )}
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image || '/images/home-1.jpg'} alt={p.title} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 line-clamp-1">{p.titleHi || p.title}</div>
                      <div className="text-xs text-gray-500">{p.title}</div>
                      <div className="text-sm font-extrabold text-[var(--primary)] mt-0.5">
                        {formatINR(p.price)} <span className="text-xs font-normal text-gray-400">· stock {p.stock}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {PROMO_KINDS.map(k => {
                          const on = (p.promoteIn ?? []).includes(k);
                          return (
                            <button key={k} onClick={() => togglePromo(p.id, k)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full border ${on ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-200 text-gray-400'}`}>
                              {PROMO_LABELS[k].emoji} {PROMO_LABELS[k].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button onClick={() => startEdit(p)} className="self-start p-2 text-blue-500 hover:text-blue-700" aria-label="Edit product">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => removeProduct(p.id)} className="self-start p-2 text-red-400 hover:text-red-600" aria-label="Remove product">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orderList.length === 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-500 text-sm">
                <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                No orders yet. When customers buy your products, orders appear here.
              </div>
            )}
            {orderList.map(([orderId, g]) => (
              <div key={orderId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-mono font-bold text-[var(--primary)]">#{orderId.slice(0, 8)}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(g.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="text-xs font-bold capitalize bg-gray-100 px-2.5 py-1 rounded-full">{g.status}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {g.lines.map((l, i) => (
                    <div key={i} className="text-sm text-gray-700 flex justify-between">
                      <span className="truncate">{l.title} × {l.qty}</span>
                      <span className="font-bold shrink-0 ml-2">{formatINR(l.price * l.qty)}</span>
                    </div>
                  ))}
                </div>
                {g.lines[0]?.address && (
                  <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-gray-700">
                    <span className="font-bold">Deliver to:</span>{' '}
                    {g.lines[0].address!.line1}, {g.lines[0].address!.city} — {g.lines[0].address!.pin}
                    {g.lines[0].address!.phone ? ` · 📞 ${g.lines[0].address!.phone}` : ''}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Truck size={15} className="text-gray-400" />
                  <input value={tracking[orderId] || ''} onChange={e => setTracking({ ...tracking, [orderId]: e.target.value })}
                    placeholder="Tracking ID" className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                  {g.status === 'placed' && (
                    <button onClick={() => shipOrder(orderId, 'shipped')}
                      className="text-xs font-bold text-white bg-[var(--primary)] px-4 py-2 rounded-xl">Mark shipped</button>
                  )}
                  {g.status === 'shipped' && (
                    <button onClick={() => shipOrder(orderId, 'delivered')}
                      className="text-xs font-bold text-white bg-green-600 px-4 py-2 rounded-xl">Mark delivered</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
