import { TOKEN_SYMBOL } from "@/lib/config";

export type TrendingToken = {
  symbol: string;
  name: string;
  chainId: string;
  address: string;
  imageUrl: string | null;
  url: string;
  volume24h: number;
  priceUsd: number | null;
  demoUsd: string;
  who: string;
  time: string;
};

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

export const fetchTrending = async (): Promise<TrendingToken[]> => {
  try {
    const response = await fetch(`${API_URL}/api/trending`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { tokens?: TrendingToken[] };
    return data.tokens ?? [];
  } catch {
    return [];
  }
};

export const tapeItems = (tokens: TrendingToken[]) => {
  const rows = tokens.map((token) => ({
    usd: token.demoUsd,
    ticker: token.symbol,
    who: token.who,
    time: token.time,
    imageUrl: token.imageUrl,
    chainId: token.chainId,
  }));
  if (!rows.some((row) => row.ticker === TOKEN_SYMBOL)) {
    rows.push({
      usd: "$0.40",
      ticker: TOKEN_SYMBOL,
      who: "2hQa…6kN9",
      time: "18m",
      imageUrl: null,
      chainId: "solana",
    });
  }
  return rows.slice(0, 8);
};
