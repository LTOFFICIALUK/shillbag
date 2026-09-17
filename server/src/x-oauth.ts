import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { SESSION_SECRET, X_USER_ID } from "./config";
import { checkFollowsUs } from "./scan";
import { getLinkByUserId, putLink } from "./store";
import { walletKey } from "./wallet";

export const X_OAUTH_COOKIE = "shillbag_x_oauth";
export const X_OAUTH_CLIENT_ID = process.env.X_OAUTH_CLIENT_ID?.trim() ?? "";
export const X_OAUTH_CLIENT_SECRET =
  process.env.X_OAUTH_CLIENT_SECRET?.trim() ?? "";

const AUTHORIZE = "https://x.com/i/oauth2/authorize";
const TOKEN = "https://api.x.com/2/oauth2/token";
const ME = "https://api.x.com/2/users/me";
const SCOPES = "tweet.read users.read follows.read";

type OauthPayload = {
  state: string;
  verifier: string;
  redirectUri: string;
};

const sign = (payload: string) =>
  createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");

const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 10 * 60,
};

export const xOauthConfigured = () => Boolean(X_OAUTH_CLIENT_ID);

export const appOrigin = (c: Context) => {
  const forwarded = c.req.header("x-forwarded-origin");
  if (forwarded) return forwarded.replace(/\/$/, "");
  return (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
};

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const writeOauthCookie = (c: Context, payload: OauthPayload) => {
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  setCookie(c, X_OAUTH_COOKIE, `${raw}.${sign(raw)}`, cookieOptions);
};

const readOauthCookie = (c: Context): OauthPayload | null => {
  const raw = getCookie(c, X_OAUTH_COOKIE);
  if (!raw || !raw.includes(".")) return null;
  const [payload, sig] = raw.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OauthPayload;
};

const clearOauthCookie = (c: Context) => {
  deleteCookie(c, X_OAUTH_COOKIE, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
};

export const xOauthStartUrl = (c: Context) => {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(16));
  const redirectUri = `${appOrigin(c)}/api/x/oauth/callback`;
  writeOauthCookie(c, { state, verifier, redirectUri });

  const url = new URL(AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", X_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
};

const exchangeCode = async (input: {
  code: string;
  verifier: string;
  redirectUri: string;
}) => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
    client_id: X_OAUTH_CLIENT_ID,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (X_OAUTH_CLIENT_SECRET) {
    headers.Authorization = `Basic ${Buffer.from(
      `${X_OAUTH_CLIENT_ID}:${X_OAUTH_CLIENT_SECRET}`,
    ).toString("base64")}`;
  }
  const response = await fetch(TOKEN, { method: "POST", headers, body });
  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "X login did not finish.");
  }
  return data.access_token;
};

const fetchMe = async (accessToken: string) => {
  const response = await fetch(`${ME}?user.fields=username,name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json()) as {
    data?: { id: string; username: string };
    title?: string;
    detail?: string;
  };
  if (!response.ok || !data.data?.id || !data.data.username) {
    throw new Error(data.detail ?? data.title ?? "Could not read the X account.");
  }
  return data.data;
};

const followsWithToken = async (
  accessToken: string,
  sourceUserId: string,
) => {
  if (!X_USER_ID) return null;
  const response = await fetch(
    `https://api.x.com/2/users/${sourceUserId}/following/${X_USER_ID}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (response.status === 404) return false;
  if (!response.ok) return null;
  const data = (await response.json()) as { data?: { id?: string } };
  return Boolean(data.data?.id);
};

export const finishXOauth = async (
  c: Context,
  address: string,
  query: { code?: string; state?: string; error?: string },
) => {
  const origin = appOrigin(c);
  const fail = (code: string) => `${origin}/app?x=${code}`;
  const pending = readOauthCookie(c);
  clearOauthCookie(c);

  if (query.error) return fail("denied");
  if (!pending || !query.code || !query.state) return fail("failed");
  if (pending.state !== query.state) return fail("failed");

  try {
    const accessToken = await exchangeCode({
      code: query.code,
      verifier: pending.verifier,
      redirectUri: pending.redirectUri,
    });
    const user = await fetchMe(accessToken);
    const existing = await getLinkByUserId(user.id);
    if (existing && existing.address !== walletKey(address)) {
      return fail("taken");
    }

    const oauthFollow = await followsWithToken(accessToken, user.id);
    const followsUs =
      oauthFollow ?? (await checkFollowsUs(user.id, user.username));

    await putLink({
      address: walletKey(address),
      username: user.username,
      userId: user.id,
      verifiedAt: new Date().toISOString(),
      followsUs,
      followsCheckedAt: new Date().toISOString(),
    });

    return `${origin}/app?x=${followsUs ? "linked" : "follow"}`;
  } catch {
    return fail("failed");
  }
};
