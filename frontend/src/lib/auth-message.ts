import { TOKEN_SYMBOL } from "./config";

export const holdingsMessage = (input: {
  address: string;
  nonce: string;
  issuedAt: string;
}) =>
  [
    `SHILLBAG wants to size your $${TOKEN_SYMBOL} bag`,
    `before raiding any X account.`,
    ``,
    `Wallet: ${input.address}`,
    `Nonce: ${input.nonce}`,
    `Issued: ${input.issuedAt}`,
  ].join("\n");
