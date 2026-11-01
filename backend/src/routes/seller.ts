import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireShop } from "../middleware/auth";
import { productSchema } from "../lib/productSchema";
import { changeOrderStatus } from "../lib/orderStatus";
import { getStats } from "../lib/stats";

const router = Router();

const shopFields = z.object({
  name: z.string().trim().min(2, "ກະລຸນາໃສ່ຊື່ຮ້ານ"),
  description: z.string().default(""),
  phone: z.string().trim().min(6, "ກະລຸນາໃສ່ເບີໂທຮ້ານ"),
  address: z.string().default(""),
  logo: z.string().nullable().optional(),
  bankName: z.string().default(""),
  accountName: z.string().default(""),
  accountNo: z.string().default(""),
});

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "shop";
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await prisma.shop.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return slug;
}

// ---------- Shop profile (works for PENDING / SUSPENDED shops too) ----------
router.get("/shop", requireAuth, async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { ownerId: req.user!.id } });
  res.json({ shop });
});

router.post("/apply", requireAuth, async (req, res) => {
  const parsed = shopFields.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  if (await prisma.shop.findUnique({ where: { ownerId: req.user!.id } })) {
    return res.status(409).json({ error: "ທ່ານມີຮ້ານຄ້າແລ້ວ" });
  }
  const shop = await prisma.shop.create({
    data: { ...parsed.data, ownerId: req.user!.id, slug: await uniqueSlug(parsed.data.name) },
  });
  res.status(201).json({ shop });
});

router.put("/shop", requireAuth, async (req, res) => {
  const parsed = shopFields.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const existing = await prisma.shop.findUnique({ where: { ownerId: req.user!.id } });
  if (!existing) return res.status(404).json({ error: "ທ່ານຍັງບໍ່ມີຮ້ານຄ້າ" });
  // slug, status and commission are controlled by the platform, not the seller
  const shop = await prisma.shop.update({ where: { id: existing.id }, data: parsed.data });
  res.json({ shop });
});

// ---------- Everything below needs an APPROVED shop ----------
router.use(requireShop);

router.get("/products", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const items = await prisma.product.findMany({
    where: { shopId: req.shop!.id, ...(search ? { name: { contains: search, mode: "insensitive" } } : {}) },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

router.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const product = await prisma.product.create({ data: { ...parsed.data, shopId: req.shop!.id } });
  res.status(201).json(product);
});

router.put("/products/:id", async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const r = await prisma.product.updateMany({ where: { id: req.params.id, shopId: req.shop!.id }, data: parsed.data });
  if (r.count === 0) return res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  res.json(await prisma.product.findUnique({ where: { id: req.params.id } }));
});

router.patch("/products/:id/stock", async (req, res) => {
  const parsed = z.object({ stock: z.number().int().min(0) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຈຳນວນບໍ່ຖືກຕ້ອງ" });
  const r = await prisma.product.updateMany({
    where: { id: req.params.id, shopId: req.shop!.id },
    data: { stock: parsed.data.stock },
  });
  if (r.count === 0) return res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  res.json({ ok: true });
});

router.delete("/products/:id", async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: req.params.id, shopId: req.shop!.id } });
  if (!product) return res.status(404).json({ error: "ບໍ່ພົບສິນຄ້າ" });
  const used = await prisma.orderItem.count({ where: { productId: product.id } });
  if (used > 0) {
    // keep order history intact: hide instead of delete
    await prisma.product.update({ where: { id: product.id }, data: { active: false } });
    return res.json({ ok: true, softDeleted: true });
  }
  await prisma.product.delete({ where: { id: product.id } });
  res.json({ ok: true });
});

// ---------- Orders of this shop ----------
router.get("/orders", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const orders = await prisma.order.findMany({
    where: { shopId: req.shop!.id, ...(status ? { status: status as any } : {}) },
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
  res.json(orders);
});

router.patch("/orders/:id/status", async (req, res) => {
  const parsed = z.object({ status: z.enum(["PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELLED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ສະຖານະບໍ່ຖືກຕ້ອງ" });
  const r = await changeOrderStatus(req.params.id, parsed.data.status, req.shop!.id);
  if (!r.ok) return res.status(r.code).json({ error: r.error });
  res.json({ ok: true });
});

router.get("/stats", async (req, res) => {
  res.json(await getStats(req.shop!.id));
});

export default router;
