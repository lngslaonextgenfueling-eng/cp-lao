import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, signToken } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

// 10 attempts per 15 minutes per IP on each credential endpoint
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Always returns the user together with their shop (if any) so the frontend knows
// whether to show "open a shop" or "my shop".
async function sessionFor(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { shop: { select: { id: true, name: true, slug: true, status: true } } },
  });
  return {
    token: signToken({ id: u.id, role: u.role }),
    user: { id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone, shop: u.shop },
  };
}

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ"),
  phone: z.string().optional(),
});

router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password, phone } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: "ອີເມວນີ້ຖືກໃຊ້ແລ້ວ" });

  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), phone, passwordHash: await bcrypt.hash(password, 10) },
  });
  res.status(201).json(await sessionFor(user.id));
});

router.post("/login", authLimiter, async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ" });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" });
  }
  res.json(await sessionFor(user.id));
});

// Google Sign-In: the frontend sends the ID token (credential) from Google Identity Services.
router.post("/google", authLimiter, async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(501).json({ error: "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ GOOGLE_CLIENT_ID" });

  const parsed = z.object({ credential: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ" });

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: parsed.data.credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) throw new Error("no email");
    // Only trust Google's email if Google has verified it; otherwise anyone could
    // take over an existing password account by using the same address.
    if (!payload.email_verified) return res.status(401).json({ error: "ອີເມວ Google ນີ້ຍັງບໍ່ໄດ້ຢືນຢັນ" });

    let user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: payload.email.toLowerCase(), name: payload.name || payload.email, googleId: payload.sub },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
    }
    res.json(await sessionFor(user.id));
  } catch {
    res.status(401).json({ error: "ເຂົ້າສູ່ລະບົບດ້ວຍ Google ບໍ່ສຳເລັດ" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const exists = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: "ບໍ່ພົບຜູ້ໃຊ້" });
  // fresh token too, so a role change (e.g. shop approved) is picked up
  res.json(await sessionFor(exists.id));
});

export default router;
