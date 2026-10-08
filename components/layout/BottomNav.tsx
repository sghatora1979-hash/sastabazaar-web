'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Gift, ShoppingCart, User } from 'lucide-react';

const NAV = [
  { href: '/',          icon: Home,          label: 'Home' },
  { href: '/search',    icon: Search,        label: 'Search' },
  { href: '/spin-and-win', icon: Gift,       label: 'Spin' },
  { href: '/cart',      icon: ShoppingCart,  label: 'Cart' },
  { href: '/account',   icon: User,          label: 'Account' }
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-5">
        {NAV.map(n => {
          const active = path === n.href;
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center justify-center py-2 text-[10px] font-medium transition ${
                active ? 'text-[var(--primary)]' : 'text-gray-500'
              }`}
            >
              <Icon size={20} fill={active ? 'currentColor' : 'none'} />
              <span className="mt-0.5">{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
