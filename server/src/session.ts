import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { SESSION_SECRET, SESSION_TTL_MS } from "./config";
import { getSession, putSession } from "./store";
import { isSolanaAddress, walletKey } from "./wallet";

export const COOKIE = "shillbag_session";

const sign = (payload: string) =>
  createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");

const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

export const clearSessionCookie = (c: Context) => {
  deleteCookie(c, COOKIE, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
};

export const createSessionCookie = async (c: Context, address: string) => {
  const wallet = walletKey(address);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await putSession({
    address: wallet,
    holdingsApprovedAt: new Date().toISOString(),
    expiresAt,
  });
  const payload = Buffer.from(
    JSON.stringify({ address: wallet, expiresAt }),
  ).toString("base64url");
  setCookie(c, COOKIE, `${payload}.${sign(payload)}`, cookieOptions);
};

export const readSessionAddress = async (c: Context) => {
  const raw = getCookie(c, COOKIE);
  if (!raw || !raw.includes(".")) return null;
  const [payload, sig] = raw.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const parsed = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as { address?: string; expiresAt?: string };
  if (!parsed.address || !isSolanaAddress(parsed.address)) return null;
  if (!parsed.expiresAt || Date.parse(parsed.expiresAt) < Date.now()) {
    deleteCookie(c, COOKIE, { path: "/" });
    return null;
  }
  const session = await getSession(parsed.address);
  if (!session) return null;
  return parsed.address;
};

const decodeSignature = (signature: string) => {
  const fromBase64 = Buffer.from(signature, "base64");
  if (fromBase64.length === 64) return fromBase64;
  return bs58.decode(signature);
};

export const verifyHoldingsSignature = async (input: {
  address: string;
  signature: string;
  message: string;
}) => {
  const publicKey = new PublicKey(input.address);
  const message = new TextEncoder().encode(input.message);
  const signature = decodeSignature(input.signature);
  const valid = nacl.sign.detached.verify(
    message,
    Uint8Array.from(signature),
    publicKey.toBytes(),
  );
  if (!valid) throw new Error("Signature did not match this wallet.");
  if (!input.message.includes(input.address)) {
    throw new Error("Signed message does not name this wallet.");
  }
};
