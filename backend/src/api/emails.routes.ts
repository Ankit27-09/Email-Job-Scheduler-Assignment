import { Router } from "express";
import { z } from "zod";
import { currentUserId, requireAuth } from "../auth/requireAuth";
import { countEmails, EmailListKind, getEmail, listEmails } from "../services/email.query";
import { scheduleCampaign, scheduleSchema } from "../services/schedule.service";

export const emailsRouter = Router();
emailsRouter.use(requireAuth);

const listQuery = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["SCHEDULED", "SENDING", "SENT", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

emailsRouter.post("/schedule", async (req, res) => {
  const input = scheduleSchema.parse(req.body);
  const result = await scheduleCampaign(currentUserId(req), input);
  res.status(201).json(result);
});

emailsRouter.get("/counts", async (req, res) => {
  res.json(await countEmails(currentUserId(req)));
});

for (const kind of ["scheduled", "sent"] as EmailListKind[]) {
  emailsRouter.get(`/${kind}`, async (req, res) => {
    const query = listQuery.parse(req.query);
    res.json(await listEmails({ userId: currentUserId(req), kind, ...query }));
  });
}

emailsRouter.get("/:id", async (req, res) => {
  const email = await getEmail(currentUserId(req), req.params.id);
  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }
  res.json(email);
});
