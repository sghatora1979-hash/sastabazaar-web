export type Category = {
  id: string;
  slug: string;
  name: string;
  nameHi: string;
  emoji: string;
  subcategories: string[];
};

export const CATEGORIES: Category[] = [
  { id: '1',  slug: 'mobiles',       name: 'Mobiles & Tablets',  nameHi: 'मोबाइल',       emoji: '📱', subcategories: ['Smartphones', 'Feature Phones', 'Tablets', 'Accessories', 'Chargers'] },
  { id: '2',  slug: 'electronics',   name: 'Electronics',        nameHi: 'इलेक्ट्रॉनिक्स', emoji: '💻', subcategories: ['Laptops', 'TVs', 'Cameras', 'Audio', 'Gaming'] },
  { id: '3',  slug: 'fashion-women', name: 'Women\'s Fashion',   nameHi: 'महिला फैशन',    emoji: '👗', subcategories: ['Sarees', 'Kurtis', 'Lehengas', 'Tops', 'Jeans'] },
  { id: '4',  slug: 'fashion-men',   name: 'Men\'s Fashion',     nameHi: 'पुरुष फैशन',    emoji: '👔', subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Kurta', 'Suits'] },
  { id: '5',  slug: 'footwear',      name: 'Footwear',           nameHi: 'जूते',          emoji: '👟', subcategories: ['Sneakers', 'Formal', 'Slippers', 'Sandals', 'Sports'] },
  { id: '6',  slug: 'beauty',        name: 'Beauty & Health',    nameHi: 'सौंदर्य',       emoji: '💄', subcategories: ['Makeup', 'Skincare', 'Hair', 'Fragrance', 'Ayurveda'] },
  { id: '7',  slug: 'home',          name: 'Home & Kitchen',     nameHi: 'घर',            emoji: '🏠', subcategories: ['Cookware', 'Storage', 'Decor', 'Bedding', 'Lighting'] },
  { id: '8',  slug: 'furniture',     name: 'Furniture',          nameHi: 'फर्नीचर',       emoji: '🛋️', subcategories: ['Sofas', 'Beds', 'Tables', 'Chairs', 'Wardrobes'] },
  { id: '9',  slug: 'appliances',    name: 'Appliances',         nameHi: 'उपकरण',         emoji: '🔌', subcategories: ['Fridges', 'Washing Machines', 'ACs', 'Microwaves', 'Fans'] },
  { id: '10', slug: 'books',         name: 'Books',              nameHi: 'किताबें',       emoji: '📚', subcategories: ['Academic', 'Fiction', 'Comics', 'Competitive', 'Kids'] },
  { id: '11', slug: 'toys',          name: 'Toys & Baby',        nameHi: 'खिलौने',        emoji: '🧸', subcategories: ['Toys', 'Diapers', 'Clothing', 'Feeding', 'Strollers'] },
  { id: '12', slug: 'sports',        name: 'Sports & Fitness',   nameHi: 'खेल',          emoji: '⚽', subcategories: ['Cricket', 'Football', 'Gym', 'Yoga', 'Cycling'] },
  { id: '13', slug: 'grocery',       name: 'Grocery',            nameHi: 'किराना',        emoji: '🛒', subcategories: ['Staples', 'Snacks', 'Beverages', 'Spices', 'Organic'] },
  { id: '14', slug: 'jewellery',     name: 'Jewellery',          nameHi: 'गहने',          emoji: '💍', subcategories: ['Gold', 'Silver', 'Imitation', 'Watches', 'Accessories'] },
  { id: '15', slug: 'bags',          name: 'Bags & Luggage',     nameHi: 'बैग',           emoji: '👜', subcategories: ['Backpacks', 'Handbags', 'Trolleys', 'Wallets', 'School Bags'] },
  { id: '16', slug: 'automotive',    name: 'Automotive',         nameHi: 'गाड़ी',          emoji: '🚗', subcategories: ['Car Accessories', 'Bike Parts', 'Helmets', 'Tools', 'Care'] },
  { id: '17', slug: 'office',        name: 'Office Supplies',    nameHi: 'ऑफिस',          emoji: '📎', subcategories: ['Stationery', 'Printers', 'Chairs', 'Storage', 'Paper'] },
  { id: '18', slug: 'musical',       name: 'Musical Instruments',nameHi: 'संगीत',         emoji: '🎸', subcategories: ['Guitars', 'Keyboards', 'Drums', 'Wind', 'Accessories'] },
  { id: '19', slug: 'pet',           name: 'Pet Supplies',       nameHi: 'पालतू',         emoji: '🐾', subcategories: ['Food', 'Toys', 'Grooming', 'Beds', 'Accessories'] },
  { id: '20', slug: 'handicraft',    name: 'Handicraft & Art',   nameHi: 'हस्तशिल्प',     emoji: '🎨', subcategories: ['Paintings', 'Pottery', 'Textiles', 'Wood', 'Metal'] }
];

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find(c => c.slug === slug);
}
