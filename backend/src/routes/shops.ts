import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Public shop fields (bank details are NOT exposed here; they are only shown on the order of a buyer)
const publicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logo: true,
  phone: true,
  address: true,
  createdAt: true,
} as const;

router.get("/", async (_req, res) => {
  const shops = await prisma.shop.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: {
      ...publicSelect,
      _count: { select: { products: { where: { active: true } } } },
    },
  });
  res.json(shops.map(({ _count, ...s }) => ({ ...s, productCount: _count.products })));
});

router.get("/:slug", async (req, res) => {
  const shop = await prisma.shop.findFirst({
    where: { slug: req.params.slug, status: "APPROVED" },
    select: publicSelect,
  });
  if (!shop) return res.status(404).json({ error: "ບໍ່ພົບຮ້ານຄ້າ" });
  res.json(shop);
});

export default router;
