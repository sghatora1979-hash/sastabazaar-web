import { BazaarPage } from '@/components/home/BazaarPage';

export const metadata = {
  title: 'Purana Bazaar — Quality Second-hand | Sastabazaar',
  description: 'Quality-checked pre-owned items at unbeatable prices.'
};

export default function PuranaPage() {
  return (
    <BazaarPage
      config={{
        section: 'purana',
        title: 'पुराना बाज़ार',
        subtitle: 'Quality-checked second-hand, honest prices',
        gradient: 'linear-gradient(135deg, #15803D, #22C55E)',
        icon: '♻️',
        description: 'Every used item is inspected and graded Like New, Good or Fair by our team before listing. What you see is what you get.'
      }}
    />
  );
}
