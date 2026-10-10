'use client';
/**
 * Bulk product import for sellers (dropshipping).
 * Upload a CSV file (or paste CSV text), preview every row with
 * validation, download a ready-made template, then import all valid
 * rows into the seller's product list in one click.
 * Demo storage (localStorage) — same as the single-product form.
 */
import { useRef, useState } from 'react';
import { Upload, Download, CheckCircle2, XCircle, Trash2, FileSpreadsheet } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import {
  addSellerProduct, ProductCondition, CONDITION_LABELS,
  PromoKind, PROMO_LABELS, togglePromoPlacement,
} from '@/lib/seller';

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

const CONDITIONS = Object.keys(CONDITION_LABELS) as ProductCondition[];

const TEMPLATE = `title,title_hindi,price,mrp,category,image_url,description,stock,condition,promote_in
"Stainless Steel Water Bottle 1L","स्टील की बोतल",499,799,home,https://example.com/bottle.jpg,"Keeps water cold 24 hours, leak proof cap",50,new,"lucky-draw; spin"
"Cotton Kurti - Floral Print","सूती कुर्ती",699,1299,fashion-women,https://example.com/kurti.jpg,"Comfortable daily wear kurti, sizes M to XXL",30,new,festival
"Refurbished Bluetooth Speaker","ब्लूटूथ स्पीकर",999,1999,electronics,,"Tested and certified, 6 month seller warranty",15,refurbished,`;

const PROMO_ALIASES: Record<string, PromoKind> = {
  'luckydraw': 'lucky-draw', 'lucky-draw': 'lucky-draw', 'draw': 'lucky-draw',
  'spin': 'spin', 'spinwin': 'spin', 'spin-win': 'spin',
  'refer': 'refer', 'reward': 'refer', 'referral': 'refer',
  'festival': 'festival',
};

function parsePromos(v: string): { kinds: PromoKind[]; bad: string[] } {
  const kinds: PromoKind[] = [];
  const bad: string[] = [];
  v.split(/[;|]/).map(s => s.trim()).filter(Boolean).forEach(tok => {
    const k = PROMO_ALIASES[norm(tok)];
    if (k) { if (!kinds.includes(k)) kinds.push(k); }
    else bad.push(tok);
  });
  return { kinds, bad };
}

export type BulkRowProduct = {
  title: string; titleHi?: string; price: number; mrp: number;
  categorySlug: string; image: string; description: string;
  stock: number; condition: ProductCondition; promos: PromoKind[];
};

type Row = {
  index: number;
  raw: Record<string, string>;
  errors: string[];
  product: BulkRowProduct | null;
};

