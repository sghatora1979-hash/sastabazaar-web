'use client';
import { PRODUCTS, Product } from './products';
import { getInteractions } from './interactions';

export function getPersonalizedProducts(limit = 20): Product[] {
  const store = getInteractions();
  const liked = PRODUCTS.filter(p => store.likes.includes(p.id));
  const dislikedIds = new Set(store.dislikes);
  const viewedIds = new Set(Object.keys(store.views));

  const likedCategories = new Map<string, number>();
  liked.forEach(p => likedCategories.set(p.categoryId, (likedCategories.get(p.categoryId) || 0) + 3));

  const viewedProducts = PRODUCTS.filter(p => viewedIds.has(p.id));
  viewedProducts.forEach(p => likedCategories.set(p.categoryId, (likedCategories.get(p.categoryId) || 0) + 1));

  const scored = PRODUCTS
    .filter(p => !dislikedIds.has(p.id))
    .map(p => {
      let score = 0;
      score += (likedCategories.get(p.categoryId) || 0) * 10;
      score += p.dealScore * 0.5;
      score += p.sellerRating * 3;
      score += p.rating * 2;
      if (store.likes.includes(p.id)) score += 500;

      const daysOld = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000);
      score += Math.max(0, 10 - daysOld);

      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.product);

  // If no interactions yet, fall back to top deals
  if (scored.length < limit) {
    const extras = PRODUCTS
      .filter(p => !scored.find(s => s.id === p.id) && !dislikedIds.has(p.id))
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit - scored.length);
    return [...scored, ...extras];
  }

  return scored;
}
