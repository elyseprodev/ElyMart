"use client";

/* Raw images let preview sellers use external URLs and locally uploaded data URLs. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Boxes,
  Check,
  CupSoda,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Dumbbell,
  Gamepad2,
  Gift,
  Heart,
  House,
  LocateFixed,
  MapPin,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Utensils,
  Star,
  Truck,
  X,
  Zap,
  Plus,
  Minus,
  Trash2,
  Store,
  MessageCircle,
  Instagram,
  Facebook,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { categories, seedProducts, type Product } from "@/lib/products";
import { readLocal, STORAGE_KEYS, type CartItem, writeLocal } from "@/lib/storage";
import ProductCard, { formatPrice } from "@/components/store/ProductCard";
import { AppPromotion, OffersPage, OrdersPage, StoresDirectory } from "@/components/store/MarketplacePages";

type CategoryIcon = typeof Apple;
type ToastData = { id: number; message: string; detail?: string };
type OrderRecord = {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: { productId: string; quantity: number; name: string; price: number }[];
  total: number;
};

const categoryIcons: Record<string, CategoryIcon> = {
  Groceries: Apple,
  "Beverages & Spirits": CupSoda,
  "Beauty & Personal Care": Sparkles,
  Food: Utensils,
  Essentials: Boxes,
  "Home & Kitchen": House,
  Electronics: Zap,
  "Toys & Games": Gamepad2,
  "Sports & Outdoors": Dumbbell,
  Clothing: Shirt,
  Shoes: ShoppingBag,
  "Gifts & Occasions": Gift,
};

const categorySearchTerms: Record<string, string> = {
  Electronics: "electronic tech phone smartphone mobile laptop tablet earbuds headphones",
  Shoes: "shoe footwear sneakers trainers boots sandals loafers",
  Clothing: "clothes apparel fashion outfit shirt jeans dress jacket",
  "Beauty & Personal Care": "beauty skincare skin care makeup haircare hair care shampoo conditioner lotion cleanser serum sunscreen shea butter",
};

const heroImages = {
  produce: "/catalog/market-basket.jpg",
  bananas: "/catalog/bananas.jpg",
  meal: "/catalog/shawarma.jpg",
};

export type StorefrontView = "home" | "stores" | "offers" | "orders";

export default function Storefront({ view = "home" }: { view?: StorefrontView }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All products");
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("Popular");
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [locationMenu, setLocationMenu] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("Kigali, Rwanda");
  const [toast, setToast] = useState<ToastData | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);

  useEffect(() => {
    const savedProducts = readLocal<Product[]>(STORAGE_KEYS.products, []);
    const savedCart = readLocal<CartItem[]>(STORAGE_KEYS.cart, []);
    const savedOrders = readLocal<OrderRecord[]>(STORAGE_KEYS.orders, []);
    const savedWishlist = readLocal<string[]>(STORAGE_KEYS.wishlist, []);
    const savedLocation = readLocal<string>("elymart_location_v1", "Kigali, Rwanda");
    setProducts([...savedProducts.filter((item) => item?.id), ...seedProducts]);
    setCart(savedCart.filter((item) => item?.productId && item.quantity > 0));
    setOrders(savedOrders.filter((order) => order?.orderId && Array.isArray(order.items)));
    setWishlist(savedWishlist);
    setDeliveryLocation(savedLocation);
    setReady(true);
  }, []);

  useEffect(() => {
    function refreshCatalog(event: Event) {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === STORAGE_KEYS.products) {
        const savedProducts = readLocal<Product[]>(STORAGE_KEYS.products, []);
        setProducts([...savedProducts.filter((item) => item?.id), ...seedProducts]);
      } else if (key === STORAGE_KEYS.orders) {
        setOrders(readLocal<OrderRecord[]>(STORAGE_KEYS.orders, []));
      }
    }
    function refreshFromOtherTab(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.products) {
        const savedProducts = readLocal<Product[]>(STORAGE_KEYS.products, []);
        setProducts([...savedProducts.filter((item) => item?.id), ...seedProducts]);
      } else if (event.key === STORAGE_KEYS.orders) {
        setOrders(readLocal<OrderRecord[]>(STORAGE_KEYS.orders, []));
      }
    }
    window.addEventListener("elymart:local-update", refreshCatalog);
    window.addEventListener("storage", refreshFromOtherTab);
    return () => {
      window.removeEventListener("elymart:local-update", refreshCatalog);
      window.removeEventListener("storage", refreshFromOtherTab);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeLocal(STORAGE_KEYS.cart, cart);
  }, [cart, ready]);

  useEffect(() => {
    if (!ready) return;
    writeLocal(STORAGE_KEYS.wishlist, wishlist);
  }, [wishlist, ready]);

  useEffect(() => {
    if (!ready) return;
    writeLocal("elymart_location_v1", deliveryLocation);
  }, [deliveryLocation, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setQuickView(null);
        setShowCart(false);
        setShowWishlist(false);
        setCheckoutOpen(false);
        setAccountMenu(false);
        setLocationMenu(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const cartLines = useMemo(() => cart
    .map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) }))
    .filter((line): line is CartItem & { product: Product } => Boolean(line.product)), [cart, products]);
  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0);
  const cartSubtotal = cartLines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const deliveryFee = cartSubtotal >= 50000 || cartSubtotal === 0 ? 0 : 2500;
  const cartTotal = cartSubtotal + deliveryFee;
  const wishedProducts = products.filter((product) => wishlist.includes(product.id));

  const filteredProducts = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase();
    let result = products.filter((product) => {
      const matchesCategory = activeCategory === "All products" || product.category === activeCategory;
      const searchable = `${product.name} ${product.brand} ${product.category} ${categorySearchTerms[product.category] ?? ""} ${product.description}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesCategory && matchesQuery && (!inStockOnly || product.stock > 0) && (!dealsOnly || Boolean(product.compareAt));
    });

    if (activeTab === "Food") {
      result = result.filter((product) => product.category === "Food" || product.category === "Beverages & Spirits");
    } else if (activeTab === "Essentials") {
      result = result.filter((product) => product.category === "Essentials" || product.category === "Home & Kitchen");
    } else if (activeTab === "New in") {
      result = [...result].sort((a, b) => {
        if (a.isSellerAdded !== b.isSellerAdded) return a.isSellerAdded ? -1 : 1;
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      });
    }

    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [products, appliedQuery, activeCategory, inStockOnly, dealsOnly, activeTab, sortBy]);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    const matchingProducts = products
      .filter((product) => `${product.name} ${product.brand} ${product.category} ${categorySearchTerms[product.category] ?? ""}`.toLowerCase().includes(term))
      .slice(0, 3)
      .map((product) => ({ label: product.name, detail: product.category, product }));
    const matchingCategories = categories
      .filter((category) => products.some((product) => product.category === category) && `${category} ${categorySearchTerms[category] ?? ""}`.toLowerCase().includes(term))
      .slice(0, 2)
      .map((category) => ({ label: category, detail: "Category", product: null as Product | null }));
    return [...matchingProducts, ...matchingCategories].slice(0, 5);
  }, [products, query]);

  const notify = useCallback((message: string, detail?: string) => {
    setToast({ id: Date.now(), message, detail });
  }, []);

  const jumpToProducts = useCallback(() => {
    if (view !== "home") {
      router.push("/#shop-products");
      return;
    }
    document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [router, view]);

  useEffect(() => {
    if (!ready || view !== "home") return;
    const params = new URLSearchParams(window.location.search);
    const seller = params.get("seller");
    const search = params.get("q");
    const category = params.get("category");
    if (seller || search) {
      const value = seller ?? search ?? "";
      setQuery(value);
      setAppliedQuery(value);
      setActiveCategory("All products");
      setActiveTab("Popular");
      window.setTimeout(jumpToProducts, 120);
    } else if (category && categories.includes(category)) {
      setActiveCategory(category);
      setAppliedQuery("");
      setActiveTab("Popular");
      window.setTimeout(jumpToProducts, 120);
    }
  }, [ready, view, jumpToProducts]);

  function scrollToCategories() {
    setMobileMenu(false);
    if (view === "home") {
      document.getElementById("category-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#category-heading");
    }
  }

  function openStore(brand: string) {
    router.push(`/?seller=${encodeURIComponent(brand)}`);
  }

  function applySearch(value = query) {
    setSearchFocused(false);
    setMobileMenu(false);
    setActiveTab("Popular");
    if (view !== "home") {
      router.push(`/?q=${encodeURIComponent(value.trim())}`);
      return;
    }
    setQuery(value);
    setAppliedQuery(value.trim());
    setActiveCategory("All products");
    setDealsOnly(false);
    window.setTimeout(jumpToProducts, 80);
  }

  function chooseCategory(category: string) {
    setMobileMenu(false);
    if (view !== "home") {
      router.push(`/?category=${encodeURIComponent(category)}`);
      return;
    }
    setActiveCategory(category);
    setAppliedQuery("");
    setQuery("");
    setDealsOnly(false);
    setActiveTab("Popular");
    window.setTimeout(jumpToProducts, 80);
  }

  function addToCart(product: Product) {
    if (product.stock < 1) {
      notify("This item is currently out of stock");
      return;
    }
    setCart((current) => {
      const found = current.find((line) => line.productId === product.id);
      if (found) {
        return current.map((line) => line.productId === product.id
          ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) }
          : line);
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
    notify("Added to your bag", product.name);
  }

  function updateQuantity(productId: string, change: number) {
    setCart((current) => current
      .map((line) => {
        if (line.productId !== productId) return line;
        const product = products.find((item) => item.id === productId);
        const max = product?.stock ?? 99;
        return { ...line, quantity: Math.min(Math.max(1, line.quantity + change), max) };
      }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.productId !== productId));
    notify("Item removed from your bag");
  }

  function toggleWishlist(product: Product) {
    const exists = wishlist.includes(product.id);
    setWishlist((current) => exists ? current.filter((id) => id !== product.id) : [...current, product.id]);
    notify(exists ? "Removed from your wishlist" : "Saved to your wishlist", product.name);
  }

  function openCheckout() {
    if (!cartLines.length) return;
    setCheckoutError("");
    setShowCart(false);
    setCheckoutOpen(true);
  }

  function placeDemoOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const district = String(form.get("district") ?? "").trim();
    if (!name || !phone || !address || !district) {
      setCheckoutError("Please complete all delivery details before continuing.");
      return;
    }
    const order: OrderRecord = {
      orderId: `ELY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name,
      phone,
      address,
      district,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "due on delivery" : "awaiting payment confirmation",
      createdAt: new Date().toISOString(),
      items: cartLines.map(({ product, quantity }) => ({ productId: product.id, quantity, name: product.name, price: product.price })),
      total: cartTotal,
    };
    const existingOrders = readLocal<OrderRecord[]>(STORAGE_KEYS.orders, []);
    writeLocal(STORAGE_KEYS.orders, [order, ...existingOrders]);
    setOrders([order, ...existingOrders]);
    setCart([]);
    setCheckoutOpen(false);
    notify("Order saved in preview mode", `${order.orderId} · no payment was taken`);
  }

  function submitNewsletter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterDone(true);
    setNewsletterEmail("");
    notify("Thanks for your interest", "Email updates are not connected in this preview; nothing was saved or sent.");
  }

  return (
    <main className={`storefront-shell${view === "home" && (activeCategory !== "All products" || appliedQuery) ? " catalog-only-mode" : ""}`}>
      <div className="announcement-bar">
        <div className="announcement-inner">
          <span><MapPin size={14} /> Made for Rwanda, starting in Kigali</span>
          <span className="announcement-right">Shop Smarter, Live Better. <span className="announcement-dot">✦</span></span>
        </div>
      </div>

      <header className="site-header">
        <div className="main-header container-wide">
          <button className="mobile-menu-toggle icon-button" onClick={() => setMobileMenu((open) => !open)} aria-label={mobileMenu ? "Close menu" : "Open menu"}>
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button className="brand-mark" onClick={() => { setActiveCategory("All products"); setAppliedQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="ElyMart home">
            <span className="brand-icon"><ShoppingBag size={23} strokeWidth={2.4} /></span>
            <span className="brand-word">ely<span>mart</span><small>SHOP SMARTER, LIVE BETTER</small></span>
          </button>

          <nav className="header-inline-nav" aria-label="Main navigation">
            <Link href="/" className={view === "home" ? "header-inline-link active" : "header-inline-link"}>Home</Link>
            <button type="button" className="header-inline-link" onClick={scrollToCategories}>Categories</button>
            <Link href="/offers" className={view === "offers" ? "header-inline-link active" : "header-inline-link"}>Offers</Link>
            <Link href="/stores" className={view === "stores" ? "header-inline-link active" : "header-inline-link"}>Stores</Link>
            <Link href="/orders" className={view === "orders" ? "header-inline-link active" : "header-inline-link"}>Orders</Link>
          </nav>

          <form className="header-search" onSubmit={(event) => { event.preventDefault(); applySearch(); }} role="search">
            <Search size={19} className="search-icon" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search products & stores…"
              aria-label="Search products and stores"
            />
            {query && <button type="button" className="search-clear" onClick={() => { setQuery(""); setAppliedQuery(""); }} aria-label="Clear search"><X size={15} /></button>}
            <button className="search-submit" type="submit">Search</button>
            <AnimatePresence>
              {searchFocused && suggestions.length > 0 && (
                <motion.div className="search-suggestions" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                  <span className="suggestions-heading">Search suggestions</span>
                  {suggestions.map((suggestion, index) => (
                    <button type="button" key={`${suggestion.label}-${index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => {
                      if (suggestion.product) applySearch(suggestion.label);
                      else chooseCategory(suggestion.label);
                    }}>
                      <span className="suggestion-icon">{suggestion.product ? <Search size={15} /> : <Store size={15} />}</span>
                      <span>{suggestion.label}<small>{suggestion.detail}</small></span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                  <div className="suggestion-footer">Press Enter to search all products</div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="header-actions">
            <div className="header-popover-anchor location-anchor">
              <button className="location-control" onClick={() => { setLocationMenu((open) => !open); setAccountMenu(false); }} aria-expanded={locationMenu}>
                <MapPin size={19} />
                <span><small>Deliver to</small><strong>{deliveryLocation.split(",")[0]}</strong></span>
                <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {locationMenu && <motion.div className="header-popover location-popover" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                  <strong>Choose your delivery area</strong>
                  <p>We&apos;ll show delivery options for your location.</p>
                  {["Kigali, Rwanda", "Musanze, Rwanda", "Huye, Rwanda", "Rubavu, Rwanda"].map((place) => (
                    <button key={place} className={deliveryLocation === place ? "popover-choice selected" : "popover-choice"} onClick={() => { setDeliveryLocation(place); setLocationMenu(false); notify("Delivery location updated", place); }}>
                      <MapPin size={15} />{place}{deliveryLocation === place && <Check size={15} />}
                    </button>
                  ))}
                  <button className="use-location" onClick={() => { setDeliveryLocation("Kigali, Rwanda"); setLocationMenu(false); }}><LocateFixed size={14} /> Use my current area</button>
                </motion.div>}
              </AnimatePresence>
            </div>
            <div className="header-popover-anchor account-anchor">
              <button className="account-control" onClick={() => { setAccountMenu((open) => !open); setLocationMenu(false); }} aria-expanded={accountMenu} aria-label="Sign in or open your account menu">
                <span className="account-avatar">E</span>
                <span className="account-signin-label">Sign in</span>
                <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {accountMenu && <motion.div className="header-popover account-popover" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                  <strong>Your ElyMart</strong>
                  <p>Shopping made a little easier.</p>
                  <button className="popover-choice" onClick={() => { setAccountMenu(false); notify("Account sign-in", "Customer accounts are coming soon to this preview."); }}><Heart size={15} /> My saved items <span>{wishlist.length}</span></button>
                  <Link href="/orders" className="popover-choice" onClick={() => setAccountMenu(false)}><PackageCheck size={15} /> Order history <ArrowRight size={14} /></Link>
                  <Link href="/seller" className="popover-choice seller-popover-link" onClick={() => setAccountMenu(false)}><Store size={15} /> Seller dashboard <ArrowRight size={14} /></Link>
                </motion.div>}
              </AnimatePresence>
            </div>
            <button className="header-action-icon notification-head" onClick={() => notify("No new notifications", "Order and account alerts will appear here in the live service.")} aria-label="Notifications">
              <span className="header-icon-wrap"><Bell size={20} /></span>
              <span className="header-action-label">Notifications</span>
            </button>
            <button className="header-action-icon wishlist-head" onClick={() => setShowWishlist(true)} aria-label={`Open wishlist with ${wishlist.length} items`}>
              <span className="header-icon-wrap"><Heart size={21} />{wishlist.length > 0 && <b className="action-count">{wishlist.length}</b>}</span>
              <span className="header-action-label">Saved</span>
            </button>
            <button className="header-action-icon cart-head" onClick={() => setShowCart(true)} aria-label={`Open bag with ${cartCount} items`}>
              <span className="header-icon-wrap"><ShoppingBag size={21} />{cartCount > 0 && <b className="action-count cart-count">{cartCount}</b>}</span>
              <span className="header-action-label">Bag</span>
            </button>
          </div>
        </div>
        <nav className={`nav-row ${mobileMenu ? "nav-open" : ""}`} aria-label="Main navigation">
          <div className="container-wide nav-inner">
            <Link className={view === "home" ? "nav-link active" : "nav-link"} href="/" onClick={() => setMobileMenu(false)}>Home</Link>
            <button className="nav-category-button" onClick={scrollToCategories}><Menu size={16} /> Categories <ChevronDown size={14} /></button>
            <Link className={view === "offers" ? "nav-link active" : "nav-link"} href="/offers" onClick={() => setMobileMenu(false)}>Offers</Link>
            <Link className={view === "stores" ? "nav-link active" : "nav-link"} href="/stores" onClick={() => setMobileMenu(false)}>Stores</Link>
            <Link className={view === "orders" ? "nav-link active" : "nav-link"} href="/orders" onClick={() => setMobileMenu(false)}>Orders</Link>
            <Link href="/seller" className="nav-seller-link" onClick={() => setMobileMenu(false)}><Store size={15} /> Sell on ElyMart <ArrowUpRight size={13} /></Link>
            <a className="nav-help" href="mailto:hello@elymart.rw"><CircleHelp size={15} /> Need a hand? <strong>We&apos;re here</strong></a>
          </div>
          <div className="mobile-route-links" aria-label="Storefront pages">
            <Link href="/" onClick={() => setMobileMenu(false)} className={view === "home" ? "mobile-route-link active" : "mobile-route-link"}>Home</Link>
            <button type="button" onClick={scrollToCategories} className="mobile-route-link">Categories</button>
            <Link href="/offers" onClick={() => setMobileMenu(false)} className={view === "offers" ? "mobile-route-link active" : "mobile-route-link"}>Offers</Link>
            <Link href="/stores" onClick={() => setMobileMenu(false)} className={view === "stores" ? "mobile-route-link active" : "mobile-route-link"}>Stores</Link>
            <Link href="/orders" onClick={() => setMobileMenu(false)} className={view === "orders" ? "mobile-route-link active" : "mobile-route-link"}>Orders</Link>
          </div>
          <div className="mobile-category-heading">Browse categories</div>
          <div className="mobile-category-list">
            {categories.filter((category) => products.some((product) => product.category === category)).map((category) => <button key={category} onClick={() => chooseCategory(category)}>{category}<ChevronRight size={15} /></button>)}
          </div>
          <Link href="/seller" className="mobile-seller-link" onClick={() => setMobileMenu(false)}><Store size={15} /> Sell on ElyMart <ArrowUpRight size={13} /></Link>
        </nav>
      </header>

      <div className="preview-banner"><span className="preview-dot" /> <span>Store preview</span><span className="preview-divider">·</span> Sample shops, prices &amp; fees · no payments processed.</div>

      {view === "home" && <>
      <section className="hero-section container-wide" aria-label="Welcome to ElyMart">
        <div className="hero-main">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> MADE FOR EVERYDAY LIFE</span>
            <h1>Fresh groceries &amp; everyday essentials,<br /><em>all in one place.</em></h1>
            <p>Explore Kigali&apos;s local markets, favourite kitchens, and neighbourhood stores. Fresh picks and good meals, all in one place.</p>
            <div className="hero-buttons">
              <button className="primary-button hero-shop-button" onClick={jumpToProducts}>Start shopping <ArrowRight size={17} /></button>
              <button className="text-button" onClick={() => document.getElementById("popular-stores")?.scrollIntoView({ behavior: "smooth" })}>Explore stores <ArrowUpRight size={16} /></button>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars"><span>K</span><span>F</span><span>G</span><i>+</i></div>
              <div><strong>A little closer to your neighbourhood</strong><small>A Kigali-inspired marketplace preview.</small></div>
            </div>
          </div>
          <div className="hero-art" aria-label="Featured everyday products">
            <div className="hero-art-orbit orbit-one" />
            <div className="hero-art-orbit orbit-two" />
            <div className="hero-sticker"><span>GOOD<br />FINDS</span><b>✦</b></div>
            <div className="hero-feature-card">
              <div className="hero-feature-image"><img src={heroImages.produce} alt="Fresh market produce in a woven basket" /></div>
              <div className="hero-feature-label"><span><small>FROM KIGALI MARKETS</small><strong>Fresh picks.<br />Close by.</strong></span><button onClick={jumpToProducts} aria-label="Shop fresh market produce"><ArrowUpRight size={18} /></button></div>
            </div>
            <div className="hero-float-card headphones-float"><img src={heroImages.bananas} alt="Fresh bananas from a Kigali market" /><span><small>Market day favourite</small><strong>From RWF 2,500</strong></span><ArrowUpRight size={15} /></div>
            <div className="hero-float-card watch-float"><img src={heroImages.meal} alt="A freshly prepared local meal" /><span><small>Good food, close by</small><strong>Discover local meals</strong></span></div>
            <div className="hero-promo-bubble"><small>A little treat</small><strong>Good finds<br />start here.</strong><Sparkles size={17} /></div>
          </div>
          <div className="hero-bottom-note"><span><ShieldCheck size={16} /> Shop local, all in one place</span><span className="hero-bottom-stars"><MapPin size={13} /> Made for Rwanda</span></div>
        </div>
        <div className="hero-side-promos">
          <button className="side-promo sale-promo" onClick={() => { setDealsOnly(true); setSortBy("price-low"); setActiveCategory("All products"); setAppliedQuery(""); setQuery(""); jumpToProducts(); }}>
            <span className="promo-mini-kicker">A LITTLE SOMETHING EXTRA</span>
            <span className="sale-promo-title">Good things<br />for less.</span>
            <span className="sale-promo-pill">Find a lovely deal <ArrowRight size={14} /></span>
            <span className="sale-shape"><span>✦</span><b>nice<br />find!</b></span>
            <span className="promo-arrow"><ArrowUpRight size={18} /></span>
          </button>
          <button className="side-promo tech-promo" onClick={() => chooseCategory("Food")}>
            <span className="promo-mini-kicker">TONIGHT&apos;S DINNER, SORTED</span>
            <span className="tech-promo-title">Good food.<br /><em>Close by.</em></span>
            <span className="tech-promo-bottom"><span>Fresh from local kitchens</span><ArrowRight size={16} /></span>
            <img src={heroImages.meal} alt="A meal from a local Kigali kitchen" />
            <span className="tech-decor-dot" />
          </button>
        </div>
      </section>

      <section className="service-strip container-wide" aria-label="Shopping benefits">
        <div className="service-item"><span className="service-icon"><Truck size={19} /></span><span><strong>Delivery options by area</strong><small>Details vary by seller</small></span></div>
        <div className="service-item"><span className="service-icon"><BadgeCheck size={19} /></span><span><strong>Rwanda-focused marketplace</strong><small>Local shops and makers in one place</small></span></div>
        <div className="service-item"><span className="service-icon"><ShieldCheck size={19} /></span><span><strong>Shop with clear details</strong><small>Products, prices, and stock at a glance</small></span></div>
        <div className="service-item"><span className="service-icon"><CreditCard size={19} /></span><span><strong>Simple preview checkout</strong><small>No payments are processed</small></span></div>
      </section>

      <section className="category-section container-wide" aria-labelledby="category-heading">
        <div className="section-heading-row category-heading-row">
          <div><span className="section-kicker">BROWSE THE MARKETPLACE</span><h2 id="category-heading">Shop by category.</h2><p>Shop fresh food, electronics, shoes, clothing, and everyday essentials from Rwanda&apos;s sellers.</p></div>
          <button className="inline-link" onClick={() => chooseCategory("All products")}>Explore all <ArrowRight size={16} /></button>
        </div>
        <div className="category-grid">
          {categories.filter((category) => products.some((product) => product.category === category)).map((category, index) => {
            const Icon = categoryIcons[category] ?? Sparkles;
            return <button className={`category-tile category-tone-${index % 5}`} key={category} onClick={() => chooseCategory(category)} aria-pressed={activeCategory === category}>
              <span className="category-art"><Icon size={24} strokeWidth={1.7} /></span>
              <span>{category}</span><ArrowUpRight className="category-arrow" size={13} />
            </button>;
          })}
          <button className="category-tile category-more" onClick={() => chooseCategory("All products")}>
            <span className="category-art"><Plus size={23} strokeWidth={1.8} /></span><span>More to explore</span><ArrowUpRight className="category-arrow" size={13} />
          </button>
        </div>
      </section>

      <section className="stores-section container-wide" id="popular-stores" aria-labelledby="stores-heading">
        <div className="section-heading-row stores-heading-row">
          <div><span className="section-kicker">GOOD SHOPS, CLOSE BY</span><h2 id="stores-heading">Popular stores around Kigali.</h2><p>Meet the neighbourhood favourites on ElyMart.</p></div>
          <button className="inline-link" onClick={() => chooseCategory("Groceries")}>Shop groceries <ArrowRight size={16} /></button>
        </div>
        <div className="store-card-grid">
          <button className="market-store-card" onClick={() => applySearch("Kimironko Market")}><span className="market-store-image"><img src="/catalog/market-stall.jpg" alt="Fresh produce at a Kigali market" /><i>GROCERIES</i></span><span className="market-store-info"><span className="market-store-logo kimironko-logo">K</span><span><strong>Kimironko Market</strong><small>Fresh picks from local vendors</small></span><ArrowUpRight size={16} /></span></button>
          <button className="market-store-card" onClick={() => applySearch("Igihobe Supermarket")}><span className="market-store-image"><img src="/catalog/grocery-aisle.jpg" alt="A neighbourhood supermarket aisle" /><i>EVERYDAY ESSENTIALS</i></span><span className="market-store-info"><span className="market-store-logo igihobe-logo">I</span><span><strong>Igihobe Supermarket</strong><small>Daily essentials, all in one stop</small></span><ArrowUpRight size={16} /></span></button>
          <button className="market-store-card" onClick={() => applySearch("Burger Bros")}><span className="market-store-image"><img src="/catalog/burgers.jpg" alt="A freshly prepared burger and fries" /><i>LOCAL KITCHEN</i></span><span className="market-store-info"><span className="market-store-logo burger-logo"><Utensils size={15} /></span><span><strong>Burger Bros Kitchen</strong><small>Good bites made fresh to order</small></span><ArrowUpRight size={16} /></span></button>
        </div>
      </section>

      <section className="product-section container-wide" id="shop-products" aria-labelledby="products-heading">
        <div className="product-section-top">
          <div className="section-heading-row products-heading-row">
            <div><span className="section-kicker">{activeCategory !== "All products" ? `SHOP ${activeCategory.toUpperCase()}` : appliedQuery ? "SEARCH THE MARKETPLACE" : "FROM MARKET STALLS TO LOCAL KITCHENS"}</span><h2 id="products-heading">{activeCategory !== "All products" ? activeCategory : appliedQuery ? "Search results" : "Popular right now."}</h2><p>{appliedQuery ? `Showing results for “${appliedQuery}”` : activeCategory !== "All products" ? `A fresh look at ${activeCategory.toLowerCase()}.` : dealsOnly ? "A few lovely price drops, just for you." : activeTab === "Food" ? "A few good bites from kitchens around Kigali." : activeTab === "Essentials" ? "Helpful little things for your home and everyday." : "Browse fresh market picks, electronics, shoes, clothing, and more."}</p></div>
            <div className="desktop-stock-toggle"><label><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /><span className="toggle-track" /> In stock</label></div>
          </div>
          <div className="product-tools-row">
            {activeCategory === "All products" && !appliedQuery && <div className="product-tabs" role="tablist" aria-label="Product collections">
              {["Popular", "Food", "Essentials", "New in"].map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "product-tab active" : "product-tab"} onClick={() => setActiveTab(tab)}>{tab === "Food" ? "Food & drink" : tab === "Essentials" ? "Everyday essentials" : tab}{tab === "New in" && <span className="tab-new-dot" />}</button>)}
            </div>}
            <div className="product-filter-tools">
              <span className="result-count">{filteredProducts.length} lovely {filteredProducts.length === 1 ? "find" : "finds"}</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products">
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
              </select>
              {activeCategory !== "All products" || appliedQuery || dealsOnly ? <button className="clear-filters" onClick={() => { setActiveCategory("All products"); setAppliedQuery(""); setQuery(""); setDealsOnly(false); }}>Clear filters <X size={13} /></button> : null}
            </div>
          </div>
          {(activeCategory !== "All products" || appliedQuery || dealsOnly) && <div className="active-filter-chips">
            {activeCategory !== "All products" && <button onClick={() => setActiveCategory("All products")}>{activeCategory}<X size={13} /></button>}
            {appliedQuery && <button onClick={() => { setAppliedQuery(""); setQuery(""); }}>{appliedQuery}<X size={13} /></button>}
            {dealsOnly && <button onClick={() => setDealsOnly(false)}>Price drops<X size={13} /></button>}
          </div>}
        </div>

        {filteredProducts.length > 0 ? <motion.div className="product-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => <motion.div key={product.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .22 }}>
              <ProductCard product={product} wished={wishlist.includes(product.id)} onWishlist={toggleWishlist} onAdd={addToCart} onQuickView={setQuickView} />
            </motion.div>)}
          </AnimatePresence>
        </motion.div> : <div className="empty-state"><span className="empty-state-icon"><Search size={22} /></span><h3>No finds just yet.</h3><p>Try another search or give a different category a look.</p><button className="primary-button" onClick={() => { setAppliedQuery(""); setQuery(""); setActiveCategory("All products"); }}>See all products <ArrowRight size={15} /></button></div>}
        <div className="catalog-footnote"><span><Sparkles size={13} /> Local shops, one little marketplace</span><span>Sample items and availability shown for preview.</span></div>
      </section>

      <section className="food-picks-section container-wide" aria-labelledby="food-picks-heading">
        <div className="section-heading-row food-picks-heading-row">
          <div><span className="section-kicker">GOOD BITES, MADE NEARBY</span><h2 id="food-picks-heading">Dinner, sorted.</h2><p>Explore sample dishes from Kigali kitchens on ElyMart.</p></div>
          <button className="inline-link" onClick={() => chooseCategory("Food")}>Explore local food <ArrowRight size={16} /></button>
        </div>
        <div className="product-grid food-picks-grid">
          {products.filter((product) => product.category === "Food").slice(0, 4).map((product) => <ProductCard key={`food-${product.id}`} product={product} wished={wishlist.includes(product.id)} onWishlist={toggleWishlist} onAdd={addToCart} onQuickView={setQuickView} />)}
        </div>
      </section>

      <section className="seller-invite container-wide">
        <div className="seller-invite-icon"><Store size={24} /></div>
        <div className="seller-invite-copy"><span>HAVE GOOD THINGS TO SHARE?</span><h2>Your shop belongs here.</h2><p>Bring your products to a marketplace built around local businesses and thoughtful finds.</p></div>
        <Link href="/seller" className="seller-invite-button">Start selling <ArrowRight size={16} /></Link>
        <div className="seller-invite-decor decor-a" /><div className="seller-invite-decor decor-b" />
      </section>

      <section className="how-it-works-section container-wide" aria-labelledby="how-heading">
        <div className="how-section-heading"><span className="section-kicker">SIMPLE BY DESIGN</span><h2 id="how-heading">A marketplace that feels close to home.</h2><p>Discover local sellers and try the ElyMart shopping preview.</p></div>
        <div className="how-steps-grid">
          <article className="how-step-card"><span className="how-step-number">01</span><span className="how-step-icon"><Search size={21} /></span><h3>Find your favourites</h3><p>Browse groceries, good food, and everyday essentials in one place.</p></article>
          <article className="how-step-card"><span className="how-step-number">02</span><span className="how-step-icon"><ShoppingBag size={21} /></span><h3>Fill up your bag</h3><p>Check sample prices, product details, and availability as you shop.</p></article>
          <article className="how-step-card"><span className="how-step-number">03</span><span className="how-step-icon"><ShieldCheck size={21} /></span><h3>Try the checkout</h3><p>Preview an order on this device. This demo does not process payment.</p></article>
        </div>
      </section>

      </>}
      {view === "stores" && <StoresDirectory onOpenStore={openStore} notify={notify} />}
      {view === "offers" && <OffersPage products={products} wishlist={wishlist} onWishlist={toggleWishlist} onAdd={addToCart} onQuickView={setQuickView} notify={notify} />}
      {view === "orders" && <OrdersPage orders={orders} />}
      <AppPromotion onUpdates={() => document.getElementById("elymart-updates")?.scrollIntoView({ behavior: "smooth", block: "center" })} />

      <section className="newsletter-section container-wide" id="elymart-updates">
        <div className="newsletter-leaf leaf-one">✳</div><div className="newsletter-leaf leaf-two">✦</div>
        <div className="newsletter-icon"><MessageCircle size={22} /></div>
        <div className="newsletter-copy"><span>A NOTE FROM ELYMART</span><h2>A little good in your inbox.</h2><p>Fresh finds, local stories, and the occasional lovely offer. Nothing noisy.</p></div>
        <form className="newsletter-form" onSubmit={submitNewsletter}>
          <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
          <input id="newsletter-email" type="email" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Your email address" required disabled={newsletterDone} />
          <button type="submit" disabled={newsletterDone}>{newsletterDone ? <><Check size={16} /> Thank you</> : <>Count me in <ArrowRight size={15} /></>}</button>
          <small>Preview only · email updates are not currently saved or sent.</small>
        </form>
      </section>

      <footer className="site-footer">
        <div className="footer-main container-wide">
          <div className="footer-brand-column">
            <button className="brand-mark footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="ElyMart, back to top"><span className="brand-icon"><ShoppingBag size={23} strokeWidth={2.4} /></span><span className="brand-word">ely<span>mart</span><small>SHOP SMARTER, LIVE BETTER</small></span></button>
            <p>Everyday good things, from sellers and makers who care. A marketplace with a little more heart.</p>
            <div className="social-links"><a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={17} /></a><a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noreferrer"><Facebook size={17} /></a><a href="mailto:hello@elymart.rw" aria-label="Email ElyMart"><MessageCircle size={17} /></a></div>
          </div>
          <div className="footer-link-group"><h3>Discover</h3><button onClick={() => { setActiveCategory("All products"); setActiveTab("Popular"); jumpToProducts(); }}>Shop all</button><button onClick={() => chooseCategory("Groceries")}>Groceries & produce</button><button onClick={() => chooseCategory("Food")}>Prepared food</button><button onClick={() => chooseCategory("Essentials")}>Everyday essentials</button><button onClick={() => { setActiveTab("Popular"); jumpToProducts(); }}>Popular right now</button></div>
          <div className="footer-link-group"><h3>Here to help</h3><button onClick={() => notify("Help & support", "Our support team is here for your questions.")}>Help centre</button><button onClick={() => notify("Delivery information", "Delivery options depend on your location and seller.")}>Delivery information</button><button onClick={() => notify("Returns & exchanges", "Return options are shown with each eligible listing.")}>Returns & exchanges</button><button onClick={() => notify("Contact us", "Reach us at hello@elymart.rw.")}>Contact us</button><button onClick={() => notify("Track your order", "Order tracking will be available once a delivery partner is connected.")}>Track an order</button></div>
          <div className="footer-link-group footer-sell-group"><h3>Make it yours</h3><Link href="/seller"><Store size={15} /> Sell on ElyMart</Link><button onClick={() => { setShowWishlist(true); }}>Your wishlist</button><button onClick={() => notify("Our story", "A local marketplace with room for good things.")}>Our story</button><div className="footer-location"><MapPin size={15} /> Proudly made for Rwanda</div></div>
        </div>
        <div className="footer-bottom container-wide"><span>© {new Date().getFullYear()} ElyMart. Shop smarter, live better.</span><div><button onClick={() => notify("Privacy", "Privacy details will be published with the live service.")}>Privacy</button><button onClick={() => notify("Terms", "Terms will be published with the live service.")}>Terms</button><span className="footer-currency">RWF&nbsp; · &nbsp;Rwanda</span></div><span className="footer-demo-label">Preview storefront</span></div>
      </footer>

      <AnimatePresence>
        {showCart && <motion.div className="modal-backdrop drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCart(false); }}>
          <motion.aside className="side-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: "spring", damping: 27, stiffness: 270 }}>
            <div className="drawer-header"><div><span className="drawer-kicker">A LITTLE BAG OF GOOD THINGS</span><h2 id="cart-title">Your bag <span>({cartCount})</span></h2></div><button className="modal-close" onClick={() => setShowCart(false)} aria-label="Close bag"><X size={20} /></button></div>
            {cartLines.length === 0 ? <div className="drawer-empty"><span className="drawer-empty-icon"><ShoppingBag size={24} /></span><h3>Your bag is taking a breather.</h3><p>Looks like it&apos;s waiting for something lovely.</p><button className="primary-button" onClick={() => { setShowCart(false); jumpToProducts(); }}>Find something good <ArrowRight size={15} /></button></div> : <>
              <div className="shipping-progress"><span><Truck size={16} /> {cartSubtotal >= 50000 ? "Preview free-delivery threshold reached" : `Add ${formatPrice(50000 - cartSubtotal)} to meet the sample free-delivery threshold`}</span><div><i style={{ width: `${Math.min(100, (cartSubtotal / 50000) * 100)}%` }} /></div></div>
              <div className="cart-list">{cartLines.map(({ product, quantity }) => <div className="cart-line" key={product.id}>
                <button className="cart-line-image" onClick={() => { setShowCart(false); setQuickView(product); }}><img src={product.image} alt={product.name} /></button>
                <div className="cart-line-info"><span className="cart-line-brand">{product.brand}</span><strong>{product.name}</strong><span className="cart-line-price">{formatPrice(product.price)}</span><div className="quantity-control"><button onClick={() => updateQuantity(product.id, -1)} aria-label={`Decrease ${product.name} quantity`}><Minus size={13} /></button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, 1)} aria-label={`Increase ${product.name} quantity`} disabled={quantity >= product.stock}><Plus size={13} /></button></div></div>
                <div className="cart-line-end"><strong>{formatPrice(product.price * quantity)}</strong><button onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={15} /></button></div>
              </div>)}</div>
              <div className="drawer-summary"><div><span>Subtotal</span><strong>{formatPrice(cartSubtotal)}</strong></div><div><span>Sample delivery fee</span><strong>{deliveryFee === 0 ? <em>Free</em> : formatPrice(deliveryFee)}</strong></div><div className="drawer-total"><span>Preview total</span><strong>{formatPrice(cartTotal)}</strong></div><p>Sample fees only. Delivery availability and final charges are not connected in this preview.</p><button className="checkout-button" onClick={openCheckout}>Continue to checkout <ArrowRight size={17} /></button><span className="preview-payment-note"><ShieldCheck size={13} /> Preview only · no payment will be taken</span></div>
            </>}
          </motion.aside>
        </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showWishlist && <motion.div className="modal-backdrop drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowWishlist(false); }}>
          <motion.aside className="side-drawer wishlist-drawer" role="dialog" aria-modal="true" aria-labelledby="wishlist-title" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: "spring", damping: 27, stiffness: 270 }}>
            <div className="drawer-header"><div><span className="drawer-kicker">SAVED FOR A GOOD DAY</span><h2 id="wishlist-title">Your wishlist <span>({wishedProducts.length})</span></h2></div><button className="modal-close" onClick={() => setShowWishlist(false)} aria-label="Close wishlist"><X size={20} /></button></div>
            {wishedProducts.length === 0 ? <div className="drawer-empty"><span className="drawer-empty-icon"><Heart size={24} /></span><h3>Save the good ones.</h3><p>Tap the heart on something you like and it&apos;ll be here when you&apos;re ready.</p><button className="primary-button" onClick={() => { setShowWishlist(false); jumpToProducts(); }}>Have a look around <ArrowRight size={15} /></button></div> : <div className="wishlist-list">{wishedProducts.map((product) => <div className="wishlist-line" key={product.id}><button className="cart-line-image" onClick={() => { setShowWishlist(false); setQuickView(product); }}><img src={product.image} alt={product.name} /></button><div><span className="cart-line-brand">{product.brand}</span><strong>{product.name}</strong><b>{formatPrice(product.price)}</b><button className="wishlist-add-button" onClick={() => { addToCart(product); setShowWishlist(false); }}>Move to bag <ArrowRight size={13} /></button></div><button className="wishlist-remove" onClick={() => toggleWishlist(product)} aria-label={`Remove ${product.name} from wishlist`}><X size={16} /></button></div>)}</div>}
          </motion.aside>
        </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {quickView && <motion.div className="modal-backdrop quickview-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickView(null); }}>
          <motion.div className="quickview-modal" role="dialog" aria-modal="true" aria-labelledby="quickview-title" initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 10 }} transition={{ duration: .2 }}>
            <button className="modal-close quickview-close" onClick={() => setQuickView(null)} aria-label="Close product details"><X size={20} /></button>
            <div className="quickview-image"><img src={quickView.image} alt={quickView.name} />{quickView.label && <span>{quickView.label}</span>}</div>
            <div className="quickview-content"><span className="section-kicker">{quickView.brand} &nbsp;·&nbsp; {quickView.category}</span><h2 id="quickview-title">{quickView.name}</h2>{typeof quickView.rating === "number" && <div className="quickview-rating"><Star size={14} fill="currentColor" strokeWidth={0} /><strong>{quickView.rating.toFixed(1)}</strong><span>({quickView.reviewCount} preview reviews)</span></div>}<p>{quickView.description}</p><div className="quickview-stock"><span className={quickView.stock > 0 ? "stock-good" : "stock-out"}>{quickView.stock > 0 ? <><Check size={13} /> In stock · {quickView.stock} available</> : "Currently unavailable"}</span><span>Delivery to {deliveryLocation.split(",")[0]}</span></div><div className="quickview-price"><strong>{formatPrice(quickView.price)}</strong>{quickView.compareAt && <del>{formatPrice(quickView.compareAt)}</del>}</div><div className="quickview-actions"><button className="primary-button" onClick={() => { addToCart(quickView); setQuickView(null); }} disabled={quickView.stock <= 0}><ShoppingBag size={17} /> Add to bag</button><button className={`quickview-wishlist ${wishlist.includes(quickView.id) ? "is-wished" : ""}`} onClick={() => toggleWishlist(quickView)}><Heart size={18} fill={wishlist.includes(quickView.id) ? "currentColor" : "none"} /> {wishlist.includes(quickView.id) ? "Saved" : "Save"}</button></div><span className="quickview-disclaimer"><ShieldCheck size={13} /> Sample preview listing from ElyMart</span></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {checkoutOpen && <motion.div className="modal-backdrop checkout-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}>
          <motion.div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" initial={{ opacity: 0, y: 16, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}>
            <div className="checkout-modal-header"><div><span className="drawer-kicker">JUST A FEW MORE DETAILS</span><h2 id="checkout-title">Make it yours.</h2><p>This preview records an order on this device only. No payment is processed.</p></div><button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X size={20} /></button></div>
            <form className="checkout-form" onSubmit={placeDemoOrder}>
              <div className="checkout-fields"><label>Full name<input name="name" autoComplete="name" placeholder="e.g. Aline Mukamana" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+250 7XX XXX XXX" required /></label><label className="checkout-full">Delivery address<input name="address" autoComplete="street-address" placeholder="Street, building, or nearby landmark" required /></label><label>District<select name="district" defaultValue="" required><option value="" disabled>Select district</option><option>Kigali</option><option>Musanze</option><option>Huye</option><option>Rubavu</option><option>Other</option></select></label><label>Delivery area<select defaultValue={deliveryLocation.split(",")[0]}><option>Kigali</option><option>Musanze</option><option>Huye</option><option>Rubavu</option></select></label></div>
              <div className="payment-options"><strong>How would you like to pay?</strong><label className={paymentMethod === "momo" ? "payment-option selected" : "payment-option"}><input type="radio" name="payment" value="momo" checked={paymentMethod === "momo"} onChange={() => setPaymentMethod("momo")} /><span className="payment-option-icon momo-icon">M</span><span><b>Mobile Money</b><small>MTN MoMo or Airtel Money · preview</small></span><span className="radio-indicator" /></label><label className={paymentMethod === "cod" ? "payment-option selected" : "payment-option"}><input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /><span className="payment-option-icon"><CreditCard size={17} /></span><span><b>Pay on delivery</b><small>Payment due when your order arrives</small></span><span className="radio-indicator" /></label></div>
              <div className="checkout-total-row"><span>Order total</span><strong>{formatPrice(cartTotal)}</strong></div>
              {checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}
              <button className="checkout-button" type="submit">Save preview order <ArrowRight size={17} /></button>
              <span className="checkout-safety"><ShieldCheck size={13} /> No card or payment details are collected in this preview.</span>
            </form>
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <motion.div className="toast-message" role="status" initial={{ opacity: 0, y: 16, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .98 }} key={toast.id}><span className="toast-check"><Check size={15} /></span><span><strong>{toast.message}</strong>{toast.detail && <small>{toast.detail}</small>}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={14} /></button></motion.div>}
      </AnimatePresence>

      <div className="mobile-bottom-bar"><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><House size={19} /><span>Home</span></button><button onClick={() => jumpToProducts()}><Search size={19} /><span>Discover</span></button><button onClick={() => setShowWishlist(true)}><Heart size={19} /><span>Saved</span>{wishlist.length > 0 && <i>{wishlist.length}</i>}</button><button onClick={() => setShowCart(true)}><ShoppingBag size={19} /><span>Bag</span>{cartCount > 0 && <i>{cartCount}</i>}</button></div>
    </main>
  );
}
