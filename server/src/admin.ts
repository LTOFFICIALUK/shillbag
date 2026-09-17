import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
  ADMIN_ACCESS_CODE,
  ADMIN_EMAIL,
  ADMIN_MAX_ATTEMPTS,
  ADMIN_SESSION_TTL_MS,
  ADMIN_WINDOW_MS,
  SESSION_SECRET,
} from "./config";
import {
  countRecentAdminFailures,
  recordAdminAttempt,
} from "./store";

export const ADMIN_COOKIE = "shillbag_admin";

const sign = (payload: string) =>
  createHmac("sha256", SESSION_SECRET).update(`admin:${payload}`).digest("hex");

const digest = (value: string) =>
  createHash("sha256").update(value).digest();

const sameSecret = (left: string, right: string) =>
  timingSafeEqual(digest(left), digest(right));

const cookieOptions = {
  httpOnly: true,
  sameSite: "Strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_TTL_MS / 1000,
};

export const clientIp = (c: Context) => {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return c.req.header("x-real-ip") || "unknown";
};

export const createAdminCookie = (c: Context, email: string) => {
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString();
  const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString(
    "base64url",
  );
  setCookie(c, ADMIN_COOKIE, `${payload}.${sign(payload)}`, cookieOptions);
};

export const clearAdminCookie = (c: Context) => {
  deleteCookie(c, ADMIN_COOKIE, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
};

export const readAdminEmail = (c: Context) => {
  const raw = getCookie(c, ADMIN_COOKIE);
  if (!raw || !raw.includes(".")) return null;
  const [payload, sig] = raw.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const parsed = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as { email?: string; expiresAt?: string };
  if (!parsed.email || parsed.email !== ADMIN_EMAIL) return null;
  if (!parsed.expiresAt || Date.parse(parsed.expiresAt) < Date.now()) {
    deleteCookie(c, ADMIN_COOKIE, { path: "/" });
    return null;
  }
  return parsed.email;
};

export const verifyAdminLogin = async (
  c: Context,
  emailRaw: string,
  codeRaw: string,
) => {
  const ip = clientIp(c);
  const failures = await countRecentAdminFailures(ip, ADMIN_WINDOW_MS);
  if (failures >= ADMIN_MAX_ATTEMPTS) {
    return {
      ok: false as const,
      status: 429 as const,
      retryAfterSec: Math.ceil(ADMIN_WINDOW_MS / 1000),
      error: "Too many tries. Wait 15 minutes, then try again.",
    };
  }

  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim();
  const emailOk = sameSecret(email, ADMIN_EMAIL);
  const codeOk = Boolean(ADMIN_ACCESS_CODE) && sameSecret(code, ADMIN_ACCESS_CODE);
  const ok = emailOk && codeOk;

  await recordAdminAttempt(ip, ok);

  if (!ok) {
    const remaining = Math.max(0, ADMIN_MAX_ATTEMPTS - failures - 1);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(2000, 250 * (failures + 1))),
    );
    return {
      ok: false as const,
      status: remaining === 0 ? (429 as const) : (401 as const),
      retryAfterSec: remaining === 0 ? Math.ceil(ADMIN_WINDOW_MS / 1000) : undefined,
      error:
        remaining === 0
          ? "Too many tries. Wait 15 minutes, then try again."
          : "Access denied.",
    };
  }

  createAdminCookie(c, ADMIN_EMAIL);
  return { ok: true as const, email: ADMIN_EMAIL };
};
