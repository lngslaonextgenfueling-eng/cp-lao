"use client";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { api, CATEGORY_LABEL, Product } from "@/lib/api";

interface Filters {
  brands: string[];
  ram: number[];
  storage: number[];
  cpu: string[];
  gpu: string[];
  usage: string[];
}

const USAGE_LABEL: Record<string, string> = { GAMING: "ເກມມິງ (Gaming)", WORKING: "ເຮັດວຽກ (Working)", GRAPHIC: "ກຣາຟິກ (Graphic)" };

function CheckGroup({
  title,
  options,
  selected,
  onToggle,
  label = (v: string) => v,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  label?: (v: string) => string;
}) {
  if (!options.length) return null;
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="accent-brand-600" />
            {label(o)}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [options, setOptions] = useState<Filters | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [cpu, setCpu] = useState<string[]>([]);
  const [ram, setRam] = useState<string[]>([]);
  const [storage, setStorage] = useState<string[]>([]);
  const [gpu, setGpu] = useState<string[]>([]);
  const [usage, setUsage] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");

  const toggle = (set: (f: (p: string[]) => string[]) => void) => (v: string) => {
    setPage(1);
    set((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  };

  useEffect(() => {
    api<Filters>("/products/filters").then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (debounced) p.set("search", debounced);
    if (category.length) p.set("category", category.join(","));
    if (brand.length) p.set("brand", brand.join(","));
    if (cpu.length) p.set("cpu", cpu.join(","));
    if (ram.length) p.set("ram", ram.join(","));
    if (storage.length) p.set("storage", storage.join(","));
    if (gpu.length) p.set("gpu", gpu.join(","));
    if (usage.length) p.set("usage", usage.join(","));
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", "12");
    return p.toString();
  }, [debounced, category, brand, cpu, ram, storage, gpu, usage, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    setLoading(true);
    setError("");
    api<{ items: Product[]; total: number; pages: number }>(`/products?${query}`)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setPages(r.pages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);

  const reset = () => {
    setSearch(""); setCategory([]); setBrand([]); setCpu([]); setRam([]); setStorage([]); setGpu([]); setUsage([]);
    setMinPrice(""); setMaxPrice(""); setSort("newest"); setPage(1);
  };

  return (
    <div>
      <section className="mb-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 p-8 text-white">
        <h1 className="text-3xl font-bold">ຕະຫຼາດຄອມພິວເຕີ & ອຸປະກອນໄອທີ ຈາກຫຼາຍຮ້ານໃນທີ່ດຽວ</h1>
        <p className="mt-2 max-w-xl text-brand-100">
          ເລືອກຊື້ຈາກຫຼາຍຮ້ານໃນກະຕ່າດຽວ, ຈັດສະເປັກຄອມເອງແບບກວດຄວາມເຂົ້າກັນໄດ້ອັດຕະໂນມັດ ຫຼື ເປີດຮ້ານຂອງທ່ານເອງ.
        </p>
        <div className="mt-5 flex max-w-xl gap-2">
          <input
            className="input !border-0 text-slate-800"
            placeholder="ຄົ້ນຫາສິນຄ້າ ເຊັ່ນ RTX 4060, Ryzen 5…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card flex h-fit flex-col gap-5 p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold">ຕົວກັ່ນຕອງ</div>
            <button onClick={reset} className="text-xs text-brand-600 hover:underline">ລ້າງທັງໝົດ</button>
          </div>

          <CheckGroup
            title="ໝວດໝູ່"
            options={Object.keys(CATEGORY_LABEL)}
            selected={category}
            onToggle={toggle(setCategory)}
            label={(v) => CATEGORY_LABEL[v]}
          />
          <CheckGroup title="ຍີ່ຫໍ້ (Brand)" options={options?.brands ?? []} selected={brand} onToggle={toggle(setBrand)} />

          <div>
            <div className="mb-2 text-sm font-semibold">ລາຄາ (₭)</div>
            <div className="flex items-center gap-2">
              <input className="input" type="number" min={0} placeholder="ຕ່ຳສຸດ" value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
              <span>–</span>
              <input className="input" type="number" min={0} placeholder="ສູງສຸດ" value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
            </div>
          </div>

          <CheckGroup title="ການໃຊ້ງານ" options={options?.usage ?? []} selected={usage} onToggle={toggle(setUsage)} label={(v) => USAGE_LABEL[v] || v} />
          <CheckGroup title="CPU" options={(options?.cpu ?? []) as string[]} selected={cpu} onToggle={toggle(setCpu)} />
          <CheckGroup title="RAM" options={(options?.ram ?? []).map(String)} selected={ram} onToggle={toggle(setRam)} label={(v) => `${v} GB`} />
          <CheckGroup title="Storage" options={(options?.storage ?? []).map(String)} selected={storage} onToggle={toggle(setStorage)}
            label={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000} TB` : `${v} GB`)} />
          <CheckGroup title="GPU" options={(options?.gpu ?? []) as string[]} selected={gpu} onToggle={toggle(setGpu)} />
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">ພົບ {total} ລາຍການ</div>
            <select className="input !w-auto" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="newest">ໃໝ່ລ່າສຸດ</option>
              <option value="price_asc">ລາຄາ: ຕ່ຳ → ສູງ</option>
              <option value="price_desc">ລາຄາ: ສູງ → ຕ່ຳ</option>
            </select>
          </div>

          {error && <div className="card p-4 text-red-600">{error} — ກວດວ່າ Backend ເປີດຢູ່ບໍ່</div>}
          {loading && !items.length ? (
            <div className="p-10 text-center text-slate-500">ກຳລັງໂຫຼດ…</div>
          ) : !items.length && !error ? (
            <div className="card p-10 text-center text-slate-500">ບໍ່ພົບສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂ</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>← ກ່ອນໜ້າ</button>
              <span className="text-sm">{page} / {pages}</span>
              <button className="btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>ຖັດໄປ →</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
