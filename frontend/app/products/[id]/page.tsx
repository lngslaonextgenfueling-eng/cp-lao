"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, CATEGORY_LABEL, formatLAK, Product } from "@/lib/api";
import { useCart } from "@/lib/cart";

const SPEC_LABEL: Record<string, string> = {
  socket: "Socket", cores: "ຈຳນວນ Core", threads: "ຈຳນວນ Thread", baseClock: "ຄວາມເລັ່ງພື້ນຖານ", boostClock: "ຄວາມເລັ່ງສູງສຸດ",
  tdp: "TDP (W)", ramTypes: "ຮອງຮັບ RAM", integratedGraphics: "ກາດຈໍໃນຕົວ", chipset: "Chipset", ramType: "ປະເພດ RAM",
  ramSlots: "ຊ່ອງ RAM", formFactor: "ຂະໜາດບອດ", maxRam: "RAM ສູງສຸດ", wifi: "Wi-Fi", m2Slots: "ຊ່ອງ M.2",
  capacity: "ຄວາມຈຸ", modules: "ຈຳນວນແຜ່ນ", speed: "ຄວາມໄວ", latency: "Latency", chip: "ຊິບກຣາຟິກ", vram: "VRAM",
  lengthMm: "ຄວາມຍາວ (mm)", recommendedPsu: "PSU ແນະນຳ", ports: "ພອດ", wattage: "ກຳລັງໄຟ (W)", efficiency: "ປະສິດທິພາບ",
  modular: "ສາຍໄຟ", maxBoard: "ຮອງຮັບບອດສູງສຸດ", maxGpuMm: "ກາດຈໍຍາວສຸດ (mm)", fans: "ພັດລົມ", color: "ສີ",
  type: "ປະເພດ", interface: "Interface", read: "ຄວາມໄວອ່ານ", write: "ຄວາມໄວຂຽນ", rpm: "RPM", display: "ໜ້າຈໍ",
  cpu: "CPU", ram: "RAM", storage: "Storage", gpu: "GPU", battery: "ແບັດເຕີຣີ", weight: "ນ້ຳໜັກ", os: "ລະບົບປະຕິບັດການ",
  mainboard: "Mainboard", psu: "PSU", warranty: "ການຮັບປະກັນ", size: "ຂະໜາດ", resolution: "Resolution",
  refreshRate: "Refresh rate", panel: "Panel", responseTime: "Response time", connection: "ການເຊື່ອມຕໍ່", dpi: "DPI",
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api<Product>(`/products/${id}`).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="card p-6 text-red-600">{error}</div>;
  if (!product) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;

  const inStock = product.stock > 0;
  const specs = Object.entries(product.specs || {});

  return (
    <div>
      <Link href="/" className="text-sm text-brand-600 hover:underline">← ກັບໄປໜ້າສິນຄ້າ</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="card flex h-80 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-8xl">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
          ) : (
            "🖥️"
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="text-sm text-slate-500">{product.brand} · {CATEGORY_LABEL[product.category]}</div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.shop && (
            <Link href={`/shops/${product.shop.slug}`} className="text-sm text-brand-600 hover:underline">
              🏬 ຂາຍໂດຍ {product.shop.name}
            </Link>
          )}
          <div className="text-3xl font-bold text-brand-700">{formatLAK(product.price)}</div>

          <div>
            {inStock ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                ✓ ມີສິນຄ້າ ({product.stock} ຊິ້ນ)
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">✕ ສິນຄ້າໝົດ</span>
            )}
          </div>

          {product.usage.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.usage.map((u) => (
                <span key={u} className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">{u}</span>
              ))}
            </div>
          )}
          {product.description && <p className="text-sm text-slate-600">{product.description}</p>}

          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={product.stock}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
              className="input !w-20"
              disabled={!inStock}
            />
            <button className="btn-primary" disabled={!inStock} onClick={() => add(product, qty)}>
              ເພີ່ມໃສ່ກະຕ່າ
            </button>
            <button
              className="btn-outline"
              disabled={!inStock}
              onClick={() => {
                add(product, qty);
                router.push("/cart");
              }}
            >
              ຊື້ເລີຍ
            </button>
          </div>
        </div>
      </div>

      <section className="card mt-8 overflow-hidden">
        <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold">ສະເປັກລະອຽດ (Tech Specs)</h2>
        {specs.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">ຍັງບໍ່ມີຂໍ້ມູນສະເປັກ</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-100 last:border-0">
                  <td className="w-1/3 bg-slate-50/60 px-4 py-2.5 font-medium text-slate-600">{SPEC_LABEL[k] || k}</td>
                  <td className="px-4 py-2.5">{Array.isArray(v) ? v.join(", ") : String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
