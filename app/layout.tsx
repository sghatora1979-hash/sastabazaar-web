import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { CelebrationBlast } from '@/components/festival/CelebrationBlast';
import { primeProductCache } from '@/lib/db/products';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const noto = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto', display: 'swap' });

export const metadata: Metadata = {
  title: 'Sastabazaar — सस्ते सामान का बाज़ार',
  description: 'India\'s smartest 4-in-1 marketplace. Naya bhi, Purana bhi, Clearance, aur Local — sab kuch ek jagah.',
  keywords: ['sastabazaar', 'online bazaar', 'second hand', 'clearance', 'local market', 'india marketplace'],
  metadataBase: new URL('https://sastabazaar.in'),
  openGraph: {
    title: 'Sastabazaar — सस्ते सामान का बाज़ार',
    description: 'Naya bhi. Purana bhi. Sabse sastey.',
    type: 'website'
  }
};

export const viewport: Viewport = {
  themeColor: '#FF6B35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Phase 0: load the product catalog from Supabase (falls back to demo data
  // if the database is unreachable). Sync components below read the primed
  // module-level catalog, so no UI code changes are needed.
  await primeProductCache();
  return (
    <html lang="hi" className={`${inter.variable} ${noto.variable}`}>
      <body>
        <ThemeProvider>
          <Header />
          <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <CelebrationBlast />
        </ThemeProvider>
      </body>
    </html>
  );
}
