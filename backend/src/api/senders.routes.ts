import { Router } from "express";
import { requireAuth } from "../auth/requireAuth";
import { prisma } from "../db/client";

export const sendersRouter = Router();
sendersRouter.use(requireAuth);

sendersRouter.get("/", async (_req, res) => {
  const senders = await prisma.sender.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(senders);
});
