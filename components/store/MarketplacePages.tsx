"use client";

/* Store/catalog previews use local photos and seller-supplied image URLs. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import type { Product } from "@/lib/products";
import { readLocal, writeLocal } from "@/lib/storage";
import ProductCard from "@/components/store/ProductCard";

const FOLLOWED_STORES_KEY = "elymart_followed_stores_v1";

type StorePreview = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  area: string;
  image: string;
  monogram: string;
  tone: string;
  followers: number;
};

const sampleStores: StorePreview[] = [
  {
    id: "kimironko-market",
    name: "Kimironko Market",
    brand: "Kimironko Market",
    category: "Fresh groceries",
    description: "Market produce and everyday picks from local vendors.",
    area: "Kimironko, Kigali",
    image: "/catalog/market-stall.jpg",
    monogram: "K",
    tone: "green",
    followers: 78,
  },
  {
    id: "igihobe-supermarket",
    name: "Igihobe Supermarket",
    brand: "Igihobe Supermarket",
    category: "Groceries & drinks",
    description: "Neighbourhood supermarket essentials for the week.",
    area: "Kigali",
    image: "/catalog/grocery-aisle.jpg",
    monogram: "I",
    tone: "amber",
    followers: 36,
  },
  {
    id: "urban-grill",
    name: "Urban Grill",
    brand: "Urban Grill",
    category: "Restaurant · prepared food",
    description: "Freshly prepared wraps, grilled meals, and share plates.",
    area: "Kigali",
    image: "/catalog/grilled-meal.jpg",
    monogram: "U",
    tone: "coral",
    followers: 54,
  },
  {
    id: "burger-bros",
    name: "Burger Bros Kitchen",
    brand: "Burger Bros",
    category: "Restaurant · prepared food",
    description: "Burgers, fries, and hearty bites from a local kitchen.",
    area: "Kigali",
    image: "/catalog/burgers.jpg",
    monogram: "B",
    tone: "orange",
    followers: 42,
  },
  {
    id: "city-drinks",
    name: "City Drinks",
    brand: "City Drinks",
    category: "Beverages",
    description: "Cold drinks and refreshment for the everyday table.",
    area: "Kigali",
    image: "/catalog/cola.jpg",
    monogram: "C",
    tone: "blue",
    followers: 29,
  },
  {
    id: "tamba-supermarket",
    name: "Tamba Supermarket",
    brand: "Tamba Supermarket",
    category: "Home & essentials",
    description: "Practical household-care essentials and helpful staples.",
    area: "Kigali",
    image: "/catalog/cleaning-products.jpg",
    monogram: "T",
    tone: "lavender",
    followers: 24,
  },
  {
    id: "kivu-roasters",
    name: "Kivu Roasters",
    brand: "Kivu Roasters",
    category: "Coffee & pantry",
    description: "Locally loved coffee for slow mornings and good pauses.",
    area: "Kigali",
    image: "/catalog/coffee.jpg",
    monogram: "K",
    tone: "coffee",
    followers: 61,
  },
  {
    id: "mira-botanics",
    name: "Mira Botanics",
    brand: "Mira Botanics",
    category: "Beauty & personal care",
    description: "Everyday care and simple self-care favourites.",
    area: "Kigali",
    image: "/catalog/skincare.jpg",
    monogram: "M",
    tone: "rose",
    followers: 43,
  },
];

type Notify = (message: string, detail?: string) => void;

type StoreDirectoryProps = {
  onOpenStore: (brand: string) => void;
  notify: Notify;
};

export function StoresDirectory({ onOpenStore, notify }: StoreDirectoryProps) {
  const [search, setSearch] = useState("");
  const [followedStores, setFollowedStores] = useState<string[]>([]);

  useEffect(() => {
    setFollowedStores(readLocal<string[]>(FOLLOWED_STORES_KEY, []));
  }, []);

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sampleStores;
    return sampleStores.filter((store) =>
      `${store.name} ${store.category} ${store.description} ${store.area}`.toLowerCase().includes(term),
    );
  }, [search]);

  function toggleFollow(store: StorePreview) {
    const isFollowing = followedStores.includes(store.id);
    const next = isFollowing
      ? followedStores.filter((id) => id !== store.id)
      : [...followedStores, store.id];
    setFollowedStores(next);
    writeLocal(FOLLOWED_STORES_KEY, next);
    notify(isFollowing ? "Store unfollowed" : "Store followed", store.name);
  }

  return (
    <section className="stores-page container-wide" aria-labelledby="stores-page-heading">
      <div className="stores-page-heading">
        <div>
          <span className="market-page-kicker"><Store size={14} /> LOCAL SHOPS, ALL IN ONE PLACE</span>
          <h1 id="stores-page-heading">Discover stores.</h1>
          <p>Find neighbourhood shops and kitchens across Kigali. Store details and follower counts are sample preview content.</p>
        </div>
        <div className="stores-page-note"><MapPin size={15} /> Starting in Kigali, Rwanda</div>
      </div>

      <form className="store-directory-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="store-search">Search stores</label>
        <input id="store-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stores, kitchens, or categories..." />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear store search">×</button>}
      </form>

      <div className="store-directory-toolbar">
        <span><strong>{filteredStores.length}</strong> preview {filteredStores.length === 1 ? "store" : "stores"}</span>
        <span className="store-preview-caption"><span className="preview-dot" /> Sample store directory</span>
      </div>

      {filteredStores.length > 0 ? (
        <div className="store-directory-grid">
          {filteredStores.map((store) => {
            const isFollowing = followedStores.includes(store.id);
            return (
              <article className="directory-store-card" key={store.id}>
                <div className="directory-store-cover">
                  <img src={store.image} alt={`${store.name} preview`} loading="lazy" />
                  <span className="directory-store-tag">{store.category}</span>
                  <button className={`store-follow-button ${isFollowing ? "is-following" : ""}`} type="button" onClick={() => toggleFollow(store)} aria-pressed={isFollowing}>
                    <Heart size={13} fill={isFollowing ? "currentColor" : "none"} /> {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
                <div className="directory-store-info">
                  <span className={`directory-store-monogram tone-${store.tone}`}>{store.monogram}</span>
                  <div className="directory-store-copy">
                    <h2>{store.name}</h2>
                    <p>{store.description}</p>
                    <span className="directory-store-meta"><MapPin size={11} /> {store.area} <i /> <Heart size={11} /> {store.followers} sample followers</span>
                  </div>
                  <button className="directory-store-open" type="button" onClick={() => onOpenStore(store.brand)} aria-label={`Browse products from ${store.name}`}>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="directory-empty-state"><span><Search size={21} /></span><h2>No stores found.</h2><p>Try another name, category, or neighbourhood.</p><button type="button" onClick={() => setSearch("")}>Clear search</button></div>
      )}
    </section>
  );
}

type Coupon = { amount: string; minimum: string; code: string; tone: string };
const sampleCoupons: Coupon[] = [
  { amount: "RWF 2,000", minimum: "On sample orders over RWF 15,000", code: "ELYKGL2000", tone: "sunrise" },
  { amount: "RWF 3,000", minimum: "On sample orders over RWF 25,000", code: "KIGALI3000", tone: "citrus" },
];

type OffersPageProps = {
  products: Product[];
  wishlist: string[];
  onWishlist: (product: Product) => void;
  onAdd: (product: Product) => void;
  onQuickView: (product: Product) => void;
  notify: Notify;
};

export function OffersPage({ products, wishlist, onWishlist, onAdd, onQuickView, notify }: OffersPageProps) {
  const deals = useMemo(() => products.filter((product) => Boolean(product.compareAt)), [products]);

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      notify("Sample code copied", `${code} · not redeemable in this preview`);
    } catch {
      notify("Sample coupon code", `${code} · copy it manually; offers are preview-only`);
    }
  }

  return (
    <div className="offers-page container-wide">
      <section className="offers-hero" aria-labelledby="offers-page-heading">
        <div className="offers-hero-copy">
          <span className="offers-page-kicker"><Tag size={14} /> ELYMART SAMPLE OFFERS</span>
          <h1 id="offers-page-heading">Save more on<br /><em>everyday good.</em></h1>
          <p>Explore sample offers from Kigali shops and kitchens. These preview codes and prices are illustrative only—not redeemable and not connected to checkout.</p>
          <div className="offers-hero-pills"><span><Sparkles size={13} /> 2 sample codes</span><span><Tag size={13} /> {deals.length} sample deals</span></div>
        </div>
        <div className="offers-hero-art" aria-hidden="true">
          <span className="offers-art-sun" />
          <img className="offers-art-produce" src="/catalog/market-basket.jpg" alt="" />
          <img className="offers-art-meal" src="/catalog/shawarma-platter.jpg" alt="" />
          <span className="offers-art-sticker">GOOD<br />DEAL <b>✦</b></span>
        </div>
      </section>

      <section className="coupon-section" aria-labelledby="coupon-heading">
        <div className="offers-section-heading">
          <div><span className="market-page-kicker"><Copy size={13} /> PREVIEW CODES</span><h2 id="coupon-heading">Coupons &amp; codes.</h2><p>Layout examples only. Codes do not change a preview order total.</p></div>
          <span className="coupon-heading-note">Tap a code to copy it</span>
        </div>
        <div className="coupon-grid">
          {sampleCoupons.map((coupon) => (
            <article className={`coupon-card coupon-${coupon.tone}`} key={coupon.code}>
              <div className="coupon-value"><strong>{coupon.amount}</strong><span>OFF</span></div>
              <div className="coupon-details"><small>SAMPLE COUPON</small><strong>{coupon.minimum}</strong><div className="coupon-code-row"><code>{coupon.code}</code><button type="button" onClick={() => void copyCoupon(coupon.code)} aria-label={`Copy sample coupon ${coupon.code}`}><Copy size={13} /> Copy</button></div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="deal-products-section" aria-labelledby="today-deals-heading">
        <div className="offers-section-heading deals-title-row">
          <div><span className="market-page-kicker"><Sparkles size={13} /> SAMPLE PRICE DROPS</span><h2 id="today-deals-heading">Today&apos;s deals.</h2><p>Preview listings with example markdown prices from Rwandan sellers.</p></div>
          <span className="deal-marketplace-note"><Truck size={14} /> Delivery terms are not live in this preview</span>
        </div>
        {deals.length > 0 ? (
          <div className="offers-product-grid">
            {deals.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} onWishlist={onWishlist} onAdd={onAdd} onQuickView={onQuickView} />)}
          </div>
        ) : (
          <div className="directory-empty-state"><span><Tag size={20} /></span><h2>No sample deals yet.</h2><p>Preview discounts will appear here when a listing has a comparison price.</p><Link href="/" className="offers-empty-link">Browse all products <ArrowRight size={14} /></Link></div>
        )}
      </section>
    </div>
  );
}

export type PreviewOrder = {
  orderId: string;
  name: string;
  address: string;
  district: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: { productId: string; quantity: number; name: string; price: number }[];
  total: number;
};

export function OrdersPage({ orders }: { orders: PreviewOrder[] }) {
  return (
    <section className="orders-page container-wide" aria-labelledby="orders-page-heading">
      <div className="orders-page-heading">
        <span className="market-page-kicker"><ShoppingBag size={14} /> YOUR ELYMART</span>
        <h1 id="orders-page-heading">Your orders.</h1>
        <p>Orders from this preview are stored only in this browser. No payment or delivery is confirmed.</p>
      </div>
      {orders.length === 0 ? (
        <div className="orders-empty-state"><span><ShoppingBag size={23} /></span><h2>Your order history is empty.</h2><p>When you save a preview order, it will appear here on this device.</p><Link href="/" className="offers-empty-link">Explore the marketplace <ArrowRight size={14} /></Link></div>
      ) : (
        <div className="preview-orders-list">
          {orders.map((order) => (
            <article className="preview-order-card" key={order.orderId}>
              <div className="preview-order-top"><span><small>PREVIEW ORDER</small><strong>{order.orderId}</strong></span><span className="preview-order-status"><Check size={12} /> Saved locally · unpaid</span></div>
              <div className="preview-order-details"><span>{new Date(order.createdAt).toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })}</span><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span><strong>RWF {new Intl.NumberFormat("en-RW").format(order.total)}</strong></div>
              <div className="preview-order-items">{order.items.map((item) => <span key={item.productId}>{item.quantity} × {item.name}</span>)}</div>
              <p><MapPin size={13} /> {order.address}, {order.district} · {order.name}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function AppPromotion({ onUpdates }: { onUpdates: () => void }) {
  return (
    <section className="app-promo-section container-wide" aria-labelledby="app-promo-heading">
      <div className="app-promo-copy"><span className="app-promo-kicker"><MapPin size={14} /> MADE FOR RWANDA</span><h2 id="app-promo-heading">Your local marketplace,<br /><em>wherever you are.</em></h2><p>Explore ElyMart on mobile or desktop. We&apos;re shaping a simpler way to discover neighbourhood shops and good things nearby.</p><button className="app-promo-button" onClick={onUpdates}>Get ElyMart updates <ArrowRight size={16} /></button><small>Preview storefront · no app download required</small></div>
      <div className="app-promo-visual" aria-hidden="true"><div className="app-promo-orbit orbit-one" /><div className="app-promo-orbit orbit-two" /><div className="app-phone"><span className="app-phone-camera" /><div className="app-phone-top"><span>ely<span>mart</span></span><ShoppingBag size={15} /></div><div className="app-phone-search"><Search size={12} /><span>What are you looking for?</span></div><div className="app-phone-greeting"><small>GOOD MORNING, KIGALI</small><strong>Find your<br />everyday good.</strong></div><div className="app-phone-categories"><span><Tag size={13} />Groceries</span><span><Store size={13} />Food</span><span><MapPin size={13} />Nearby</span></div><div className="app-phone-product"><img src="/catalog/market-produce.jpg" alt="" /><span><small>FRESH FROM THE MARKET</small><strong>Market greens basket</strong><b>RWF 6,500</b></span></div></div><span className="app-promo-sticker"><Sparkles size={14} /> GOOD THINGS, CLOSE BY</span></div>
    </section>
  );
}
