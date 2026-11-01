import { Router } from "express";
import { Category, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const router = Router();

// Only active products from APPROVED shops are public
const visible: Prisma.ProductWhereInput = { active: true, shop: { status: "APPROVED" } };
const withShop = { shop: { select: { id: true, name: true, slug: true } } } as const;

const num = (v: unknown) => (v !== undefined && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);
const list = (v: unknown) =>
  typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

// GET /api/products?search=&brand=ASUS,MSI&category=GPU&minPrice=&maxPrice=&cpu=&ram=16,32&storage=512&gpu=&usage=GAMING&sort=price_asc&page=1&limit=12
router.get("/", async (req, res) => {
  const q = req.query;
  const where: Prisma.ProductWhereInput = { ...visible };

  if (typeof q.search === "string" && q.search.trim()) {
    where.OR = [
      { name: { contains: q.search.trim(), mode: "insensitive" } },
      { brand: { contains: q.search.trim(), mode: "insensitive" } },
      { description: { contains: q.search.trim(), mode: "insensitive" } },
    ];
  }

  const brands = list(q.brand);
  if (brands) where.brand = { in: brands };

  if (typeof q.shop === "string" && q.shop) where.shopId = q.shop;

  const categories = list(q.category);
  if (categories) where.category = { in: categories as Category[] };

  const minPrice = num(q.minPrice);
  const maxPrice = num(q.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) };
  }

  const andFilters: Prisma.ProductWhereInput[] = [];

  const cpus = list(q.cpu);
  if (cpus) andFilters.push({ OR: cpus.map((c) => ({ cpu: { contains: c, mode: "insensitive" as const } })) });

  const rams = list(q.ram)?.map(Number).filter((n) => !isNaN(n));
  if (rams?.length) where.ramGb = { in: rams };

  const storages = list(q.storage)?.map(Number).filter((n) => !isNaN(n));
  if (storages?.length) where.storageGb = { in: storages };

  const gpus = list(q.gpu);
  if (gpus) andFilters.push({ OR: gpus.map((g) => ({ gpu: { contains: g, mode: "insensitive" as const } })) });
  if (andFilters.length) where.AND = andFilters;

  const usage = list(q.usage)?.map((u) => u.toUpperCase());
  if (usage) where.usage = { hasSome: usage };

  const sort = String(q.sort || "newest");
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };

  const page = Math.max(1, num(q.page) ?? 1);
  const limit = Math.min(60, Math.max(1, num(q.limit) ?? 12));

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: withShop }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// Distinct values to populate filter sidebar
router.get("/filters", async (_req, res) => {
  const [brands, rams, storages, cpus, gpus] = await Promise.all([
    prisma.product.findMany({ where: visible, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    prisma.product.findMany({ where: { ...visible, ramGb: { not: null } }, distinct: ["ramGb"], select: { ramGb: true }, orderBy: { ramGb: "asc" } }),
    prisma.product.findMany({ where: { ...visible, storageGb: { not: null } }, distinct: ["storageGb"], select: { storageGb: true }, orderBy: { storageGb: "asc" } }),
    prisma.product.findMany({ where: { ...visible, cpu: { not: null } }, distinct: ["cpu"], select: { cpu: true }, orderBy: { cpu: "asc" } }),
    prisma.product.findMany({ where: { ...visible, gpu: { not: null } }, distinct: ["gpu"], select: { gpu: true }, orderBy: { gpu: "asc" } }),
  ]);
  res.json({
    brands: brands.map((b) => b.brand),
    ram: rams.map((r) => r.ramGb),
    storage: storages.map((s) => s.storageGb),
    cpu: cpus.map((c) => c.cpu),
    gpu: gpus.map((g) => g.gpu),
    usage: ["GAMING", "WORKING", "GRAPHIC"],
  });
});

router.get("/:id", async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: req.params.id, ...visible }, include: withShop });
  if (!product) return res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  res.json({ ...product, inStock: product.stock > 0 });
});

export default router;
