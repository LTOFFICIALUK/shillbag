export const TOKEN_SYMBOL = (
  process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "BAG"
).replace(/^\$/, "");

const configuredTokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS?.trim();

export const TOKEN_ADDRESS = configuredTokenAddress || null;

export const TOKEN_DECIMALS = Number(
  process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 9,
);

export const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE ?? "shillbagfun")
  .replace(/^@/, "")
  .toLowerCase();

export const SITE_NAME = "SHILLBAG";
export const SITE_LINE = "Tag the coin. Get paid in it.";
