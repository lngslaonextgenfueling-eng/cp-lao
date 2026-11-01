"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, SHOP_STATUS_COLOR, SHOP_STATUS_LABEL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { OrdersManager, ProductsManager, StatsView } from "@/components/dashboard";

interface AdminShop {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNo: string | null;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  commissionPercent: number;
  createdAt: string;
  owner: { name: string; email: string };
  _count: { products: number; orders: number };
}

type Tab = "stats" | "shops" | "products" | "orders" | "coupons";

function ShopsTab() {
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<AdminShop[]>("/admin/shops").then(setShops).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const patch = async (id: string, body: object) => {
    await api(`/admin/shops/${id}`, { method: "PATCH", body: JSON.stringify(body) }).catch((e) => alert(e.message));
    load();
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="text-red-600">{error}</div>}
      {shops.length === 0 && <div className="card p-6 text-center text-slate-500">ຍັງບໍ່ມີຮ້ານຄ້າ</div>}
      {shops.map((s) => (
        <div key={s.id} className="card p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{s.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SHOP_STATUS_COLOR[s.status]}`}>
                  {SHOP_STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="text-slate-500">
                ເຈົ້າຂອງ: {s.owner.name} ({s.owner.email}) · ເບີ {s.phone || "-"}
              </div>
              <div className="text-slate-500">
                ບັນຊີ: {s.bankName || "-"} · {s.accountName || "-"} · {s.accountNo || "-"}
              </div>
              <div className="text-slate-500">ສິນຄ້າ {s._count.products} · ອໍເດີ {s._count.orders}</div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <label className="flex items-center gap-2">
                ຄ່າທຳນຽມ
                <input
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={s.commissionPercent}
                  key={s.id + s.commissionPercent}
                  className="input !w-20"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== s.commissionPercent && v >= 0 && v <= 50) patch(s.id, { commissionPercent: v });
                  }}
                />
                %
              </label>
              <div className="flex gap-2">
                {s.status !== "APPROVED" && (
                  <button className="btn-primary" onClick={() => patch(s.id, { status: "APPROVED" })}>
                    {s.status === "PENDING" ? "ອະນຸມັດຮ້ານ" : "ເປີດໃຊ້ງານຄືນ"}
                  </button>
                )}
                {s.status !== "SUSPENDED" && (
                  <button
                    className="btn-danger"
                    onClick={() => confirm(`ລະງັບຮ້ານ "${s.name}" ? ສິນຄ້າຈະຖືກຊ່ອນຈາກໜ້າເວັບ`) && patch(s.id, { status: "SUSPENDED" })}
                  >
                    ລະງັບ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CouponsTab() {
  const [coupons, setCoupons] = useState<{ id: string; code: string; percent: number; active: boolean }[]>([]);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");

  const load = useCallback(() => {
    api<typeof coupons>("/admin/coupons").then(setCoupons).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/admin/coupons", { method: "POST", body: JSON.stringify({ code, percent: Number(percent) }) }).catch((e) => alert(e.message));
    setCode("");
    load();
  };

  return (
    <div className="max-w-xl">
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className="input uppercase" placeholder="ໂຄດຄູປອງ" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input className="input !w-24" type="number" min={1} max={90} value={percent} onChange={(e) => setPercent(e.target.value)} required />
        <button className="btn-primary whitespace-nowrap">ເພີ່ມ / ອັບເດດ</button>
      </form>
      <div className="card divide-y divide-slate-100 text-sm">
        {coupons.map((c) => (
          <div key={c.id} className="flex justify-between p-3">
            <b>{c.code}</b>
            <span>ຫຼຸດ {c.percent}%</span>
          </div>
        ))}
        {coupons.length === 0 && <div className="p-4 text-slate-500">ຍັງບໍ່ມີຄູປອງ</div>}
      </div>
      <p className="mt-2 text-xs text-slate-500">ຄູປອງໃຊ້ໄດ້ທຸກຮ້ານ ແລະ ສ່ວນຫຼຸດຖືກຫັກຈາກຍອດຂອງຮ້ານນັ້ນໆ (ຄ່າທຳນຽມຄິດຫຼັງຫັກສ່ວນຫຼຸດ).</p>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");

  if (loading) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-slate-600">ໜ້ານີ້ສະເພາະ Admin ຂອງແພລດຟອມເທົ່ານັ້ນ</p>
        <Link href="/login?next=/admin" className="btn-primary mt-4">ເຂົ້າສູ່ລະບົບ</Link>
      </div>
    );
  }

  const tabs: [Tab, string][] = [
    ["stats", "ພາບລວມແພລດຟອມ"],
    ["shops", "ຮ້ານຄ້າ"],
    ["products", "ສິນຄ້າທັງໝົດ"],
    ["orders", "ອໍເດີທັງໝົດ"],
    ["coupons", "ຄູປອງ"],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Platform Admin</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "stats" && <StatsView base="/admin" mode="admin" />}
        {tab === "shops" && <ShopsTab />}
        {tab === "products" && <ProductsManager base="/admin" canCreate={false} />}
        {tab === "orders" && <OrdersManager base="/admin" />}
        {tab === "coupons" && <CouponsTab />}
      </div>
    </div>
  );
}
