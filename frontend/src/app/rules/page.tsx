import Link from "next/link";
import { Receipt } from "@/components/receipt";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { TOKEN_SYMBOL, X_HANDLE } from "@/lib/config";

export default function RulesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="display text-5xl text-ink">Rules</h1>
        <Receipt className="mt-8">
          <ul className="space-y-4 text-[15px] leading-7 text-mute">
            <li>Original posts only. Retweets are not payable.</li>
            <li>
              The tweet must carry a Solana CA: X&apos;s `solana:mint` cashtag,
              a token URL, or ${TOKEN_SYMBOL}.
            </li>
            <li>
              You get paid in that mint. Tickers without a CA do not pay — new
              coins often have no mint bound on X yet. That skip is expected.
            </li>
            <li>Must follow @{X_HANDLE} and hold at least $100 of ${TOKEN_SYMBOL}.</li>
            <li>Lookback, cooldown, and day cap come from your shiller.</li>
            <li>Same tweet never pays twice. Unpaid never reads as Paid.</li>
          </ul>
        </Receipt>
        <Link href="/app" className="btn-primary mt-10">
          Scan profile
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
