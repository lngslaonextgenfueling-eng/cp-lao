import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { checkCompatibility } from "../lib/compat";

const router = Router();

const schema = z.object({
  cpu: z.string().optional(),
  mainboard: z.string().optional(),
  ram: z.string().optional(),
  gpu: z.string().optional(),
  psu: z.string().optional(),
  case: z.string().optional(),
});

// POST /api/builder/check  { cpu: productId, mainboard: productId, ... }
router.post("/check", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ" });

  const ids = Object.values(parsed.data).filter(Boolean) as string[];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const pick = (id?: string) => {
    const p = id ? byId.get(id) : undefined;
    return p ? { name: p.name, specs: (p.specs ?? {}) as Record<string, any> } : null;
  };

  const result = checkCompatibility({
    cpu: pick(parsed.data.cpu),
    mainboard: pick(parsed.data.mainboard),
    ram: pick(parsed.data.ram),
    gpu: pick(parsed.data.gpu),
    psu: pick(parsed.data.psu),
    case: pick(parsed.data.case),
  });
  const total = products.reduce((s, p) => s + p.price, 0);
  res.json({ ...result, total });
});

export default router;
