"use client";
import Link from "next/link";
import { CATEGORY_LABEL, formatLAK, Product } from "@/lib/api";
import { useCart } from "@/lib/cart";

const ICON: Record<string, string> = {
  CPU: "🧠", MAINBOARD: "🔌", RAM: "💾", GPU: "🎮", PSU: "⚡", STORAGE: "🗄️",
  CASE: "🧰", LAPTOP: "💻", DESKTOP: "🖥️", MONITOR: "🖵", ACCESSORY: "🖱️",
};

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = product.stock <= 0;

  return (
    <div className="card flex flex-col overflow-hidden">
      <Link href={`/products/${product.id}`} className="block">
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-6xl">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
          ) : (
            ICON[product.category] || "📦"
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs text-slate-500">
          {product.brand} · {CATEGORY_LABEL[product.category] || product.category}
        </div>
        {product.shop && (
          <Link href={`/shops/${product.shop.slug}`} className="text-xs text-brand-600 hover:underline">
            🏬 {product.shop.name}
          </Link>
        )}
        <Link href={`/products/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="text-lg font-bold text-brand-700">{formatLAK(product.price)}</div>
            <div className={`text-xs ${out ? "text-red-600" : product.stock <= 5 ? "text-amber-600" : "text-green-600"}`}>
              {out ? "ສິນຄ້າໝົດ" : product.stock <= 5 ? `ເຫຼືອ ${product.stock} ຊິ້ນ` : "ມີສິນຄ້າ"}
            </div>
          </div>
          <button className="btn-primary" disabled={out} onClick={() => add(product)}>
            ເພີ່ມ
          </button>
        </div>
      </div>
    </div>
  );
}
