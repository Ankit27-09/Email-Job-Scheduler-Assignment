import type { User } from "@prisma/client";
import { Router } from "express";
import { env } from "../config/env";
import { prisma } from "../db/client";
import { isGoogleConfigured, passport } from "../auth/passport";
import { currentUserId, requireAuth } from "../auth/requireAuth";
import { AUTH_COOKIE, authCookieOptions, signToken } from "../auth/token";

export const authRouter = Router();

authRouter.get("/google", (req, res, next) => {
  if (!isGoogleConfigured) {
    res.status(503).json({ error: "Google OAuth is not configured on the server" });
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false, prompt: "select_account" })(
    req,
    res,
    next,
  );
});

authRouter.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${env.FRONTEND_URL}/login?error=google`,
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user as User;
    res.cookie(AUTH_COOKIE, signToken(user.id), authCookieOptions);
    res.redirect(env.FRONTEND_URL);
  },
);

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: currentUserId(req) },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (!user) {
    res.clearCookie(AUTH_COOKIE, { path: "/" });
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(user);
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.status(204).end();
});
