import Link from "next/link";
import { BagMark } from "@/components/bag-mark";
import { Receipt, ReceiptRule } from "@/components/receipt";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "@/lib/config";
import { TIERS, bagbackPercent } from "@/lib/tiers";

const payments = [
  { usd: "$2.14", ticker: "BONK", who: "7nK2…pQ4x", time: "2m" },
  { usd: "$1.08", ticker: "WIF", who: "9fLm…3bR7", time: "6m" },
  { usd: "$0.86", ticker: "PENGU", who: "4cWp…8sD1", time: "11m" },
  { usd: "$0.40", ticker: TOKEN_SYMBOL, who: "2hQa…6kN9", time: "18m" },
  { usd: "$5.00", ticker: "FARTCOIN", who: "8tVe…1mC5", time: "31m" },
];

export default function Home() {
  return (
    <div>
      <SiteNav />
      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
          <div>
            <p className="eyebrow">Solana · X · receipts</p>
            <h1 className="display mt-5 max-w-xl text-[52px] leading-[0.92] text-slip sm:text-[76px]">
              Tag the coin.
              <br />
              Get paid in it.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-7 text-faint">
              Scan your profile. We pay the Solana mint in the post, not a
              ticker list. Pending never reads as paid.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="btn-primary">
                Scan profile
              </Link>
              <Link href="/ranks" className="btn-ghost">
                Shiller ranks
              </Link>
            </div>
            <p className="mt-8 font-mono text-[11px] text-faint">
              ${TOKEN_SYMBOL} · {TOKEN_ADDRESS ?? "CA soon"}
            </p>
          </div>

          <Receipt rotate={-1.5} className="print-out max-w-md justify-self-center lg:justify-self-end">
            <div className="flex items-start justify-between">
              <BagMark className="h-10 w-10" inverted />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                SHILLBAG / 0041
              </p>
            </div>
            <p className="mt-8 text-[13px] leading-6 text-mute">
              @degen tagged $BONK. 214 likes. Original post.
            </p>
            <ReceiptRule />
            <p className="eyebrow !text-mute">Status</p>
            <p className="stamp mt-3 h-14 w-28 text-xl">Paid.</p>
            <p className="display mt-6 text-4xl leading-none">$2.14 in $BONK</p>
            <p className="mt-3 font-mono text-[11px] text-mute">
              and $0.86 in $WIF
            </p>
            <ReceiptRule />
            <p className="font-mono text-[11px] text-mute">
              Phantom · Solana · not a promise
            </p>
          </Receipt>
        </section>

        <div className="overflow-hidden border-y border-white/8 bg-night-2 py-3">
          <div className="marquee gap-10 pr-10 font-mono text-[12px] text-faint">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-10">
                {payments.map((item) => (
                  <span key={`${copy}-${item.time}-${item.ticker}`}>
                    {item.usd} sent in ${item.ticker}
                    <span className="ml-3 text-paid">Paid.</span>
                    <span className="ml-3">{item.time}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="mx-auto w-full max-w-6xl px-4 py-20">
          <p className="eyebrow">Three beats</p>
          <h2 className="display mt-3 max-w-xl text-4xl text-slip sm:text-5xl">
            Proof that looks like payment.
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Size the bag",
                d: `Phantom on Solana. We mark your $${TOKEN_SYMBOL} and park you on a shiller rank.`,
              },
              {
                n: "02",
                t: "Hook X",
                d: "Holdings first. Then login. We attach that handle to the wallet.",
              },
              {
                n: "03",
                t: "Print the slip",
                d: "Scan once. Tagged memes pay in that meme. The receipt only says Paid after the transfer.",
              },
            ].map((step) => (
              <li key={step.n} className="border-t border-white/12 pt-5">
                <p className="font-mono text-[11px] text-faint">{step.n}</p>
                <h3 className="mt-3 text-[17px] text-slip">{step.t}</h3>
                <p className="mt-2 text-[14px] leading-6 text-faint">{step.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-night-2 py-16">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Any Solana mint</p>
                <h2 className="display mt-2 text-4xl">The CA you shill is the token you get.</h2>
              </div>
              <Link href="/coins" className="text-[13px] text-faint hover:text-slip">
                How we read CAs
              </Link>
            </div>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-faint">
              No allowlist. If X binds the cashtag to Solana, we see
              solana:&lt;mint&gt;. Pump and chart links work too. A bare $TICKER
              with no mint is skipped so copycats do not get paid.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-4xl">Shiller ranks</h2>
            <Link href="/ranks" className="text-[13px] text-faint hover:text-slip">
              Open the ladder
            </Link>
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                  <th className="pb-3 font-normal">Rank</th>
                  <th className="pb-3 font-normal">Hold</th>
                  <th className="pb-3 font-normal">Lookback</th>
                  <th className="pb-3 font-normal">Bagback</th>
                  <th className="pb-3 font-normal">Day cap</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => (
                  <tr key={tier.id} className="border-t border-white/8">
                    <td className="py-3.5 text-slip">{tier.name}</td>
                    <td className="py-3.5 font-mono text-faint">
                      ${tier.minHoldUsd.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-faint">{tier.lookbackLabel}</td>
                    <td className="py-3.5 font-mono text-faint">
                      {bagbackPercent(tier)}%
                    </td>
                    <td className="py-3.5 font-mono text-faint">${tier.dailyCapUsd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-10">
          <p className="eyebrow">Recent slips</p>
          <ul className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {payments.map((item) => (
              <li
                key={item.who + item.time}
                className="flex flex-wrap items-baseline justify-between gap-3 py-4 text-[14px]"
              >
                <span className="text-slip">
                  {item.usd} in ${item.ticker}
                </span>
                <span className="font-mono text-[12px] text-faint">
                  {item.who} · {item.time} · Paid.
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-24">
          <Receipt className="px-8 py-16 text-center">
            <BagMark className="mx-auto h-14 w-14" inverted />
            <h2 className="display mx-auto mt-8 max-w-2xl text-4xl sm:text-5xl">
              Your timeline already did the shill.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-mute">
              Connect Phantom. Approve the bag. We only open X after that.
            </p>
            <Link href="/app" className="btn-ink mt-8">
              Scan profile
            </Link>
          </Receipt>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
