import { Hero } from '@/components/home/Hero';
import { BazaarSelector } from '@/components/home/BazaarSelector';
import { PersonalizedFeed } from '@/components/home/PersonalizedFeed';
import { DealOfDay } from '@/components/home/DealOfDay';
import { CategoryGrid } from '@/components/home/CategoryGrid';

export default function HomePage() {
  return (
    <>
      <Hero />
      <BazaarSelector />
      <PersonalizedFeed />
      <DealOfDay />
      <CategoryGrid />
    </>
  );
}
