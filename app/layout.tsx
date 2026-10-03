import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElyMart — Shop Smarter, Live Better",
  description:
    "Find thoughtful everyday essentials from trusted sellers across Rwanda. Shop electronics, fashion, home, beauty, and more on ElyMart.",
  openGraph: {
    title: "ElyMart — Shop Smarter, Live Better",
    description: "Good finds. Better living. Discover ElyMart, Rwanda's marketplace.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