/** Minimal RFC-4180-ish CSV parser: handles quoted fields with commas/newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, '');

function matchCategory(v: string): string | null {
  const n = norm(v);
  if (!n) return null;
  const hit = CATEGORIES.find(
    (c) => norm(c.slug) === n || norm(c.name) === n || norm(c.nameHi) === n
  );
  return hit ? hit.slug : null;
}

function validateRows(text: string): Row[] {
  const grid = parseCSV(text);
  if (grid.length < 2) return [];
  const headers = grid[0].map(norm);
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = headers.indexOf(norm(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const ci = {
    title: col('title', 'name', 'product', 'productname'),
    titleHi: col('titlehindi', 'hindi', 'titlehi', 'namehindi'),
    price: col('price', 'sellingprice', 'rate'),
    mrp: col('mrp', 'maximumretailprice', 'listprice'),
    category: col('category', 'cat', 'categoryslug'),
    image: col('imageurl', 'image', 'photo', 'image_url'),
    description: col('description', 'desc', 'details'),
    stock: col('stock', 'qty', 'quantity'),
    condition: col('condition', 'type', 'producttype'),
    promote: col('promotein', 'promote', 'placements', 'promo', 'featurein'),
  };
  const rows: Row[] = [];
  for (let r = 1; r < grid.length; r++) {
    const g = (i: number) => (i >= 0 && i < grid[r].length ? grid[r][i].trim() : '');
    const errors: string[] = [];
    const title = g(ci.title);
    const price = Number(g(ci.price));
    const mrpRaw = g(ci.mrp);
    const mrp = mrpRaw ? Number(mrpRaw) : price;
    const catSlug = matchCategory(g(ci.category));
    const condRaw = norm(g(ci.condition));
    const condition = (CONDITIONS as string[]).includes(condRaw)
      ? (condRaw as ProductCondition)
      : condRaw === '' ? 'new' : null;
    const stockRaw = g(ci.stock);
    const stock = stockRaw === '' ? 10 : Math.floor(Number(stockRaw));

    if (title.length < 3) errors.push('Title needs 3+ characters.');
    if (!price || price <= 0 || Number.isNaN(price)) errors.push('Price must be a number above 0.');
    if (Number.isNaN(mrp) || mrp < price) errors.push('MRP must be a number ≥ price.');
    if (!catSlug) errors.push(`Unknown category "${g(ci.category)}". Use a slug like: ${CATEGORIES.slice(0, 5).map((c) => c.slug).join(', ')}, …`);
    if (condition === null) errors.push(`Condition must be: ${CONDITIONS.join(', ')}.`);
    if (stockRaw !== '' && (Number.isNaN(stock) || stock < 0)) errors.push('Stock must be 0 or more.');
    const { kinds: promos, bad: badPromos } = parsePromos(g(ci.promote));
    if (badPromos.length) errors.push(`Unknown promote_in value(s): ${badPromos.join(', ')}. Use: lucky-draw, spin, refer, festival (separate with ;).`);

    rows.push({
      index: r,
      raw: { title },
      errors,
      product: errors.length === 0 ? {
        title,
        titleHi: g(ci.titleHi) || undefined,
        price,
        mrp,
        categorySlug: catSlug as string,
        image: g(ci.image) || IMG_FOR[catSlug as string] || '/images/home-1.jpg',
        description: g(ci.description),
        stock,
        condition: condition as ProductCondition,
        promos,
      } : null,
    });
  }
  return rows;
}

export function BulkImport({ sellerId, onImported, importRow }: {
  sellerId: string;
  onImported: () => void;
  /** When provided, rows are imported through this async function (e.g. Supabase)
   *  instead of the demo localStorage store. */
  importRow?: (p: BulkRowProduct) => Promise<{ ok: boolean; id?: string; error?: string }>;
}) {
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [parsed, setParsed] = useState(false);
  const [done, setDone] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sastabazaar-bulk-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loadFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setCsvText(text);
      setRows(validateRows(text));
      setParsed(true);
      setDone('');
    };
    reader.readAsText(f);
  };

  const parsePasted = () => {
    setRows(validateRows(csvText));
    setParsed(true);
    setDone('');
  };

  const clear = () => {
    setCsvText(''); setRows([]); setParsed(false); setDone('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const doImport = async () => {
    const valid = rows.filter((r) => r.product);
    let okCount = 0;
    const failures: string[] = [];
    for (const r of valid) {
      const p = r.product!;
      if (importRow) {
        // DB path: the caller's importRow persists promos via products.promote_in.
        const res = await importRow(p);
        if (res.ok && res.id) {
          okCount++;
        } else {
          failures.push(`${p.title.slice(0, 30)}: ${res.error ?? 'failed'}`);
        }
      } else {
        const created = addSellerProduct({
          sellerId,
          title: p.title, titleHi: p.titleHi,
          price: p.price, mrp: p.mrp,
          categorySlug: p.categorySlug,
          image: p.image, images: [p.image], sizes: [],
          description: p.description, stock: p.stock, condition: p.condition,
        });
        p.promos.forEach((k) => togglePromoPlacement(created.id, k));
        okCount++;
      }
    }
    setDone(
      `Imported ${okCount} product${okCount === 1 ? '' : 's'}` +
      (failures.length ? `, ${failures.length} failed: ${failures.slice(0, 3).join('; ')}` : '') +
      '. They are live on the Marketplace now.'
    );
    onImported();
    // keep the confirmation visible: reset the form but not the message
    setCsvText(''); setRows([]); setParsed(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const validCount = rows.filter((r) => r.product).length;

  return (
    <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-orange-600" />
          Bulk Import — add many products at once
        </h3>
        <button onClick={downloadTemplate} className="btn-fx text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <Download size={14} /> Download CSV template
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        For dropshipping: fill the template with your supplier&apos;s products, upload, review, import.
        Columns: <b>title, title_hindi, price, mrp, category, image_url, description, stock, condition, promote_in</b>.
        Category accepts the slug (e.g. <i>mobiles</i>) or name (e.g. <i>Mobiles &amp; Tablets</i>).
        Condition: <i>new</i>, <i>refurbished</i> or <i>clearance</i> — this decides the bazaar section.
        promote_in (optional): <i>lucky-draw; spin; refer; festival</i> — feature the product in promos on import.
      </p>

      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => loadFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-fx w-full border-2 border-dashed border-orange-200 rounded-2xl py-6 text-sm font-bold text-orange-700 bg-orange-50/50 flex flex-col items-center gap-1.5"
          >
            <Upload size={20} />
            Choose CSV file
            <span className="text-[11px] font-normal text-gray-400">from your phone or computer</span>
          </button>
        </div>
        <div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="…or paste your CSV here, then tap Preview"
            rows={4}
            className="w-full text-xs border border-gray-200 rounded-2xl p-3 font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <button onClick={parsePasted} disabled={!csvText.trim()} className="btn-fx mt-1.5 text-xs font-bold text-white bg-gray-900 rounded-xl px-4 py-2 disabled:opacity-40">
            Preview pasted CSV
          </button>
        </div>
      </div>

      {parsed && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-800">
              {rows.length} row{rows.length === 1 ? '' : 's'} found —{' '}
              <span className="text-green-600">{validCount} ready</span>
              {validCount < rows.length && <span className="text-red-500">, {rows.length - validCount} with errors</span>}
            </p>
            <button onClick={clear} className="text-xs text-gray-400 flex items-center gap-1"><Trash2 size={13} /> Clear</button>
          </div>
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-bold text-gray-500">#</th>
                    <th className="text-left p-2 font-bold text-gray-500">Title</th>
                    <th className="text-left p-2 font-bold text-gray-500">Price</th>
                    <th className="text-left p-2 font-bold text-gray-500">Category</th>
                    <th className="text-left p-2 font-bold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.index} className="border-t border-gray-100">
                      <td className="p-2 text-gray-400">{r.index}</td>
                      <td className="p-2 font-semibold text-gray-800 max-w-[180px] truncate">{r.raw.title || <span className="text-gray-300">—</span>}</td>
                      <td className="p-2 text-gray-600">{r.product ? `₹${r.product.price}` : '—'}</td>
                      <td className="p-2 text-gray-600">{r.product ? r.product.categorySlug : '—'}</td>
                      <td className="p-2">
                        {r.product ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 size={14} /> OK</span>
                        ) : (
                          <span className="inline-flex items-start gap-1 text-red-500 font-semibold">
                            <XCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{r.errors.join(' ')}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            onClick={doImport}
            disabled={validCount === 0}
            className="btn-fx mt-3 w-full font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl py-3 disabled:opacity-40"
          >
            Import {validCount} product{validCount === 1 ? '' : 's'} to my store
          </button>
        </div>
      )}

      {done && (
        <p className="mt-3 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> {done}
        </p>
      )}
    </div>
  );
}
