import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, verifyToken } from "./token";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.auth = { userId };
  next();
}

export function currentUserId(req: Request): string {
  if (!req.auth) throw new Error("requireAuth middleware missing");
  return req.auth.userId;
}
