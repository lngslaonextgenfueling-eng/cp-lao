"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { api, Product, Shop } from "@/lib/api";

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Shop>(`/shops/${slug}`).then(setShop).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!shop) return;
    api<{ items: Product[]; pages: number }>(`/products?shop=${shop.id}&page=${page}&limit=12`)
      .then((r) => {
        setItems(r.items);
        setPages(r.pages);
      })
      .catch((e) => setError(e.message));
  }, [shop, page]);

  if (error) return <div className="card p-6 text-red-600">{error}</div>;
  if (!shop) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;

  return (
    <div>
      <Link href="/shops" className="text-sm text-brand-600 hover:underline">← ຮ້ານຄ້າທັງໝົດ</Link>
      <div className="card mt-3 flex flex-wrap items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">🏬</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          {shop.description && <p className="text-sm text-slate-600">{shop.description}</p>}
          <div className="mt-1 text-sm text-slate-500">
            {shop.phone && <>📞 {shop.phone}</>} {shop.address && <> · 📍 {shop.address}</>}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-slate-500">ຮ້ານນີ້ຍັງບໍ່ມີສິນຄ້າ</div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>← ກ່ອນໜ້າ</button>
          <span className="text-sm">{page} / {pages}</span>
          <button className="btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>ຖັດໄປ →</button>
        </div>
      )}
    </div>
  );
}
