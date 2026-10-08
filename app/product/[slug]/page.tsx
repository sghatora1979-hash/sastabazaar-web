import { getProductBySlug, getProductsByCategory, Product } from '@/lib/products';
import { CATEGORIES } from '@/lib/categories';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductCard3D } from '@/components/3d/ProductCard3D';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getProductBySlug(params.slug);
  if (!p) return { title: 'Product not found' };
  return {
    title: `${p.title} | Sastabazaar`,
    description: p.description
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const cat = CATEGORIES.find(c => c.id === product.categoryId);
  const related: Product[] = getProductsByCategory(product.categoryId, undefined, 9)
    .filter(p => p.id !== product.id)
    .slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductDetail product={product} categorySlug={cat?.slug} />

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {related.map((p, i) => (
              <ProductCard3D key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
