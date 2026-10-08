import { BazaarPage } from '@/components/home/BazaarPage';

export const metadata = {
  title: 'Clearance Bazaar — Up to 80% OFF | Sastabazaar',
  description: 'End-of-season stock clearance. Up to 80% off, while stock lasts.'
};

export default function ClearancePage() {
  return (
    <BazaarPage
      config={{
        section: 'clearance',
        title: 'क्लीयरेंस बाज़ार',
        subtitle: '50–80% OFF. Stock clearance — grab it before it is gone',
        gradient: 'linear-gradient(135deg, #991B1B, #DC2626)',
        icon: '🔥',
        description: 'End-of-season and overstock deals. Deep discounts on genuine products, limited quantities only.'
      }}
    />
  );
}
