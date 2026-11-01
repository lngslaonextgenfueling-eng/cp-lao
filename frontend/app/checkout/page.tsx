"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatLAK, Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

interface ShippingInfo {
  options: { id: string; label: string; fee: number }[];
}

const PAYMENT_OPTIONS = [
  { id: "QR", label: "ສະແກນ QR Code (BCEL One / ທະນາຄານໃນລາວ)" },
  { id: "TRANSFER", label: "ໂອນເງິນຜ່ານບັນຊີທະນາຄານ" },
  { id: "COD", label: "ເກັບເງິນປາຍທາງ (COD)" },
] as const;

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { lines, groups, subtotal, coupon, discount, clear } = useCart();
  const [info, setInfo] = useState<ShippingInfo | null>(null);
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [shipping, setShipping] = useState("standard");
  const [payment, setPayment] = useState<"QR" | "TRANSFER" | "COD">("QR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order[] | null>(null);

  useEffect(() => {
    api<ShippingInfo>("/orders/shipping-options").then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setRecipient((r) => r || user.name);
  }, [user]);

  // shipping is charged once per shop
  const feePerShop = info?.options.find((o) => o.id === shipping)?.fee ?? 0;
  const fee = feePerShop * groups.length;
  const total = subtotal - discount + fee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const r = await api<{ groupId: string; orders: Order[] }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
          recipient,
          phone,
          address,
          note: note || undefined,
          shippingMethod: shipping,
          paymentMethod: payment,
          couponCode: coupon?.code,
        }),
      });
      clear();
      setPlaced(r.orders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    const grand = placed.reduce((s, o) => s + o.total, 0);
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-2 text-xl font-bold">ສັ່ງຊື້ສຳເລັດ!</h1>
          <p className="text-sm text-slate-500">
            {placed.length > 1 ? `ແຍກເປັນ ${placed.length} ອໍເດີ ຕາມຮ້ານ · ` : ""}ລວມທັງໝົດ {formatLAK(grand)}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {placed.map((o) => (
            <div key={o.id} className="card p-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-bold">🏬 {o.shop?.name}</div>
                <div className="font-bold text-brand-700">{formatLAK(o.total)}</div>
              </div>
              <div className="text-xs text-slate-500">ອໍເດີ #{o.id}</div>
              <div className="mt-2 text-slate-600">{o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}</div>

              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                {o.paymentMethod === "COD" ? (
                  <p className="text-slate-600">ກະລຸນາກຽມເງິນສົດ {formatLAK(o.total)} ຈ່າຍໃຫ້ຮ້ານເມື່ອໄດ້ຮັບສິນຄ້າ.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 text-slate-700">
                    {o.paymentMethod === "QR" && (
                      <div className="mx-auto mb-1 flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-center text-xs text-slate-500">
                        QR Code ຂອງຮ້ານ
                        <br />
                        (ຮ້ານສົ່ງໃຫ້ທາງ {o.shop?.phone || "ເບີຮ້ານ"})
                      </div>
                    )}
                    {o.shop?.accountNo ? (
                      <>
                        <div>ທະນາຄານ: <b>{o.shop.bankName}</b></div>
                        <div>ຊື່ບັນຊີ: <b>{o.shop.accountName}</b></div>
                        <div>ເລກບັນຊີ: <b>{o.shop.accountNo}</b></div>
                      </>
                    ) : (
                      <div>ຮ້ານຍັງບໍ່ໄດ້ຕັ້ງບັນຊີຮັບເງິນ ກະລຸນາຕິດຕໍ່ຮ້ານ: <b>{o.shop?.phone || "-"}</b></div>
                    )}
                    <p className="text-xs text-slate-500">
                      ຫຼັງໂອນແລ້ວ ຮ້ານຈະກວດສອບ ແລະ ອັບເດດສະຖານະເປັນ “ຊຳລະແລ້ວ” ໃຫ້.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <Link href="/orders" className="btn-primary flex-1">ເບິ່ງອໍເດີຂອງຂ້ອຍ</Link>
          <Link href="/" className="btn-outline flex-1">ເລືອກຊື້ຕໍ່</Link>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-600">ກະຕ່າຫວ່າງ</p>
        <Link href="/" className="btn-primary mt-4">ເລືອກຊື້ສິນຄ້າ</Link>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-slate-600">ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຊຳລະເງິນ</p>
        <Link href="/login?next=/checkout" className="btn-primary mt-4">ເຂົ້າສູ່ລະບົບ / ສະໝັກສະມາຊິກ</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <section className="card p-4">
          <h2 className="mb-3 font-bold">1. ທີ່ຢູ່ຈັດສົ່ງ</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="ຊື່ຜູ້ຮັບ" value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
            <input className="input" placeholder="ເບີໂທ (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <textarea className="input sm:col-span-2" rows={3} placeholder="ທີ່ຢູ່ (ບ້ານ, ເມືອງ, ແຂວງ)" value={address} onChange={(e) => setAddress(e.target.value)} required />
            <input className="input sm:col-span-2" placeholder="ໝາຍເຫດ (ບໍ່ບັງຄັບ)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-1 font-bold">2. ວິທີຈັດສົ່ງ</h2>
          {groups.length > 1 && <p className="mb-3 text-xs text-slate-500">ຄ່າຈັດສົ່ງຄິດຕໍ່ 1 ຮ້ານ × {groups.length} ຮ້ານ</p>}
          <div className="flex flex-col gap-2">
            {(info?.options ?? []).map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <span className="flex items-center gap-2">
                  <input type="radio" name="shipping" checked={shipping === o.id} onChange={() => setShipping(o.id)} className="accent-brand-600" />
                  {o.label}
                </span>
                <span className="font-semibold">{o.fee ? formatLAK(o.fee) : "ຟຣີ"}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-1 font-bold">3. ວິທີຊຳລະເງິນ</h2>
          <p className="mb-3 text-xs text-slate-500">ເງິນຈ່າຍເຂົ້າບັນຊີຂອງແຕ່ລະຮ້ານໂດຍກົງ — ຈະສະແດງເລກບັນຊີຫຼັງຢືນຢັນສັ່ງຊື້.</p>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="payment" checked={payment === o.id} onChange={() => setPayment(o.id)} className="accent-brand-600" />
                {o.label}
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="card h-fit p-4">
        <div className="font-bold">ສະຫຼຸບ</div>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          {groups.map((g) => (
            <div key={g.shopId}>
              <div className="mb-1 text-xs font-semibold text-slate-500">🏬 {g.shopName}</div>
              {g.lines.map((l) => (
                <div key={l.product.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-slate-600">{l.product.name} × {l.qty}</span>
                  <span className="whitespace-nowrap">{formatLAK(l.product.price * l.qty)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between"><span>ລາຄາສິນຄ້າ</span><span>{formatLAK(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><span>ສ່ວນຫຼຸດ ({coupon?.code})</span><span>−{formatLAK(discount)}</span></div>}
          <div className="flex justify-between">
            <span>ຄ່າຈັດສົ່ງ{groups.length > 1 ? ` (${groups.length} ຮ້ານ)` : ""}</span>
            <span>{fee ? formatLAK(fee) : "ຟຣີ"}</span>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
          <span>ລວມທັງໝົດ</span>
          <span className="text-brand-700">{formatLAK(total)}</span>
        </div>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <button className="btn-primary mt-4 w-full" disabled={submitting}>
          {submitting ? "ກຳລັງສົ່ງຄຳສັ່ງຊື້…" : "ຢືນຢັນສັ່ງຊື້"}
        </button>
      </aside>
    </form>
  );
}
