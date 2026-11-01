"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-600">
          🖥️ PC SHOP
        </Link>
        <nav className="hidden gap-5 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/" className="hover:text-brand-600">ສິນຄ້າທັງໝົດ</Link>
          <Link href="/shops" className="hover:text-brand-600">ຮ້ານຄ້າ</Link>
          <Link href="/builder" className="hover:text-brand-600">ຈັດສະເປັກຄອມ</Link>
          {user && <Link href="/orders" className="hover:text-brand-600">ອໍເດີຂອງຂ້ອຍ</Link>}
          {user?.role !== "ADMIN" && (
            <Link href="/seller" className="hover:text-brand-600">
              {user?.shop?.status === "APPROVED" ? "ຮ້ານຂອງຂ້ອຍ" : user?.shop ? "ສະຖານະຮ້ານ" : "ເປີດຮ້ານຂາຍ"}
            </Link>
          )}
          {user?.role === "ADMIN" && <Link href="/admin" className="hover:text-brand-600">Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/cart" className="btn-outline relative">
            🛒 ກະຕ່າ
            {count > 0 && (
              <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{count}</span>
            )}
          </Link>
          {user ? (
            <>
              <span className="hidden text-slate-600 md:inline">{user.name}</span>
              <button onClick={logout} className="btn-outline">ອອກຈາກລະບົບ</button>
            </>
          ) : (
            <Link href="/login" className="btn-primary">ເຂົ້າສູ່ລະບົບ</Link>
          )}
        </div>
      </div>
    </header>
  );
}
