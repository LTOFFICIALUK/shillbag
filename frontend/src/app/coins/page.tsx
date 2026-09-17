import Link from "next/link";
import { Receipt } from "@/components/receipt";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { TOKEN_SYMBOL } from "@/lib/config";

export default function CoinsPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <p className="eyebrow">No allowlist</p>
        <h1 className="display mt-4 text-5xl text-slip sm:text-7xl">Coins</h1>
        <Receipt className="mt-8">
          <p className="text-[15px] leading-7 text-mute">
            We pay the Solana mint in the tweet, not a curated ticker list.
            Copycats share names. The CA does not. Fresh launches often have no
            CA on X yet — that skip is expected, not FUD.
          </p>
          <ul className="mt-6 space-y-3 text-[14px] leading-6 text-mute">
            <li>X crypto cashtag bound to Solana → `solana:&lt;mint&gt;` in the post.</li>
            <li>pump.fun, axiom, dexscreener, birdeye, solscan token links.</li>
            <li>${TOKEN_SYMBOL} still pays in ${TOKEN_SYMBOL} when the mint is live.</li>
            <li>
              A bare $TICKER with no mint is skipped. New coins usually look like
              this until X maps the cashtag. Paste a token URL in the post to
              get paid sooner.
            </li>
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
