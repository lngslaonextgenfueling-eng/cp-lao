import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Shipping fee is charged per shop (each shop ships its own parcel)
export const SHIPPING_OPTIONS = [
  { id: "pickup", label: "ຮັບເອງທີ່ຮ້ານ", fee: 0 },
  { id: "standard", label: "ສົ່ງທົ່ວໄປ (2-4 ວັນ)", fee: 30000 },
  { id: "express", label: "ສົ່ງດ່ວນ (ພາຍໃນວັນ, ນະຄອນຫຼວງ)", fee: 60000 },
];

const shopPaymentSelect = {
  id: true,
  name: true,
  slug: true,
  phone: true,
  bankName: true,
  accountName: true,
  accountNo: true,
} as const;

async function findCoupon(code?: string) {
  if (!code) return null;
  const c = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) return null;
  if (c.expiresAt && c.expiresAt < new Date()) return null;
  return c;
}

router.get("/shipping-options", (_req, res) => {
  res.json({ options: SHIPPING_OPTIONS });
});

router.post("/coupons/validate", async (req, res) => {
  const coupon = await findCoupon(req.body?.code);
  if (!coupon) return res.status(404).json({ error: "ຄູປອງບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸ" });
  res.json({ code: coupon.code, percent: coupon.percent });
});

const createSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1),
  recipient: z.string().min(1, "ກະລຸນາໃສ່ຊື່ຜູ້ຮັບ"),
  phone: z.string().min(6, "ກະລຸນາໃສ່ເບີໂທ"),
  address: z.string().min(5, "ກະລຸນາໃສ່ທີ່ຢູ່ຈັດສົ່ງ"),
  note: z.string().optional(),
  shippingMethod: z.enum(["pickup", "standard", "express"]),
  paymentMethod: z.enum(["QR", "TRANSFER", "COD"]),
  couponCode: z.string().optional(),
});

/**
 * One checkout can contain products from several shops. We create ONE ORDER PER SHOP
 * (they share a groupId). Each shop then confirms payment / ships / completes its own order,
 * and the platform keeps `commissionPercent` of (subtotal - discount) as platformFee.
 */
router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;

  // merge duplicate product lines
  const qtyById = new Map<string, number>();
  for (const i of d.items) qtyById.set(i.productId, (qtyById.get(i.productId) ?? 0) + i.qty);

  try {
    const orders = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...qtyById.keys()] }, active: true, shop: { status: "APPROVED" } },
        include: { shop: { select: { id: true, ownerId: true, commissionPercent: true } } },
      });
      if (products.length !== qtyById.size) throw new Error("ມີສິນຄ້າບາງລາຍການບໍ່ມີຂາຍແລ້ວ ກະລຸນາກັບໄປກວດກະຕ່າ");

      const byShop = new Map<string, typeof products>();
      for (const p of products) {
        const qty = qtyById.get(p.id)!;
        if (p.shop.ownerId === req.user!.id) throw new Error("ບໍ່ສາມາດສັ່ງຊື້ສິນຄ້າຂອງຮ້ານຕົນເອງ");
        if (p.stock < qty) throw new Error(`"${p.name}" ມີໃນສະຕັອກພຽງ ${p.stock} ຊິ້ນ`);
        byShop.set(p.shopId, [...(byShop.get(p.shopId) ?? []), p]);
      }

      const coupon = await findCoupon(d.couponCode);
      const shippingFee = SHIPPING_OPTIONS.find((s) => s.id === d.shippingMethod)!.fee;
      const groupId = randomUUID();
      const created = [];

      for (const [shopId, shopProducts] of byShop) {
        const subtotal = shopProducts.reduce((s, p) => s + p.price * qtyById.get(p.id)!, 0);
        const discount = coupon ? Math.floor((subtotal * coupon.percent) / 100) : 0;
        const total = subtotal - discount + shippingFee;
        const platformFee = Math.floor(((subtotal - discount) * shopProducts[0].shop.commissionPercent) / 100);

        for (const p of shopProducts) {
          // guard against races: only decrement when enough stock still remains
          const r = await tx.product.updateMany({
            where: { id: p.id, stock: { gte: qtyById.get(p.id)! } },
            data: { stock: { decrement: qtyById.get(p.id)! } },
          });
          if (r.count === 0) throw new Error(`"${p.name}" ໝົດສະຕັອກ ກະລຸນາລອງໃໝ່`);
        }

        created.push(
          await tx.order.create({
            data: {
              groupId,
              userId: req.user!.id,
              shopId,
              subtotal,
              discount,
              shippingFee,
              total,
              platformFee,
              couponCode: coupon?.code,
              paymentMethod: d.paymentMethod,
              shippingMethod: d.shippingMethod,
              recipient: d.recipient,
              phone: d.phone,
              address: d.address,
              note: d.note,
              items: {
                create: shopProducts.map((p) => ({
                  productId: p.id,
                  qty: qtyById.get(p.id)!,
                  name: p.name,
                  price: p.price,
                })),
              },
            },
            include: { items: true, shop: { select: shopPaymentSelect } },
          })
        );
      }
      return created;
    });
    res.status(201).json({ groupId: orders[0].groupId, orders });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "ສັ່ງຊື້ບໍ່ສຳເລັດ" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, shop: { select: shopPaymentSelect } },
  });
  res.json(orders);
});

router.get("/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, shop: { select: shopPaymentSelect } },
  });
  if (!order || (order.userId !== req.user!.id && req.user!.role !== "ADMIN")) {
    return res.status(404).json({ error: "ບໍ່ພົບອໍເດີ" });
  }
  res.json(order);
});

export default router;
