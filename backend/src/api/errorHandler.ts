import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { createLogger } from "../lib/logger";
import { NotFoundError } from "../services/schedule.service";

const log = createLogger("api");

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  log.error("unhandled error", { error: err instanceof Error ? err.stack : String(err) });
  res.status(500).json({ error: "Something went wrong" });
};
