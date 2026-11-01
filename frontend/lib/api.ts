export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface ShopRef {
  id: string;
  name: string;
  slug: string;
}

export interface Shop extends ShopRef {
  description: string;
  logo: string | null;
  phone: string | null;
  address: string | null;
  productCount?: number;
}

export interface MyShop extends Shop {
  bankName: string | null;
  accountName: string | null;
  accountNo: string | null;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  commissionPercent: number;
}

export interface Product {
  id: string;
  shopId: string;
  shop?: ShopRef & { name: string };
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  description: string;
  cpu: string | null;
  ramGb: number | null;
  storageGb: number | null;
  gpu: string | null;
  usage: string[];
  specs: Record<string, any>;
  active: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface OrderShop {
  id: string;
  name: string;
  slug?: string;
  phone?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNo?: string | null;
}

export interface Order {
  id: string;
  groupId: string;
  shop?: OrderShop;
  platformFee: number;
  status: "PENDING" | "PAID" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  paymentMethod: "QR" | "TRANSFER" | "COD";
  shippingMethod: string;
  recipient: string;
  phone: string;
  address: string;
  createdAt: string;
  items: OrderItem[];
  user?: { name: string; email: string };
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `ຂໍ້ຜິດພາດ (${res.status})`);
  return data as T;
}

export const formatLAK = (n: number) => new Intl.NumberFormat("lo-LA").format(n) + " ₭";

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "ລໍຖ້າຊຳລະ",
  PAID: "ຊຳລະແລ້ວ",
  SHIPPING: "ກຳລັງຈັດສົ່ງ",
  COMPLETED: "ສຳເລັດ",
  CANCELLED: "ຍົກເລີກ",
};

export const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  SHIPPING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export const CATEGORY_LABEL: Record<string, string> = {
  CPU: "CPU",
  MAINBOARD: "Mainboard",
  RAM: "RAM",
  GPU: "ກາດຈໍ (GPU)",
  PSU: "Power Supply",
  STORAGE: "Storage",
  CASE: "ເຄສ",
  LAPTOP: "ໂນດບຸກ",
  DESKTOP: "ຄອມຕັ້ງໂຕະ",
  MONITOR: "ຈໍ",
  ACCESSORY: "ອຸປະກອນເສີມ",
};

export const SHOP_STATUS_LABEL: Record<string, string> = {
  PENDING: "ລໍຖ້າອະນຸມັດ",
  APPROVED: "ເປີດໃຊ້ງານ",
  SUSPENDED: "ຖືກລະງັບ",
};

export const SHOP_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-700",
};
