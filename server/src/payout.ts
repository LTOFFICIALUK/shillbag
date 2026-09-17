import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { resolveMint } from "./tokens";
import { connection } from "./chain";
import {
  TOKEN_DECIMALS,
  TREASURY_ADDRESS,
  TREASURY_SECRET_KEY,
} from "./config";
import type { ClaimRecord } from "./store";

const MEMO_PROGRAM = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

const priceCache = new Map<string, { value: number; at: number }>();

export const treasuryReady = () => Boolean(TREASURY_SECRET_KEY);

const loadTreasury = () => {
  if (!TREASURY_SECRET_KEY) {
    throw new Error("Treasury wallet is not configured.");
  }
  const secret = TREASURY_SECRET_KEY.startsWith("[")
    ? Uint8Array.from(JSON.parse(TREASURY_SECRET_KEY) as number[])
    : TREASURY_SECRET_KEY.length > 88
      ? Buffer.from(TREASURY_SECRET_KEY, "base64")
      : bs58.decode(TREASURY_SECRET_KEY);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  if (TREASURY_ADDRESS && keypair.publicKey.toBase58() !== TREASURY_ADDRESS) {
    throw new Error("Treasury secret does not match TREASURY_ADDRESS.");
  }
  return keypair;
};

const mintProgramId = async (mint: PublicKey) => {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error(`Mint ${mint.toBase58()} is not on Solana.`);
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  throw new Error(`Mint ${mint.toBase58()} is not an SPL token.`);
};

const mintPriceUsd = async (mint: string) => {
  const cached = priceCache.get(mint);
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
      { cache: "no-store" },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        pairs?: { chainId?: string; priceUsd?: string }[];
      };
      const priced = data.pairs
        ?.filter((pair) => pair.chainId === "solana")
        .map((pair) => Number(pair.priceUsd))
        .find((price) => Number.isFinite(price) && price > 0);
      if (priced) {
        priceCache.set(mint, { value: priced, at: Date.now() });
        return priced;
      }
    }
  } catch {
    // fall through
  }
  return 0;
};

const tokenRawAmount = (payoutUsd: number, priceUsd: number, decimals: number) => {
  if (priceUsd <= 0 || payoutUsd <= 0) return 0n;
  const units = payoutUsd / priceUsd;
  const raw = Math.floor(units * 10 ** decimals);
  if (!Number.isFinite(raw) || raw <= 0) return 0n;
  return BigInt(raw);
};

export type PayoutSendResult =
  | { ok: true; signature: string }
  | { ok: false; error: string };

export const sendClaimTokens = async (
  claim: ClaimRecord,
): Promise<PayoutSendResult> => {
  if (!treasuryReady()) {
    return { ok: false, error: "Treasury wallet is not configured." };
  }

  let treasury: Keypair;
  try {
    treasury = loadTreasury();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Treasury key is invalid.",
    };
  }

  const recipient = new PublicKey(claim.address);
  const instructions: TransactionInstruction[] = [
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM,
      data: Buffer.from(`shillbag:${claim.tweetId}`, "utf8"),
    }),
  ];

  try {
    for (const line of claim.assets) {
      const mintAddress = line.mint;
      if (!mintAddress) continue;
      const resolved = await resolveMint(mintAddress);
      const decimals = line.decimals ?? resolved?.decimals ?? TOKEN_DECIMALS;
      const priceUsd = await mintPriceUsd(mintAddress);
      const amount = tokenRawAmount(line.payoutUsd, priceUsd, decimals);
      if (amount <= 0n) continue;

      const mint = new PublicKey(mintAddress);
      const programId = await mintProgramId(mint);
      const source = getAssociatedTokenAddressSync(
        mint,
        treasury.publicKey,
        false,
        programId,
      );
      const destination = getAssociatedTokenAddressSync(
        mint,
        recipient,
        false,
        programId,
      );
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          treasury.publicKey,
          destination,
          recipient,
          mint,
          programId,
        ),
        createTransferCheckedInstruction(
          source,
          mint,
          destination,
          treasury.publicKey,
          amount,
          decimals,
          [],
          programId,
        ),
      );
    }

    if (instructions.length === 1) {
      return {
        ok: false,
        error: "No transferable token amount after pricing.",
      };
    }

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    const message = new TransactionMessage({
      payerKey: treasury.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(message);
    transaction.sign([treasury]);
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      maxRetries: 3,
    });
    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (confirmation.value.err) {
      return { ok: false, error: "Solana rejected the payout transaction." };
    }
    return { ok: true, signature };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Payout transfer failed.",
    };
  }
};
