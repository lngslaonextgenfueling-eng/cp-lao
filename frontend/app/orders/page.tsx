"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatLAK, Order, STATUS_COLOR, STATUS_LABEL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STEPS = ["PENDING", "PAID", "SHIPPING", "COMPLETED"];
const PAY_LABEL = { QR: "QR Code", TRANSFER: "ໂອນເງິນ", COD: "ເກັບເງິນປາຍທາງ" } as const;

function Tracker({ status }: { status: string }) {
  if (status === "CANCELLED") return <div className="text-sm text-slate-500">ອໍເດີນີ້ຖືກຍົກເລີກ</div>;
  const idx = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center gap-1">
          <div className={`h-2 w-full rounded-full ${i <= idx ? "bg-brand-500" : "bg-slate-200"}`} />
          <span className={`text-[11px] ${i <= idx ? "font-semibold text-brand-700" : "text-slate-400"}`}>{STATUS_LABEL[s]}</span>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api<Order[]>("/orders").then(setOrders).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;
  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-slate-600">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງອໍເດີ</p>
        <Link href="/login?next=/orders" className="btn-primary mt-4">ເຂົ້າສູ່ລະບົບ</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">ປະຫວັດການສັ່ງຊື້</h1>
      {error && <div className="card mt-4 p-4 text-red-600">{error}</div>}
      {orders && orders.length === 0 && <div className="card mt-4 p-8 text-center text-slate-500">ຍັງບໍ່ມີອໍເດີ</div>}

      <div className="mt-4 flex flex-col gap-4">
        {orders?.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">🏬 {o.shop?.name}</div>
                <div className="text-xs text-slate-500">#{o.id}</div>
                <div className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString("lo-LA")}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
            </div>

            <div className="mt-4">
              <Tracker status={o.status} />
            </div>

            <div className="mt-4 divide-y divide-slate-100 text-sm">
              {o.items.map((i) => (
                <div key={i.id} className="flex justify-between gap-3 py-1.5">
                  <span>{i.name} × {i.qty}</span>
                  <span className="whitespace-nowrap">{formatLAK(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-slate-200 pt-3 text-sm">
              <div className="text-slate-500">
                {PAY_LABEL[o.paymentMethod]} · ສົ່ງຫາ {o.recipient}, {o.address}
                {o.paymentMethod !== "COD" && o.status === "PENDING" && o.shop?.accountNo && (
                  <div className="mt-1 text-xs">ໂອນເຂົ້າ: {o.shop.bankName} · {o.shop.accountName} · <b>{o.shop.accountNo}</b></div>
                )}
              </div>
              <div className="text-lg font-bold text-brand-700">{formatLAK(o.total)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
