export type TierId =
  | "none"
  | "replyguy"
  | "shiller"
  | "alphacaller"
  | "kol"
  | "cult";

export type Tier = {
  id: TierId;
  name: string;
  minHoldUsd: number;
  bagbackBps: number;
  dailyCapUsd: number;
  lookbackMs: number;
  lookbackLabel: string;
  maxPages: number;
  scanCooldownMs: number;
  perPostCapUsd: number;
};

export const TIERS: Tier[] = [
  {
    id: "replyguy",
    name: "Reply Guy",
    minHoldUsd: 100,
    bagbackBps: 100,
    dailyCapUsd: 5,
    lookbackMs: 6 * 60 * 60 * 1000,
    lookbackLabel: "6 hours",
    maxPages: 1,
    scanCooldownMs: 30 * 60 * 1000,
    perPostCapUsd: 8,
  },
  {
    id: "shiller",
    name: "Shiller",
    minHoldUsd: 500,
    bagbackBps: 200,
    dailyCapUsd: 15,
    lookbackMs: 24 * 60 * 60 * 1000,
    lookbackLabel: "24 hours",
    maxPages: 2,
    scanCooldownMs: 20 * 60 * 1000,
    perPostCapUsd: 16,
  },
  {
    id: "alphacaller",
    name: "Alpha Caller",
    minHoldUsd: 2_500,
    bagbackBps: 300,
    dailyCapUsd: 25,
    lookbackMs: 7 * 24 * 60 * 60 * 1000,
    lookbackLabel: "7 days",
    maxPages: 4,
    scanCooldownMs: 10 * 60 * 1000,
    perPostCapUsd: 24,
  },
  {
    id: "kol",
    name: "KOL",
    minHoldUsd: 10_000,
    bagbackBps: 500,
    dailyCapUsd: 75,
    lookbackMs: 14 * 24 * 60 * 60 * 1000,
    lookbackLabel: "14 days",
    maxPages: 6,
    scanCooldownMs: 5 * 60 * 1000,
    perPostCapUsd: 40,
  },
  {
    id: "cult",
    name: "Cult Leader",
    minHoldUsd: 50_000,
    bagbackBps: 800,
    dailyCapUsd: 200,
    lookbackMs: 30 * 24 * 60 * 60 * 1000,
    lookbackLabel: "30 days",
    maxPages: 8,
    scanCooldownMs: 2 * 60 * 1000,
    perPostCapUsd: 60,
  },
];

export const NONE_TIER: Tier = {
  id: "none",
  name: "Unranked",
  minHoldUsd: 0,
  bagbackBps: 0,
  dailyCapUsd: 0,
  lookbackMs: 0,
  lookbackLabel: "none",
  maxPages: 0,
  scanCooldownMs: 60 * 60 * 1000,
  perPostCapUsd: 0,
};

export const MIN_EARNING_HOLD_USD = TIERS[0].minHoldUsd;

export const bagbackPercent = (tier: Tier) => tier.bagbackBps / 100;

export const tierFromHoldUsd = (holdUsd: number): Tier => {
  let matched: Tier = NONE_TIER;
  for (const tier of TIERS) {
    if (holdUsd >= tier.minHoldUsd) matched = tier;
  }
  return matched;
};

export const nextTier = (tier: Tier): Tier | null => {
  if (tier.id === "none") return TIERS[0];
  const index = TIERS.findIndex((item) => item.id === tier.id);
  return index >= 0 && index < TIERS.length - 1 ? TIERS[index + 1] : null;
};
