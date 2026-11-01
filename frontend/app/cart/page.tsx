"use client";
import { useState } from "react";
import Link from "next/link";
import { formatLAK } from "@/lib/api";
import { useCart } from "@/lib/cart";

export default function CartPage() {
  const { lines, groups, subtotal, coupon, discount, setQty, remove, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submitCoupon = async () => {
    if (!code.trim()) return;
    try {
      await applyCoupon(code);
      setMsg({ ok: true, text: "ໃຊ້ຄູປອງສຳເລັດ" });
      setCode("");
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  if (!lines.length) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl">🛒</div>
        <p className="mt-3 text-slate-600">ກະຕ່າຂອງທ່ານຍັງຫວ່າງ</p>
        <Link href="/" className="btn-primary mt-4">ເລືອກຊື້ສິນຄ້າ</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">ກະຕ່າສິນຄ້າ</h1>
        {groups.map((g) => (
          <div key={g.shopId} className="card divide-y divide-slate-100">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-sm">
              <span className="font-semibold">🏬 {g.shopName}</span>
              <span className="text-slate-500">ລວມຮ້ານນີ້ {formatLAK(g.subtotal)}</span>
            </div>
            {g.lines.map(({ product: p, qty }) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${p.id}`} className="line-clamp-2 font-medium hover:text-brand-600">{p.name}</Link>
                  <div className="text-sm text-slate-500">{formatLAK(p.price)} / ຊິ້ນ · ເຫຼືອ {p.stock} ຊິ້ນ</div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-outline !px-3" onClick={() => setQty(p.id, qty - 1)} disabled={qty <= 1}>−</button>
                  <input
                    className="input !w-14 text-center"
                    type="number"
                    min={1}
                    max={p.stock}
                    value={qty}
                    onChange={(e) => setQty(p.id, Number(e.target.value) || 1)}
                  />
                  <button className="btn-outline !px-3" onClick={() => setQty(p.id, qty + 1)} disabled={qty >= p.stock}>+</button>
                </div>
                <div className="w-32 text-right font-bold">{formatLAK(p.price * qty)}</div>
                <button className="text-sm text-red-600 hover:underline" onClick={() => remove(p.id)}>ລົບ</button>
              </div>
            ))}
          </div>
        ))}
        {groups.length > 1 && (
          <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
            ສິນຄ້າມາຈາກ {groups.length} ຮ້ານ — ລະບົບຈະແຍກເປັນ {groups.length} ອໍເດີ ແລະ ແຕ່ລະຮ້ານຈັດສົ່ງແຍກກັນ (ຄ່າຈັດສົ່ງຄິດຕໍ່ຮ້ານ).
          </div>
        )}
      </div>

      <aside className="card h-fit p-4">
        <div className="font-bold">ສະຫຼຸບຄຳສັ່ງຊື້</div>

        <div className="mt-3">
          <div className="mb-1 text-sm font-medium">ຄູປອງສ່ວນຫຼຸດ</div>
          {coupon ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-2 text-sm text-green-700">
              <span>{coupon.code} (−{coupon.percent}%)</span>
              <button className="underline" onClick={removeCoupon}>ຍົກເລີກ</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input className="input uppercase" placeholder="ໃສ່ໂຄດຄູປອງ" value={code} onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCoupon()} />
              <button className="btn-outline" onClick={submitCoupon}>ໃຊ້</button>
            </div>
          )}
          {msg && <div className={`mt-1 text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</div>}
        </div>

        <div className="mt-4 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between"><span>ລາຄາສິນຄ້າ</span><span>{formatLAK(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700"><span>ສ່ວນຫຼຸດ</span><span>−{formatLAK(discount)}</span></div>
          )}
          <div className="text-xs text-slate-500">ຄ່າຈັດສົ່ງຄຳນວນໃນຂັ້ນຕອນຊຳລະເງິນ</div>
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
          <span>ລວມ</span>
          <span className="text-brand-700">{formatLAK(subtotal - discount)}</span>
        </div>
        <Link href="/checkout" className="btn-primary mt-4 w-full">ດຳເນີນການຊຳລະເງິນ</Link>
      </aside>
    </div>
  );
}
