/**
 * Create (or reset) the platform admin account.
 *   docker compose exec backend npm run create-admin -- <email> <password> [name]
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [email, password, ...nameParts] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password> [name]");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();
(async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "ADMIN", passwordHash },
    create: { email: email.toLowerCase(), name: nameParts.join(" ") || "Admin", role: "ADMIN", passwordHash },
  });
  console.log(`Admin ready: ${user.email}`);
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
