import { Connection, PublicKey } from "@solana/web3.js";
import { formatUnits } from "viem";
import {
  FALLBACK_TOKEN_PRICE_USD,
  SOLANA_RPC,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
} from "./config";
import { tierFromHoldUsd, type Tier } from "./tiers";
import { walletKey } from "./wallet";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

export const connection = new Connection(SOLANA_RPC, "confirmed");

export type Holdings = {
  address: string;
  balance: string;
  balanceRaw: string;
  priceUsd: number;
  holdUsd: number;
  tier: Tier;
};

const priceCache: { value: number; at: number } = { value: 0, at: 0 };

export const tokenPriceUsd = async () => {
  if (Date.now() - priceCache.at < 60_000 && priceCache.value > 0) {
    return priceCache.value;
  }

  if (!TOKEN_ADDRESS) {
    return FALLBACK_TOKEN_PRICE_USD;
  }

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`,
      { cache: "no-store" },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        pairs?: { priceUsd?: string }[];
      };
      const priced = data.pairs
        ?.map((pair) => Number(pair.priceUsd))
        .find((price) => Number.isFinite(price) && price > 0);
      if (priced) {
        priceCache.value = priced;
        priceCache.at = Date.now();
        return priced;
      }
    }
  } catch {
    // fall through to configured price
  }

  priceCache.value = FALLBACK_TOKEN_PRICE_USD;
  priceCache.at = Date.now();
  return FALLBACK_TOKEN_PRICE_USD;
};

const splBalanceRaw = async (owner: PublicKey, mint: PublicKey) => {
  let raw = BigInt(0);
  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
      mint,
      programId,
    });
    for (const account of accounts.value) {
      const amount = account.account.data.parsed.info.tokenAmount.amount as string;
      raw += BigInt(amount);
    }
  }
  return raw;
};

export const readHoldings = async (address: string): Promise<Holdings> => {
  const wallet = walletKey(address);
  const priceUsd = await tokenPriceUsd();
  let balanceRaw = BigInt(0);
  if (TOKEN_ADDRESS) {
    try {
      balanceRaw = await splBalanceRaw(
        new PublicKey(wallet),
        new PublicKey(TOKEN_ADDRESS),
      );
    } catch {
      balanceRaw = BigInt(0);
    }
  }

  const balance = formatUnits(balanceRaw, TOKEN_DECIMALS);
  const onchainUsd = Number(balance) * priceUsd;
  const demoUsd = Number(process.env.DEMO_HOLDINGS_USD ?? 0);
  const holdUsd = Math.max(onchainUsd, demoUsd);

  return {
    address: wallet,
    balance,
    balanceRaw: balanceRaw.toString(),
    priceUsd,
    holdUsd,
    tier: tierFromHoldUsd(holdUsd),
  };
};
