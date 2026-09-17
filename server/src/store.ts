import { pool } from "./db";
import { walletKey } from "./wallet";

export type SessionRecord = {
  address: string;
  holdingsApprovedAt: string;
  expiresAt: string;
};

export type ChallengeRecord = {
  address: string;
  code: string;
  createdAt: string;
};

export type XLink = {
  address: string;
  username: string;
  userId: string;
  verifiedAt: string;
  followsUs: boolean;
  followsCheckedAt?: string;
};

export type ClaimRecord = {
  tweetId: string;
  address: string;
  username: string;
  payoutUsd: number;
  assets: { symbol: string; payoutUsd: number }[];
  claimedAt: string;
  status: "reserved" | "sent" | "skipped";
  txSignature?: string | null;
  payoutError?: string | null;
};

export type ScanRecord = {
  id: string;
  address: string;
  username: string;
  at: string;
  pagesFetched: number;
  tweetsLooked: number;
  paidUsd: number;
  lookbackLabel: string;
  tierId: string;
};

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export const putSession = async (session: SessionRecord) => {
  await pool.query(
    `INSERT INTO sessions (address, holdings_approved_at, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (address) DO UPDATE SET
       holdings_approved_at = EXCLUDED.holdings_approved_at,
       expires_at = EXCLUDED.expires_at`,
    [walletKey(session.address), session.holdingsApprovedAt, session.expiresAt],
  );
  return session;
};

export const getSession = async (address: string) => {
  const result = await pool.query(
    `SELECT address, holdings_approved_at, expires_at
     FROM sessions WHERE address = $1`,
    [walletKey(address)],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    address: row.address,
    holdingsApprovedAt: iso(row.holdings_approved_at),
    expiresAt: iso(row.expires_at),
  } satisfies SessionRecord;
};

export const putChallenge = async (challenge: ChallengeRecord) => {
  await pool.query(
    `INSERT INTO challenges (address, code, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (address) DO UPDATE SET
       code = EXCLUDED.code,
       created_at = EXCLUDED.created_at`,
    [walletKey(challenge.address), challenge.code, challenge.createdAt],
  );
  return challenge;
};

export const getChallenge = async (address: string) => {
  const result = await pool.query(
    `SELECT address, code, created_at FROM challenges WHERE address = $1`,
    [walletKey(address)],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    address: row.address,
    code: row.code,
    createdAt: iso(row.created_at),
  } satisfies ChallengeRecord;
};

export const putLink = async (link: XLink) => {
  await pool.query(
    `INSERT INTO x_links (
       address, username, user_id, verified_at, follows_us, follows_checked_at
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (address) DO UPDATE SET
       username = EXCLUDED.username,
       user_id = EXCLUDED.user_id,
       verified_at = EXCLUDED.verified_at,
       follows_us = EXCLUDED.follows_us,
       follows_checked_at = EXCLUDED.follows_checked_at`,
    [
      walletKey(link.address),
      link.username,
      link.userId,
      link.verifiedAt,
      link.followsUs,
      link.followsCheckedAt ?? null,
    ],
  );
  return link;
};

export const getLink = async (address: string) => {
  const result = await pool.query(
    `SELECT address, username, user_id, verified_at, follows_us, follows_checked_at
     FROM x_links WHERE address = $1`,
    [walletKey(address)],
  );
  return mapLink(result.rows[0]);
};

export const getLinkByUserId = async (userId: string) => {
  const result = await pool.query(
    `SELECT address, username, user_id, verified_at, follows_us, follows_checked_at
     FROM x_links WHERE user_id = $1`,
    [userId],
  );
  return mapLink(result.rows[0]);
};

const mapLink = (row: {
  address: string;
  username: string;
  user_id: string;
  verified_at: Date | string;
  follows_us: boolean;
  follows_checked_at: Date | string | null;
} | undefined) => {
  if (!row) return null;
  return {
    address: row.address,
    username: row.username,
    userId: row.user_id,
    verifiedAt: iso(row.verified_at),
    followsUs: Boolean(row.follows_us),
    followsCheckedAt: row.follows_checked_at
      ? iso(row.follows_checked_at)
      : undefined,
  } satisfies XLink;
};

