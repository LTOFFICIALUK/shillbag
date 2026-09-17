import { PublicKey } from "@solana/web3.js";

export const isSolanaAddress = (value: string) => {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
};

export const walletKey = (address: string) => new PublicKey(address).toBase58();
