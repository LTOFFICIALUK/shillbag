import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "./chain";
import { TOKEN_ADDRESS, TOKEN_DECIMALS, TOKEN_SYMBOL } from "./config";

export type PayableAsset = {
  symbol: string;
  name: string;
  kind: "meme" | "token";
  mint: string;
  decimals: number;
};

const CHAIN_CA_RE = /\b(solana):([1-9A-HJ-NP-Za-km-z]{32,44})\b/gi;
const BAG_RE = /\$BAG\b|\$SHILLBAG\b/i;

const URL_MINT_RE = [
  /pump\.fun\/(?:coin\/)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /axiom\.trade\/(?:meme|t|token)\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /dexscreener\.com\/solana\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /birdeye\.so\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /solscan\.io\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /gmgn\.ai\/sol\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
];

const metaCache = new Map<string, { asset: PayableAsset; at: number }>();
const missCache = new Map<string, number>();

const looksLikeMint = (value: string) => {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
};

const collectMints = (text: string, urls: string[] = []) => {
  const found = new Set<string>();
  for (const match of text.matchAll(CHAIN_CA_RE)) {
    if (match[1].toLowerCase() === "solana" && looksLikeMint(match[2])) {
      found.add(match[2]);
    }
  }
  const haystack = [text, ...urls].join(" ");
  for (const pattern of URL_MINT_RE) {
    for (const match of haystack.matchAll(new RegExp(pattern.source, "gi"))) {
      if (looksLikeMint(match[1])) found.add(match[1]);
    }
  }
  return [...found];
};

const dexMeta = async (mint: string) => {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    pairs?: {
      chainId?: string;
      priceUsd?: string;
      baseToken?: { address?: string; symbol?: string; name?: string };
      quoteToken?: { address?: string; symbol?: string; name?: string };
    }[];
  };
  const pair = data.pairs?.find((item) => item.chainId === "solana");
  if (!pair) return null;
  const token =
    pair.baseToken?.address === mint
      ? pair.baseToken
      : pair.quoteToken?.address === mint
        ? pair.quoteToken
        : pair.baseToken;
  return {
    symbol: (token?.symbol ?? "TOKEN").replace(/^\$/, "").toUpperCase(),
    name: token?.name ?? token?.symbol ?? "Token",
    priceUsd: Number(pair.priceUsd),
  };
};

const onchainDecimals = async (mint: PublicKey) => {
  const info = await connection.getParsedAccountInfo(mint, "confirmed");
  const value = info.value;
  if (!value) return null;
  const owner = value.owner;
  if (!owner.equals(TOKEN_PROGRAM_ID) && !owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return null;
  }
  const parsed = value.data;
  if (parsed && typeof parsed === "object" && "parsed" in parsed) {
    const decimals = Number(
      (parsed.parsed as { info?: { decimals?: number } }).info?.decimals,
    );
    if (Number.isFinite(decimals)) return decimals;
  }
  return null;
};

export const resolveMint = async (mint: string): Promise<PayableAsset | null> => {
  const cached = metaCache.get(mint);
  if (cached && Date.now() - cached.at < 60_000) return cached.asset;
  if ((missCache.get(mint) ?? 0) > Date.now() - 30_000) return null;

  try {
    const pubkey = new PublicKey(mint);
    const decimals = await onchainDecimals(pubkey);
    if (decimals === null) {
      missCache.set(mint, Date.now());
      return null;
    }
    const dex = await dexMeta(mint).catch(() => null);
    const asset: PayableAsset = {
      symbol: dex?.symbol ?? mint.slice(0, 6).toUpperCase(),
      name: dex?.name ?? "Solana token",
      kind: "meme",
      mint,
      decimals,
    };
    metaCache.set(mint, { asset, at: Date.now() });
    return asset;
  } catch {
    missCache.set(mint, Date.now());
    return null;
  }
};

export const ourTokenAsset = (): PayableAsset | null => {
  if (!TOKEN_ADDRESS) return null;
  return {
    symbol: TOKEN_SYMBOL.toUpperCase(),
    name: `$${TOKEN_SYMBOL.toUpperCase()}`,
    kind: "token",
    mint: TOKEN_ADDRESS,
    decimals: TOKEN_DECIMALS,
  };
};

export const resolveTweetAssets = async (
  text: string,
  urls: string[] = [],
): Promise<PayableAsset[]> => {
  const mints = collectMints(text, urls);
  const assets: PayableAsset[] = [];
  const seen = new Set<string>();

  for (const mint of mints) {
    const asset = await resolveMint(mint);
    if (!asset || seen.has(asset.mint)) continue;
    seen.add(asset.mint);
    assets.push(asset);
  }

  const bag = ourTokenAsset();
  if (bag && BAG_RE.test(text) && !seen.has(bag.mint)) {
    assets.push(bag);
  }

  return assets;
};

export const tweetHasSolanaMint = (text: string, urls: string[] = []) =>
  collectMints(text, urls).length > 0 || BAG_RE.test(text);
