"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Shop } from "@/lib/api";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Shop[]>("/shops").then(setShops).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ຮ້ານຄ້າທັງໝົດ</h1>
        <Link href="/seller" className="btn-primary">ເປີດຮ້ານຂອງທ່ານ</Link>
      </div>
      {error && <div className="card mt-4 p-4 text-red-600">{error}</div>}
      {!shops && !error && <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>}
      {shops && shops.length === 0 && <div className="card mt-4 p-8 text-center text-slate-500">ຍັງບໍ່ມີຮ້ານຄ້າ</div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops?.map((s) => (
          <Link key={s.id} href={`/shops/${s.slug}`} className="card block p-5 transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-xl">🏬</div>
              <div>
                <div className="font-bold">{s.name}</div>
                <div className="text-xs text-slate-500">{s.productCount ?? 0} ສິນຄ້າ</div>
              </div>
            </div>
            {s.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{s.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
