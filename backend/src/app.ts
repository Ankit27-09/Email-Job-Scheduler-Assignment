import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { passport } from "./auth/passport";
import { authRouter } from "./api/auth.routes";
import { emailsRouter } from "./api/emails.routes";
import { sendersRouter } from "./api/senders.routes";
import { errorHandler } from "./api/errorHandler";
import { redis } from "./lib/redis";
import { prisma } from "./db/client";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get("/health", async (_req, res) => {
    await Promise.all([redis.ping(), prisma.$queryRaw`SELECT 1`]);
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/api/emails", emailsRouter);
  app.use("/api/senders", sendersRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(errorHandler);

  return app;
}
