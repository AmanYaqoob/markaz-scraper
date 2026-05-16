import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ShellWrapper from "@/components/ShellWrapper";
import { CartProvider } from "@/components/CartProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DROPSHOP — Style. Quality. You.",
    template: "%s | DROPSHOP",
  },
  description:
    "Pakistan's premium online store. Shop trending products across 33+ categories — fashion, electronics, cosmetics, accessories & more.",
  keywords: ["dropshop", "online shopping pakistan", "fashion", "electronics", "cosmetics"],
  openGraph: {
    siteName: "DROPSHOP",
    type: "website",
    images: ["/banner.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-white antialiased">
        <CartProvider>
          <ShellWrapper>{children}</ShellWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
