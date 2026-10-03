# ElyMart

A green-led, Rwanda-focused marketplace preview for **ElyMart — Shop Smarter, Live Better.** The storefront brings together groceries, prepared food, everyday essentials, electronics, shoes, and clothing, while preserving the seller workflow for adding and managing product listings.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## What works in this preview

- Responsive marketplace homepage with category navigation, product search, sort controls, stock filtering, and category-only result views. The preview catalog includes 42 listings across groceries, food, beauty and personal care, electronics, shoes, and clothing; selecting a category shows only that category’s products.
- Store directory at `/stores` with shop search, locally saved Follow buttons, and links to each shop’s preview listings.
- Offers page at `/offers` with sample coupon concepts and markdown-priced products; codes are not redeemable in this preview.
- Orders page at `/orders` for locally saved preview orders.
- Super-admin concept at `/admin` with sample KPIs/charts, seller-review actions, search, CSV export, and local-only settings.
- Product quick view, wishlist, quantity-aware cart, sample delivery-fee calculation, and a preview checkout flow.
- Seller studio at `/seller`, including add/edit/delete product listings, inventory counts, image URL or small image upload, store settings, and locally saved preview orders.
- Seller-created products appear in the storefront immediately. Storefront products, cart, wishlist, seller profile, and preview orders persist in the current browser using `localStorage`.
- Seed shops, product details, prices, stock, and delivery fees are preview data. Checkout and newsletter forms do not send payments or emails.

## Architecture

- Next.js App Router + React + TypeScript.
- Tailwind CSS 4 is installed through the PostCSS plugin; the shared visual system is in `app/globals.css`.
- Lucide React icons and Framer Motion for lightweight interface details.
- `lib/products.ts` is the preview catalog; `lib/storage.ts` contains the browser-only storage helpers.
- `components/Storefront.tsx` contains the storefront interactions; `components/SellerDashboard.tsx` contains the seller listing workflow.
- `components/admin/SuperAdminDashboard.tsx` is a demo-only admin surface. `/admin` is not authenticated or authorization-protected and must not be used for real administration.

## Preview limitations / production work still required

This repository began as an empty shell. This iteration is a functional front-end preview, **not yet a production marketplace backend**. Browser storage is device-local and is not a database or a secure source of truth. The project does not yet include MongoDB/Mongoose, user authentication, server-enforced roles, shared seller/customer accounts, product moderation, a payment gateway, verified payment callbacks, transactional inventory, email, or shipping-provider integrations. The preview checkout records a local order but never charges or marks an order paid. Do not deploy the preview flow as a live checkout.

Before accepting real listings or orders, add server-side APIs and persistent storage, validate and sanitize every request on the server, implement authentication and role-based authorization, store uploaded images with an approved image service, and integrate payment/shipping providers with signature verification and idempotency. Keep all provider secrets on the server. The bundled catalogue photos are preview imagery sourced from Pexels/Unsplash; replace them with seller-approved media for a live catalog.

## Product listing workflow

1. Open **Sell on ElyMart** in the navigation or go to `/seller`.
2. Choose **Add a product**.
3. Enter a product name, category, RWF price, stock quantity, and image URL (or upload an image smaller than 900 KB).
4. Save the listing. It appears in the seller catalogue and the customer storefront in the same browser.
5. Edit or remove it from **Products**. Changes are stored locally in this preview.
