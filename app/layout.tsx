import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { CelebrationBlast } from '@/components/festival/CelebrationBlast';
import { primeProductCache } from '@/lib/db/products';
import { AuthProvider } from '@/lib/auth';
import { MatrixBackdrop } from '@/components/ui/MatrixBackdrop';
import { TouchGlow } from '@/components/ui/TouchGlow';
// Update 21: PWA service-worker registration (installable app shell).
import { PwaRegister } from '@/components/delivery/PwaRegister';
// Chatbot v2: Sasta Sahayak AI — floating help widget on every page.
import { SastaChatbot } from '@/components/sasta-chatbot/SastaChatbot';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const noto = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto', display: 'swap' });

export const metadata: Metadata = {
  title: 'SastaBazaar — सस्ते सामान का बाज़ार',
  description: 'India\'s smartest 4-in-1 marketplace. Naya bhi, Purana bhi, Clearance, aur Local — sab kuch ek jagah.',
  keywords: ['sastabazaar', 'online bazaar', 'second hand', 'clearance', 'local market', 'india marketplace'],
  // Update 21: installable PWA manifest + icons.
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SastaBazaar' },
  metadataBase: new URL('https://sastabazaar.in'),
  openGraph: {
    title: 'SastaBazaar — सस्ते सामान का बाज़ार',
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
        {/* Update 18: full-site matrix rain, fixed behind everything (z-0). */}
        <MatrixBackdrop />
        {/* Update 20: ambient finger-follow glow, also behind everything. */}
        <TouchGlow />
        {/* Update 21: PWA service worker (no visual output). */}
        <PwaRegister />
        <div className="relative z-[1]">
        <ThemeProvider>
          <AuthProvider>
          <Header />
          <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <CelebrationBlast />
          <SastaChatbot />
          </AuthProvider>
        </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
