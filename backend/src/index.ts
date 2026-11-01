import "dotenv/config";
import express from "express";
import "express-async-errors"; // forwards errors from async route handlers to the error middleware
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import builderRoutes from "./routes/builder";
import orderRoutes from "./routes/orders";
import adminRoutes from "./routes/admin";
import shopRoutes from "./routes/shops";
import sellerRoutes from "./routes/seller";

const app = express();

// behind a reverse proxy (nginx / Docker), so req.ip is the real client IP
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/builder", builderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/seller", sellerRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "ເກີດຂໍ້ຜິດພາດໃນລະບົບ" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
