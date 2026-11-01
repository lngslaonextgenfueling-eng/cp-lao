import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "ກະລຸນາໃສ່ຊື່ສິນຄ້າ"),
  brand: z.string().min(1, "ກະລຸນາໃສ່ຍີ່ຫໍ້"),
  category: z.enum(["CPU", "MAINBOARD", "RAM", "GPU", "PSU", "STORAGE", "CASE", "LAPTOP", "DESKTOP", "MONITOR", "ACCESSORY"]),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  image: z.string().nullable().optional(),
  description: z.string().default(""),
  cpu: z.string().nullable().optional(),
  ramGb: z.number().int().nullable().optional(),
  storageGb: z.number().int().nullable().optional(),
  gpu: z.string().nullable().optional(),
  usage: z.array(z.string()).default([]),
  specs: z.record(z.any()).default({}),
  active: z.boolean().default(true),
});
