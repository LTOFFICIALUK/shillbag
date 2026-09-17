import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { TOKEN_SYMBOL } from "@/lib/config";

const coins = [
  ["BONK", "Bonk"],
  ["WIF", "dogwifhat"],
  ["POPCAT", "Popcat"],
  ["FARTCOIN", "Fartcoin"],
  ["MEW", "cat in a dogs world"],
  ["PNUT", "Peanut"],
  ["GOAT", "Goatseus Maximus"],
  ["TRUMP", "OFFICIAL TRUMP"],
  ["PENGU", "Pudgy Penguins"],
  ["BOME", "BOOK OF MEME"],
  ["SAMO", "Samoyed"],
  ["GIGA", "GIGACHAD"],
  ["MOODENG", "Moo Deng"],
  ["CHILLGUY", "Just a chill guy"],
  ["USELESS", "USELESS COIN"],
  ["FWOG", "FWOG"],
  ["AI16Z", "ai16z"],
  ["WEN", "Wen"],
  ["MICHI", "michi"],
  ["RETARDIO", "RETARDIO"],
  ["TROLL", "TROLL"],
  ["MOONPIG", "moonpig"],
  ["SPX", "SPX6900"],
  [TOKEN_SYMBOL.toUpperCase(), `$${TOKEN_SYMBOL}`],
];

export default function CoinsPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <p className="eyebrow">Payable memes</p>
        <h1 className="display mt-4 text-5xl text-slip sm:text-7xl">Coins</h1>
        <p className="mt-5 max-w-xl text-faint">
          Tag the ticker. Get paid in that memecoin. The slip only says Paid
          after the transfer.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {coins.map(([symbol, name]) => (
            <li
              key={symbol}
              className="flex items-baseline justify-between border border-white/10 px-4 py-4"
            >
              <span className="font-mono text-[15px] text-slip">${symbol}</span>
              <span className="text-[13px] text-faint">{name}</span>
            </li>
          ))}
        </ul>
        <Link href="/app" className="btn-primary mt-10">
          Scan profile
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
