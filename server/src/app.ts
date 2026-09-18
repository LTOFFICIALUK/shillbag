import { Hono } from "hono";
import { cors } from "hono/cors";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, X_HANDLE, ADMIN_EMAIL } from "./config";
import { readHoldings } from "./chain";
import { treasuryReady } from "./payout";
import { isSolanaAddress, walletKey } from "./wallet";
import { runScan } from "./scan";
import {
  LIKE_USD,
  QUOTE_USD,
  REPLY_USD,
  REPOST_USD,
} from "./scoring";
import {
  clearSessionCookie,
  createSessionCookie,
  readSessionAddress,
  verifyHoldingsSignature,
} from "./session";
import {
  getLink,
  recentPayouts,
  dailyPaid,
  lastScanAt,
  getAdminStats,
} from "./store";
import { TIERS, bagbackPercent } from "./tiers";
import {
  appOrigin,
  finishXOauth,
  xOauthConfigured,
  xOauthStartUrl,
} from "./x-oauth";
import {
  clearAdminCookie,
  readAdminEmail,
  verifyAdminLogin,
} from "./admin";

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ?? "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.get("/health", (c) => c.json({ ok: true, product: "shillbag" }));

app.get("/api/config", (c) =>
  c.json({
    tokenSymbol: TOKEN_SYMBOL,
    tokenAddress: TOKEN_ADDRESS,
    treasuryReady: treasuryReady(),
    xHandle: X_HANDLE,
    xOauth: xOauthConfigured(),
    likeUsd: LIKE_USD,
    repostUsd: REPOST_USD,
    quoteUsd: QUOTE_USD,
    replyUsd: REPLY_USD,
    tiers: TIERS.map((tier) => ({
      ...tier,
      bagbackPercent: bagbackPercent(tier),
    })),
    assets: [],
  }),
);

app.get("/api/me", async (c) => {
  const address = await readSessionAddress(c);
  if (!address) return c.json({ connected: false });

  try {
    const holdings = await readHoldings(address);
    const link = await getLink(address);
    const paid = await dailyPaid(address);
    const last = await lastScanAt(address);
    return c.json({
      connected: true,
      address,
      tokenSymbol: TOKEN_SYMBOL,
      holdings,
      tier: {
        ...holdings.tier,
        bagbackPercent: bagbackPercent(holdings.tier),
      },
      x: link,
      dailyPaidUsd: paid,
      remainingDailyUsd: Math.max(0, holdings.tier.dailyCapUsd - paid),
      lastScanAt: last,
    });
  } catch (error) {
    return c.json(
      {
        connected: true,
        address,
        error:
          error instanceof Error
            ? error.message
            : "Could not read holdings on Solana.",
      },
      502,
    );
  }
});

app.delete("/api/session", async (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

app.get("/api/x/oauth/start", async (c) => {
  const origin = appOrigin(c);
  const address = await readSessionAddress(c);
  if (!address) return c.redirect(`${origin}/app?x=need_wallet`);
  if (!xOauthConfigured()) return c.redirect(`${origin}/app?x=not_configured`);
  return c.redirect(xOauthStartUrl(c));
});

app.get("/api/x/oauth/callback", async (c) => {
  const origin = appOrigin(c);
  const address = await readSessionAddress(c);
  if (!address) return c.redirect(`${origin}/app?x=need_wallet`);
  const location = await finishXOauth(c, address, {
    code: c.req.query("code"),
    state: c.req.query("state"),
    error: c.req.query("error"),
  });
  return c.redirect(location);
});

app.post("/api/session", async (c) => {
  const body = (await c.req.json()) as {
    address?: string;
    signature?: string;
    message?: string;
  };

  if (
    !body.address ||
    !isSolanaAddress(body.address) ||
    !body.signature ||
    !body.message
  ) {
    return c.json({ error: "Missing wallet signature." }, 400);
  }

  try {
    await verifyHoldingsSignature({
      address: body.address,
      signature: body.signature,
      message: body.message,
    });
    await createSessionCookie(c, body.address);
    return c.json({ ok: true, address: walletKey(body.address) });
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Could not approve bag.",
      },
      401,
    );
  }
});

app.post("/api/scan", async (c) => {
  const address = await readSessionAddress(c);
  if (!address) {
    return c.json({ error: "Link Phantom first." }, 401);
  }

  const holdings = await readHoldings(address);
  if (holdings.tier.id === "none") {
    return c.json(
      {
        error: `Bag $100 of $${TOKEN_SYMBOL} to unlock a raid. We do not read X for lurkers.`,
      },
      403,
    );
  }

  const link = await getLink(address);
  if (!link) {
    return c.json(
      { error: "Connect an X account after the bag is proven." },
      403,
    );
  }

  try {
    const result = await runScan({
      address,
      holdingsUsd: holdings.holdUsd,
      tier: holdings.tier,
      link,
    });
    return c.json({
      ...result,
      tier: holdings.tier,
      holdUsd: holdings.holdUsd,
    });
  } catch (error) {
    console.error("scan failed", error);
    return c.json(
      {
        error: "Timeline is jammed. Try again in a minute.",
      },
      503,
    );
  }
});

app.get("/api/payouts", async (c) => {
  const payouts = await recentPayouts(10);
  return c.json({ payouts });
});

app.post("/api/admin/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
  };
  const result = await verifyAdminLogin(
    c,
    body.email ?? "",
    body.code ?? "",
  );
  if (!result.ok) {
    if (result.retryAfterSec) {
      c.header("Retry-After", String(result.retryAfterSec));
    }
    return c.json({ error: result.error }, result.status);
  }
  return c.json({ ok: true, email: result.email });
});

app.post("/api/admin/logout", (c) => {
  clearAdminCookie(c);
  return c.json({ ok: true });
});

app.get("/api/admin/stats", async (c) => {
  if (!readAdminEmail(c)) {
    return c.json({ error: "Admin sign in required." }, 401);
  }
  try {
    const stats = await getAdminStats();
    return c.json({ ok: true, email: ADMIN_EMAIL, stats });
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load admin stats.",
      },
      502,
    );
  }
});
