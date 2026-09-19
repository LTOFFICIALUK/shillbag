import { TOKEN_SYMBOL } from "./config";

const DEX = "https://api.dexscreener.com";
const TTL_MS = 3 * 60 * 1000;
const REFRESH_MS = 3 * 60 * 1000;
const PREFERRED = new Set(["robinhood", "solana"]);
const SKIP_SYMBOLS = new Set([
  "WETH",
  "ETH",
  "SOL",
  "WSOL",
  "USDC",
  "USDT",
  "USDG",
  "WBTC",
  "WBNB",
]);

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

type DexHit = {
  url?: string;
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
  totalAmount?: number;
};

type DexPair = {
  chainId?: string;
  url?: string;
  priceUsd?: string;
  volume?: { h24?: number };
  baseToken?: { address?: string; symbol?: string; name?: string };
  quoteToken?: { address?: string; symbol?: string; name?: string };
  info?: { imageUrl?: string };
};

type Cache = {
  tokens: TrendingToken[];
  fetchedAt: number;
  source: "dexscreener" | "empty";
};

let cache: Cache = { tokens: [], fetchedAt: 0, source: "empty" };
let inflight: Promise<TrendingToken[]> | null = null;

const shortAddress = (address: string) =>
  address.length < 10
    ? address
    : `${address.slice(0, 4)}…${address.slice(-4)}`;

const demoUsd = (address: string, index: number) => {
  const seed = Number.parseInt(address.replace(/[^0-9a-f]/gi, "").slice(-4) || "1a", 16);
  const value = 0.42 + ((seed + index * 17) % 680) / 100;
  return `$${value.toFixed(2)}`;
};

const demoTime = (index: number) => `${[2, 5, 9, 14, 22, 31, 44, 58][index] ?? 8 + index}m`;

const iconUrl = (icon?: string) => {
  if (!icon) return null;
  if (icon.startsWith("http")) return icon;
  return `https://cdn.dexscreener.com/cms/images/${icon}?width=128&height=128&quality=90&format=auto`;
};

const json = async <T>(path: string): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${DEX}${path}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const collectHits = (lists: DexHit[][]) => {
  const seen = new Set<string>();
  const hits: { chainId: string; address: string; url?: string; icon?: string; boost: number }[] =
    [];
  for (const list of lists) {
    for (const item of list) {
      const chainId = (item.chainId ?? "").toLowerCase();
      const address = item.tokenAddress ?? "";
      if (!PREFERRED.has(chainId) || !address) continue;
      const key = `${chainId}:${address.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        chainId,
        address,
        url: item.url,
        icon: item.icon,
        boost: Number(item.totalAmount ?? 0),
      });
    }
  }
  hits.sort((a, b) => b.boost - a.boost);
  const robinhood = hits.filter((hit) => hit.chainId === "robinhood").slice(0, 8);
  const solana = hits.filter((hit) => hit.chainId === "solana").slice(0, 8);
  return [...robinhood, ...solana];
};

const hydrateChain = async (
  chainId: string,
  hits: { address: string; url?: string; icon?: string }[],
) => {
  if (hits.length === 0) return [] as TrendingToken[];
  const pairs = await json<DexPair[]>(
    `/tokens/v1/${chainId}/${hits.map((hit) => hit.address).join(",")}`,
  );
  if (!pairs) return [];

  const byAddress = new Map<string, DexPair>();
  for (const pair of pairs) {
    const base = pair.baseToken?.address?.toLowerCase();
    if (base) byAddress.set(base, pair);
  }

  return hits.flatMap((hit, index) => {
    const pair = byAddress.get(hit.address.toLowerCase());
    const token =
      pair?.baseToken?.address?.toLowerCase() === hit.address.toLowerCase()
        ? pair.baseToken
        : pair?.quoteToken?.address?.toLowerCase() === hit.address.toLowerCase()
          ? pair.quoteToken
          : pair?.baseToken;
    const symbol = (token?.symbol ?? "").replace(/^\$/, "").trim();
    if (!symbol || SKIP_SYMBOLS.has(symbol.toUpperCase())) return [];
    return [
      {
        symbol: symbol.toUpperCase(),
        name: token?.name ?? symbol,
        chainId,
        address: hit.address,
        imageUrl: pair?.info?.imageUrl ?? iconUrl(hit.icon),
        url: pair?.url ?? hit.url ?? `https://dexscreener.com/${chainId}/${hit.address}`,
        volume24h: Number(pair?.volume?.h24 ?? 0),
        priceUsd: pair?.priceUsd ? Number(pair.priceUsd) : null,
        demoUsd: demoUsd(hit.address, index),
        who: shortAddress(hit.address),
        time: demoTime(index),
      } satisfies TrendingToken,
    ];
  });
};

const mixChains = (tokens: TrendingToken[]) => {
  const robinhood = tokens.filter((token) => token.chainId === "robinhood");
  const solana = tokens.filter((token) => token.chainId === "solana");
  const mixed: TrendingToken[] = [];
  while (mixed.length < 8 && (robinhood.length > 0 || solana.length > 0)) {
    const hood = robinhood.shift();
    if (hood) mixed.push(hood);
    const sol = solana.shift();
    if (sol && mixed.length < 8) mixed.push(sol);
  }
  return mixed.map((token, index) => ({ ...token, time: demoTime(index) }));
};

const refreshTrending = async () => {
  if (inflight) return inflight;
  inflight = (async () => {
    const [top, latest, profiles] = await Promise.all([
      json<DexHit[]>("/token-boosts/top/v1"),
      json<DexHit[]>("/token-boosts/latest/v1"),
      json<DexHit[]>("/token-profiles/latest/v1"),
    ]);
    const hits = collectHits([top ?? [], latest ?? [], profiles ?? []]);
    const robinhood = hits.filter((hit) => hit.chainId === "robinhood");
    const solana = hits.filter((hit) => hit.chainId === "solana");
    const [hoodTokens, solTokens] = await Promise.all([
      hydrateChain("robinhood", robinhood),
      hydrateChain("solana", solana),
    ]);
    const mixed = mixChains([...hoodTokens, ...solTokens]);
    if (mixed.length === 0) return cache.tokens;
    cache = {
      tokens: mixed,
      fetchedAt: Date.now(),
      source: "dexscreener",
    };
    return mixed;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
};

export const getTrending = async () => {
  if (Date.now() - cache.fetchedAt > TTL_MS || cache.tokens.length === 0) {
    await refreshTrending().catch(() => cache.tokens);
  }
  return {
    tokens: cache.tokens,
    fetchedAt: cache.fetchedAt,
    source: cache.source,
    tokenSymbol: TOKEN_SYMBOL,
  };
};

export const startTrendingRefresh = () => {
  void refreshTrending().catch((error) => {
    console.error("trending warmup failed", error);
  });
  setInterval(() => {
    void refreshTrending().catch((error) => {
      console.error("trending refresh failed", error);
    });
  }, REFRESH_MS).unref();
};
