import { getCategoryBySlug } from '@/lib/categories';
import { getProductsByCategory } from '@/lib/products';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category not found' };
  return {
    title: `${cat.name} | Sastabazaar`,
    description: `Shop ${cat.name} across Naya, Purana, Clearance and Local bazaars.`
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = getCategoryBySlug(params.slug);
  if (!cat) notFound();

  const products = getProductsByCategory(cat.id, undefined, 40);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-5xl mb-2">{cat.emoji}</div>
        <h1 className="text-3xl font-extrabold text-gray-900">{cat.name}</h1>
        <p className="text-gray-500 mt-1">{cat.nameHi} · {products.length} products</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {cat.subcategories.map(s => (
            <span key={s} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.map((p, i) => (
          <ProductCard3D key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
