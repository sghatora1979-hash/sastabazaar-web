import { BazaarPage } from '@/components/home/BazaarPage';

export const metadata = {
  title: 'Local Bazaar — Pickup in Your City | Sastabazaar',
  description: 'Meet sellers in your city, inspect in person and skip shipping.'
};

export default function LocalPage() {
  return (
    <BazaarPage
      config={{
        section: 'local',
        title: 'लोकल बाज़ार',
        subtitle: 'Meet sellers, inspect in person, skip shipping',
        gradient: 'linear-gradient(135deg, #C2410C, #FF6B35)',
        icon: '📍',
        description: 'Buy from sellers in your city. Chat, meet at a safe public spot, check the item yourself and pay on pickup.'
      }}
    />
  );
}
