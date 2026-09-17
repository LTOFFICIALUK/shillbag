export const TOKEN_SYMBOL = (
  process.env.TOKEN_SYMBOL ??
  process.env.NEXT_PUBLIC_TOKEN_SYMBOL ??
  "BAG"
).replace(/^\$/, "");

const configuredTokenAddress = (
  process.env.TOKEN_ADDRESS ?? process.env.NEXT_PUBLIC_TOKEN_ADDRESS
)?.trim();

export const TOKEN_ADDRESS = configuredTokenAddress || null;

export const TOKEN_DECIMALS = Number(
  process.env.TOKEN_DECIMALS ?? process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 9,
);

export const HELIUS_API_KEY = process.env.HELIUS_API_KEY?.trim() ?? "";

export const SOLANA_RPC =
  process.env.SOLANA_RPC_URL ??
  (HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : "https://api.mainnet-beta.solana.com");

export const X_HANDLE = (
  process.env.X_HANDLE ??
  process.env.NEXT_PUBLIC_X_HANDLE ??
  "shillbagfun"
)
  .replace(/^@/, "")
  .toLowerCase();

export const X_USER_ID = process.env.X_USER_ID ?? "";

export const SITE_NAME = "SHILLBAG";
export const SITE_LINE = "Shill the ticker. Catch the bag.";

export const FALLBACK_TOKEN_PRICE_USD = Number(
  process.env.TOKEN_PRICE_USD ?? 0.01,
);

export const TWTAPI_BASE = (
  process.env.TWTAPI_BASE ?? "https://api.twtapi.com"
).replace(/\/$/, "");
export const TWTAPI_KEY = process.env.TWTAPI_KEY ?? "";

export const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "shillbag-dev-secret-change-me";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "everythingsimpleinc1@gmail.com"
)
  .trim()
  .toLowerCase();

export const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE ?? "";

export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const ADMIN_WINDOW_MS = 15 * 60 * 1000;
export const ADMIN_MAX_ATTEMPTS = 5;

export const TREASURY_SECRET_KEY = process.env.TREASURY_SECRET_KEY?.trim() ?? "";

export const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS?.trim() ?? "";
