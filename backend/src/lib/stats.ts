import { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";

const COUNTED: OrderStatus[] = ["PAID", "SHIPPING", "COMPLETED"];

/** Sales analytics for the whole platform (no shopId) or for a single shop. */
export async function getStats(shopId?: string) {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const shopWhere = shopId ? { shopId } : {};

  const [revenueAgg, orderCount, pending, lowStock, recent, topItems, byStatus] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true, platformFee: true },
      where: { ...shopWhere, status: { in: COUNTED } },
    }),
    prisma.order.count({ where: shopWhere }),
    prisma.order.count({ where: { ...shopWhere, status: "PENDING" } }),
    prisma.product.findMany({
      where: { ...shopWhere, stock: { lte: 5 }, active: true },
      orderBy: { stock: "asc" },
      take: 10,
      select: { id: true, name: true, stock: true },
    }),
    prisma.order.findMany({
      where: { ...shopWhere, createdAt: { gte: since }, status: { in: COUNTED } },
      select: { createdAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      where: { order: { ...shopWhere, status: { in: COUNTED } } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({ by: ["status"], where: shopWhere, _count: true }),
  ]);

  const daily: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    daily[d.toISOString().slice(0, 10)] = { revenue: 0, orders: 0 };
  }
  for (const o of recent) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (daily[key]) {
      daily[key].revenue += o.total;
      daily[key].orders += 1;
    }
  }

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const platformFeeTotal = revenueAgg._sum.platformFee ?? 0;

  return {
    totalRevenue,
    platformFeeTotal,
    netRevenue: totalRevenue - platformFeeTotal,
    orderCount,
    pending,
    lowStock,
    daily: Object.entries(daily).map(([date, v]) => ({ date, ...v })),
    topProducts: topItems.map((t) => ({ productId: t.productId, name: t.name, qty: t._sum.qty ?? 0 })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
  };
}
