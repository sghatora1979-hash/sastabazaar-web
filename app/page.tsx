import { Hero } from '@/components/home/Hero';
import { BazaarSelector } from '@/components/home/BazaarSelector';
import { PersonalizedFeed } from '@/components/home/PersonalizedFeed';
import { DealOfDay } from '@/components/home/DealOfDay';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FestivalPromo } from '@/components/festival/FestivalPromo';
import { getNextFestival } from '@/lib/festivals';

export default function HomePage() {
  const nextFestival = getNextFestival();
  return (
    <>
      <Hero />
      {nextFestival && <FestivalPromo festival={nextFestival} />}
      <BazaarSelector />
      <PersonalizedFeed />
      <DealOfDay />
      <CategoryGrid />
    </>
  );
}
