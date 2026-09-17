type PhantomSolana = {
  isPhantom?: boolean;
  publicKey: { toBase58: () => string } | null;
  isConnected: boolean;
  connect: (options?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display?: "utf8" | "hex",
  ) => Promise<{ signature: Uint8Array }>;
  on: (event: "connect" | "disconnect" | "accountChanged", handler: (key?: { toBase58: () => string } | null) => void) => void;
  off?: (
    event: "connect" | "disconnect" | "accountChanged",
    handler: (key?: { toBase58: () => string } | null) => void,
  ) => void;
};

type PhantomWindow = Window & {
  phantom?: { solana?: PhantomSolana };
  solana?: PhantomSolana;
};

export const phantomSolana = () => {
  if (typeof window === "undefined") return null;
  const phantomWindow = window as PhantomWindow;
  const provider =
    phantomWindow.phantom?.solana ??
    (phantomWindow.solana?.isPhantom ? phantomWindow.solana : null);
  return provider ?? null;
};

export const encodeSignature = (signature: Uint8Array) =>
  btoa(Array.from(signature, (byte) => String.fromCharCode(byte)).join(""));
