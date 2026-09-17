import type { PayableAsset } from "./memes";
import { payableCashtags } from "./memes";
import { bagbackPercent, type Tier } from "./tiers";

export const LIKE_USD = 0.02;
export const REPOST_USD = 0.08;
export const QUOTE_USD = 0.06;
export const REPLY_USD = 0.04;

export type Engagement = {
  likes: number;
  reposts: number;
  quotes: number;
  replies: number;
};

export const engagementNotionalUsd = (engagement: Engagement) =>
  engagement.likes * LIKE_USD +
  engagement.reposts * REPOST_USD +
  engagement.quotes * QUOTE_USD +
  engagement.replies * REPLY_USD;

export type PayoutLine = {
  asset: PayableAsset;
  notionalUsd: number;
  payoutUsd: number;
};

export type ScoredPost = {
  tweetId: string;
  text: string;
  createdAt: string;
  engagement: Engagement;
  notionalUsd: number;
  cappedNotionalUsd: number;
  payoutUsd: number;
  lines: PayoutLine[];
  skipped?: string;
  txSignature?: string;
};

export const scorePost = (input: {
  tweetId: string;
  text: string;
  createdAt: string;
  engagement: Engagement;
  isRetweet: boolean;
  tier: Tier;
  remainingDailyUsd: number;
}): ScoredPost => {
  const assets = payableCashtags(input.text);

  if (input.isRetweet) {
    return emptyScore(input, "Retweets are not eligible.");
  }
  if (assets.length === 0) {
    return emptyScore(input, "No payable ticker.");
  }

  const raw = engagementNotionalUsd(input.engagement);
  const cappedNotional = Math.min(raw, input.tier.perPostCapUsd);
  const uncappedPayout =
    (cappedNotional * bagbackPercent(input.tier)) / 100;
  const payoutUsd = Math.min(uncappedPayout, input.remainingDailyUsd);
  if (payoutUsd <= 0) {
    return emptyScore(input, "Daily cap reached.");
  }
  const share = payoutUsd / assets.length;

  return {
    tweetId: input.tweetId,
    text: input.text,
    createdAt: input.createdAt,
    engagement: input.engagement,
    notionalUsd: raw,
    cappedNotionalUsd: cappedNotional,
    payoutUsd,
    lines: assets.map((asset) => ({
      asset,
      notionalUsd: cappedNotional / assets.length,
      payoutUsd: share,
    })),
  };
};

const emptyScore = (
  input: {
    tweetId: string;
    text: string;
    createdAt: string;
    engagement: Engagement;
  },
  skipped: string,
): ScoredPost => ({
  tweetId: input.tweetId,
  text: input.text,
  createdAt: input.createdAt,
  engagement: input.engagement,
  notionalUsd: 0,
  cappedNotionalUsd: 0,
  payoutUsd: 0,
  lines: [],
  skipped,
});

export const formatUsd = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
