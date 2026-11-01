"use client";
import { useEffect, useMemo, useState } from "react";
import { api, formatLAK, Product } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useRouter } from "next/navigation";

type Slot = "cpu" | "mainboard" | "ram" | "gpu" | "psu" | "case" | "storage";

const SLOTS: { key: Slot; label: string; category: string; required: boolean }[] = [
  { key: "cpu", label: "CPU", category: "CPU", required: true },
  { key: "mainboard", label: "Mainboard", category: "MAINBOARD", required: true },
  { key: "ram", label: "RAM", category: "RAM", required: true },
  { key: "gpu", label: "ກາດຈໍ (GPU)", category: "GPU", required: false },
  { key: "psu", label: "Power Supply", category: "PSU", required: true },
  { key: "case", label: "ເຄສ (Case)", category: "CASE", required: false },
  { key: "storage", label: "Storage", category: "STORAGE", required: false },
];

interface CheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  estimatedWatts: number;
  recommendedPsuWatts: number;
  total: number;
}

function shortSpec(p: Product) {
  const s = p.specs || {};
  return [s.socket, s.ramType, s.formFactor, s.wattage ? `${s.wattage}W` : null, s.vram, s.capacity, s.maxBoard && `ຮອງຮັບ ${s.maxBoard}`]
    .filter(Boolean)
    .join(" · ");
}

export default function BuilderPage() {
  const router = useRouter();
  const { add } = useCart();
  const [catalog, setCatalog] = useState<Record<string, Product[]>>({});
  const [selected, setSelected] = useState<Partial<Record<Slot, string>>>({});
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all(
      SLOTS.map((s) =>
        api<{ items: Product[] }>(`/products?category=${s.category}&limit=60&sort=price_asc`).then((r) => [s.key, r.items] as const)
      )
    )
      .then((entries) => setCatalog(Object.fromEntries(entries)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const chosen = useMemo(
    () => SLOTS.map((s) => catalog[s.key]?.find((p) => p.id === selected[s.key])).filter(Boolean) as Product[],
    [catalog, selected]
  );
  const total = chosen.reduce((s, p) => s + p.price, 0);

  // Re-check compatibility whenever the selection changes
  useEffect(() => {
    if (!chosen.length) {
      setResult(null);
      return;
    }
    const t = setTimeout(() => {
      api<CheckResult>("/builder/check", { method: "POST", body: JSON.stringify(selected) })
        .then(setResult)
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [selected, chosen.length]);

  const requiredMissing = SLOTS.filter((s) => s.required && !selected[s.key]);
  const outOfStock = chosen.filter((p) => p.stock <= 0);
  const canAdd = chosen.length > 0 && requiredMissing.length === 0 && result?.ok && outOfStock.length === 0;

  const addAll = () => {
    chosen.forEach((p) => add(p, 1));
    router.push("/cart");
  };

  if (loading) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;
  if (error) return <div className="card p-6 text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">ຈັດສະເປັກຄອມເອງ (PC Builder)</h1>
      <p className="mt-1 text-sm text-slate-600">ເລືອກຊິ້ນສ່ວນ — ລະບົບຈະກວດຄວາມເຂົ້າກັນໄດ້ (Socket, ປະເພດ RAM, ກຳລັງໄຟ, ຂະໜາດເຄສ) ໃຫ້ອັດຕະໂນມັດ.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          {SLOTS.map((s) => {
            const options = catalog[s.key] || [];
            const picked = options.find((p) => p.id === selected[s.key]);
            return (
              <div key={s.key} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold">
                    {s.label} {s.required && <span className="text-red-500">*</span>}
                  </div>
                  {picked && <div className="font-bold text-brand-700">{formatLAK(picked.price)}</div>}
                </div>
                <select
                  className="input"
                  value={selected[s.key] || ""}
                  onChange={(e) => setSelected((prev) => ({ ...prev, [s.key]: e.target.value || undefined }))}
                >
                  <option value="">— ເລືອກ {s.label} —</option>
                  {options.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} — {formatLAK(p.price)}
                      {p.stock <= 0 ? " (ໝົດ)" : ""}
                    </option>
                  ))}
                </select>
                {picked && <div className="mt-2 text-xs text-slate-500">{shortSpec(picked)}</div>}
              </div>
            );
          })}
        </div>

        <aside className="card sticky top-20 h-fit p-4">
          <div className="font-bold">ສະຫຼຸບການຈັດສະເປັກ</div>

          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            {chosen.length === 0 && <div className="text-slate-500">ຍັງບໍ່ໄດ້ເລືອກຊິ້ນສ່ວນ</div>}
            {chosen.map((p) => (
              <div key={p.id} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-slate-600">{p.name}</span>
                <span className="whitespace-nowrap">{formatLAK(p.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
            <span>ລວມ</span>
            <span className="text-brand-700">{formatLAK(total)}</span>
          </div>

          {result && (
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="text-slate-600">
                ໃຊ້ໄຟປະມານ <b>{result.estimatedWatts}W</b> · PSU ແນະນຳ ≥ <b>{result.recommendedPsuWatts}W</b>
              </div>
              {result.errors.map((e) => (
                <div key={e} className="rounded-lg bg-red-50 p-2 text-red-700">✕ {e}</div>
              ))}
              {result.warnings.map((w) => (
                <div key={w} className="rounded-lg bg-amber-50 p-2 text-amber-800">⚠ {w}</div>
              ))}
              {result.ok && requiredMissing.length === 0 && (
                <div className="rounded-lg bg-green-50 p-2 text-green-700">✓ ຊິ້ນສ່ວນທັງໝົດເຂົ້າກັນໄດ້</div>
              )}
            </div>
          )}

          <button className="btn-primary mt-4 w-full" disabled={!canAdd} onClick={addAll}>
            ເພີ່ມທັງໝົດໃສ່ກະຕ່າ
          </button>
          {requiredMissing.length > 0 && chosen.length > 0 && (
            <div className="mt-2 text-xs text-slate-500">ຍັງຂາດ: {requiredMissing.map((s) => s.label).join(", ")}</div>
          )}
        </aside>
      </div>
    </div>
  );
}
