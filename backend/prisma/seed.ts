import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Seed = {
  name: string;
  brand: string;
  category: Category;
  price: number; // LAK
  stock: number;
  description?: string;
  cpu?: string;
  ramGb?: number;
  storageGb?: number;
  gpu?: string;
  usage?: string[];
  specs: Record<string, any>;
};

const G = "GAMING";
const W = "WORKING";
const D = "GRAPHIC";

const products: Seed[] = [
  // ---------- CPU ----------
  { name: "Intel Core i5-14400F", brand: "Intel", category: "CPU", price: 2_400_000, stock: 20, cpu: "Intel Core i5", usage: [G, W],
    specs: { socket: "LGA1700", cores: 10, threads: 16, baseClock: "2.5 GHz", boostClock: "4.7 GHz", tdp: 65, ramTypes: ["DDR4", "DDR5"], integratedGraphics: "ບໍ່ມີ" } },
  { name: "Intel Core i7-14700K", brand: "Intel", category: "CPU", price: 5_600_000, stock: 10, cpu: "Intel Core i7", usage: [G, W, D],
    specs: { socket: "LGA1700", cores: 20, threads: 28, baseClock: "3.4 GHz", boostClock: "5.6 GHz", tdp: 125, ramTypes: ["DDR4", "DDR5"], integratedGraphics: "Intel UHD 770" } },
  { name: "AMD Ryzen 5 7600", brand: "AMD", category: "CPU", price: 2_700_000, stock: 15, cpu: "AMD Ryzen 5", usage: [G, W],
    specs: { socket: "AM5", cores: 6, threads: 12, baseClock: "3.8 GHz", boostClock: "5.1 GHz", tdp: 65, ramTypes: ["DDR5"], integratedGraphics: "AMD Radeon" } },
  { name: "AMD Ryzen 7 7800X3D", brand: "AMD", category: "CPU", price: 6_200_000, stock: 8, cpu: "AMD Ryzen 7", usage: [G],
    specs: { socket: "AM5", cores: 8, threads: 16, baseClock: "4.2 GHz", boostClock: "5.0 GHz", tdp: 120, ramTypes: ["DDR5"], integratedGraphics: "AMD Radeon" } },
  { name: "AMD Ryzen 9 7950X", brand: "AMD", category: "CPU", price: 8_900_000, stock: 4, cpu: "AMD Ryzen 9", usage: [W, D],
    specs: { socket: "AM5", cores: 16, threads: 32, baseClock: "4.5 GHz", boostClock: "5.7 GHz", tdp: 170, ramTypes: ["DDR5"], integratedGraphics: "AMD Radeon" } },

  // ---------- Mainboard ----------
  { name: "ASUS PRIME B760M-A WIFI D4", brand: "ASUS", category: "MAINBOARD", price: 2_200_000, stock: 12, usage: [G, W],
    specs: { socket: "LGA1700", chipset: "B760", ramType: "DDR4", ramSlots: 4, formFactor: "Micro-ATX", maxRam: "128GB", wifi: "Wi-Fi 6", m2Slots: 2 } },
  { name: "MSI MAG B760 TOMAHAWK WIFI", brand: "MSI", category: "MAINBOARD", price: 3_900_000, stock: 7, usage: [G, W, D],
    specs: { socket: "LGA1700", chipset: "B760", ramType: "DDR5", ramSlots: 4, formFactor: "ATX", maxRam: "192GB", wifi: "Wi-Fi 6E", m2Slots: 3 } },
  { name: "GIGABYTE B650M AORUS ELITE AX", brand: "GIGABYTE", category: "MAINBOARD", price: 3_300_000, stock: 9, usage: [G, W],
    specs: { socket: "AM5", chipset: "B650", ramType: "DDR5", ramSlots: 4, formFactor: "Micro-ATX", maxRam: "192GB", wifi: "Wi-Fi 6E", m2Slots: 2 } },
  { name: "ASUS ROG STRIX X670E-E GAMING WIFI", brand: "ASUS", category: "MAINBOARD", price: 7_800_000, stock: 3, usage: [G, D],
    specs: { socket: "AM5", chipset: "X670E", ramType: "DDR5", ramSlots: 4, formFactor: "ATX", maxRam: "192GB", wifi: "Wi-Fi 6E", m2Slots: 4 } },

  // ---------- RAM ----------
  { name: "Kingston FURY Beast 16GB (2x8GB) DDR4-3200", brand: "Kingston", category: "RAM", price: 650_000, stock: 30, ramGb: 16, usage: [G, W],
    specs: { ramType: "DDR4", capacity: "16GB", modules: 2, speed: "3200 MHz", latency: "CL16" } },
  { name: "Corsair Vengeance 32GB (2x16GB) DDR5-6000", brand: "Corsair", category: "RAM", price: 1_750_000, stock: 18, ramGb: 32, usage: [G, W, D],
    specs: { ramType: "DDR5", capacity: "32GB", modules: 2, speed: "6000 MHz", latency: "CL30" } },
  { name: "G.SKILL Trident Z5 RGB 32GB DDR5-6400", brand: "G.SKILL", category: "RAM", price: 2_050_000, stock: 10, ramGb: 32, usage: [G, D],
    specs: { ramType: "DDR5", capacity: "32GB", modules: 2, speed: "6400 MHz", latency: "CL32" } },
  { name: "Kingston FURY Beast 64GB (2x32GB) DDR5-5600", brand: "Kingston", category: "RAM", price: 3_400_000, stock: 5, ramGb: 64, usage: [W, D],
    specs: { ramType: "DDR5", capacity: "64GB", modules: 2, speed: "5600 MHz", latency: "CL40" } },

  // ---------- GPU ----------
  { name: "NVIDIA GeForce RTX 4060 8GB (ASUS Dual)", brand: "ASUS", category: "GPU", price: 4_900_000, stock: 14, gpu: "NVIDIA RTX 4060", usage: [G],
    specs: { chip: "RTX 4060", vram: "8GB GDDR6", tdp: 115, lengthMm: 227, recommendedPsu: "550W", ports: "HDMI 2.1, 3x DP 1.4a" } },
  { name: "NVIDIA GeForce RTX 4070 SUPER 12GB (MSI Ventus)", brand: "MSI", category: "GPU", price: 9_800_000, stock: 6, gpu: "NVIDIA RTX 4070", usage: [G, D],
    specs: { chip: "RTX 4070 SUPER", vram: "12GB GDDR6X", tdp: 220, lengthMm: 308, recommendedPsu: "650W", ports: "HDMI 2.1, 3x DP 1.4a" } },
  { name: "NVIDIA GeForce RTX 4080 SUPER 16GB (GIGABYTE Gaming OC)", brand: "GIGABYTE", category: "GPU", price: 16_500_000, stock: 2, gpu: "NVIDIA RTX 4080", usage: [G, D],
    specs: { chip: "RTX 4080 SUPER", vram: "16GB GDDR6X", tdp: 320, lengthMm: 340, recommendedPsu: "750W", ports: "HDMI 2.1, 3x DP 1.4a" } },
  { name: "AMD Radeon RX 7800 XT 16GB (Sapphire Pulse)", brand: "Sapphire", category: "GPU", price: 8_700_000, stock: 5, gpu: "AMD RX 7800", usage: [G],
    specs: { chip: "RX 7800 XT", vram: "16GB GDDR6", tdp: 263, lengthMm: 280, recommendedPsu: "700W", ports: "HDMI 2.1, 3x DP 2.1" } },

  // ---------- PSU ----------
  { name: "Corsair CV550 550W 80+ Bronze", brand: "Corsair", category: "PSU", price: 780_000, stock: 20, usage: [W],
    specs: { wattage: 550, efficiency: "80+ Bronze", modular: "Non-modular" } },
  { name: "Cooler Master MWE 750 Gold V2", brand: "Cooler Master", category: "PSU", price: 1_450_000, stock: 12, usage: [G, W, D],
    specs: { wattage: 750, efficiency: "80+ Gold", modular: "Full modular" } },
  { name: "Corsair RM1000x 1000W 80+ Gold", brand: "Corsair", category: "PSU", price: 2_900_000, stock: 5, usage: [G, D],
    specs: { wattage: 1000, efficiency: "80+ Gold", modular: "Full modular" } },

  // ---------- Case ----------
  { name: "NZXT H5 Flow ATX Mid Tower", brand: "NZXT", category: "CASE", price: 1_600_000, stock: 9, usage: [G, W],
    specs: { maxBoard: "ATX", maxGpuMm: 365, fans: "2x 120mm", color: "ດຳ" } },
  { name: "Cooler Master NR200P Mini-ITX", brand: "Cooler Master", category: "CASE", price: 1_900_000, stock: 4, usage: [W],
    specs: { maxBoard: "Mini-ITX", maxGpuMm: 330, fans: "2x 120mm", color: "ຂາວ" } },
  { name: "Deepcool MATREXX 40 Micro-ATX", brand: "Deepcool", category: "CASE", price: 700_000, stock: 15, usage: [W],
    specs: { maxBoard: "Micro-ATX", maxGpuMm: 270, fans: "1x 120mm", color: "ດຳ" } },

  // ---------- Storage ----------
  { name: "Samsung 980 PRO 1TB NVMe Gen4", brand: "Samsung", category: "STORAGE", price: 1_650_000, stock: 16, storageGb: 1000, usage: [G, W, D],
    specs: { type: "NVMe SSD", capacity: "1TB", interface: "PCIe 4.0 x4", read: "7000 MB/s", write: "5000 MB/s" } },
  { name: "WD Blue SN580 500GB NVMe", brand: "WD", category: "STORAGE", price: 700_000, stock: 25, storageGb: 500, usage: [W],
    specs: { type: "NVMe SSD", capacity: "500GB", interface: "PCIe 4.0 x4", read: "4000 MB/s", write: "3600 MB/s" } },
  { name: "Seagate Barracuda 2TB HDD", brand: "Seagate", category: "STORAGE", price: 900_000, stock: 18, storageGb: 2000, usage: [W],
    specs: { type: "HDD", capacity: "2TB", interface: "SATA III", rpm: 7200 } },

  // ---------- Laptop / Desktop ----------
  { name: "ASUS TUF Gaming F15 (i5-12500H / RTX 3050 / 16GB / 512GB)", brand: "ASUS", category: "LAPTOP", price: 13_900_000, stock: 6,
    cpu: "Intel Core i5", ramGb: 16, storageGb: 512, gpu: "NVIDIA RTX 3050", usage: [G, W],
    specs: { display: '15.6" FHD 144Hz', cpu: "Intel Core i5-12500H", ram: "16GB DDR4", storage: "512GB NVMe", gpu: "RTX 3050 4GB", battery: "48Wh", weight: "2.2 kg", os: "Windows 11" } },
  { name: "Lenovo ThinkPad E14 (Ryzen 5 / 16GB / 512GB)", brand: "Lenovo", category: "LAPTOP", price: 11_500_000, stock: 8,
    cpu: "AMD Ryzen 5", ramGb: 16, storageGb: 512, usage: [W],
    specs: { display: '14" FHD IPS', cpu: "AMD Ryzen 5 7530U", ram: "16GB DDR4", storage: "512GB NVMe", gpu: "Radeon Graphics", battery: "47Wh", weight: "1.6 kg", os: "Windows 11 Pro" } },
  { name: "MacBook Air 13 M2 (16GB / 512GB)", brand: "Apple", category: "LAPTOP", price: 22_900_000, stock: 3,
    ramGb: 16, storageGb: 512, usage: [W, D],
    specs: { display: '13.6" Liquid Retina', cpu: "Apple M2 8-core", ram: "16GB unified", storage: "512GB SSD", gpu: "10-core GPU", battery: "52.6Wh", weight: "1.24 kg", os: "macOS" } },
  { name: "PC Gaming Ready: Ryzen 5 7600 / RTX 4060 / 16GB / 1TB", brand: "PC SHOP", category: "DESKTOP", price: 15_900_000, stock: 5,
    cpu: "AMD Ryzen 5", ramGb: 16, storageGb: 1000, gpu: "NVIDIA RTX 4060", usage: [G],
    specs: { cpu: "AMD Ryzen 5 7600", mainboard: "B650M", ram: "16GB DDR5", storage: "1TB NVMe", gpu: "RTX 4060 8GB", psu: "650W 80+ Bronze", warranty: "1 ປີ" } },
  { name: "PC Creator: Core i7-14700K / RTX 4070 SUPER / 32GB / 1TB", brand: "PC SHOP", category: "DESKTOP", price: 27_500_000, stock: 2,
    cpu: "Intel Core i7", ramGb: 32, storageGb: 1000, gpu: "NVIDIA RTX 4070", usage: [G, D, W],
    specs: { cpu: "Intel Core i7-14700K", mainboard: "B760 DDR5", ram: "32GB DDR5", storage: "1TB NVMe", gpu: "RTX 4070 SUPER 12GB", psu: "750W 80+ Gold", warranty: "1 ປີ" } },

  // ---------- Monitor / Accessory ----------
  { name: 'LG UltraGear 27" QHD 165Hz', brand: "LG", category: "MONITOR", price: 4_200_000, stock: 7, usage: [G],
    specs: { size: '27"', resolution: "2560x1440", refreshRate: "165 Hz", panel: "IPS", responseTime: "1ms" } },
  { name: "Logitech G Pro X Superlight 2", brand: "Logitech", category: "ACCESSORY", price: 3_100_000, stock: 11, usage: [G],
    specs: { type: "Gaming mouse", connection: "Wireless 2.4GHz", weight: "60 g", dpi: "32000" } },
];

