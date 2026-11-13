import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/layout/CartDrawer";
import SearchOverlay from "@/components/layout/SearchOverlay";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Uttoron Prokasoni — Immersive 3D Publishing House & Online Bookstore",
    template: "%s | Uttoron Prokasoni",
  },
  description:
    "Discover extraordinary stories, explore new perspectives, and experience the magic of reading in Uttoron Prokasoni's interactive 3D digital library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f5f0] text-[#141413] antialiased selection:bg-[#141413] selection:text-[#f6f5f0]">
        <StoreProvider>
          <Navbar />
          <SearchOverlay />
          <CartDrawer />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}

