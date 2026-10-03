export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  compareAt?: number;
  rating?: number;
  reviewCount?: number;
  stock: number;
  image: string;
  label?: string;
  description: string;
  createdAt?: string;
  isSellerAdded?: boolean;
};

// Preview catalog inspired by Kigali's grocery, food, and everyday-needs marketplace.
// All stock, prices, and seller names are example listings, not live store data.
export const seedProducts: Product[] = [
  {
    id: "p-01",
    slug: "fresh-market-greens-basket",
    name: "Fresh market greens basket",
    category: "Groceries",
    brand: "Kimironko Market",
    price: 6500,
    compareAt: 8000,
    stock: 12,
    image: "/catalog/market-produce.jpg",
    label: "Market fresh",
    description: "A colourful basket of seasonal greens and vegetables, selected for your everyday meals by a local market seller.",
  },
  {
    id: "p-02",
    slug: "sweet-yellow-bananas-1kg",
    name: "Sweet yellow bananas · 1 kg",
    category: "Groceries",
    brand: "Kimironko Market",
    price: 2500,
    compareAt: 3000,
    stock: 23,
    image: "/catalog/bananas.jpg",
    label: "A Kigali favourite",
    description: "Ripe, naturally sweet bananas for breakfast, lunchboxes, and the snack drawer. Sold by the kilogram.",
  },
  {
    id: "p-03",
    slug: "garden-avocado-tomato-box",
    name: "Avocado & tomato box",
    category: "Groceries",
    brand: "Kimironko Market",
    price: 4200,
    stock: 16,
    image: "/catalog/market-basket.jpg",
    label: "Fresh today",
    description: "A handy mix of ripe avocado, tomatoes, and seasonal produce for salads, toast, and family meals.",
  },
  {
    id: "p-04",
    slug: "coca-cola-original-500ml",
    name: "Coca-Cola Original · 500 ml",
    category: "Beverages & Spirits",
    brand: "City Drinks",
    price: 1500,
    stock: 28,
    image: "/catalog/cola.jpg",
    label: "Chilled favourite",
    description: "An ice-cold 500 ml bottle of Coca-Cola. Add a little refreshment to your next meal.",
  },
  {
    id: "p-05",
    slug: "vegetable-oil-1-litre",
    name: "Everyday vegetable oil · 1 L",
    category: "Groceries",
    brand: "Igihobe Supermarket",
    price: 4800,
    compareAt: 5400,
    stock: 9,
    image: "/catalog/cooking-oil.jpg",
    label: "Good value",
    description: "A kitchen staple for daily cooking, packed in a one-litre bottle from a trusted neighbourhood shop.",
  },
  {
    id: "p-06",
    slug: "crispy-chicken-shawarma-wrap",
    name: "Crispy chicken shawarma wrap",
    category: "Food",
    brand: "Urban Grill",
    price: 4500,
    compareAt: 5500,
    stock: 11,
    image: "/catalog/shawarma.jpg",
    label: "Ready to enjoy",
    description: "A generously filled chicken shawarma served with crisp fries and a side of dip. Prepared fresh by a local kitchen.",
  },
  {
    id: "p-07",
    slug: "double-cheese-burger-fries",
    name: "Double cheese burger & fries",
    category: "Food",
    brand: "Burger Bros",
    price: 7500,
    stock: 8,
    image: "/catalog/burgers.jpg",
    label: "Lunch favourite",
    description: "A double burger with cheese, lettuce, and golden fries. A satisfying pick for lunch or an easy dinner.",
  },
  {
    id: "p-08",
    slug: "grilled-chicken-and-fries",
    name: "Grilled chicken & fries",
    category: "Food",
    brand: "Urban Grill",
    price: 6500,
    stock: 14,
    image: "/catalog/grilled-meal.jpg",
    label: "Kitchen pick",
    description: "A freshly prepared chicken meal with fries and a tasty dip, packed and ready for delivery.",
  },
  {
    id: "p-09",
    slug: "shawarma-share-platter",
    name: "Shawarma share platter",
    category: "Food",
    brand: "Burger Bros",
    price: 9800,
    compareAt: 11500,
    stock: 6,
    image: "/catalog/shawarma-platter.jpg",
    label: "Share the good stuff",
    description: "A shareable platter with warm wraps, crunchy fries, and sauces for the table. Prepared fresh to order.",
  },
  {
    id: "p-10",
    slug: "home-cleaning-essentials-set",
    name: "Home cleaning essentials set",
    category: "Essentials",
    brand: "Tamba Supermarket",
    price: 12500,
    compareAt: 15000,
    stock: 5,
    image: "/catalog/cleaning-products.jpg",
    label: "Home essentials",
    description: "A useful mix of everyday home-care essentials to help keep your kitchen and living space feeling fresh.",
  },
  {
    id: "p-11",
    slug: "market-mix-family-vegetables",
    name: "Family mix of fresh vegetables",
    category: "Groceries",
    brand: "Kimironko Market",
    price: 5800,
    stock: 18,
    image: "/catalog/market-stall.jpg",
    label: "Picked this morning",
    description: "A family-size mix of market vegetables, packed with the day's freshest seasonal picks.",
  },
  {
    id: "p-12",
    slug: "local-market-fruit-and-greens",
    name: "Local market fruit & greens",
    category: "Groceries",
    brand: "Kimironko Market",
    price: 7200,
    compareAt: 8500,
    stock: 7,
    image: "/catalog/market-basket.jpg",
    label: "Save on the basket",
    description: "A convenient produce bundle with fruit and greens for a few easy meals at home.",
  },
  {
    id: "p-13",
    slug: "fresh-coffee-for-slow-mornings",
    name: "Fresh coffee for slow mornings",
    category: "Beverages & Spirits",
    brand: "Kivu Roasters",
    price: 6800,
    stock: 10,
    image: "/catalog/coffee.jpg",
    label: "Locally loved",
    description: "A smooth, warming coffee for slow mornings and a proper pause in the middle of the day.",
  },
  {
    id: "p-14",
    slug: "daily-care-skincare-set",
    name: "Daily care skincare set",
    category: "Beauty & Personal Care",
    brand: "Mira Botanics",
    price: 9500,
    stock: 6,
    image: "/catalog/skincare.jpg",
    label: "Everyday care",
    description: "A simple self-care set with everyday skincare essentials to keep close by the sink or in your travel bag.",
  },
];

export const categories = [
  "Groceries",
  "Beverages & Spirits",
  "Beauty & Personal Care",
  "Food",
  "Essentials",
  "Home & Kitchen",
  "Electronics",
  "Toys & Games",
  "Sports & Outdoors",
  "Clothing",
  "Gifts & Occasions",
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