async function upsertShop(opts: {
  email: string;
  password: string;
  ownerName: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  bankName: string;
  accountName: string;
  accountNo: string;
}) {
  const owner = await prisma.user.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      email: opts.email,
      name: opts.ownerName,
      role: "SELLER",
      passwordHash: await bcrypt.hash(opts.password, 10),
    },
  });
  return prisma.shop.upsert({
    where: { slug: opts.slug },
    update: {},
    create: {
      ownerId: owner.id,
      name: opts.name,
      slug: opts.slug,
      description: opts.description,
      phone: opts.phone,
      bankName: opts.bankName,
      accountName: opts.accountName,
      accountNo: opts.accountNo,
      status: "APPROVED",
    },
  });
}

async function main() {
  // Demo data has public passwords (admin1234, seller1234). Never load it on a live server by accident.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
    console.error("Refusing to load demo data in production. Use `npm run create-admin` instead.");
    console.error("(To load it anyway on a test server: ALLOW_DEMO_SEED=1 npm run db:seed)");
    process.exit(1);
  }
  console.log("Seeding…");

  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", percent: 10 } });
  await prisma.coupon.upsert({ where: { code: "PCSHOP5" }, update: {}, create: { code: "PCSHOP5", percent: 5 } });

  // Platform admin — CHANGE THIS PASSWORD in production
  await prisma.user.upsert({
    where: { email: "admin@pcshop.la" },
    update: {},
    create: { email: "admin@pcshop.la", name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash("admin1234", 10) },
  });

  // Two demo shops (sellers) — CHANGE / DELETE in production
  const official = await upsertShop({
    email: "seller1@pcshop.la",
    password: "seller1234",
    ownerName: "PC SHOP Official",
    name: "PC SHOP Official",
    slug: "pc-shop-official",
    description: "ຮ້ານຫຼັກ: ຊິ້ນສ່ວນຄອມ ແລະ ຄອມປະກອບສຳເລັດ",
    phone: "020 5555 0001",
    bankName: "BCEL",
    accountName: "PC SHOP OFFICIAL",
    accountNo: "000-000-000001",
  });
  const gaming = await upsertShop({
    email: "seller2@pcshop.la",
    password: "seller1234",
    ownerName: "Lao Gaming Store",
    name: "Lao Gaming Store",
    slug: "lao-gaming-store",
    description: "ໂນດບຸກ, ຈໍ ແລະ ອຸປະກອນເກມມິງ",
    phone: "020 5555 0002",
    bankName: "BCEL",
    accountName: "LAO GAMING STORE",
    accountNo: "000-000-000002",
  });

  if ((await prisma.product.count()) === 0) {
    const gamingCategories: Category[] = ["LAPTOP", "MONITOR", "ACCESSORY"];
    for (const p of products) {
      await prisma.product.create({
        data: {
          description: "",
          usage: [],
          ...p,
          shopId: gamingCategories.includes(p.category) ? gaming.id : official.id,
        },
      });
    }
  }

  console.log(`Done. Products: ${await prisma.product.count()}`);
  console.log("Admin   → admin@pcshop.la   / admin1234");
  console.log("Seller1 → seller1@pcshop.la / seller1234  (PC SHOP Official)");
  console.log("Seller2 → seller2@pcshop.la / seller1234  (Lao Gaming Store)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
