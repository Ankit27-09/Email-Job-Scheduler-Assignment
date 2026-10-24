import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { env, isProd } from "../config/env";

export const AUTH_COOKIE = "session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies TokenPayload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  maxAge: MAX_AGE_MS,
  path: "/",
};
