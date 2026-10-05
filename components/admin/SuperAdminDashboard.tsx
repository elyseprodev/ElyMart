"use client";

/* The admin console is a non-secure demo surface backed by sample/local preview data. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileBarChart,
  Heart,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Package,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { categories, seedProducts, type Product } from "@/lib/products";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/storage";
import { formatPrice } from "@/components/store/ProductCard";

type AdminView = "Dashboard" | "Orders" | "Products" | "Categories" | "Sellers" | "Customers" | "Delivery & Agents" | "Payments" | "Promotions" | "Reviews" | "Reports & Analytics" | "Support Tickets" | "Settings";
type OrderStatus = "Processing" | "Delivered" | "Pending" | "Cancelled";
type SampleOrder = {
  id: string;
  customer: string;
  initials: string;
  date: string;
  amount: number;
  status: OrderStatus;
  method: string;
};
type SellerApplication = {
  id: string;
  name: string;
  initials: string;
  category: string;
  description: string;
  location: string;
  submitted: string;
  products: number;
  status: "Pending" | "Approved" | "Declined";
};
type MetricCardData = { label: string; value: string; change: string; note: string; icon: LucideIcon; tone: string; spark: string };
type TableRow = { id: string; searchText: string; cells: ReactNode[] };

const ADMIN_APPROVALS_KEY = "elymart_admin_approvals_demo_v1";

const navItems: { label: AdminView; icon: LucideIcon; badge?: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Orders", icon: ClipboardList, badge: "12" },
  { label: "Products", icon: Package },
  { label: "Categories", icon: Boxes },
  { label: "Sellers", icon: Store, badge: "18" },
  { label: "Customers", icon: Users },
  { label: "Delivery & Agents", icon: Truck },
  { label: "Payments", icon: CreditCard },
  { label: "Promotions", icon: Tag },
  { label: "Reviews", icon: Heart },
  { label: "Reports & Analytics", icon: FileBarChart },
  { label: "Support Tickets", icon: LifeBuoy, badge: "3" },
  { label: "Settings", icon: Settings },
];

const navGroups: { heading: string; items: AdminView[] }[] = [
  { heading: "OVERVIEW", items: ["Dashboard", "Reports & Analytics"] },
  { heading: "SALES & CATALOGUE", items: ["Orders", "Products", "Categories", "Promotions"] },
  { heading: "PEOPLE & TRUST", items: ["Sellers", "Customers", "Reviews"] },
  { heading: "OPERATIONS", items: ["Delivery & Agents", "Payments", "Support Tickets"] },
  { heading: "SYSTEM", items: ["Settings"] },
];

const sampleOrders: SampleOrder[] = [
  { id: "ELY-10482", customer: "Aline M.", initials: "AM", date: "02 Oct 2026", amount: 78500, status: "Processing", method: "MTN MoMo" },
  { id: "ELY-10481", customer: "Jean R.", initials: "JR", date: "02 Oct 2026", amount: 18500, status: "Delivered", method: "Airtel Money" },
  { id: "ELY-10480", customer: "Grace U.", initials: "GU", date: "01 Oct 2026", amount: 72000, status: "Pending", method: "Pay on delivery" },
  { id: "ELY-10479", customer: "David N.", initials: "DN", date: "01 Oct 2026", amount: 12000, status: "Delivered", method: "MTN MoMo" },
  { id: "ELY-10478", customer: "Chantal K.", initials: "CK", date: "30 Sep 2026", amount: 45200, status: "Cancelled", method: "MTN MoMo" },
];

const initialApplications: SellerApplication[] = [
  { id: "seller-kigali-kitchen", name: "Kigali Kitchen Co.", initials: "KK", category: "Prepared food", description: "Local meals and fresh bakery", location: "Gasabo, Kigali", submitted: "Today, 09:24", products: 14, status: "Pending" },
  { id: "seller-igihobe", name: "Igihobe Supermarket", initials: "IS", category: "Groceries", description: "Neighbourhood food and essentials", location: "Kicukiro, Kigali", submitted: "Yesterday", products: 32, status: "Pending" },
  { id: "seller-kivu-craft", name: "Kivu Craft House", initials: "KC", category: "Home & living", description: "Locally made baskets and decor", location: "Nyarugenge, Kigali", submitted: "30 Sep 2026", products: 8, status: "Pending" },
];

const categoryStats = [
  { label: "Electronics", products: "832 active products", share: 28.4, icon: CreditCard, tone: "mint" },
  { label: "Food", products: "650 active products", share: 22.1, icon: ShoppingBag, tone: "yellow" },
  { label: "Groceries", products: "425 active products", share: 17.8, icon: Boxes, tone: "green" },
  { label: "Home & Kitchen", products: "400 active products", share: 14.2, icon: Home, tone: "blue" },
];

const metricCards: MetricCardData[] = [
  { label: "Gross Revenue", value: "RWF 24,850,000", change: "+7.2%", note: "vs. previous 30 days", icon: CircleDollarSign, tone: "green", spark: "0,32 9,29 18,34 27,25 36,27 45,19 54,22 63,13 72,16 81,7" },
  { label: "Total Orders", value: "1,284", change: "+4.4%", note: "vs. previous 30 days", icon: ShoppingBag, tone: "teal", spark: "0,30 9,33 18,25 27,28 36,20 45,24 54,15 63,19 72,11 81,8" },
  { label: "Active Products", value: "3,642", change: "+6.2%", note: "across all categories", icon: PackageCheck, tone: "purple", spark: "0,34 9,28 18,30 27,21 36,24 45,17 54,19 63,12 72,14 81,6" },
  { label: "Pending Sellers", value: "18", change: "Needs review", note: "3 applications shown below", icon: Users, tone: "orange", spark: "0,29 9,27 18,31 27,21 36,24 45,18 54,21 63,12 72,16 81,7" },
];

const customers = [
  ["Mugisha A.", "mugisha@example.rw", "Kigali", "18 orders", "Active"],
  ["Uwase B.", "uwase@example.rw", "Huye", "12 orders", "Active"],
  ["Niyonsenga J.", "niyonsenga@example.rw", "Musanze", "7 orders", "Active"],
  ["Mukamana C.", "mukamana@example.rw", "Rubavu", "4 orders", "New"],
];

const deliveryAgents = [
  ["Patrick N.", "KGL-204", "Kigali · Gasabo", "18 deliveries", "Available"],
  ["Marie C.", "KGL-118", "Kigali · Kicukiro", "12 deliveries", "On delivery"],
  ["Eric U.", "HYE-032", "Huye", "9 deliveries", "Available"],
  ["Aline M.", "KGL-087", "Kigali · Nyarugenge", "6 deliveries", "Offline"],
];

const supportTickets = [
  ["#TK-0812", "Payment confirmation question", "Aline M.", "02 Oct 2026", "Open"],
  ["#TK-0811", "Seller listing image issue", "Kivu Craft House", "02 Oct 2026", "In progress"],
  ["#TK-0810", "Delivery area update", "Jean R.", "01 Oct 2026", "Open"],
];

export default function SuperAdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [activeView, setActiveView] = useState<AdminView>("Dashboard");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<SampleOrder[]>(sampleOrders);
  const [applications, setApplications] = useState<SellerApplication[]>(initialApplications);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [reviewingSeller, setReviewingSeller] = useState<SellerApplication | null>(null);
  const [toast, setToast] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveReviews, setAutoApproveReviews] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  useEffect(() => {
    const savedProducts = readLocal<Product[]>(STORAGE_KEYS.products, []);
    const localOrders = readLocal<{ orderId: string; name: string; createdAt: string; total: number; paymentMethod: string; paymentStatus: string }[]>(STORAGE_KEYS.orders, []);
    const savedApplications = readLocal<SellerApplication[]>(ADMIN_APPROVALS_KEY, initialApplications);
    const savedSettings = readLocal<{ maintenanceMode?: boolean; autoApproveReviews?: boolean }>("elymart_admin_settings_demo_v1", {});
    setProducts([...savedProducts.filter((item) => item?.id), ...seedProducts]);
    if (localOrders.length) {
      const localPreviewOrders = localOrders.slice(0, 8).map((order) => ({
        id: order.orderId,
        customer: order.name || "Preview customer",
        initials: (order.name || "P").split(/\s+/).map((part) => part.slice(0, 1)).join("").slice(0, 2).toUpperCase(),
        date: new Intl.DateTimeFormat("en-RW", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.createdAt)),
        amount: order.total,
        status: order.paymentStatus === "awaiting payment confirmation" ? "Pending" as const : "Processing" as const,
        method: order.paymentMethod === "momo" ? "Mobile Money" : "Pay on delivery",
      }));
      setOrders([...localPreviewOrders, ...sampleOrders].slice(0, 8));
    }
    setApplications(savedApplications);
    setMaintenanceMode(Boolean(savedSettings.maintenanceMode));
    setAutoApproveReviews(Boolean(savedSettings.autoApproveReviews));
    void fetch("/api/support/whatsapp", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load support settings.");
        const result = (await response.json()) as { whatsappPhone?: unknown };
        setWhatsappPhone(typeof result.whatsappPhone === "string" && result.whatsappPhone ? `+${result.whatsappPhone}` : "");
      })
      .catch(() => setWhatsappError("Could not load WhatsApp support settings from this server."));

    function syncLocal(event: Event) {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === STORAGE_KEYS.products) setProducts([...readLocal<Product[]>(STORAGE_KEYS.products, []).filter((item) => item?.id), ...seedProducts]);
      if (key === STORAGE_KEYS.orders) {
        const currentOrders = readLocal<{ orderId: string; name: string; createdAt: string; total: number; paymentMethod: string; paymentStatus: string }[]>(STORAGE_KEYS.orders, []);
        const localPreviewOrders = currentOrders.slice(0, 8).map((order) => ({
          id: order.orderId,
          customer: order.name || "Preview customer",
          initials: (order.name || "P").split(/\s+/).map((part) => part.slice(0, 1)).join("").slice(0, 2).toUpperCase(),
          date: new Intl.DateTimeFormat("en-RW", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.createdAt)),
          amount: order.total,
          status: order.paymentStatus === "awaiting payment confirmation" ? "Pending" as const : "Processing" as const,
          method: order.paymentMethod === "momo" ? "Mobile Money" : "Pay on delivery",
        }));
        setOrders([...localPreviewOrders, ...sampleOrders].slice(0, 8));
      }
    }
    function syncStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.products) setProducts([...readLocal<Product[]>(STORAGE_KEYS.products, []).filter((item) => item?.id), ...seedProducts]);
      if (event.key === STORAGE_KEYS.orders) {
        const currentOrders = readLocal<{ orderId: string; name: string; createdAt: string; total: number; paymentMethod: string; paymentStatus: string }[]>(STORAGE_KEYS.orders, []);
        const localPreviewOrders = currentOrders.slice(0, 8).map((order) => ({
          id: order.orderId,
          customer: order.name || "Preview customer",
          initials: (order.name || "P").split(/\s+/).map((part) => part.slice(0, 1)).join("").slice(0, 2).toUpperCase(),
          date: new Intl.DateTimeFormat("en-RW", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.createdAt)),
          amount: order.total,
          status: order.paymentStatus === "awaiting payment confirmation" ? "Pending" as const : "Processing" as const,
          method: order.paymentMethod === "momo" ? "Mobile Money" : "Pay on delivery",
        }));
        setOrders([...localPreviewOrders, ...sampleOrders].slice(0, 8));
      }
    }
    window.addEventListener("elymart:local-update", syncLocal);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener("elymart:local-update", syncLocal);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pendingApplications = applications.filter((application) => application.status === "Pending").length;
  const pendingSellers = 15 + pendingApplications;
  const activeProducts = products.filter((product) => product.stock > 0).length + 3628;
  const revenueSeries = useMemo(() => getSeries(dateRange), [dateRange]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredOrders = useMemo(() => orders.filter((order) => `${order.id} ${order.customer} ${order.status} ${order.method}`.toLowerCase().includes(normalizedSearch)), [orders, normalizedSearch]);
  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalizedSearch)), [products, normalizedSearch]);
  const filteredApplications = useMemo(() => applications.filter((application) => `${application.name} ${application.category} ${application.location} ${application.status}`.toLowerCase().includes(normalizedSearch)), [applications, normalizedSearch]);

  function showToast(message: string) {
    setToast(message);
  }

  function changeApplication(id: string, status: SellerApplication["status"]) {
    const next = applications.map((application) => application.id === id ? { ...application, status } : application);
    setApplications(next);
    writeLocal(ADMIN_APPROVALS_KEY, next);
    setReviewingSeller(null);
    showToast(`${status === "Approved" ? "Approval" : "Application update"} simulated in this preview`);
  }

  function exportReport() {
    const rows = [
      ["ElyMart admin preview report", dateRange],
      ["Metric", "Sample value"],
      ["Gross revenue", "RWF 24,850,000"],
      ["Total orders", "1,284"],
      ["Active products", String(activeProducts.toLocaleString("en-RW"))],
      ["Pending sellers", String(pendingSellers)],
      [],
      ["Order ID", "Customer", "Date", "Amount RWF", "Status", "Payment method"],
      ...filteredOrders.map((order) => [order.id, order.customer, order.date, String(order.amount), order.status, order.method]),
      [],
      ["Note", "Sample preview data only; not a financial or operational report."],
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `elymart-admin-preview-${dateRange.toLowerCase().replaceAll(" ", "-")}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Preview report downloaded");
  }

  function saveAdminSettings() {
    writeLocal("elymart_admin_settings_demo_v1", { maintenanceMode, autoApproveReviews });
    setSettingsSaved(true);
    showToast("Demo preferences saved in this browser");
    window.setTimeout(() => setSettingsSaved(false), 1800);
  }

  async function saveWhatsAppNumber() {
    setWhatsappError("");
    setWhatsappSaving(true);
    setWhatsappSaved(false);
    try {
      const response = await fetch("/api/support/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappPhone }),
      });
      const result = (await response.json()) as { whatsappPhone?: unknown; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save the WhatsApp number.");
      const savedPhone = typeof result.whatsappPhone === "string" ? result.whatsappPhone : "";
      setWhatsappPhone(savedPhone ? `+${savedPhone}` : "");
      setWhatsappSaved(true);
      showToast(savedPhone ? "WhatsApp support number updated" : "WhatsApp support number cleared");
      window.setTimeout(() => setWhatsappSaved(false), 2200);
    } catch (error) {
      setWhatsappError(error instanceof Error ? error.message : "Could not save the WhatsApp number.");
    } finally {
      setWhatsappSaving(false);
    }
  }

  async function logoutAdmin() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.assign("/admin");
    }
  }

  function setView(view: AdminView) {
    setActiveView(view);
    setSearchTerm("");
    setSearchValue("");
    setMobileSidebarOpen(false);
  }

  const titleCopy = viewCopy(activeView);

  return (
    <main className="admin-app">
      <aside className={`admin-sidebar ${mobileSidebarOpen ? "is-open" : ""}`}>
        <Link href="/" className="admin-brand" aria-label="ElyMart home">
          <span className="admin-brand-icon"><ShoppingBag size={19} fill="currentColor" /></span>
          <span className="admin-brand-word">Ely<span>Mart</span><small>SUPER ADMIN</small></span>
          <ChevronDown className="admin-brand-chevron" size={13} />
        </Link>
        <div className="admin-workspace"><span className="admin-workspace-icon"><ShieldCheck size={15} /></span><span><small>WORKSPACE</small><strong>Marketplace admin</strong></span><ChevronDown size={13} /></div>
        <nav className="admin-nav" aria-label="Super admin sections">
          {navGroups.map((group) => <div className="admin-nav-group" key={group.heading}>
            <span className="admin-nav-caption">{group.heading}</span>
            {group.items.map((label) => {
              const item = navItems.find((navItem) => navItem.label === label);
              if (!item) return null;
              const Icon = item.icon;
              return <button key={label} type="button" className={`admin-nav-item ${activeView === label ? "active" : ""}`} onClick={() => setView(label)} aria-current={activeView === label ? "page" : undefined}>
                <Icon size={16} strokeWidth={1.9} /><span>{label}</span>{label === "Sellers" ? <i>{pendingSellers}</i> : item.badge && <i>{item.badge}</i>}
              </button>;
            })}
          </div>)}
        </nav>
        <div className="admin-sidebar-card"><span className="admin-sidebar-card-icon"><Activity size={16} /></span><strong>Marketplace health</strong><p>Admin access is protected. Marketplace records remain sample preview data.</p><span className="admin-sidebar-status"><i /> Preview data</span></div>
        <div className="admin-sidebar-bottom"><Link href="/" className="admin-back-link"><ArrowRight size={14} /> View storefront</Link><span>ELYMART ADMIN · PREVIEW 0.1</span></div>
      </aside>
      {mobileSidebarOpen && <button className="admin-sidebar-scrim" aria-label="Close admin menu" onClick={() => setMobileSidebarOpen(false)} />}

      <section className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-toggle" type="button" onClick={() => setMobileSidebarOpen((open) => !open)} aria-label="Toggle admin navigation"><Menu size={19} /></button>
          <div className="admin-breadcrumb"><span>Admin</span><ChevronRight size={13} /><strong>{activeView}</strong></div>
          <form className="admin-global-search" onSubmit={(event) => { event.preventDefault(); setSearchTerm(searchValue); }} role="search">
            <Search size={15} /><input aria-label="Search admin records" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search products, orders, sellers..." />
            {searchValue && <button type="button" onClick={() => { setSearchValue(""); setSearchTerm(""); }} aria-label="Clear search"><X size={13} /></button>}
          </form>
          <div className="admin-top-actions">
            <div className="admin-popover-anchor">
              <button className={`admin-icon-button ${notificationsOpen ? "selected" : ""}`} type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}><Bell size={17} />{!notificationsRead && <i />}</button>
              {notificationsOpen && <div className="admin-popover admin-notifications-popover"><div className="admin-popover-heading"><strong>Notifications</strong><button type="button" onClick={() => setNotificationsRead(true)}>Mark all read</button></div><div className="admin-notification-row"><span className="notification-dot orange" /><span><strong>3 seller applications</strong><small>Waiting for a review in the preview queue.</small></span></div><div className="admin-notification-row"><span className="notification-dot blue" /><span><strong>12 orders need attention</strong><small>Example notification · no live orders.</small></span></div><div className="admin-popover-foot">Sample notifications only</div></div>}
            </div>
            <div className="admin-popover-anchor admin-profile-anchor">
              <button className="admin-profile-button" type="button" aria-expanded={profileOpen} onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}><span className="admin-avatar">{adminEmail.slice(0, 1).toUpperCase()}</span><span className="admin-profile-copy"><strong>{adminEmail}</strong><small>Super Admin</small></span><ChevronDown size={13} /></button>
              {profileOpen && <div className="admin-popover admin-profile-popover"><strong>Signed in as super admin</strong><small>{adminEmail}</small><button type="button" onClick={logoutAdmin}><LogOut size={14} /> Sign out</button><Link href="/" onClick={() => setProfileOpen(false)}>Return to storefront</Link></div>}
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-demo-banner"><span><ShieldCheck size={13} /> Authenticated super admin</span><i /> Marketplace records and operations remain preview-only until connected to a production database.</div>
          <div className="admin-page-heading">
            <div><div className="admin-page-eyebrow"><span>ADMIN</span><ChevronRight size={12} /> <span>{activeView}</span></div><h1>{titleCopy.title}</h1><p>{titleCopy.description}</p></div>
            <div className="admin-page-actions">
              {(activeView === "Dashboard" || activeView === "Reports & Analytics") && <label className="admin-range-select"><Clock3 size={14} /><select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Select report date range"><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select><ChevronDown size={12} /></label>}
              <button className="admin-export-button" type="button" onClick={exportReport}><Download size={14} /> Export report</button>
            </div>
          </div>

          {activeView === "Dashboard" && <DashboardOverview
            dateRange={dateRange}
            activeProducts={activeProducts}
            pendingSellers={pendingSellers}
            orders={filteredOrders.slice(0, 4)}
            applications={applications.filter((application) => application.status === "Pending").slice(0, 3)}
            onView={setView}
            onReview={setReviewingSeller}
            onApprove={(id) => changeApplication(id, "Approved")}
          />}
          {activeView === "Reports & Analytics" && <ReportsView dateRange={dateRange} revenueSeries={revenueSeries} />}
          {activeView === "Sellers" && <SellerManagement
            applications={filteredApplications}
            onReview={setReviewingSeller}
            onApprove={(id) => changeApplication(id, "Approved")}
            onDecline={(id) => changeApplication(id, "Declined")}
          />}
          {activeView === "Settings" && <SettingsView maintenanceMode={maintenanceMode} autoApproveReviews={autoApproveReviews} onMaintenance={setMaintenanceMode} onAutoApprove={setAutoApproveReviews} onSave={saveAdminSettings} saved={settingsSaved} whatsappPhone={whatsappPhone} onWhatsAppPhone={setWhatsappPhone} onSaveWhatsApp={saveWhatsAppNumber} whatsappSaving={whatsappSaving} whatsappError={whatsappError} whatsappSaved={whatsappSaved} />}
          {activeView !== "Dashboard" && activeView !== "Reports & Analytics" && activeView !== "Sellers" && activeView !== "Settings" && <ResourceView
            view={activeView}
            orders={filteredOrders}
            products={filteredProducts}
            searchTerm={searchTerm}
          />}
        </div>
      </section>

      {reviewingSeller && <SellerReviewModal application={reviewingSeller} onClose={() => setReviewingSeller(null)} onApprove={() => changeApplication(reviewingSeller.id, "Approved")} onDecline={() => changeApplication(reviewingSeller.id, "Declined")} />}
      {toast && <div className="admin-toast" role="status"><span><Check size={14} /></span>{toast}<button type="button" onClick={() => setToast("")} aria-label="Dismiss"><X size={13} /></button></div>}
    </main>
  );
}

function DashboardOverview({
  dateRange,
  activeProducts,
  pendingSellers,
  orders,
  applications,
  onView,
  onReview,
  onApprove,
}: {
  dateRange: string;
  activeProducts: number;
  pendingSellers: number;
  orders: SampleOrder[];
  applications: SellerApplication[];
  onView: (view: AdminView) => void;
  onReview: (application: SellerApplication) => void;
  onApprove: (id: string) => void;
}) {
  return (
    <>
      <div className="admin-metric-grid">
        {metricCards.map((metric) => (
          <article className="admin-metric-card" key={metric.label}>
            <div className={`admin-metric-icon ${metric.tone}`}><metric.icon size={16} strokeWidth={2.1} /></div>
            <div className="admin-metric-main"><span>{metric.label}</span><strong>{metric.label === "Pending Sellers" ? pendingSellers : metric.label === "Active Products" ? activeProducts.toLocaleString("en-RW") : metric.value}</strong>
              <small className={metric.label === "Pending Sellers" ? "admin-metric-attention" : "admin-metric-change"}>{metric.label === "Pending Sellers" ? <><Clock3 size={11} /> 3 need review</> : <><ArrowUpRight size={11} /> {metric.change}</>}</small>
            </div>
            <span className="admin-metric-note">{metric.label === "Pending Sellers" ? "applications in queue" : metric.note}</span>
            <svg className={`admin-mini-spark ${metric.tone}`} viewBox="0 0 82 40" aria-hidden="true"><polyline points={metric.spark} /></svg>
          </article>
        ))}
      </div>

      <div className="admin-analysis-grid">
        <section className="admin-panel revenue-panel">
          <div className="admin-panel-heading"><div><h2>Revenue &amp; orders overview</h2><p>Marketplace activity · {dateRange.toLowerCase()} · sample figures</p></div><button className="admin-more-button" type="button" aria-label="More revenue options"><MoreHorizontal size={17} /></button></div>
          <div className="admin-chart-legend"><span><i className="legend-revenue" /> Revenue (RWF)</span><span><i className="legend-orders" /> Orders</span></div>
          <RevenueChart dateRange={dateRange} />
        </section>

        <section className="admin-panel order-status-panel">
          <div className="admin-panel-heading"><div><h2>Order status</h2><p>Sample order breakdown</p></div><button className="admin-more-button" type="button" aria-label="More order status options"><MoreHorizontal size={17} /></button></div>
          <div className="admin-order-status-content"><div className="admin-donut-chart"><div><strong>1,284</strong><small>Total orders</small></div></div><div className="admin-status-legend">
            <StatusLegend color="pending" label="Pending" share="18.7%" count="240" />
            <StatusLegend color="processing" label="Processing" share="26.4%" count="339" />
            <StatusLegend color="delivered" label="Delivered" share="50.1%" count="644" />
            <StatusLegend color="cancelled" label="Cancelled" share="4.8%" count="61" />
          </div></div>
        </section>
      </div>

      <div className="admin-lower-grid">
        <section className="admin-panel recent-orders-panel">
          <div className="admin-panel-heading"><div><h2>Recent orders</h2><p>Latest marketplace activity · sample preview rows</p></div><button className="admin-view-all" type="button" onClick={() => onView("Orders")}>View all <ArrowRight size={13} /></button></div>
          <AdminOrdersTable orders={orders} compact />
        </section>
        <section className="admin-panel categories-panel">
          <div className="admin-panel-heading"><div><h2>Top selling categories</h2><p>Sample order share</p></div><button className="admin-view-all" type="button" onClick={() => onView("Categories")}>View all <ArrowRight size={13} /></button></div>
          <div className="admin-category-list">{categoryStats.map((category) => {
            const Icon = category.icon;
            return <div className="admin-category-row" key={category.label}><span className={`admin-category-icon ${category.tone}`}><Icon size={14} /></span><span className="admin-category-info"><strong>{category.label}</strong><small>{category.products}</small><i><b style={{ width: `${category.share}%` }} /></i></span><small className="admin-category-share">{category.share}%</small></div>;
          })}</div>
        </section>
        <section className="admin-panel seller-approvals-panel">
          <div className="admin-panel-heading"><div><h2>Seller approvals</h2><p>{applications.length} sample applications to review</p></div><button className="admin-view-all" type="button" onClick={() => onView("Sellers")}>View all <ArrowRight size={13} /></button></div>
          {applications.length > 0 ? <div className="admin-approval-list">{applications.map((application) => <article className="admin-approval-row" key={application.id}><span className="admin-seller-avatar">{application.initials}</span><span className="admin-approval-info"><strong>{application.name}</strong><small>{application.category} · {application.products} products</small></span><button className="admin-approval-more" type="button" onClick={() => onReview(application)} aria-label={`Review ${application.name}`}><MoreHorizontal size={15} /></button><div className="admin-approval-actions"><button className="approve-button" type="button" onClick={() => onApprove(application.id)}>Approve</button><button className="review-button" type="button" onClick={() => onReview(application)}>Review</button></div></article>)}</div> : <div className="admin-panel-empty">No pending sample applications.</div>}
        </section>
      </div>
    </>
  );
}

function RevenueChart({ dateRange }: { dateRange: string }) {
  const data = getSeries(dateRange);
  const orders = getOrderSeries(dateRange);
  const revenuePoints = chartPoints(data);
  const orderPoints = chartPoints(orders);
  const revenueLine = pointsToPath(revenuePoints);
  const revenueArea = `${revenueLine} L ${revenuePoints[revenuePoints.length - 1].x} 174 L ${revenuePoints[0].x} 174 Z`;
  const orderLine = pointsToPath(orderPoints);
  return (
    <div className="admin-chart-wrap">
      <div className="admin-y-axis"><span>6,000,000</span><span>4,500,000</span><span>3,000,000</span><span>1,500,000</span><span>0</span></div>
      <div className="admin-chart-main"><svg viewBox="0 0 780 190" preserveAspectRatio="none" role="img" aria-label={`Sample revenue and order chart for ${dateRange}`}>
        <defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#19a66b" stopOpacity=".18" /><stop offset="100%" stopColor="#19a66b" stopOpacity="0" /></linearGradient></defs>
        {[16, 54, 92, 130, 168].map((y) => <line key={y} x1="0" x2="780" y1={y} y2={y} className="admin-chart-gridline" />)}
        <path d={revenueArea} fill="url(#revenue-fill)" />
        <path d={orderLine} className="admin-chart-orders-line" />
        <path d={revenueLine} className="admin-chart-revenue-line" />
        {revenuePoints.filter((_, index) => index % 4 === 0 || index === revenuePoints.length - 1).map((point) => <circle key={point.x} cx={point.x} cy={point.y} r="2.8" className="admin-chart-point" />)}
      </svg>
      <div className="admin-x-axis">{(dateRange === "Last 7 days" ? ["Sep 27", "Sep 29", "Oct 01", "Oct 03"] : dateRange === "Last 90 days" ? ["Jul 06", "Jul 24", "Aug 11", "Aug 29", "Sep 16", "Oct 03"] : ["Sep 05", "Sep 10", "Sep 15", "Sep 20", "Sep 25", "Oct 03"]).map((label) => <span key={label}>{label}</span>)}</div></div>
    </div>
  );
}

function StatusLegend({ color, label, share, count }: { color: string; label: string; share: string; count: string }) {
  return <div className="admin-status-row"><span className={`admin-status-dot ${color}`} /><strong>{label}</strong><span>{share}</span><b>{count}</b></div>;
}

function AdminOrdersTable({ orders, compact = false }: { orders: SampleOrder[]; compact?: boolean }) {
  return (
    <div className={`admin-table-wrap ${compact ? "is-compact" : ""}`}>
      <table className="admin-table"><thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {orders.length ? orders.map((order) => <tr key={order.id}><td><strong className="admin-order-id">{order.id}</strong></td><td><span className="admin-customer-cell"><i>{order.initials}</i>{order.customer}</span></td><td>{order.date}</td><td><strong className="admin-amount">{formatPrice(order.amount)}</strong></td><td><span className={`admin-order-status-pill ${order.status.toLowerCase()}`}><i />{order.status}</span></td><td><button className="admin-row-action" type="button" aria-label={`View ${order.id}`}><Eye size={14} /></button></td></tr>) : <tr><td colSpan={6}><div className="admin-table-empty">No matching orders in the preview.</div></td></tr>}
      </tbody></table>
    </div>
  );
}

function ReportsView({ dateRange, revenueSeries }: { dateRange: string; revenueSeries: number[] }) {
  return <div className="admin-reports-view"><section className="admin-panel reports-chart-panel"><div className="admin-panel-heading"><div><h2>Revenue performance</h2><p>{dateRange} · illustrative marketplace sample</p></div><span className="admin-report-tag"><Activity size={13} /> Preview analytics</span></div><RevenueChart dateRange={dateRange} /></section><div className="admin-report-stats">{[["Gross merchandise value", "RWF 24,850,000", "+7.2%"], ["Average order value", "RWF 19,354", "+2.1%"], ["Completed orders", "644", "+5.4%"], ["Cancellation rate", "4.8%", "−0.6%"]].map(([label, value, change]) => <article className="admin-panel admin-report-stat" key={label}><span>{label}</span><strong>{value}</strong><small><ArrowUpRight size={12} /> {change} compared with prior period</small></article>)}</div><section className="admin-panel admin-report-insight"><span><Activity size={18} /></span><div><strong>Sample insight</strong><p>Revenue and order volumes trend upward in this illustrative chart. Connect verified order and payment data before using operational reports.</p></div></section></div>;
}

function SellerManagement({ applications, onReview, onApprove, onDecline }: { applications: SellerApplication[]; onReview: (application: SellerApplication) => void; onApprove: (id: string) => void; onDecline: (id: string) => void }) {
  return <section className="admin-panel admin-resource-panel"><div className="admin-panel-heading"><div><h2>Seller applications</h2><p>Approvals are simulated in this local preview.</p></div><span className="admin-report-tag"><Users size={13} /> {applications.length} applications</span></div><div className="admin-seller-management-list">{applications.map((application) => <article className="admin-seller-management-row" key={application.id}><span className="admin-seller-avatar large">{application.initials}</span><div className="admin-seller-main"><strong>{application.name}</strong><span>{application.description}</span><small><MapPin size={12} /> {application.location} · {application.category} · {application.products} products</small></div><span className={`admin-application-status ${application.status.toLowerCase()}`}>{application.status}</span><div className="admin-seller-management-actions">{application.status === "Pending" ? <><button className="review-button" onClick={() => onReview(application)}>Review</button><button className="approve-button" onClick={() => onApprove(application.id)}>Approve</button><button className="decline-button" onClick={() => onDecline(application.id)}>Decline</button></> : <button className="review-button" onClick={() => onReview(application)}>View record</button>}</div></article>)}</div></section>;
}

function SettingsView({
  maintenanceMode,
  autoApproveReviews,
  onMaintenance,
  onAutoApprove,
  onSave,
  saved,
  whatsappPhone,
  onWhatsAppPhone,
  onSaveWhatsApp,
  whatsappSaving,
  whatsappError,
  whatsappSaved,
}: {
  maintenanceMode: boolean;
  autoApproveReviews: boolean;
  onMaintenance: (checked: boolean) => void;
  onAutoApprove: (checked: boolean) => void;
  onSave: () => void;
  saved: boolean;
  whatsappPhone: string;
  onWhatsAppPhone: (phone: string) => void;
  onSaveWhatsApp: () => void;
  whatsappSaving: boolean;
  whatsappError: string;
  whatsappSaved: boolean;
}) {
  return (
    <section className="admin-panel admin-settings-panel">
      <div className="admin-panel-heading">
        <div><h2>Marketplace settings</h2><p>Set the customer WhatsApp contact and local preview preferences.</p></div>
        <Settings size={17} />
      </div>
      <div className="admin-settings-list">
        <label>
          <span><strong>Maintenance mode</strong><small>Preview preference only; it does not take the public storefront offline.</small></span>
          <input type="checkbox" checked={maintenanceMode} onChange={(event) => onMaintenance(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>Auto-approve sample reviews</strong><small>Demo preference only. Live user content needs server-side moderation.</small></span>
          <input type="checkbox" checked={autoApproveReviews} onChange={(event) => onAutoApprove(event.target.checked)} />
          <i />
        </label>
      </div>
      <section className="admin-whatsapp-setting" aria-labelledby="admin-whatsapp-title">
        <div className="admin-whatsapp-setting-heading">
          <span><MessageCircle size={16} /><strong id="admin-whatsapp-title">WhatsApp customer support</strong></span>
          <small>Shown publicly in the storefront footer</small>
        </div>
        <p>Enter the full international number, including its country code. Customers will be sent to WhatsApp to start a chat; messages are not stored by ElyMart.</p>
        <label className="admin-whatsapp-label" htmlFor="admin-whatsapp-number">Support number</label>
        <div className="admin-whatsapp-form-row">
          <input
            id="admin-whatsapp-number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={40}
            value={whatsappPhone}
            onChange={(event) => onWhatsAppPhone(event.target.value)}
            placeholder="+250 7XX XXX XXX"
          />
          <button type="button" className="admin-primary-button" onClick={onSaveWhatsApp} disabled={whatsappSaving}>
            {whatsappSaving ? "Saving…" : whatsappSaved ? <><Check size={13} /> Saved</> : "Save WhatsApp number"}
          </button>
        </div>
        {whatsappError && <p className="admin-whatsapp-error" role="alert">{whatsappError}</p>}
        <div className="admin-settings-note"><ShieldCheck size={15} /> Stored on this local server for the preview. Use shared database storage for production or multiple server instances.</div>
      </section>
      <div className="admin-settings-footer">
        <span>Preview preferences save in this browser</span>
        <button type="button" className="admin-primary-button" onClick={onSave}>{saved ? <><Check size={14} /> Saved</> : <>Save preview preferences <ArrowRight size={14} /></>}</button>
      </div>
    </section>
  );
}

function ResourceView({ view, orders, products, searchTerm }: { view: AdminView; orders: SampleOrder[]; products: Product[]; searchTerm: string }) {
  const resourceRows: TableRow[] = useMemo(() => {
    if (view === "Orders") return orders.map((order) => ({ id: order.id, searchText: `${order.id} ${order.customer} ${order.status} ${order.method}`, cells: [<strong key="id">{order.id}</strong>, order.customer, order.date, formatPrice(order.amount), <span key="status" className={`admin-order-status-pill ${order.status.toLowerCase()}`}><i />{order.status}</span>, order.method] }));
    if (view === "Products") return products.map((product) => ({ id: product.id, searchText: `${product.name} ${product.brand} ${product.category}`, cells: [<span className="admin-product-cell" key="product"><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.brand}</small></span></span>, product.category, formatPrice(product.price), `${product.stock} units`, <span className={`admin-order-status-pill ${product.stock > 0 ? "delivered" : "cancelled"}`} key="status"><i />{product.stock > 0 ? "Active" : "Out of stock"}</span>] }));
    if (view === "Categories") return categories.map((category, index) => ({ id: category, searchText: category, cells: [<span className="admin-category-name" key="name"><i className={`admin-table-category-icon tone-${index % 4}`}><Boxes size={14} /></i><strong>{category}</strong></span>, `${products.filter((product) => product.category === category).length} preview listings`, `${Math.max(4, 26 - index * 2)}%`, index < 5 ? "Active" : "Ready to populate"] }));
    if (view === "Customers") return customers.map(([name, email, area, orderCount, status]) => ({ id: email, searchText: `${name} ${email} ${area} ${status}`, cells: [<strong key="name">{name}</strong>, email, area, orderCount, status] }));
    if (view === "Delivery & Agents") return deliveryAgents.map(([name, code, area, count, status]) => ({ id: code, searchText: `${name} ${code} ${area} ${status}`, cells: [<strong key="name">{name}</strong>, code, area, count, status] }));
    if (view === "Payments") return orders.map((order, index) => ({ id: `PAY-${order.id}`, searchText: `${order.id} ${order.customer} ${order.status} ${order.method}`, cells: [`PAY-${order.id}`, order.customer, order.method, formatPrice(order.amount), index === 2 ? "Awaiting confirmation" : "Preview only", <span key="status" className={`admin-order-status-pill ${index === 2 ? "pending" : "processing"}`}><i />{index === 2 ? "Unverified" : "Not processed"}</span>] }));
    if (view === "Promotions") return [["ELYKGL2000", "RWF 2,000 sample coupon", "Illustrative", "Preview only"], ["KIGALI3000", "RWF 3,000 sample coupon", "Illustrative", "Preview only"]].map(([code, description, type, status]) => ({ id: code, searchText: `${code} ${description} ${status}`, cells: [<strong key="code">{code}</strong>, description, type, "Not redeemable"] }));
    if (view === "Reviews") return [["Aline M.", "Fresh market greens basket", "Lovely produce and helpful seller.", "Sample review"], ["Jean R.", "Grilled chicken & fries", "Good portions for a family lunch.", "Sample review"], ["Grace U.", "Coffee for slow mornings", "A nice everyday pantry pick.", "Sample review"]].map(([customer, product, text, status], index) => ({ id: `review-${index}`, searchText: `${customer} ${product} ${text}`, cells: [customer, product, text, status] }));
    if (view === "Support Tickets") return supportTickets.map(([ticket, subject, user, date, status]) => ({ id: ticket, searchText: `${ticket} ${subject} ${user} ${status}`, cells: [<strong key="id">{ticket}</strong>, subject, user, date, status] }));
    return [];
  }, [view, orders, products]);
  const filtered = resourceRows.filter((row) => row.searchText.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  const columns = resourceColumns(view);
  const icon = navItems.find((item) => item.label === view)?.icon ?? LayoutDashboard;
  const Icon = icon;
  return <section className="admin-panel admin-resource-panel"><div className="admin-panel-heading"><div><h2>{resourceHeading(view)}</h2><p>{resourceDescription(view)}{searchTerm ? ` · matching “${searchTerm}”` : ""}</p></div><span className="admin-resource-count"><Icon size={14} /> {filtered.length} records</span></div><div className="admin-table-wrap admin-resource-table"><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{filtered.map((row) => <tr key={row.id}>{row.cells.map((cell, index) => <td key={`${row.id}-${index}`}>{cell}</td>)}</tr>)}{filtered.length === 0 && <tr><td colSpan={columns.length}><div className="admin-table-empty">No matching preview records.</div></td></tr>}</tbody></table></div><div className="admin-resource-foot"><ShieldCheck size={13} /> Sample or browser-local data only · administrative actions are not connected to a live marketplace.</div></section>;
}

function SellerReviewModal({ application, onClose, onApprove, onDecline }: { application: SellerApplication; onClose: () => void; onApprove: () => void; onDecline: () => void }) {
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="seller-review-title"><div className="admin-review-modal-top"><span className="admin-seller-avatar large">{application.initials}</span><button type="button" onClick={onClose} aria-label="Close seller review"><X size={18} /></button></div><span className="admin-page-eyebrow">SELLER APPLICATION · SAMPLE</span><h2 id="seller-review-title">{application.name}</h2><p>{application.description}</p><dl><div><dt>Category</dt><dd>{application.category}</dd></div><div><dt>Location</dt><dd>{application.location}</dd></div><div><dt>Products proposed</dt><dd>{application.products} sample listings</dd></div><div><dt>Submitted</dt><dd>{application.submitted}</dd></div></dl><div className="admin-review-note"><ShieldCheck size={14} /> Actions here only update this browser&apos;s demo state. Identity and compliance checks are not implemented.</div><div className="admin-review-actions"><button type="button" className="decline-button" onClick={onDecline}>Decline sample</button><button type="button" className="approve-button" onClick={onApprove}>Approve in preview <Check size={14} /></button></div></section></div>;
}

function resourceColumns(view: AdminView) {
  if (view === "Orders") return ["ORDER ID", "CUSTOMER", "DATE", "AMOUNT", "STATUS", "PAYMENT METHOD"];
  if (view === "Products") return ["PRODUCT", "CATEGORY", "PRICE", "STOCK", "LISTING STATUS"];
  if (view === "Categories") return ["CATEGORY", "LISTINGS", "ORDER SHARE", "STATUS"];
  if (view === "Customers") return ["CUSTOMER", "EMAIL", "AREA", "ORDERS", "STATUS"];
  if (view === "Delivery & Agents") return ["AGENT", "AGENT ID", "AREA", "ACTIVITY", "STATUS"];
  if (view === "Payments") return ["REFERENCE", "CUSTOMER", "METHOD", "AMOUNT", "PAYMENT STATE", "PREVIEW"];
  if (view === "Promotions") return ["CODE", "OFFER", "TYPE", "STATUS"];
  if (view === "Reviews") return ["CUSTOMER", "PRODUCT", "REVIEW", "SOURCE"];
  return ["TICKET", "SUBJECT", "REQUESTER", "OPENED", "STATUS"];
}

function resourceHeading(view: AdminView) {
  const titles: Partial<Record<AdminView, string>> = { Orders: "All orders", Products: "Product catalogue", Categories: "Marketplace categories", Customers: "Customer directory", "Delivery & Agents": "Delivery network", Payments: "Payment activity", Promotions: "Promotions & coupon concepts", Reviews: "Customer reviews", "Support Tickets": "Support queue" };
  return titles[view] ?? view;
}
function resourceDescription(view: AdminView) {
  const descriptions: Partial<Record<AdminView, string>> = { Orders: "Order rows are examples; local preview orders are also shown on this device.", Products: "Seed and seller-added browser preview listings.", Categories: "Category coverage and listing counts from the sample catalogue.", Customers: "Illustrative customer profiles, not production user accounts.", "Delivery & Agents": "Sample delivery-agent availability and activity.", Payments: "No payment provider is connected. These are status examples only.", Promotions: "Coupon examples are copyable but not redeemable.", Reviews: "Illustrative review content only; no customer ratings are seeded.", "Support Tickets": "Example customer and seller support requests." };
  return descriptions[view] ?? "Preview data for the marketplace administration concept.";
}
function viewCopy(view: AdminView) {
  const copy: Record<AdminView, { title: string; description: string }> = {
    Dashboard: { title: "Marketplace Overview", description: "Track marketplace performance, manage orders, and review seller activity." },
    Orders: { title: "Orders", description: "Inspect sample marketplace orders and browser-local preview checkouts." },
    Products: { title: "Products", description: "Review sample and seller-added listings from the current preview catalog." },
    Categories: { title: "Categories", description: "Keep an eye on category coverage across the marketplace." },
    Sellers: { title: "Seller approvals", description: "Review example seller applications. Approvals are not connected to authentication." },
    Customers: { title: "Customers", description: "Illustrative customer directory for the admin dashboard concept." },
    "Delivery & Agents": { title: "Delivery & agents", description: "View sample delivery coverage and agent availability." },
    Payments: { title: "Payments", description: "Payment examples are unverified and no transactions are processed." },
    Promotions: { title: "Promotions", description: "Manage sample offer concepts and coupon codes for the preview." },
    Reviews: { title: "Reviews", description: "Example moderation queue. No review data is sourced from customers." },
    "Reports & Analytics": { title: "Reports & analytics", description: "Explore illustrative marketplace trends and sample performance metrics." },
    "Support Tickets": { title: "Support tickets", description: "Review example support requests for the admin concept." },
    Settings: { title: "Settings", description: "Manage the customer WhatsApp contact and local preview preferences." },
  };
  return copy[view];
}

function getSeries(range: string) {
  if (range === "Last 7 days") return [37, 42, 39, 50, 48, 57, 61, 54, 63, 67, 72, 68, 79, 76, 86];
  if (range === "Last 90 days") return [24, 31, 27, 36, 42, 38, 45, 50, 47, 58, 61, 55, 64, 70, 68, 75, 81, 76, 91];
  return [26, 32, 29, 37, 41, 39, 45, 48, 43, 52, 56, 50, 61, 65, 59, 69, 73, 68, 79, 76, 85, 81, 94];
}
function getOrderSeries(range: string) {
  if (range === "Last 7 days") return [23, 27, 25, 34, 32, 38, 40, 37, 46, 45, 50, 53, 56, 60, 63];
  if (range === "Last 90 days") return [19, 24, 22, 29, 32, 30, 36, 38, 37, 44, 47, 45, 50, 54, 57, 59, 63, 67, 70];
  return [18, 21, 24, 22, 29, 31, 28, 34, 38, 35, 43, 46, 41, 49, 53, 50, 56, 59, 56, 63, 66, 64, 72];
}
function chartPoints(values: number[]) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values.map((value, index) => ({ x: 4 + (index / (values.length - 1)) * 772, y: 158 - ((value - min) / Math.max(1, max - min)) * 112 }));
}
function pointsToPath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}
