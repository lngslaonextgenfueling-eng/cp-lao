import { NextFunction, Request, Response } from "express";

/**
 * Minimal in-memory fixed-window rate limiter (per IP + route).
 * Good enough for a single API instance; use Redis-backed limiting if you run several.
 */
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: "ລອງຫຼາຍເທື່ອເກີນໄປ ກະລຸນາລໍຖ້າແລ້ວລອງໃໝ່" });
    }
    next();
  };
}
