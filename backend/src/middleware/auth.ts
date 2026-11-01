import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthUser {
  id: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
}

export interface ShopCtx {
  id: string;
  name: string;
  commissionPercent: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      shop?: ShopCtx;
    }
  }
}

const WEAK_SECRETS = ["", "dev-secret", "change-me-to-a-long-random-string"];
const JWT_SECRET = process.env.JWT_SECRET ?? "";
if (process.env.NODE_ENV === "production" && (WEAK_SECRETS.includes(JWT_SECRET) || JWT_SECRET.length < 32)) {
  // Refuse to start: with a known secret anyone could forge an ADMIN token.
  throw new Error("JWT_SECRET must be set to a random string of at least 32 characters in production");
}
const secret = () => JWT_SECRET || "dev-secret";

export function signToken(user: AuthUser) {
  return jwt.sign(user, secret(), { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "ກະລຸນາເຂົ້າສູ່ລະບົບ" });
  }
  try {
    req.user = jwt.verify(header.slice(7), secret()) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "Token ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸ" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "ສະເພາະ Admin ເທົ່ານັ້ນ" });
    }
    next();
  });
}

/**
 * Requires a logged-in user that owns an APPROVED shop.
 * The shop is read from the database (not the token) so approval / suspension
 * takes effect immediately without re-login.
 */
export function requireShop(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      const shop = await prisma.shop.findUnique({ where: { ownerId: req.user!.id } });
      if (!shop) return res.status(403).json({ error: "ທ່ານຍັງບໍ່ມີຮ້ານຄ້າ ກະລຸນາສະໝັກເປີດຮ້ານກ່ອນ" });
      if (shop.status === "PENDING") return res.status(403).json({ error: "ຮ້ານຂອງທ່ານກຳລັງລໍຖ້າ Admin ອະນຸມັດ" });
      if (shop.status === "SUSPENDED") return res.status(403).json({ error: "ຮ້ານຂອງທ່ານຖືກລະງັບການໃຊ້ງານ" });
      req.shop = { id: shop.id, name: shop.name, commissionPercent: shop.commissionPercent };
      next();
    } catch (e) {
      next(e);
    }
  });
}
