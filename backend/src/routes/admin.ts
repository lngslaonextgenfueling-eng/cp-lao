import { Router } from "express";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";
import { productSchema } from "../lib/productSchema";
import { changeOrderStatus } from "../lib/orderStatus";
import { getStats } from "../lib/stats";

const router = Router();
router.use(requireAdmin);

// ---------- Shops (approval, suspension, commission) ----------
router.get("/shops", async (_req, res) => {
  const shops = await prisma.shop.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { products: true, orders: true } },
    },
  });
  res.json(shops);
});

router.patch("/shops/:id", async (req, res) => {
  const parsed = z
    .object({
      status: z.enum(["PENDING", "APPROVED", "SUSPENDED"]).optional(),
      commissionPercent: z.number().int().min(0).max(50).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ" });

  const shop = await prisma.shop.findUnique({ where: { id: req.params.id } });
  if (!shop) return res.status(404).json({ error: "ບໍ່ພົບຮ້ານຄ້າ" });

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shop.update({ where: { id: shop.id }, data: parsed.data });
    // Approved owners become SELLER (admins keep their role)
    if (parsed.data.status === "APPROVED") {
      await tx.user.updateMany({ where: { id: shop.ownerId, role: "CUSTOMER" }, data: { role: "SELLER" } });
    }
    return s;
  });
  res.json(updated);
});

// ---------- Product moderation (all shops) ----------
router.get("/products", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const items = await prisma.product.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    include: { shop: { select: { id: true, name: true } } },
  });
  res.json(items);
});

router.put("/products/:id", async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  try {
    res.json(await prisma.product.update({ where: { id: req.params.id }, data: parsed.data }));
  } catch {
    res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  }
});

router.patch("/products/:id/stock", async (req, res) => {
  const parsed = z.object({ stock: z.number().int().min(0) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຈຳນວນບໍ່ຖືກຕ້ອງ" });
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { stock: parsed.data.stock } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  }
});

router.delete("/products/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  const used = await prisma.orderItem.count({ where: { productId: product.id } });
  if (used > 0) {
    await prisma.product.update({ where: { id: product.id }, data: { active: false } });
    return res.json({ ok: true, softDeleted: true });
  }
  await prisma.product.delete({ where: { id: product.id } });
  res.json({ ok: true });
});

// ---------- Orders (all shops) ----------
router.get("/orders", async (req, res) => {
  const status = typeof req.query.status === "string" ? (req.query.status as OrderStatus) : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
      shop: { select: { id: true, name: true } },
    },
  });
  res.json(orders);
});

router.patch("/orders/:id/status", async (req, res) => {
  const parsed = z.object({ status: z.enum(["PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELLED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ສະຖານະບໍ່ຖືກຕ້ອງ" });
  const r = await changeOrderStatus(req.params.id, parsed.data.status);
  if (!r.ok) return res.status(r.code).json({ error: r.error });
  res.json({ ok: true });
});

// ---------- Platform analytics ----------
router.get("/stats", async (_req, res) => {
  const [stats, shopsByStatus] = await Promise.all([
    getStats(),
    prisma.shop.groupBy({ by: ["status"], _count: true }),
  ]);
  res.json({ ...stats, shopsByStatus: shopsByStatus.map((s) => ({ status: s.status, count: s._count })) });
});

// ---------- Coupons (platform-wide) ----------
router.get("/coupons", async (_req, res) => res.json(await prisma.coupon.findMany({ orderBy: { code: "asc" } })));

router.post("/coupons", async (req, res) => {
  const parsed = z.object({ code: z.string().min(2), percent: z.number().int().min(1).max(90) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຂໍ້ມູນຄູປອງບໍ່ຖືກຕ້ອງ" });
  const code = parsed.data.code.toUpperCase();
  res.status(201).json(
    await prisma.coupon.upsert({
      where: { code },
      update: { percent: parsed.data.percent, active: true },
      create: { code, percent: parsed.data.percent },
    })
  );
});

export default router;