export const getClaim = async (tweetId: string) => {
  const result = await pool.query(
    `SELECT tweet_id, address, username, payout_usd, assets, claimed_at, status,
            tx_signature, payout_error
     FROM claims WHERE tweet_id = $1`,
    [tweetId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return mapClaim(row);
};

const mapClaim = (row: {
  tweet_id: string;
  address: string;
  username: string;
  payout_usd: string | number;
  assets: ClaimRecord["assets"];
  claimed_at: Date | string;
  status: ClaimRecord["status"];
  tx_signature?: string | null;
  payout_error?: string | null;
}) =>
  ({
    tweetId: row.tweet_id,
    address: row.address,
    username: row.username,
    payoutUsd: Number(row.payout_usd),
    assets: row.assets,
    claimedAt: iso(row.claimed_at),
    status: row.status,
    txSignature: row.tx_signature ?? null,
    payoutError: row.payout_error ?? null,
  }) satisfies ClaimRecord;

export const tryInsertClaim = async (claim: ClaimRecord) => {
  const result = await pool.query(
    `INSERT INTO claims (
       tweet_id, address, username, payout_usd, assets, claimed_at, status
     ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
     ON CONFLICT (tweet_id) DO NOTHING
     RETURNING tweet_id`,
    [
      claim.tweetId,
      walletKey(claim.address),
      claim.username,
      claim.payoutUsd,
      JSON.stringify(claim.assets),
      claim.claimedAt,
      claim.status,
    ],
  );
  return Boolean(result.rowCount);
};

export const markClaimSent = async (tweetId: string, signature: string) => {
  await pool.query(
    `UPDATE claims
     SET status = 'sent', tx_signature = $2, payout_error = NULL
     WHERE tweet_id = $1 AND status <> 'sent'`,
    [tweetId, signature],
  );
};

export const markClaimPayoutError = async (tweetId: string, error: string) => {
  await pool.query(
    `UPDATE claims SET payout_error = $2 WHERE tweet_id = $1 AND status = 'reserved'`,
    [tweetId, error],
  );
};

export const lockAndPayClaim = async (
  tweetId: string,
  send: (
    claim: ClaimRecord,
  ) => Promise<{ ok: true; signature: string } | { ok: false; error: string }>,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT tweet_id, address, username, payout_usd, assets, claimed_at, status,
              tx_signature, payout_error
       FROM claims WHERE tweet_id = $1 FOR UPDATE`,
      [tweetId],
    );
    const row = locked.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return { ok: false as const, error: "Claim missing." };
    }
    const claim = mapClaim(row);
    if (claim.status === "sent") {
      await client.query("COMMIT");
      return {
        ok: true as const,
        signature: claim.txSignature ?? "",
        alreadySent: true as const,
        claim,
      };
    }
    if (claim.status !== "reserved") {
      await client.query("COMMIT");
      return { ok: false as const, error: "Claim is not payable.", claim };
    }

    const paid = await send(claim);
    if (!paid.ok) {
      await client.query(
        `UPDATE claims SET payout_error = $2 WHERE tweet_id = $1`,
        [tweetId, paid.error],
      );
      await client.query("COMMIT");
      return { ...paid, claim };
    }

    await client.query(
      `UPDATE claims
       SET status = 'sent', tx_signature = $2, payout_error = NULL
       WHERE tweet_id = $1`,
      [tweetId, paid.signature],
    );
    await client.query("COMMIT");
    return { ok: true as const, signature: paid.signature, alreadySent: false as const, claim };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const putScan = async (scan: ScanRecord) => {
  await pool.query(
    `INSERT INTO scans (
       id, address, username, at, pages_fetched, tweets_looked,
       paid_usd, lookback_label, tier_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      scan.id,
      walletKey(scan.address),
      scan.username,
      scan.at,
      scan.pagesFetched,
      scan.tweetsLooked,
      scan.paidUsd,
      scan.lookbackLabel,
      scan.tierId,
    ],
  );
  await pool.query(
    `INSERT INTO last_scans (address, at) VALUES ($1, $2)
     ON CONFLICT (address) DO UPDATE SET at = EXCLUDED.at`,
    [walletKey(scan.address), scan.at],
  );
  return scan;
};

export const lastScanAt = async (address: string) => {
  const result = await pool.query(
    `SELECT at FROM last_scans WHERE address = $1`,
    [walletKey(address)],
  );
  return result.rows[0] ? iso(result.rows[0].at) : null;
};

export type ScanCoverage = {
  address: string;
  tierId: string;
  coveredFrom: string;
  coveredTo: string;
};

export const getScanCoverage = async (address: string) => {
  const result = await pool.query(
    `SELECT address, tier_id, covered_from, covered_to
     FROM scan_coverage WHERE address = $1`,
    [walletKey(address)],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    address: row.address,
    tierId: row.tier_id,
    coveredFrom: iso(row.covered_from),
    coveredTo: iso(row.covered_to),
  } satisfies ScanCoverage;
};

export const putScanCoverage = async (coverage: ScanCoverage) => {
  await pool.query(
    `INSERT INTO scan_coverage (address, tier_id, covered_from, covered_to)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (address) DO UPDATE SET
       tier_id = EXCLUDED.tier_id,
       covered_from = EXCLUDED.covered_from,
       covered_to = EXCLUDED.covered_to`,
    [
      walletKey(coverage.address),
      coverage.tierId,
      coverage.coveredFrom,
      coverage.coveredTo,
    ],
  );
  return coverage;
};

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const dailyPaid = async (address: string) => {
  const result = await pool.query(
    `SELECT paid_usd FROM daily_spend WHERE address = $1 AND day = $2`,
    [walletKey(address), todayKey()],
  );
  return result.rows[0] ? Number(result.rows[0].paid_usd) : 0;
};

export const addDailyPaid = async (address: string, amount: number) => {
  const result = await pool.query(
    `INSERT INTO daily_spend (address, day, paid_usd)
     VALUES ($1, $2, $3)
     ON CONFLICT (address, day) DO UPDATE SET
       paid_usd = daily_spend.paid_usd + EXCLUDED.paid_usd
     RETURNING paid_usd`,
    [walletKey(address), todayKey(), amount],
  );
  return Number(result.rows[0].paid_usd);
};

export const recentPayouts = async (limit = 8) => {
  const result = await pool.query(
    `SELECT tweet_id, address, username, payout_usd, assets, claimed_at, status
     FROM claims
     WHERE payout_usd > 0
     ORDER BY claimed_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map(
    (row) =>
      ({
        tweetId: row.tweet_id,
        address: row.address,
        username: row.username,
        payoutUsd: Number(row.payout_usd),
        assets: row.assets,
        claimedAt: iso(row.claimed_at),
        status: row.status,
      }) satisfies ClaimRecord,
  );
};

export const countRecentAdminFailures = async (ip: string, windowMs: number) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM admin_attempts
     WHERE ip = $1
       AND ok = FALSE
       AND attempted_at > NOW() - make_interval(secs => $2::int)`,
    [ip, Math.ceil(windowMs / 1000)],
  );
  return Number(result.rows[0]?.n ?? 0);
};

export const recordAdminAttempt = async (ip: string, ok: boolean) => {
  await pool.query(
    `INSERT INTO admin_attempts (ip, ok) VALUES ($1, $2)`,
    [ip, ok],
  );
};

export const getAdminStats = async () => {
  const [
    wallets,
    links,
    following,
    scans,
    scansDay,
    paid,
    paidDay,
    claims,
    spendDays,
    tiers,
    recentScans,
    recentClaims,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS n FROM sessions`),
    pool.query(`SELECT COUNT(*)::int AS n FROM x_links`),
    pool.query(
      `SELECT COUNT(*)::int AS n FROM x_links WHERE follows_us = TRUE`,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS n, COALESCE(SUM(tweets_looked), 0)::int AS tweets,
              COALESCE(SUM(pages_fetched), 0)::int AS pages,
              COALESCE(SUM(paid_usd), 0)::float AS paid
       FROM scans`,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS n, COALESCE(SUM(paid_usd), 0)::float AS paid
       FROM scans WHERE at > NOW() - INTERVAL '24 hours'`,
    ),
    pool.query(
      `SELECT COALESCE(SUM(payout_usd), 0)::float AS paid FROM claims WHERE payout_usd > 0`,
    ),
    pool.query(
      `SELECT COALESCE(SUM(payout_usd), 0)::float AS paid
       FROM claims WHERE payout_usd > 0 AND claimed_at > NOW() - INTERVAL '24 hours'`,
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS n, COALESCE(SUM(payout_usd), 0)::float AS paid
       FROM claims GROUP BY status`,
    ),
    pool.query(
      `SELECT day::text AS day, COALESCE(SUM(paid_usd), 0)::float AS paid
       FROM daily_spend
       WHERE day >= CURRENT_DATE - INTERVAL '13 days'
       GROUP BY day
       ORDER BY day ASC`,
    ),
    pool.query(
      `SELECT tier_id, COUNT(*)::int AS n, COALESCE(SUM(paid_usd), 0)::float AS paid
       FROM scans GROUP BY tier_id ORDER BY n DESC`,
    ),
    pool.query(
      `SELECT id, address, username, at, pages_fetched, tweets_looked, paid_usd, lookback_label, tier_id
       FROM scans ORDER BY at DESC LIMIT 25`,
    ),
    pool.query(
      `SELECT tweet_id, address, username, payout_usd, assets, claimed_at, status
       FROM claims ORDER BY claimed_at DESC LIMIT 25`,
    ),
  ]);

  const claimRows = claims.rows as {
    status: string;
    n: number;
    paid: number;
  }[];

  return {
    wallets: Number(wallets.rows[0]?.n ?? 0),
    xLinked: Number(links.rows[0]?.n ?? 0),
    followingUs: Number(following.rows[0]?.n ?? 0),
    scans: Number(scans.rows[0]?.n ?? 0),
    tweetsLooked: Number(scans.rows[0]?.tweets ?? 0),
    pagesFetched: Number(scans.rows[0]?.pages ?? 0),
    paidUsd: Number(paid.rows[0]?.paid ?? 0),
    paidUsd24h: Number(paidDay.rows[0]?.paid ?? 0),
    scans24h: Number(scansDay.rows[0]?.n ?? 0),
    scanPaid24h: Number(scansDay.rows[0]?.paid ?? 0),
    claims: Object.fromEntries(
      claimRows.map((row) => [row.status, { count: row.n, paid: row.paid }]),
    ),
    spendByDay: spendDays.rows.map((row) => ({
      day: row.day as string,
      paid: Number(row.paid),
    })),
    scansByTier: tiers.rows.map((row) => ({
      tierId: row.tier_id as string,
      count: Number(row.n),
      paid: Number(row.paid),
    })),
    recentScans: recentScans.rows.map((row) => ({
      id: row.id as string,
      address: row.address as string,
      username: row.username as string,
      at: iso(row.at),
      pagesFetched: Number(row.pages_fetched),
      tweetsLooked: Number(row.tweets_looked),
      paidUsd: Number(row.paid_usd),
      lookbackLabel: row.lookback_label as string,
      tierId: row.tier_id as string,
    })),
    recentClaims: recentClaims.rows.map((row) => ({
      tweetId: row.tweet_id as string,
      address: row.address as string,
      username: row.username as string,
      payoutUsd: Number(row.payout_usd),
      assets: row.assets,
      claimedAt: iso(row.claimed_at),
      status: row.status as string,
    })),
  };
};
