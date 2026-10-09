import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-black">S</div>
            <span className="text-white font-bold text-lg">Sastabazaar</span>
          </div>
          <p className="text-sm text-gray-400">
            सस्ते सामान का बाज़ार. India&apos;s smartest 4-in-1 marketplace — Naya, Purana, Clearance, aur Local.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Made in India
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Bazaars</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/naya" className="hover:text-white">Naya Bazaar</Link></li>
            <li><Link href="/purana" className="hover:text-white">Purana Bazaar</Link></li>
            <li><Link href="/clearance" className="hover:text-white">Clearance Bazaar</Link></li>
            <li><Link href="/local" className="hover:text-white">Local Bazaar</Link></li>
            <li><Link href="/spin-and-win" className="hover:text-white">Spin &amp; Win</Link></li>
            <li><Link href="/festivals" className="hover:text-white font-semibold text-white">🪔 Festival Sales</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Categories</h4>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(0, 6).map(c => (
              <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Help</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/contact" className="hover:text-white font-semibold text-white">Contact Us</Link></li>
            <li><Link href="/seller/agreement" className="hover:text-white">Seller Agreement</Link></li>
            <li><a href="https://wa.me/919000000000" className="hover:text-white">WhatsApp Support <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">soon</span></a></li>
            <li><Link href="/track" className="hover:text-white">Track Order</Link></li>
            <li><Link href="/return-policy" className="hover:text-white">Returns</Link></li>
            <li><Link href="/shipping" className="hover:text-white">Shipping</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Sastabazaar · Head Office: Bangalore, India</span>
          <span>UPI · COD · Card · Escrow Protected</span>
        </div>
      </div>
    </footer>
  );
}
