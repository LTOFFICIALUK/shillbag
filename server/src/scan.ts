import { payableCashtags } from "./memes";
import { TOKEN_SYMBOL, X_HANDLE, X_USER_ID } from "./config";
import { sendClaimTokens } from "./payout";
import { scorePost, type ScoredPost } from "./scoring";
import {
  addDailyPaid,
  dailyPaid,
  getClaim,
  getScanCoverage,
  lastScanAt,
  lockAndPayClaim,
  putLink,
  putScan,
  putScanCoverage,
  tryInsertClaim,
  type ClaimRecord,
  type XLink,
} from "./store";
import type { Tier } from "./tiers";
import {
  listFollowing,
  listUserTweets,
  TrafficError,
  twtapiEnabled,
  type TwtTweet,
} from "./twtapi";
import { demoTweets } from "./mock";
import { walletKey } from "./wallet";

const FOLLOW_PAGES = 8;

export const checkFollowsUs = async (userId: string, username: string) => {
  if (!twtapiEnabled()) return true;
  const targetId = X_USER_ID;
  const targetHandle = X_HANDLE.toLowerCase();
  let cursor: string | undefined;

  try {
    for (let page = 0; page < FOLLOW_PAGES; page += 1) {
      const result = await listFollowing(userId, cursor);
      const hit = result.users.some((user) => {
        const handle = (user.username ?? user.screen_name ?? "").toLowerCase();
        return (
          (targetId && user.user_id === targetId) || handle === targetHandle
        );
      });
      if (hit) return true;
      if (!result.cursor_bottom) break;
      cursor = result.cursor_bottom;
    }
  } catch (error) {
    if (error instanceof TrafficError) throw error;
    return username.toLowerCase() === targetHandle;
  }

  return false;
};

export type ScanResult = {
  demo: boolean;
  pagesFetched: number;
  tweetsLooked: number;
  paidUsd: number;
  remainingDailyUsd: number;
  posts: ScoredPost[];
  skipped: ScoredPost[];
  gate?: string;
};

