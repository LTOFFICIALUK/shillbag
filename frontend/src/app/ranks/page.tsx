import Link from "next/link";
import { Receipt } from "@/components/receipt";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { TOKEN_SYMBOL } from "@/lib/config";
import { TIERS, bagbackPercent } from "@/lib/tiers";

export default function RanksPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <p className="eyebrow">The ladder</p>
        <h1 className="display mt-4 text-5xl text-slip sm:text-7xl">Shillers</h1>
        <p className="mt-5 max-w-xl text-faint">
          Dollar-priced. As ${TOKEN_SYMBOL} moves, the shiller stays put. More
          bag, longer scan, fatter bagback.
        </p>
        <div className="mt-10 grid gap-5">
          {TIERS.map((tier) => (
            <Receipt key={tier.id}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="display text-3xl">{tier.name}</h2>
                <p className="font-mono text-[13px] text-mute">
                  ${tier.minHoldUsd.toLocaleString()}+
                </p>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4">
                <div>
                  <dt className="text-faint">Lookback</dt>
                  <dd>{tier.lookbackLabel}</dd>
                </div>
                <div>
                  <dt className="text-faint">Bagback</dt>
                  <dd>{bagbackPercent(tier)}%</dd>
                </div>
                <div>
                  <dt className="text-faint">Day cap</dt>
                  <dd>${tier.dailyCapUsd}</dd>
                </div>
                <div>
                  <dt className="text-faint">Post cap</dt>
                  <dd>${tier.perPostCapUsd}</dd>
                </div>
              </dl>
            </Receipt>
          ))}
        </div>
        <Link href="/app" className="btn-primary mt-10">
          Scan profile
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
