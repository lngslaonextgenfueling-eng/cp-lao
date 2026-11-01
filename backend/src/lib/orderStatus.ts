import { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";

export type ChangeResult = { ok: true } | { ok: false; code: number; error: string };

/**
 * Allowed forward moves. COD orders may ship before they are paid (PENDING → SHIPPING).
 * COMPLETED and CANCELLED are final for sellers.
 */
const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "SHIPPING", "CANCELLED"],
  PAID: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** Admin may additionally step back one stage to correct a mistake (never out of CANCELLED). */
const ADMIN_EXTRA: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PENDING"],
  SHIPPING: ["PAID"],
  COMPLETED: ["SHIPPING"],
};

const LABEL: Record<OrderStatus, string> = {
  PENDING: "ລໍຖ້າຊຳລະ",
  PAID: "ຊຳລະແລ້ວ",
  SHIPPING: "ກຳລັງຈັດສົ່ງ",
  COMPLETED: "ສຳເລັດ",
  CANCELLED: "ຍົກເລີກ",
};

export function canTransition(from: OrderStatus, to: OrderStatus, asAdmin: boolean) {
  if (SELLER_TRANSITIONS[from].includes(to)) return true;
  return asAdmin && (ADMIN_EXTRA[from] ?? []).includes(to);
}

/**
 * Changes an order's status.
 * - When `shopId` is given the order must belong to that shop (seller scope); otherwise admin scope.
 * - The status update is conditional on the status we read (optimistic lock), so two people
 *   cancelling at the same time can never return the stock twice.
 */
export async function changeOrderStatus(orderId: string, status: OrderStatus, shopId?: string): Promise<ChangeResult> {
  const asAdmin = !shopId;
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(shopId ? { shopId } : {}) },
    include: { items: true },
  });
  if (!order) return { ok: false, code: 404, error: "ບໍ່ພົບອໍເດີ" };
  if (order.status === status) return { ok: true };
  if (order.status === "CANCELLED") return { ok: false, code: 400, error: "ອໍເດີທີ່ຍົກເລີກແລ້ວບໍ່ສາມາດປ່ຽນສະຖານະ" };
  if (!canTransition(order.status, status, asAdmin)) {
    return {
      ok: false,
      code: 400,
      error: `ບໍ່ສາມາດປ່ຽນຈາກ "${LABEL[order.status]}" ເປັນ "${LABEL[status]}"`,
    };
  }

  const done = await prisma.$transaction(async (tx) => {
    const r = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status },
    });
    if (r.count === 0) return false; // someone else changed it first
    if (status === "CANCELLED") {
      for (const i of order.items) {
        await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty } } });
      }
    }
    return true;
  });

  if (!done) return { ok: false, code: 409, error: "ສະຖານະອໍເດີຖືກປ່ຽນແລ້ວ ກະລຸນາໂຫຼດໜ້າໃໝ່" };
  return { ok: true };
}