export const runScan = async (input: {
  address: string;
  holdingsUsd: number;
  tier: Tier;
  link: XLink;
}): Promise<ScanResult> => {
  if (input.tier.id === "none") {
    return {
      demo: !twtapiEnabled(),
      pagesFetched: 0,
      tweetsLooked: 0,
      paidUsd: 0,
      remainingDailyUsd: 0,
      posts: [],
      skipped: [],
      gate: `Bag $100 of $${TOKEN_SYMBOL} before we raid the timeline.`,
    };
  }

  const last = await lastScanAt(input.address);
  if (last && Date.now() - Date.parse(last) < input.tier.scanCooldownMs) {
    const waitMin = Math.ceil(
      (input.tier.scanCooldownMs - (Date.now() - Date.parse(last))) / 60000,
    );
    return {
      demo: !twtapiEnabled(),
      pagesFetched: 0,
      tweetsLooked: 0,
      paidUsd: 0,
      remainingDailyUsd: Math.max(
        0,
        input.tier.dailyCapUsd - (await dailyPaid(input.address)),
      ),
      posts: [],
      skipped: [],
      gate: `Cooldown. Next raid in ${waitMin} min. Ranks pace X reads.`,
    };
  }

  if (!input.link.followsUs) {
    const follows = await checkFollowsUs(input.link.userId, input.link.username);
    await putLink({
      ...input.link,
      followsUs: follows,
      followsCheckedAt: new Date().toISOString(),
    });
    if (!follows) {
      return {
        demo: !twtapiEnabled(),
        pagesFetched: 0,
        tweetsLooked: 0,
        paidUsd: 0,
        remainingDailyUsd: 0,
        posts: [],
        skipped: [],
        gate: `Follow @${X_HANDLE} on X or we keep the bag.`,
      };
    }
  }

  const cutoff = Date.now() - input.tier.lookbackMs;
  const scannedAt = new Date().toISOString();
  const coverage = await getScanCoverage(input.address);
  const sameTier = Boolean(coverage && coverage.tierId === input.tier.id);
  const stopAt = sameTier && coverage
    ? Math.max(cutoff, Date.parse(coverage.coveredTo))
    : cutoff;

  const tweets: TwtTweet[] = [];
  let pagesFetched = 0;
  let cursor: string | undefined;
  let reachedStop = false;
  let oldestSeen: number | undefined;
  const demo = !twtapiEnabled();

  if (demo) {
    tweets.push(
      ...demoTweets(input.link.username, cutoff).filter(
        (tweet) => Date.parse(tweet.created_at) > stopAt,
      ),
    );
    pagesFetched = 1;
    reachedStop = true;
  } else {
    while (pagesFetched < input.tier.maxPages) {
      const page = await listUserTweets(input.link.userId, cursor);
      pagesFetched += 1;
      if (page.tweets.length === 0) {
        reachedStop = true;
        break;
      }
      for (const tweet of page.tweets) {
        const created = Date.parse(tweet.created_at);
        if (!Number.isFinite(created)) continue;
        if (oldestSeen === undefined || created < oldestSeen) oldestSeen = created;
        if (created <= stopAt) {
          reachedStop = true;
          continue;
        }
        tweets.push(tweet);
      }
      if (reachedStop || !page.cursor_bottom) {
        if (!page.cursor_bottom) reachedStop = true;
        break;
      }
      cursor = page.cursor_bottom;
    }
  }

  const coveredFrom = sameTier && coverage
    ? coverage.coveredFrom
    : new Date(
        reachedStop || oldestSeen === undefined ? cutoff : oldestSeen,
      ).toISOString();
  const coveredTo = reachedStop
    ? scannedAt
    : new Date(oldestSeen ?? Date.now()).toISOString();

  let remaining = Math.max(
    0,
    input.tier.dailyCapUsd - (await dailyPaid(input.address)),
  );
  const posts: ScoredPost[] = [];
  const skipped: ScoredPost[] = [];
  let paidUsd = 0;

  const tweetEngagement = (tweet: TwtTweet) => ({
    likes: tweet.like_count,
    reposts: tweet.retweet_count,
    quotes: tweet.quote_count,
    replies: tweet.reply_count,
  });

  const skipTweet = (tweet: TwtTweet, reason: string): ScoredPost => ({
    tweetId: tweet.tweet_id,
    text: tweet.text,
    createdAt: tweet.created_at,
    engagement: tweetEngagement(tweet),
    notionalUsd: 0,
    cappedNotionalUsd: 0,
    payoutUsd: 0,
    lines: [],
    skipped: reason,
  });

  const settleClaim = async (
    claim: ClaimRecord,
    tweet: TwtTweet,
    scored?: ScoredPost,
  ) => {
    if (claim.status === "sent") {
      skipped.push(skipTweet(tweet, "Already paid."));
      return;
    }
    if (claim.status === "skipped") {
      skipped.push(skipTweet(tweet, "Already skipped."));
      return;
    }
    if (demo) {
      skipped.push(skipTweet(tweet, "Demo scan does not send tokens."));
      return;
    }

    const paid = await lockAndPayClaim(claim.tweetId, sendClaimTokens);
    if (!paid.ok) {
      skipped.push(skipTweet(tweet, paid.error));
      return;
    }
    if (paid.alreadySent) {
      skipped.push(skipTweet(tweet, "Already paid."));
      return;
    }

    remaining -= paid.claim.payoutUsd;
    paidUsd += paid.claim.payoutUsd;
    posts.push({
      ...(scored ?? skipTweet(tweet, "")),
      skipped: undefined,
      payoutUsd: paid.claim.payoutUsd,
      txSignature: paid.signature,
    });
  };

  for (const tweet of tweets) {
    const existing = await getClaim(tweet.tweet_id);
    if (existing?.status === "sent") {
      skipped.push(skipTweet(tweet, "Already paid."));
      continue;
    }
    if (existing?.status === "skipped") {
      skipped.push(skipTweet(tweet, "Already skipped."));
      continue;
    }
    if (existing?.status === "reserved") {
      await settleClaim(existing, tweet);
      continue;
    }

    if (payableCashtags(tweet.text).length === 0) continue;

    const scored = scorePost({
      tweetId: tweet.tweet_id,
      text: tweet.text,
      createdAt: tweet.created_at,
      engagement: tweetEngagement(tweet),
      isRetweet: Boolean(tweet.is_retweet),
      tier: input.tier,
      remainingDailyUsd: remaining,
    });

    if (scored.skipped || scored.payoutUsd <= 0) {
      skipped.push(scored);
      continue;
    }

    if (demo) {
      remaining -= scored.payoutUsd;
      paidUsd += scored.payoutUsd;
      posts.push(scored);
      continue;
    }

    const claim: ClaimRecord = {
      tweetId: scored.tweetId,
      address: walletKey(input.address),
      username: input.link.username,
      payoutUsd: scored.payoutUsd,
      assets: scored.lines.map((line) => ({
        symbol: line.asset.symbol,
        payoutUsd: line.payoutUsd,
      })),
      claimedAt: new Date().toISOString(),
      status: "reserved",
    };

    const inserted = await tryInsertClaim(claim);
    if (!inserted) {
      const raced = await getClaim(tweet.tweet_id);
      if (raced?.status === "sent") {
        skipped.push(skipTweet(tweet, "Already paid."));
        continue;
      }
      if (raced?.status === "reserved") {
        await settleClaim(raced, tweet, scored);
        continue;
      }
      skipped.push(skipTweet(tweet, "Already claimed."));
      continue;
    }

    await settleClaim(claim, tweet, scored);
  }

  if (paidUsd > 0) await addDailyPaid(input.address, paidUsd);

  await putScanCoverage({
    address: walletKey(input.address),
    tierId: input.tier.id,
    coveredFrom,
    coveredTo,
  });

  await putScan({
    id: `${input.address}-${Date.now()}`,
    address: walletKey(input.address),
    username: input.link.username,
    at: new Date().toISOString(),
    pagesFetched,
    tweetsLooked: tweets.length,
    paidUsd,
    lookbackLabel: input.tier.lookbackLabel,
    tierId: input.tier.id,
  });

  return {
    demo,
    pagesFetched,
    tweetsLooked: tweets.length,
    paidUsd,
    remainingDailyUsd: remaining,
    posts,
    skipped: skipped.slice(0, 12),
  };
};
