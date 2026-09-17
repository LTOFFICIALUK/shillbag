import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "./config";

export type PayableAsset = {
  symbol: string;
  name: string;
  kind: "meme" | "token";
  mint?: string;
  decimals?: number;
  aliases?: string[];
};

const MEMES: PayableAsset[] = [
  {
    symbol: "BONK",
    name: "Bonk",
    kind: "meme",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    kind: "meme",
    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    decimals: 6,
    aliases: ["DOGWIFHAT"],
  },
  {
    symbol: "POPCAT",
    name: "Popcat",
    kind: "meme",
    mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    decimals: 9,
  },
  {
    symbol: "FARTCOIN",
    name: "Fartcoin",
    kind: "meme",
    mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    decimals: 6,
    aliases: ["FART"],
  },
  {
    symbol: "MEW",
    name: "cat in a dogs world",
    kind: "meme",
    mint: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
    decimals: 5,
  },
  {
    symbol: "PNUT",
    name: "Peanut the Squirrel",
    kind: "meme",
    mint: "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump",
    decimals: 6,
  },
  {
    symbol: "GOAT",
    name: "Goatseus Maximus",
    kind: "meme",
    mint: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
    decimals: 6,
  },
  {
    symbol: "TRUMP",
    name: "OFFICIAL TRUMP",
    kind: "meme",
    mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    decimals: 6,
  },
  {
    symbol: "PENGU",
    name: "Pudgy Penguins",
    kind: "meme",
    mint: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv",
    decimals: 6,
  },
  {
    symbol: "BOME",
    name: "BOOK OF MEME",
    kind: "meme",
    mint: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82",
    decimals: 6,
  },
  {
    symbol: "SAMO",
    name: "Samoyed Coin",
    kind: "meme",
    mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    decimals: 9,
  },
  {
    symbol: "GIGA",
    name: "GIGACHAD",
    kind: "meme",
    mint: "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9",
    decimals: 5,
  },
  {
    symbol: "MOODENG",
    name: "Moo Deng",
    kind: "meme",
    mint: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY",
    decimals: 6,
  },
  {
    symbol: "CHILLGUY",
    name: "Just a chill guy",
    kind: "meme",
    mint: "Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump",
    decimals: 6,
  },
  {
    symbol: "USELESS",
    name: "USELESS COIN",
    kind: "meme",
    mint: "Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk",
    decimals: 6,
  },
  {
    symbol: "FWOG",
    name: "FWOG",
    kind: "meme",
    mint: "A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump",
    decimals: 6,
  },
  {
    symbol: "AI16Z",
    name: "ai16z",
    kind: "meme",
    mint: "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
    decimals: 9,
  },
  {
    symbol: "WEN",
    name: "Wen",
    kind: "meme",
    mint: "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk",
    decimals: 5,
  },
  {
    symbol: "MICHI",
    name: "michi",
    kind: "meme",
    mint: "AywAYdNJnSLSXwKWYxDciPjqGRnwp4iZdQptuuQTpump",
    decimals: 6,
  },
  {
    symbol: "RETARDIO",
    name: "RETARDIO",
    kind: "meme",
    mint: "6ogzHhzdrQr9Pgv6hZ2MNze7UrzBMAFyBBWUYp1Fhitx",
    decimals: 6,
  },
  {
    symbol: "TROLL",
    name: "TROLL",
    kind: "meme",
    mint: "5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2",
    decimals: 6,
  },
  {
    symbol: "MOONPIG",
    name: "moonpig",
    kind: "meme",
    mint: "Ai3eKAWjzKMV8wRwd41nVP83yqfbAVJykhvJVPxspump",
    decimals: 6,
  },
  {
    symbol: "SPX",
    name: "SPX6900",
    kind: "meme",
    mint: "J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr",
    decimals: 8,
    aliases: ["SPX6900"],
  },
];

export const OUR_TOKEN: PayableAsset = {
  symbol: TOKEN_SYMBOL.toUpperCase(),
  name: `$${TOKEN_SYMBOL.toUpperCase()}`,
  kind: "token",
  ...(TOKEN_ADDRESS ? { mint: TOKEN_ADDRESS } : {}),
};

export const PAYABLE_ASSETS: PayableAsset[] = [...MEMES, OUR_TOKEN];

export const PAYABLE_BY_SYMBOL = new Map<string, PayableAsset>();

for (const asset of PAYABLE_ASSETS) {
  PAYABLE_BY_SYMBOL.set(asset.symbol.toUpperCase(), asset);
  for (const alias of asset.aliases ?? []) {
    PAYABLE_BY_SYMBOL.set(alias.toUpperCase(), asset);
  }
}

if (OUR_TOKEN.symbol !== "SHILLBAG") {
  PAYABLE_BY_SYMBOL.set("SHILLBAG", OUR_TOKEN);
  PAYABLE_BY_SYMBOL.set("BAGSHOT", OUR_TOKEN);
}

const CASHTAG_RE = /\$([A-Za-z][A-Za-z0-9]{0,14})\b/g;

export const extractCashtags = (text: string) => {
  const found = new Set<string>();
  for (const match of text.matchAll(CASHTAG_RE)) {
    found.add(match[1].toUpperCase());
  }
  return [...found];
};

export const payableCashtags = (text: string) =>
  extractCashtags(text)
    .map((symbol) => PAYABLE_BY_SYMBOL.get(symbol))
    .filter((asset): asset is PayableAsset => Boolean(asset))
    .filter(
      (asset, index, list) =>
        list.findIndex((item) => item.symbol === asset.symbol) === index,
    );

export const FEATURED_TICKERS = [
  "BONK",
  "WIF",
  "POPCAT",
  "FARTCOIN",
  "PENGU",
  "TRUMP",
  "MEW",
  "PNUT",
  "GOAT",
  "MOODENG",
  TOKEN_SYMBOL.toUpperCase(),
];
