import { Hero } from '@/components/home/Hero';
import { MatrixIntro } from '@/components/home/MatrixIntro';
import { LocalBazaarButton } from '@/components/home/LocalBazaarButton';
import { ShopkeeperCta } from '@/components/home/ShopkeeperCta';
import { FestivalGreeting } from '@/components/home/FestivalGreeting';
import { BrandMessage } from '@/components/home/BrandMessage';
import { BazaarSelector } from '@/components/home/BazaarSelector';
import { PersonalizedFeed } from '@/components/home/PersonalizedFeed';
import { FlashDeals } from '@/components/store/FlashDeals';
import { BudgetPicks } from '@/components/store/BudgetPicks';
import { RefCapture } from '@/components/refer/RefCapture';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FestivalPromo } from '@/components/festival/FestivalPromo';
import { getNextFestival } from '@/lib/festivals';

export default function HomePage() {
  const nextFestival = getNextFestival();
  return (
    <>
      <MatrixIntro />
      <LocalBazaarButton />
      <ShopkeeperCta />
      <Hero />
      <FestivalGreeting />
      {nextFestival && <FestivalPromo festival={nextFestival} />}
      <RefCapture />
      <FlashDeals />
      <BudgetPicks />
      <BazaarSelector />
      <PersonalizedFeed />
      <CategoryGrid />
      <BrandMessage />
    </>
  );
}
