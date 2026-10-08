import { BazaarPage } from '@/components/home/BazaarPage';

export const metadata = {
  title: 'Naya Bazaar — Brand New Products | Sastabazaar',
  description: 'Brand new products from verified sellers at the best prices.'
};

export default function NayaPage() {
  return (
    <BazaarPage
      config={{
        section: 'naya',
        title: 'नया बाज़ार',
        subtitle: 'Brand new, sealed products from verified sellers',
        gradient: 'linear-gradient(135deg, #0B3D91, #4A90E2)',
        icon: '🆕',
        description: 'Every item is factory-sealed with manufacturer warranty, escrow-protected payment and 7-day easy returns.'
      }}
    />
  );
}
