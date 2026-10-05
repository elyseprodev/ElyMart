# ElyMart

A green-led, Rwanda-focused marketplace preview for **ElyMart — Shop Smarter, Live Better.** The storefront brings together groceries, prepared food and beverages, everyday essentials, beauty and personal care, electronics, shoes, and clothing, while preserving the seller workflow for adding and managing product listings.

## Run locally

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` and set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` using your email provider's SMTP details (use an app password where the provider requires one). Without SMTP configuration, sign-in intentionally will not complete because the verification code cannot be delivered. Use the desired admin email, choose a new unique password, and generate the session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep `.env.local` private; it is ignored by Git. Do not put credentials in source code or commits. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The super-admin sign-in is at `/admin`. Production checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## What works in this preview

- Responsive marketplace homepage with category navigation, product search, sort controls, stock filtering, and category-only result views. The preview catalog includes 48 listings across groceries, food and beverages, beauty and personal care, electronics, shoes, and clothing; selecting a category shows only that category’s products.
- Store directory at `/stores` with shop search, locally saved Follow buttons, and links to each shop’s preview listings.
- Offers page at `/offers` with sample coupon concepts and markdown-priced products; codes are not redeemable in this preview.
- Orders page at `/orders` for locally saved preview orders.
- `/admin` requires the configured super-admin email and password, then a one-time six-digit verification code sent to that email over configured SMTP. Codes expire after 10 minutes, allow five attempts, and can be resent with a cooldown. Successful admin sessions use a signed, HttpOnly, SameSite cookie with a 12-hour lifetime.
- The admin Settings view can set a customer-facing WhatsApp number. The storefront’s WhatsApp support link opens a `wa.me` chat; the number is saved to an ignored local server data file for this preview.
- Product quick view, wishlist, quantity-aware cart, sample delivery-fee calculation, and preview checkout choices for MTN MoMo, Airtel Money, or pay on delivery. Orders are saved unpaid; no payment provider is connected.
- Seller studio at `/seller`, including add/edit/delete product listings, inventory counts, image URL or small image upload, store settings, and locally saved preview orders.
- Seller-created products appear in the storefront immediately. Storefront products, cart, wishlist, seller profile, and preview orders persist in the current browser using `localStorage`.
- Seed shops, product details, prices, stock, and delivery fees are preview data. Checkout and newsletter forms do not send payments or emails.

## Architecture

- Next.js App Router + React + TypeScript.
- Tailwind CSS 4 is installed through the PostCSS plugin; the shared visual system is in `app/globals.css`.
- Lucide React icons and Framer Motion for lightweight interface details.
- `lib/products.ts` is the preview catalog; `lib/storage.ts` contains the browser-only storage helpers.
- `components/Storefront.tsx` contains the storefront interactions; `components/SellerDashboard.tsx` contains the seller listing workflow.
- `components/admin/SuperAdminDashboard.tsx` is an authenticated admin preview. `lib/admin-auth.ts` verifies server-side credentials, signs admin sessions, and guards a one-time email-code challenge; `lib/admin-mailer.ts` sends codes over configured SMTP. `/api/admin/login` handles password, verification, and resend steps, while `/api/admin/logout` clears the session. The contact-number setting is served by `/api/support/whatsapp` and stored under the ignored `.elymart-data/` directory during local preview.

## Preview limitations / production work still required

This repository began as an empty shell. This iteration is still a functional preview, **not a complete production marketplace backend**. The environment-configured super-admin login protects `/admin`, but only one super-admin is configured; customer and seller accounts, database-backed roles, and most marketplace actions are not implemented. OTP challenges and login limits are held in process memory, so production or multiple server instances need a shared store such as Redis or a database. Catalog, cart, wishlist, seller listings, and orders remain browser-local/sample data. The WhatsApp number is stored in a local JSON file for a single-server preview; production needs shared persistent database storage. SMTP is used only for admin verification codes when configured; order emails are not implemented. There is no payment gateway, verified payment callback, transactional inventory, or shipping-provider integration. Checkout records a local order but never charges or marks it paid. Do not deploy the preview flow as a live checkout.

Before accepting real listings or orders, add shared persistent storage and server-side APIs, validate and sanitize every request on the server, extend authentication and role-based authorization to customer/seller accounts and every administrative operation, store uploaded images with an approved image service, and integrate payment/shipping providers with signature verification and idempotency. Keep all provider secrets on the server. The bundled catalogue photos are preview imagery sourced from Pexels/Unsplash; replace them with seller-approved media for a live catalog.

## Product listing workflow

1. Open **Sell on ElyMart** in the navigation or go to `/seller`.
2. Choose **Add a product**.
3. Enter a product name, category, RWF price, stock quantity, and image URL (or upload an image smaller than 900 KB).
4. Save the listing. It appears in the seller catalogue and the customer storefront in the same browser.
5. Edit or remove it from **Products**. Changes are stored locally in this preview.
