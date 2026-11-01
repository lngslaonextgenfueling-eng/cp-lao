"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, MyShop, SHOP_STATUS_COLOR, SHOP_STATUS_LABEL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { OrdersManager, ProductsManager, StatsView } from "@/components/dashboard";

type Tab = "stats" | "products" | "orders" | "profile";

const EMPTY = { name: "", description: "", phone: "", address: "", bankName: "", accountName: "", accountNo: "" };

function ShopForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: typeof EMPTY;
  submitLabel: string;
  onSubmit: (v: typeof EMPTY) => Promise<void>;
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<any>) => {
    setSaved(false);
    setV((p) => ({ ...p, [k]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(v);
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className="input sm:col-span-2" placeholder="ຊື່ຮ້ານ *" value={v.name} onChange={set("name")} required />
      <textarea className="input sm:col-span-2" rows={3} placeholder="ແນະນຳຮ້ານ" value={v.description} onChange={set("description")} />
      <input className="input" placeholder="ເບີໂທຮ້ານ *" value={v.phone} onChange={set("phone")} required />
      <input className="input" placeholder="ທີ່ຢູ່ຮ້ານ" value={v.address} onChange={set("address")} />

      <div className="mt-2 sm:col-span-2">
        <div className="font-semibold">ບັນຊີຮັບເງິນ</div>
        <div className="text-xs text-slate-500">ສະແດງໃຫ້ລູກຄ້າເຫັນຕອນເລືອກຊຳລະແບບ QR / ໂອນເງິນ. ເງິນເຂົ້າບັນຊີຂອງທ່ານໂດຍກົງ.</div>
      </div>
      <input className="input" placeholder="ທະນາຄານ (ເຊັ່ນ BCEL)" value={v.bankName} onChange={set("bankName")} />
      <input className="input" placeholder="ຊື່ບັນຊີ" value={v.accountName} onChange={set("accountName")} />
      <input className="input sm:col-span-2" placeholder="ເລກບັນຊີ" value={v.accountNo} onChange={set("accountNo")} />

      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700 sm:col-span-2">{error}</div>}
      {saved && <div className="rounded-lg bg-green-50 p-2 text-sm text-green-700 sm:col-span-2">ບັນທຶກແລ້ວ</div>}
      <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "ກະລຸນາລໍຖ້າ…" : submitLabel}</button>
    </form>
  );
}

const toForm = (s: MyShop): typeof EMPTY => ({
  name: s.name,
  description: s.description || "",
  phone: s.phone || "",
  address: s.address || "",
  bankName: s.bankName || "",
  accountName: s.accountName || "",
  accountNo: s.accountNo || "",
});

export default function SellerPage() {
  const { user, loading, refresh } = useAuth();
  const [shop, setShop] = useState<MyShop | null | undefined>(undefined); // undefined = loading
  const [tab, setTab] = useState<Tab>("stats");

  const loadShop = () =>
    api<{ shop: MyShop | null }>("/seller/shop")
      .then((r) => setShop(r.shop))
      .catch(() => setShop(null));

  useEffect(() => {
    if (user) loadShop();
  }, [user]);

  if (loading) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;
  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-slate-600">ກະລຸນາເຂົ້າສູ່ລະບົບ ຫຼື ສະໝັກສະມາຊິກກ່ອນເປີດຮ້ານ</p>
        <Link href="/login?next=/seller" className="btn-primary mt-4">ເຂົ້າສູ່ລະບົບ / ສະໝັກສະມາຊິກ</Link>
      </div>
    );
  }
  if (shop === undefined) return <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>;

  // ---- No shop yet → application form
  if (shop === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">ເປີດຮ້ານຂາຍສິນຄ້າໃນ PC SHOP</h1>
        <p className="mt-1 text-sm text-slate-600">
          ສະໝັກເປີດຮ້ານຟຣີ. ຫຼັງ Admin ອະນຸມັດ ທ່ານສາມາດລົງສິນຄ້າ, ຈັດການສະຕັອກ ແລະ ອໍເດີຂອງຮ້ານຕົນເອງໄດ້. ແພລດຟອມເກັບຄ່າທຳນຽມຈາກຍອດຂາຍ.
        </p>
        <div className="card mt-5 p-5">
          <ShopForm
            initial={{ ...EMPTY, phone: "" }}
            submitLabel="ສົ່ງຄຳຂໍເປີດຮ້ານ"
            onSubmit={async (v) => {
              await api("/seller/apply", { method: "POST", body: JSON.stringify(v) });
              await Promise.all([loadShop(), refresh()]);
            }}
          />
        </div>
      </div>
    );
  }

  // ---- Shop exists but not active
  if (shop.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-6 text-center">
          <div className="text-4xl">{shop.status === "PENDING" ? "⏳" : "⛔"}</div>
          <h1 className="mt-2 text-xl font-bold">{shop.name}</h1>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${SHOP_STATUS_COLOR[shop.status]}`}>
            {SHOP_STATUS_LABEL[shop.status]}
          </span>
          <p className="mt-3 text-sm text-slate-600">
            {shop.status === "PENDING"
              ? "ຄຳຂໍເປີດຮ້ານຂອງທ່ານກຳລັງລໍຖ້າ Admin ກວດສອບ. ເມື່ອອະນຸມັດແລ້ວ ກົດ “ກວດສອບສະຖານະ” ເພື່ອເຂົ້າແດຊບອດ."
              : "ຮ້ານນີ້ຖືກລະງັບການໃຊ້ງານ. ກະລຸນາຕິດຕໍ່ Admin ຂອງແພລດຟອມ."}
          </p>
          <button
            className="btn-outline mt-4"
            onClick={async () => {
              await Promise.all([loadShop(), refresh()]);
            }}
          >
            ກວດສອບສະຖານະ
          </button>
        </div>
      </div>
    );
  }

  // ---- Approved shop dashboard
  const tabs: [Tab, string][] = [
    ["stats", "ຍອດຂາຍ"],
    ["products", "ສິນຄ້າ & ສະຕັອກ"],
    ["orders", "ອໍເດີ"],
    ["profile", "ຂໍ້ມູນຮ້ານ"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          <div className="text-sm text-slate-500">
            ຄ່າທຳນຽມແພລດຟອມ {shop.commissionPercent}% ·{" "}
            <Link href={`/shops/${shop.slug}`} className="text-brand-600 hover:underline">ເບິ່ງໜ້າຮ້ານ</Link>
          </div>
        </div>
      </div>

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
        {tab === "stats" && <StatsView base="/seller" mode="seller" />}
        {tab === "products" && <ProductsManager base="/seller" canCreate />}
        {tab === "orders" && <OrdersManager base="/seller" />}
        {tab === "profile" && (
          <div className="card max-w-2xl p-5">
            <ShopForm
              initial={toForm(shop)}
              submitLabel="ບັນທຶກຂໍ້ມູນຮ້ານ"
              onSubmit={async (v) => {
                await api("/seller/shop", { method: "PUT", body: JSON.stringify(v) });
                await loadShop();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
