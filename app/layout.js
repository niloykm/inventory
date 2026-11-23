import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CategoriesProvider } from "@/lib/categories-context";
import { WarehouseProvider } from "@/lib/warehouse-context";
import { InventoryStoreProvider } from "@/lib/inventory-store";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { CacheBuster } from "@/lib/cache-buster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "Niloy Inventory — Enterprise ERP & Operations Command Center",
  description:
    "High-density multi-warehouse inventory ledger, stock threshold telemetry, inter-warehouse transfers, and replenishment workflows.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <MotionProvider>
          <AuthProvider>
            <CacheBuster />
            <CategoriesProvider>
              <WarehouseProvider>
                <InventoryStoreProvider>
                  {children}
                  <Toaster position="bottom-right" richColors />
                </InventoryStoreProvider>
              </WarehouseProvider>
            </CategoriesProvider>
          </AuthProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
