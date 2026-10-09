'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { BRAND } from '@/components/store/ProductCard';

/**
 * Temu-style mobile bottom nav: Home · Categories · Cart · Account.
 * Categories opens the header drawer via a window event.
 */
export function BottomNav() {
  const path = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try {
        const c = JSON.parse(localStorage.getItem('sb-cart') || '[]');
        setCartCount(Array.isArray(c) ? c.length : 0);
      } catch { setCartCount(0); }
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener('sb-cart', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('sb-cart', update);
    };
  }, []);

  const openCategories = () => window.dispatchEvent(new CustomEvent('sb-open-menu'));

  const item = (active: boolean) =>
    `flex flex-col items-center justify-center py-2 text-[10px] font-semibold transition w-full ${
      active ? '' : 'text-gray-400'
    }`;

  const iconStyle = (active: boolean) => (active ? { color: BRAND } : undefined);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-4">
        <Link href="/" className={item(path === '/')}>
          <Home size={22} style={iconStyle(path === '/')} fill={path === '/' ? BRAND : 'none'} />
          <span className="mt-0.5" style={iconStyle(path === '/')}>Home</span>
        </Link>
        <button onClick={openCategories} className={item(false)} aria-label="Categories">
          <LayoutGrid size={22} />
          <span className="mt-0.5">Categories</span>
        </button>
        <Link href="/cart" className={`${item(path === '/cart')} relative`}>
          <ShoppingCart size={22} style={iconStyle(path === '/cart')} fill={path === '/cart' ? BRAND : 'none'} />
          <span className="mt-0.5" style={iconStyle(path === '/cart')}>Cart</span>
          {cartCount > 0 && (
            <span
              className="absolute top-1 left-1/2 ml-1 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center"
              style={{ background: BRAND }}
            >
              {cartCount}
            </span>
          )}
        </Link>
        <Link href="/account" className={item(path === '/account')}>
          <User size={22} style={iconStyle(path === '/account')} fill={path === '/account' ? BRAND : 'none'} />
          <span className="mt-0.5" style={iconStyle(path === '/account')}>Account</span>
        </Link>
      </div>
    </nav>
  );
}
