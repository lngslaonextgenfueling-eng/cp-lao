"use client";
// Dashboard pieces shared by the Seller dashboard (/seller → /api/seller/*)
// and the platform Admin dashboard (/admin → /api/admin/*). Both APIs expose the same shapes.
import { useCallback, useEffect, useState } from "react";
import { api, CATEGORY_LABEL, formatLAK, Order, Product, STATUS_COLOR, STATUS_LABEL } from "@/lib/api";

// ---------------------------------------------------------------- Stats
interface Stats {
  totalRevenue: number;
  platformFeeTotal: number;
  netRevenue: number;
  orderCount: number;
  pending: number;
  lowStock: { id: string; name: string; stock: number }[];
  daily: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: string; name: string; qty: number }[];
  byStatus: { status: string; count: number }[];
  shopsByStatus?: { status: string; count: number }[];
}

export function StatsView({ base, mode }: { base: "/seller" | "/admin"; mode: "seller" | "admin" }) {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Stats>(`${base}/stats`).then(setS).catch((e) => setError(e.message));
  }, [base]);
  if (error) return <div className="text-red-600">{error}</div>;
  if (!s) return <div className="text-slate-500">ກຳລັງໂຫຼດ…</div>;

  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  const last7 = s.daily.slice(-7).reduce((a, d) => a + d.revenue, 0);

  const tiles: [string, string][] =
    mode === "admin"
      ? [
          ["ຍອດຂາຍລວມທັງແພລດຟອມ", formatLAK(s.totalRevenue)],
          ["ຄ່າທຳນຽມທີ່ແພລດຟອມໄດ້ຮັບ", formatLAK(s.platformFeeTotal)],
          ["ຈຳນວນອໍເດີ", String(s.orderCount)],
          ["ລໍຖ້າຊຳລະ", String(s.pending)],
        ]
      : [
          ["ຍອດຂາຍລວມ", formatLAK(s.totalRevenue)],
          ["ລາຍຮັບສຸດທິ (ຫຼັງຫັກຄ່າທຳນຽມ)", formatLAK(s.netRevenue)],
          ["ຈຳນວນອໍເດີ", String(s.orderCount)],
          ["ລໍຖ້າຊຳລະ", String(s.pending)],
        ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([k, v]) => (
          <div key={k} className="card p-4">
            <div className="text-sm text-slate-500">{k}</div>
            <div className="mt-1 text-2xl font-bold text-brand-700">{v}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="mb-1 font-bold">ຍອດຂາຍ 30 ວັນຫຼ້າສຸດ</div>
        <div className="mb-3 text-xs text-slate-500">7 ວັນຫຼ້າສຸດ: {formatLAK(last7)}</div>
        <div className="flex h-40 items-end gap-1">
          {s.daily.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-brand-500 transition group-hover:bg-brand-700"
                style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
              />
              <div className="pointer-events-none absolute -top-12 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                {d.date}: {formatLAK(d.revenue)} ({d.orders})
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="mb-2 font-bold">ສິນຄ້າຂາຍດີ</div>
          {s.topProducts.length === 0 && <div className="text-sm text-slate-500">ຍັງບໍ່ມີຂໍ້ມູນ</div>}
          {s.topProducts.map((p) => (
            <div key={p.productId} className="flex justify-between gap-2 py-1 text-sm">
              <span className="line-clamp-1">{p.name}</span>
              <b>{p.qty}</b>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <div className="mb-2 font-bold">ສິນຄ້າໃກ້ໝົດສະຕັອກ (≤ 5)</div>
          {s.lowStock.length === 0 && <div className="text-sm text-slate-500">ບໍ່ມີ</div>}
          {s.lowStock.map((p) => (
            <div key={p.id} className="flex justify-between gap-2 py-1 text-sm">
              <span className="line-clamp-1">{p.name}</span>
              <b className={p.stock === 0 ? "text-red-600" : "text-amber-600"}>{p.stock}</b>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <div className="mb-2 font-bold">ອໍເດີຕາມສະຖານະ</div>
          {s.byStatus.length === 0 && <div className="text-sm text-slate-500">ຍັງບໍ່ມີອໍເດີ</div>}
          {s.byStatus.map((b) => (
            <div key={b.status} className="flex items-center justify-between py-1 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[b.status]}`}>{STATUS_LABEL[b.status]}</span>
              <b>{b.count}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Products
const EMPTY = {
  name: "", brand: "", category: "CPU", price: 0, stock: 0, description: "", image: "",
  cpu: "", ramGb: "", storageGb: "", gpu: "", usage: "", specs: "{}",
};
type Form = typeof EMPTY & { id?: string };

export function ProductsManager({ base, canCreate }: { base: "/seller" | "/admin"; canCreate: boolean }) {
  const [items, setItems] = useState<(Product & { shop?: { name: string } })[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Form | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Product[]>(`${base}/products?search=${encodeURIComponent(search)}`).then(setItems).catch((e) => setError(e.message));
  }, [base, search]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const updateStock = async (id: string, stock: number) => {
    await api(`${base}/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }).catch((e) => alert(e.message));
    load();
  };

  const toggleActive = async (p: Product) => {
    await api(`${base}/products/${p.id}`, { method: "PUT", body: JSON.stringify({ active: !p.active }) }).catch((e) => alert(e.message));
    load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`ລົບ "${p.name}" ?`)) return;
    try {
      const r = await api<{ softDeleted?: boolean }>(`${base}/products/${p.id}`, { method: "DELETE" });
      if (r.softDeleted) alert("ສິນຄ້ານີ້ມີໃນອໍເດີແລ້ວ ຈຶ່ງຖືກຊ່ອນແທນການລົບ");
    } catch (e: any) {
      alert(e.message);
    }
    load();
  };

  const openEdit = (p: Product) =>
    setEditing({
      id: p.id, name: p.name, brand: p.brand, category: p.category, price: p.price, stock: p.stock,
      description: p.description, image: p.image || "", cpu: p.cpu || "", ramGb: p.ramGb?.toString() || "",
      storageGb: p.storageGb?.toString() || "", gpu: p.gpu || "", usage: p.usage.join(","),
      specs: JSON.stringify(p.specs, null, 2),
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    let specs: Record<string, any>;
    try {
      specs = JSON.parse(editing.specs || "{}");
    } catch {
      return alert("Specs ຕ້ອງເປັນ JSON ທີ່ຖືກຕ້ອງ");
    }
    const body = {
      name: editing.name,
      brand: editing.brand,
      category: editing.category,
      price: Number(editing.price),
      stock: Number(editing.stock),
      description: editing.description,
      image: editing.image || null,
      cpu: editing.cpu || null,
      ramGb: editing.ramGb ? Number(editing.ramGb) : null,
      storageGb: editing.storageGb ? Number(editing.storageGb) : null,
      gpu: editing.gpu || null,
      usage: editing.usage.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
      specs,
    };
    try {
      await api(editing.id ? `${base}/products/${editing.id}` : `${base}/products`, {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setEditing(null);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<any>) => setEditing((p) => (p ? { ...p, [k]: e.target.value } : p));

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <input className="input max-w-xs" placeholder="ຄົ້ນຫາສິນຄ້າ…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {canCreate && <button className="btn-primary" onClick={() => setEditing({ ...EMPTY })}>+ ເພີ່ມສິນຄ້າ</button>}
      </div>
      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">ສິນຄ້າ</th>
              {base === "/admin" && <th className="p-3">ຮ້ານ</th>}
              <th className="p-3">ໝວດ</th><th className="p-3">ລາຄາ</th>
              <th className="p-3">ສະຕັອກ</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className={`border-t border-slate-100 ${p.active ? "" : "opacity-50"}`}>
                <td className="max-w-xs p-3">
                  <div className="line-clamp-1 font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.brand}{p.active ? "" : " · ຖືກຊ່ອນ"}</div>
                </td>
                {base === "/admin" && <td className="p-3">{p.shop?.name}</td>}
                <td className="p-3">{CATEGORY_LABEL[p.category]}</td>
                <td className="p-3 whitespace-nowrap">{formatLAK(p.price)}</td>
                <td className="p-3">
                  <input
                    type="number"
                    min={0}
                    defaultValue={p.stock}
                    key={p.id + p.stock}
                    onBlur={(e) => Number(e.target.value) !== p.stock && updateStock(p.id, Number(e.target.value))}
                    className={`input !w-20 ${p.stock <= 5 ? "!border-amber-400" : ""}`}
                  />
                </td>
                <td className="p-3 whitespace-nowrap text-right">
                  <button className="mr-3 text-brand-600 hover:underline" onClick={() => openEdit(p)}>ແກ້ໄຂ</button>
                  <button className="mr-3 text-slate-600 hover:underline" onClick={() => toggleActive(p)}>{p.active ? "ຊ່ອນ" : "ສະແດງ"}</button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(p)}>ລົບ</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">ຍັງບໍ່ມີສິນຄ້າ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={save} className="card my-8 w-full max-w-2xl p-5">
            <h3 className="mb-3 text-lg font-bold">{editing.id ? "ແກ້ໄຂສິນຄ້າ" : "ເພີ່ມສິນຄ້າ"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input sm:col-span-2" placeholder="ຊື່ສິນຄ້າ" value={editing.name} onChange={set("name")} required />
              <input className="input" placeholder="ຍີ່ຫໍ້" value={editing.brand} onChange={set("brand")} required />
              <select className="input" value={editing.category} onChange={set("category")}>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input className="input" type="number" min={0} placeholder="ລາຄາ (₭)" value={editing.price} onChange={set("price")} required />
              <input className="input" type="number" min={0} placeholder="ສະຕັອກ" value={editing.stock} onChange={set("stock")} required />
              <input className="input sm:col-span-2" placeholder="URL ຮູບສິນຄ້າ (ບໍ່ບັງຄັບ)" value={editing.image} onChange={set("image")} />
              <input className="input" placeholder="CPU (ເຊັ່ນ Intel Core i5)" value={editing.cpu} onChange={set("cpu")} />
              <input className="input" placeholder="GPU (ເຊັ່ນ NVIDIA RTX 4060)" value={editing.gpu} onChange={set("gpu")} />
              <input className="input" type="number" placeholder="RAM (GB)" value={editing.ramGb} onChange={set("ramGb")} />
              <input className="input" type="number" placeholder="Storage (GB)" value={editing.storageGb} onChange={set("storageGb")} />
              <input className="input sm:col-span-2" placeholder="ການໃຊ້ງານ: GAMING,WORKING,GRAPHIC" value={editing.usage} onChange={set("usage")} />
              <textarea className="input sm:col-span-2" rows={2} placeholder="ລາຍລະອຽດ" value={editing.description} onChange={set("description")} />
              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-slate-500">
                  Specs (JSON) — ສຳລັບ PC Builder ໃຊ້ key: socket, ramType, ramSlots, modules, formFactor, maxBoard, maxGpuMm, lengthMm, tdp, wattage
                </div>
                <textarea className="input font-mono text-xs" rows={7} value={editing.specs} onChange={set("specs")} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>ຍົກເລີກ</button>
              <button className="btn-primary">ບັນທຶກ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Orders
// Must match backend/src/lib/orderStatus.ts
const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["PAID", "SHIPPING", "CANCELLED"],
  PAID: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
const ADMIN_BACK: Record<string, string[]> = { PAID: ["PENDING"], SHIPPING: ["PAID"], COMPLETED: ["SHIPPING"] };

function allowedStatuses(current: string, asAdmin: boolean) {
  return [current, ...NEXT_STATUS[current], ...(asAdmin ? ADMIN_BACK[current] ?? [] : [])];
}

export function OrdersManager({ base }: { base: "/seller" | "/admin" }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Order[]>(`${base}/orders${filter ? `?status=${filter}` : ""}`).then(setOrders).catch((e) => setError(e.message));
  }, [base, filter]);
  useEffect(load, [load]);

  const setStatus = async (id: string, status: string) => {
    if (status === "CANCELLED" && !confirm("ຍົກເລີກອໍເດີ? ສະຕັອກຈະຖືກຄືນ")) return;
    await api(`${base}/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }).catch((e) => alert(e.message));
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["", "PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELLED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={filter === s ? "btn-primary" : "btn-outline"}>
            {s ? STATUS_LABEL[s] : "ທັງໝົດ"}
          </button>
        ))}
      </div>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <div className="flex flex-col gap-3">
        {orders.length === 0 && <div className="card p-6 text-center text-slate-500">ບໍ່ມີອໍເດີ</div>}
        {orders.map((o) => (
          <div key={o.id} className="card p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {o.user?.name} <span className="font-normal text-slate-500">({o.user?.email})</span>
                  {base === "/admin" && o.shop && <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs">{o.shop.name}</span>}
                </div>
                <div className="text-xs text-slate-500">#{o.id} · {new Date(o.createdAt).toLocaleString("lo-LA")}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                <select
                  className="input !w-auto"
                  value={o.status}
                  disabled={allowedStatuses(o.status, base === "/admin").length === 1}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {allowedStatuses(o.status, base === "/admin").map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2 text-slate-600">
              {o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-slate-500">
              <span>{o.recipient} · {o.phone} · {o.address}</span>
              <span>
                ຊຳລະ: <b>{o.paymentMethod}</b> · ລວມ <b className="text-brand-700">{formatLAK(o.total)}</b>
                {" · "}ຄ່າທຳນຽມ <b>{formatLAK(o.platformFee)}</b>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
