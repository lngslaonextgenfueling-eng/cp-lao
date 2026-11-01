import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PC SHOP — ຮ້ານຂາຍຄອມພິວເຕີ",
  description: "ຄອມພິວເຕີ, ໂນດບຸກ, ອຸປະກອນຄອມ ແລະ ບໍລິການຈັດສະເປັກຄອມ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
            <footer className="mt-10 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} PC SHOP ·{" "}
              <Link href="/policy" className="underline hover:text-slate-700">ນະໂຍບາຍການສັ່ງຊື້ ແລະ ການຄືນເງິນ</Link>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
