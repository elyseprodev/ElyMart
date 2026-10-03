"use client";

/* Seller image sources may be data URLs or user-entered image hosts in this local preview. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Eye,
  FileImage,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  PackageCheck,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Upload,
  X,
  Pencil,
  CircleDollarSign,
  ClipboardList,
  Boxes,
  Sparkles,
} from "lucide-react";
import type { Product } from "@/lib/products";
import { categories, slugify } from "@/lib/products";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/storage";
import { formatPrice } from "@/components/store/ProductCard";

type SellerView = "Overview" | "Products" | "Orders" | "Store settings";
type SellerOrder = {
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
type SellerProfile = { storeName: string; contactName: string; email: string; phone: string; bio: string };
type ProductDraft = { name: string; category: string; brand: string; price: string; compareAt: string; stock: string; image: string; description: string };

const emptyDraft: ProductDraft = { name: "", category: "Phones & Tablets", brand: "", price: "", compareAt: "", stock: "", image: "", description: "" };
const defaultProfile: SellerProfile = { storeName: "My ElyMart store", contactName: "", email: "", phone: "", bio: "" };

export default function SellerDashboard() {
  const [view, setView] = useState<SellerView>("Overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [profile, setProfile] = useState<SellerProfile>(defaultProfile);
  const [formProduct, setFormProduct] = useState<Product | null | false>(false);
  const [toast, setToast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setProducts(readLocal<Product[]>(STORAGE_KEYS.products, []));
    setOrders(readLocal<SellerOrder[]>(STORAGE_KEYS.orders, []));
    setProfile(readLocal<SellerProfile>("elymart_seller_profile_v1", defaultProfile));
    function syncLocalData(event: Event) {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === STORAGE_KEYS.products) setProducts(readLocal<Product[]>(STORAGE_KEYS.products, []));
      if (key === STORAGE_KEYS.orders) setOrders(readLocal<SellerOrder[]>(STORAGE_KEYS.orders, []));
      if (key === "elymart_seller_profile_v1") setProfile(readLocal<SellerProfile>(key, defaultProfile));
    }
    function syncOtherTab(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.products) setProducts(readLocal<Product[]>(STORAGE_KEYS.products, []));
      if (event.key === STORAGE_KEYS.orders) setOrders(readLocal<SellerOrder[]>(STORAGE_KEYS.orders, []));
      if (event.key === "elymart_seller_profile_v1") setProfile(readLocal<SellerProfile>(event.key, defaultProfile));
    }
    window.addEventListener("elymart:local-update", syncLocalData);
    window.addEventListener("storage", syncOtherTab);
    return () => {
      window.removeEventListener("elymart:local-update", syncLocalData);
      window.removeEventListener("storage", syncOtherTab);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleProducts = useMemo(() => products.filter((product) =>
    `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(searchTerm.trim().toLowerCase())
  ), [products, searchTerm]);
  const inStock = products.filter((product) => product.stock > 0).length;
  const totalUnits = products.reduce((sum, product) => sum + Math.max(0, product.stock), 0);
  const matchingOrders = orders.filter((order) => order.items.some((item) => products.some((product) => product.id === item.productId)));
  const receivedUnits = matchingOrders.reduce((sum, order) => sum + order.items.reduce((items, item) => items + (products.some((product) => product.id === item.productId) ? item.quantity : 0), 0), 0);

  function persistProducts(next: Product[]) {
    setProducts(next);
    writeLocal(STORAGE_KEYS.products, next);
  }

  function saveProduct(product: Product, isEdit: boolean) {
    const next = isEdit ? products.map((existing) => existing.id === product.id ? product : existing) : [product, ...products];
    persistProducts(next);
    setFormProduct(null);
    setView("Products");
    setToast(isEdit ? "Product listing updated" : "Your product is live in the preview shop");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    persistProducts(products.filter((product) => product.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast("Product removed from your listings");
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeLocal("elymart_seller_profile_v1", profile);
    setProfileSaved(true);
    setToast("Store details saved on this device");
    window.setTimeout(() => setProfileSaved(false), 2200);
  }

  function setCurrentView(next: SellerView) {
    setView(next);
    setMobileSidebarOpen(false);
  }

  const navItems: { label: SellerView; icon: typeof LayoutDashboard; note?: string }[] = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Products", icon: Package },
    { label: "Orders", icon: ClipboardList, note: matchingOrders.length ? String(matchingOrders.length) : undefined },
    { label: "Store settings", icon: Settings2 },
  ];

  return (
    <main className="seller-app">
      <aside className={`seller-sidebar ${mobileSidebarOpen ? "seller-sidebar-open" : ""}`}>
        <Link href="/" onClick={(event) => { event.preventDefault(); window.location.assign("/"); }} className="seller-brand"><span className="seller-brand-icon"><ShoppingBag size={22} /></span><span>ely<span>mart</span><small>SELLER STUDIO</small></span></Link>
        <div className="seller-workspace"><span className="seller-workspace-icon"><Store size={17} /></span><span><small>YOUR WORKSPACE</small><strong>{profile.storeName || "My ElyMart store"}</strong></span><ChevronDown size={14} /></div>
        <nav className="seller-nav" aria-label="Seller dashboard">
          <span className="seller-nav-label">WORKSPACE</span>
          {navItems.map(({ label, icon: Icon, note }) => <button key={label} className={view === label ? "seller-nav-item selected" : "seller-nav-item"} onClick={() => setCurrentView(label)}><Icon size={18} /><span>{label}</span>{note && <i>{note}</i>}</button>)}
        </nav>
        <div className="seller-sidebar-card"><span><SparkleIcon /></span><strong>Good things belong here.</strong><p>Keep your listings clear, current, and ready to meet their next owner.</p><button onClick={() => setFormProduct(null)}>Add a product <Plus size={14} /></button></div>
        <div className="seller-sidebar-bottom"><Link href="/" onClick={(event) => { event.preventDefault(); window.location.assign("/"); }}><ArrowLeft size={16} /> Back to ElyMart</Link><button onClick={() => setToast("Help centre is coming with the live seller service.")}><CircleHelp size={16} /> Seller help</button><div className="seller-user"><span className="seller-user-avatar">E</span><span><strong>{profile.contactName || "ElyMart seller"}</strong><small>Seller workspace</small></span><MoreHorizontal size={17} /></div></div>
      </aside>
      {mobileSidebarOpen && <button className="seller-mobile-scrim" onClick={() => setMobileSidebarOpen(false)} aria-label="Close navigation" />}

      <section className="seller-main-area">
        <header className="seller-topbar">
          <button className="seller-mobile-menu" onClick={() => setMobileSidebarOpen((open) => !open)} aria-label="Toggle seller navigation"><Menu size={20} /></button>
          <div className="seller-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{view}</strong></div>
          <div className="seller-topbar-right"><span className="seller-preview-pill"><i /> Preview workspace</span><Link href="/" onClick={(event) => { event.preventDefault(); window.location.assign("/"); }} className="seller-view-shop"><Eye size={15} /> View shop <ArrowUpRight size={13} /></Link><button className="seller-top-avatar" aria-label="Seller account">{(profile.contactName || "E").slice(0, 1).toUpperCase()}</button></div>
        </header>

        <div className="seller-content">
          {view === "Overview" && <>
            <div className="seller-page-heading"><div><span className="seller-eyebrow">YOUR STORE AT A GLANCE</span><h1>Welcome to your studio.</h1><p>A calm little place to keep your shop moving.</p></div><button className="seller-primary-button" onClick={() => setFormProduct(null)}><Plus size={17} /> Add a product</button></div>
            <div className="seller-intro-card"><div className="seller-intro-icon"><Store size={21} /></div><div><strong>Your shop is ready for its first good find.</strong><p>Add a product listing and it will appear in the ElyMart preview storefront right away.</p></div><button onClick={() => setFormProduct(null)}>Create your first listing <ArrowRight size={15} /></button><span className="seller-intro-decor" /></div>
            <div className="seller-stat-grid">
              <div className="seller-stat-card"><span className="seller-stat-icon green"><Package size={18} /></span><span className="seller-stat-label">Active listings</span><strong>{products.length}</strong><small>{products.length === 1 ? "product in your shop" : "products in your shop"}</small></div>
              <div className="seller-stat-card"><span className="seller-stat-icon mint"><Boxes size={18} /></span><span className="seller-stat-label">In-stock listings</span><strong>{inStock}</strong><small>{totalUnits} units available across your shop</small></div>
              <div className="seller-stat-card"><span className="seller-stat-icon lavender"><ClipboardList size={18} /></span><span className="seller-stat-label">Preview orders</span><strong>{matchingOrders.length}</strong><small>{receivedUnits} item{receivedUnits === 1 ? "" : "s"} ordered in this browser</small></div>
              <div className="seller-stat-card"><span className="seller-stat-icon peach"><CircleDollarSign size={18} /></span><span className="seller-stat-label">Sales revenue</span><strong>—</strong><small>Payments are not enabled in preview</small></div>
            </div>
            <div className="seller-content-split">
              <section className="seller-panel recent-listings-panel"><div className="seller-panel-heading"><div><span className="seller-eyebrow">YOUR CATALOGUE</span><h2>Recent listings</h2></div><button className="seller-text-link" onClick={() => setCurrentView("Products")}>View all <ArrowRight size={14} /></button></div>
                {products.length === 0 ? <div className="seller-table-empty"><span><Package size={23} /></span><strong>Your product shelf is empty.</strong><p>When you add a product, it will show up here.</p><button onClick={() => setFormProduct(null)}>Add your first product <Plus size={14} /></button></div> : <div className="recent-products">{products.slice(0, 4).map((product) => <div className="recent-product-row" key={product.id}><div className="seller-product-thumb"><img src={product.image} alt="" /></div><div className="recent-product-name"><strong>{product.name}</strong><small>{product.category}</small></div><span className={`seller-stock-pill ${product.stock > 0 ? "available" : "sold-out"}`}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span><strong className="recent-product-price">{formatPrice(product.price)}</strong><button className="seller-more-button" onClick={() => setFormProduct(product)} aria-label={`Edit ${product.name}`}><Pencil size={15} /></button></div>)}</div>}
              </section>
              <section className="seller-panel store-health-panel"><div className="seller-panel-heading"><div><span className="seller-eyebrow">A GOOD START</span><h2>Shop health</h2></div><span className="health-leaf"><BadgeCheck size={18} /></span></div><div className="store-health-score"><div className="health-ring"><span>{products.length ? "Good" : "Ready"}</span></div><div><strong>{products.length ? "Your catalogue is taking shape" : "Your workspace is set up"}</strong><p>{products.length ? "Keep your details fresh and make sure your stock is up to date." : "Add your first listing to introduce your products to shoppers."}</p></div></div><div className="health-checklist"><div><span className={products.length ? "health-check done" : "health-check"}>{products.length ? <Check size={12} /> : "1"}</span><span><strong>Add a first product</strong><small>{products.length ? "Your first listing is in the catalogue" : "Give shoppers something good to discover"}</small></span><button onClick={() => setFormProduct(null)}>{products.length ? "Add more" : "Get started"} <ArrowRight size={13} /></button></div><div><span className="health-check">2</span><span><strong>Set up your store details</strong><small>Help customers know who they&apos;re buying from</small></span><button onClick={() => setCurrentView("Store settings")}>Set up <ArrowRight size={13} /></button></div><div><span className="health-check">3</span><span><strong>Keep an eye on orders</strong><small>See orders connected to your listings</small></span><button onClick={() => setCurrentView("Orders")}>View orders <ArrowRight size={13} /></button></div></div></section>
            </div>
            <div className="seller-demo-note"><ShieldCheck size={15} /><span><strong>Preview mode, clearly.</strong> Product listings and orders are saved in this browser. No customer payment or seller payout is processed.</span></div>
          </>}

          {view === "Products" && <>
            <div className="seller-page-heading"><div><span className="seller-eyebrow">MAKE YOUR CATALOGUE YOURS</span><h1>Products</h1><p>Keep your product details fresh and your stock up to date.</p></div><button className="seller-primary-button" onClick={() => setFormProduct(null)}><Plus size={17} /> Add a product</button></div>
            <div className="seller-products-toolbar"><div className="seller-search"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search your products" aria-label="Search your products" />{searchTerm && <button onClick={() => setSearchTerm("")} aria-label="Clear search"><X size={15} /></button>}</div><span>{visibleProducts.length} {visibleProducts.length === 1 ? "listing" : "listings"}</span></div>
            <section className="seller-panel seller-table-panel"><div className="seller-products-table-wrap"><table className="seller-products-table"><thead><tr><th>PRODUCT</th><th>STATUS</th><th>PRICE</th><th>STOCK</th><th>ADDED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {visibleProducts.map((product) => <tr key={product.id}><td><div className="table-product-cell"><span className="table-product-thumb"><img src={product.image} alt="" /></span><span><strong>{product.name}</strong><small>{product.brand} · {product.category}</small></span></div></td><td><span className={`seller-stock-pill ${product.stock > 0 ? "available" : "sold-out"}`}><i />{product.stock > 0 ? "Active" : "Out of stock"}</span></td><td className="table-price">{formatPrice(product.price)}{product.compareAt && <small>Was {formatPrice(product.compareAt)}</small>}</td><td><span className={product.stock <= 5 ? "table-stock low" : "table-stock"}>{product.stock} units</span></td><td className="table-date">{product.createdAt ? new Intl.DateTimeFormat("en-RW", { day: "numeric", month: "short", year: "numeric" }).format(new Date(product.createdAt)) : "—"}</td><td><div className="table-actions"><button onClick={() => setFormProduct(product)} aria-label={`Edit ${product.name}`}><Pencil size={15} /></button><button onClick={() => setDeleteTarget(product)} aria-label={`Delete ${product.name}`}><Trash2 size={15} /></button></div></td></tr>)}
              {visibleProducts.length === 0 && <tr><td colSpan={6}><div className="empty-table-state"><span><Package size={22} /></span><strong>{products.length ? "No matching products" : "No listings yet"}</strong><p>{products.length ? "Try another search term." : "Start with one product listing and grow from there."}</p>{products.length === 0 && <button onClick={() => setFormProduct(null)}>Add your first product <Plus size={14} /></button>}</div></td></tr>}
            </tbody></table></div><div className="table-footer-note"><span><ShieldCheck size={14} /> Changes appear in the preview storefront.</span><Link href="/" onClick={(event) => { event.preventDefault(); window.location.assign("/"); }}>Open storefront <ExternalLink size={14} /></Link></div></section>
            <div className="seller-demo-note"><ShieldCheck size={15} /><span><strong>Listings stay on this device.</strong> Add a photo URL or upload an image, set a price in RWF, and save to preview it in the shop.</span></div>
          </>}

          {view === "Orders" && <>
            <div className="seller-page-heading"><div><span className="seller-eyebrow">KEEP THINGS MOVING</span><h1>Orders</h1><p>Orders in this view are preview checkouts placed on this device.</p></div><span className="seller-order-count"><PackageCheck size={16} /> {matchingOrders.length} preview orders</span></div>
            <section className="seller-panel seller-orders-panel"><div className="seller-orders-heading"><div><h2>Orders for your products</h2><p>Only locally saved preview orders that include one of your listings appear here.</p></div><span className="preview-order-tag"><i /> Preview data</span></div>
              {matchingOrders.length === 0 ? <div className="seller-table-empty orders-empty"><span><ClipboardList size={23} /></span><strong>No orders for your listings yet.</strong><p>When a preview order includes one of your products, it will appear here.</p><Link href="/" onClick={(event) => { event.preventDefault(); window.location.assign("/"); }}>Take a look at the storefront <ArrowRight size={14} /></Link></div> : <div className="orders-list">{matchingOrders.map((order) => { const myItems = order.items.filter((item) => products.some((product) => product.id === item.productId)); return <article className="order-card" key={order.orderId}><div className="order-card-top"><div><strong>{order.orderId}</strong><span>{new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</span></div><span className="order-status-pill"><i /> {order.paymentStatus}</span></div><div className="order-card-middle"><div><small>Customer</small><strong>{order.name}</strong><span>{order.phone}</span></div><div><small>Delivery to</small><strong>{order.district}</strong><span>{order.address}</span></div><div><small>Your items</small><strong>{myItems.reduce((sum, item) => sum + item.quantity, 0)} item{myItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}</strong><span>{myItems.map((item) => item.name).join(", ")}</span></div><div><small>Order total</small><strong>{formatPrice(myItems.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong><span>Includes all cart items</span></div></div><div className="order-card-foot"><span><Truck size={14} /> Delivery status is not connected in preview.</span><button onClick={() => setToast(`Order details viewed · ${order.orderId} was saved in preview mode.`)}>View details <ArrowRight size={14} /></button></div></article>; })}</div>}
            </section><div className="seller-demo-note"><ShieldCheck size={15} /><span><strong>Payment state is never assumed.</strong> Mobile Money orders remain awaiting payment confirmation in this preview. No payment is captured or verified.</span></div>
          </>}

          {view === "Store settings" && <>
            <div className="seller-page-heading"><div><span className="seller-eyebrow">THE PEOPLE BEHIND THE PRODUCTS</span><h1>Store settings</h1><p>Share a little about your shop and how customers can reach you.</p></div><span className="seller-settings-badge"><ShieldCheck size={15} /> Saved in this browser</span></div>
            <form className="seller-panel settings-form" onSubmit={saveProfile}><div className="settings-panel-heading"><span className="settings-store-icon"><Store size={19} /></span><div><h2>Your seller profile</h2><p>These details help shoppers recognise your store. They&apos;re saved locally in preview mode.</p></div></div><div className="settings-fields"><label>Store name<input value={profile.storeName} onChange={(event) => setProfile({ ...profile, storeName: event.target.value })} placeholder="e.g. Aline's Home Finds" required /></label><label>Your name<input value={profile.contactName} onChange={(event) => setProfile({ ...profile, contactName: event.target.value })} placeholder="Full name" /></label><label>Contact email<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="you@example.com" /></label><label>Contact phone<input type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="+250 7XX XXX XXX" /></label><label className="settings-full">About your shop<textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Tell shoppers what makes your shop special..." rows={4} /></label></div><div className="settings-form-foot"><span><ShieldCheck size={14} /> Private details are not published by this preview.</span><button type="submit" className="seller-primary-button">{profileSaved ? <><Check size={16} /> Saved</> : <>Save changes <ArrowRight size={15} /></>}</button></div></form>
            <div className="seller-demo-note"><ShieldCheck size={15} /><span><strong>Security first.</strong> This local demo does not collect passwords, payout details, or identity documents. Seller verification requires the live platform backend.</span></div>
          </>}
        </div>
      </section>

      {formProduct !== false && <ProductFormModal key={formProduct?.id ?? "new-product"} initialProduct={formProduct} onClose={() => setFormProduct(false)} onSave={saveProduct} />}
      {deleteTarget && <div className="seller-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><div className="seller-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><button className="seller-confirm-close" onClick={() => setDeleteTarget(null)} aria-label="Close"><X size={19} /></button><span className="delete-modal-icon"><Trash2 size={21} /></span><h2 id="delete-title">Remove this listing?</h2><p><strong>{deleteTarget.name}</strong> will be removed from your store and the preview storefront. This cannot be undone.</p><div><button className="seller-secondary-button" onClick={() => setDeleteTarget(null)}>Keep listing</button><button className="seller-danger-button" onClick={confirmDelete}>Remove product <Trash2 size={15} /></button></div></div></div>}
      {toast && <div className="seller-toast" role="status"><span><Check size={15} /></span>{toast}<button onClick={() => setToast("")} aria-label="Dismiss"><X size={14} /></button></div>}
    </main>
  );
}

function ProductFormModal({ initialProduct, onClose, onSave }: { initialProduct: Product | null; onClose: () => void; onSave: (product: Product, isEdit: boolean) => void }) {
  const [draft, setDraft] = useState<ProductDraft>(initialProduct ? {
    name: initialProduct.name,
    category: initialProduct.category,
    brand: initialProduct.brand,
    price: String(initialProduct.price),
    compareAt: initialProduct.compareAt ? String(initialProduct.compareAt) : "",
    stock: String(initialProduct.stock),
    image: initialProduct.image,
    description: initialProduct.description,
  } : emptyDraft);
  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");
  const isEdit = Boolean(initialProduct);

  function updateField(field: keyof ProductDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === "image") setImageError("");
    if (formError) setFormError("");
  }

  function loadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setImageError("Choose a JPG, PNG, WebP, or GIF image file.");
      return;
    }
    if (file.size > 900 * 1024) {
      setImageError("For this browser preview, please use an image under 900 KB or paste a hosted image URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateField("image", String(reader.result));
    reader.onerror = () => setImageError("This image could not be read. Try another file.");
    reader.readAsDataURL(file);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const price = Number(draft.price);
    const compareAt = draft.compareAt ? Number(draft.compareAt) : undefined;
    const stock = Number(draft.stock);
    if (!Number.isFinite(price) || price <= 0) return setFormError("Add a price greater than zero.");
    if (compareAt !== undefined && (!Number.isFinite(compareAt) || compareAt <= price)) return setFormError("The original price must be higher than the current price.");
    if (!Number.isInteger(stock) || stock < 0) return setFormError("Stock must be a whole number, zero or higher.");
    if (!draft.image.trim()) return setFormError("Add a product image URL or upload a photo.");
    const imageSource = draft.image.trim();
    const isUploadedImage = /^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(imageSource);
    const isSecureImageUrl = /^https:\/\/[^\s]+$/i.test(imageSource);
    if (!isUploadedImage && !isSecureImageUrl) return setFormError("Use an HTTPS image link or upload a JPG, PNG, WebP, or GIF.");
    const name = draft.name.trim();
    const product: Product = {
      id: initialProduct?.id ?? `seller-${Date.now().toString(36)}`,
      slug: initialProduct?.slug ?? `${slugify(name)}-${Date.now().toString(36)}`,
      name,
      category: draft.category,
      brand: draft.brand.trim() || "Independent seller",
      price,
      ...(compareAt ? { compareAt } : {}),
      stock,
      image: imageSource,
      label: initialProduct?.label ?? "Just landed",
      description: draft.description.trim() || `${name} from ${draft.brand.trim() || "an independent ElyMart seller"}. A considered find for everyday life.`,
      createdAt: initialProduct?.createdAt ?? new Date().toISOString(),
      isSellerAdded: true,
    };
    onSave(product, isEdit);
  }

  return <div className="seller-modal-backdrop product-form-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="product-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
      <div className="product-form-header"><div><span className="seller-eyebrow">YOUR SHOP, YOUR PICKS</span><h2 id="product-form-title">{isEdit ? "Edit your product" : "Add a product"}</h2><p>{isEdit ? "Give your listing a refresh." : "Share something good with the ElyMart community."}</p></div><button className="seller-confirm-close" onClick={onClose} aria-label="Close product form"><X size={19} /></button></div>
      <form className="product-form" onSubmit={submit}>
        <div className="product-form-scroll"><div className="product-form-layout"><div className="product-image-uploader"><label className="seller-field-label">Product image <span>Required</span></label><div className={`product-upload-area ${draft.image ? "has-preview" : ""}`}>{draft.image ? <><img src={draft.image} alt="Product preview" /><button type="button" className="replace-image-button" onClick={() => updateField("image", "")}><Pencil size={13} /> Change photo</button></> : <><span className="upload-icon"><FileImage size={22} /></span><strong>Add a clear product photo</strong><small>Square images look best · JPG, PNG, WebP</small><label className="upload-file-button"><Upload size={14} /> Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={loadImage} /></label><span className="upload-or">or paste an image URL below</span></>}</div>{imageError && <span className="field-error">{imageError}</span>}
            <label className="seller-field-label image-url-label">Image URL <span>Hosted photo</span><input value={draft.image.startsWith("data:") ? "Uploaded image on this device" : draft.image} onChange={(event) => updateField("image", event.target.value)} placeholder="https://your-image-link.jpg" readOnly={draft.image.startsWith("data:")} /></label>{draft.image.startsWith("data:") && <button type="button" className="remove-upload-link" onClick={() => updateField("image", "")}>Remove uploaded image</button>}</div>
          <div className="product-form-fields"><label className="seller-field-label">Product name <span>Required</span><input autoFocus value={draft.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Handwoven everyday basket" required maxLength={90} /></label><div className="product-form-two-col"><label className="seller-field-label">Category <span>Required</span><select value={draft.category} onChange={(event) => updateField("category", event.target.value)} required>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="seller-field-label">Brand or maker<input value={draft.brand} onChange={(event) => updateField("brand", event.target.value)} placeholder="e.g. Kivu Goods" maxLength={50} /></label></div><div className="product-form-two-col"><label className="seller-field-label">Price (RWF) <span>Required</span><input value={draft.price} onChange={(event) => updateField("price", event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="45000" required /></label><label className="seller-field-label">Original price (RWF)<input value={draft.compareAt} onChange={(event) => updateField("compareAt", event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Optional" /></label></div><div className="product-form-two-col"><label className="seller-field-label">Available stock <span>Required</span><input value={draft.stock} onChange={(event) => updateField("stock", event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="10" required /></label><span className="stock-hint"><Boxes size={15} /> Inventory updates on this device</span></div><label className="seller-field-label">A little about this product<textarea value={draft.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What makes it useful, special, or lovely?" rows={4} maxLength={600} /><small className="character-count">{draft.description.length}/600</small></label></div></div>
          <div className="product-preview-note"><ShieldCheck size={15} /><span>This listing will appear in the ElyMart preview shop. It is not published to a live marketplace.</span></div>
          {formError && <p className="form-validation-error" role="alert">{formError}</p>}</div>
        <div className="product-form-footer"><button type="button" className="seller-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="seller-primary-button">{isEdit ? <><Check size={16} /> Save changes</> : <><Plus size={17} /> Add product to shop</>}</button></div>
      </form>
    </section>
  </div>;
}

function SparkleIcon() {
  return <Sparkles size={20} />;
}
