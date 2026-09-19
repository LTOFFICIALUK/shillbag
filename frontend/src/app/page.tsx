import Link from "next/link";
import { BagMark } from "@/components/bag-mark";
import { Receipt, ReceiptRule } from "@/components/receipt";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { TokenMark } from "@/components/token-mark";
import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "@/lib/config";
import { TIERS, bagbackPercent } from "@/lib/tiers";
import { fetchTrending, tapeItems } from "@/lib/trending";

export const dynamic = "force-dynamic";

export default async function Home() {
  const payments = tapeItems(await fetchTrending());
  const lead = payments[0];
  const follow = payments[1];
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <div className="page-grid pointer-events-none absolute inset-0 -z-20" />
          <div className="hero-glow pointer-events-none absolute -right-24 top-16 -z-10 h-80 w-80 rounded-full sm:h-112 sm:w-112" />
          <div className="mx-auto grid w-full max-w-[1080px] items-center gap-12 px-4 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
            <div className="relative z-10">
              <p className="eyebrow inline-flex items-center gap-2">
                <span className="live-dot" aria-hidden="true" />
                Live tape · Robinhood Chain + Solana
              </p>
              <h1 className="display mt-5 max-w-xl text-[60px] leading-[0.88] text-ink sm:text-[88px]">
                Tag the coin.
                <br />
                Get{" "}
                <span className="relative inline-block">
                  <span className="absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.28em] -rotate-1 rounded-full bg-accent" />
                  paid
                </span>{" "}
                in it.
              </h1>
              <p className="mt-6 max-w-md text-[16px] leading-7 text-mute">
                Scan your profile. We pay the Solana mint in the post, not a
                ticker list. Fresh launches often have no CA on X yet — those
                posts are skipped. Pending never reads as paid.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app" className="btn-primary">
                  Scan profile
                </Link>
                <Link href="/ranks" className="btn-ghost">
                  The shillers
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-faint">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-paid" />
                  Non-custodial
                </span>
                <span>Phantom signed</span>
                <span className="font-mono">${TOKEN_SYMBOL} · {TOKEN_ADDRESS ?? "CA soon"}</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
              <div className="float-slow absolute -left-28 top-12 z-10 hidden rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_40px_#1111111a] backdrop-blur-xl sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Just landed
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  +{lead?.usd ?? "$1.00"} · ${lead?.ticker ?? TOKEN_SYMBOL}
                </p>
              </div>
              <div className="float-delayed absolute -bottom-4 -right-4 z-10 hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2.5 text-[12px] font-semibold shadow-[0_14px_40px_#1111111a] backdrop-blur-xl sm:flex">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent" aria-hidden="true">
                  ✓
                </span>
                Transfer confirmed
              </div>
              <Receipt className="hero-receipt print-out w-full">
                <div className="flex items-start justify-between">
                  <TokenMark
                    symbol={lead?.ticker ?? TOKEN_SYMBOL}
                    imageUrl={lead?.imageUrl}
                    className="relative z-20 h-10 w-10"
                  />
                  <p className="text-[12px] font-medium text-mute">
                    shillbag / {lead?.chainId ?? "live"}
                  </p>
                </div>
                <p className="mt-8 text-[14px] leading-6 text-mute">
                  @degen tagged ${lead?.ticker ?? TOKEN_SYMBOL}. 214 likes.
                  Original post.
                </p>
                <ReceiptRule />
                <p className="eyebrow">Status</p>
                <p className="stamp mt-3 h-9 px-4">Paid</p>
                <p className="display mt-6 text-4xl leading-none">
                  {lead?.usd ?? "$1.00"} in ${lead?.ticker ?? TOKEN_SYMBOL}
                </p>
                {follow ? (
                  <p className="mt-3 text-[14px] text-mute">
                    and {follow.usd} in ${follow.ticker}
                  </p>
                ) : null}
                <ReceiptRule />
                <p className="text-[12px] text-faint">
                  DexScreener cache · not a promise
                </p>
              </Receipt>
            </div>
          </div>
        </section>

        <div className="mx-4 overflow-hidden rounded-[24px] border border-line bg-white py-3 shadow-[0_8px_30px_#1111110a]">
          <div className="marquee gap-10 pr-10 text-[13px] text-mute">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-10">
                {payments.map((item) => (
                  <span key={`${copy}-${item.time}-${item.ticker}`}>
                    {item.usd} sent in ${item.ticker}
                    <span className="ml-3 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
                      Paid
                    </span>
                    <span className="ml-3 text-faint">
                      {item.time}
                      {item.chainId ? ` · ${item.chainId}` : ""}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="mx-auto w-full max-w-[1080px] px-4 py-16">
          <p className="eyebrow">Three beats</p>
          <h2 className="display mt-3 max-w-xl text-4xl text-ink sm:text-5xl">
            Proof that looks like payment.
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Size the bag",
                d: `Phantom on Solana. We mark your $${TOKEN_SYMBOL} and park you on a shiller.`,
              },
              {
                n: "02",
                t: "Hook X",
                d: "Holdings first. Then login. We attach that handle to the wallet.",
              },
              {
                n: "03",
                t: "Print the slip",
                d: "Scan once. Tagged memes pay in that meme. Paid only after the transfer.",
              },
            ].map((step) => (
              <li key={step.n} className="lift-card group rounded-[24px] border border-line bg-white p-6">
                <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[12px] font-semibold">
                  {step.n}
                </p>
                <h3 className="mt-4 text-[17px] font-semibold text-ink transition-transform duration-300 group-hover:translate-x-1">{step.t}</h3>
                <p className="mt-2 text-[14px] leading-6 text-mute">{step.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="px-4">
          <div className="relative mx-auto w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-night px-6 py-14 text-white shadow-[0_24px_70px_#11111124] sm:px-10">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-36 w-36 translate-x-1/3 translate-y-1/3 rounded-full border-[36px] border-accent/10" />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow !text-white/50">Any Solana mint</p>
                <h2 className="display mt-2 max-w-2xl text-4xl">
                  No CA on the tweet is not a miss. New coins often have none yet.
                </h2>
              </div>
              <Link
                href="/coins"
                className="text-[13px] text-white/60 hover:text-white"
                tabIndex={0}
              >
                How we read CAs
              </Link>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <p className="max-w-xl text-[15px] leading-7 text-white/70">
                X has to bind a cashtag to a mint before we see
                solana:&lt;mint&gt;. Brand-new tokens usually show as a bare
                $TICKER with no contract. We skip those on purpose so the twenty
                copycats of the same name do not get paid. That is the product
                working, not an unpaid shill.
              </p>
              <ul className="space-y-3 text-[14px] leading-6 text-white/70">
                <li>
                  Pays: X maps the cashtag to Solana, or the post has a
                  pump.fun, axiom, dexscreener, birdeye, or solscan token link.
                </li>
                <li>Skipped: $TICKER only, no mint. Copycats share names.</li>
                <li>
                  Receipts only say Paid after the SPL transfer. A skip is not a
                  pending payout.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1080px] px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-4xl">The shillers</h2>
            <Link href="/ranks" className="text-[13px] text-mute hover:text-ink" tabIndex={0}>
              Open the ladder
            </Link>
          </div>
          <div className="mt-8 overflow-hidden rounded-[24px] border border-line bg-white">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
                  <th className="px-5 pb-3 pt-4 font-semibold">Shiller</th>
                  <th className="px-5 pb-3 pt-4 font-semibold">Hold</th>
                  <th className="px-5 pb-3 pt-4 font-semibold">Lookback</th>
                  <th className="px-5 pb-3 pt-4 font-semibold">Bagback</th>
                  <th className="px-5 pb-3 pt-4 font-semibold">Day cap</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => (
                  <tr key={tier.id} className="border-t border-line transition-colors hover:bg-accent-soft/60">
                    <td className="px-5 py-3.5 font-medium text-ink">{tier.name}</td>
                    <td className="px-5 py-3.5 font-mono text-mute">
                      ${tier.minHoldUsd.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-mute">{tier.lookbackLabel}</td>
                    <td className="px-5 py-3.5 font-mono text-mute">
                      {bagbackPercent(tier)}%
                    </td>
                    <td className="px-5 py-3.5 font-mono text-mute">${tier.dailyCapUsd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1080px] px-4 pb-8">
          <p className="eyebrow">What is getting talked about</p>
          <ul className="mt-5 overflow-hidden rounded-[24px] border border-line bg-white">
            {payments.map((item) => (
              <li
                key={item.who + item.time + item.ticker}
                className="group flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 text-[14px] transition-colors last:border-b-0 hover:bg-accent-soft/50"
              >
                <span className="flex items-center gap-3 font-medium text-ink">
                  <TokenMark
                    symbol={item.ticker}
                    imageUrl={item.imageUrl}
                    className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
                  />
                  {item.usd} in ${item.ticker}
                </span>
                <span className="font-mono text-[12px] text-faint">
                  {item.who} · {item.time} · Paid
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-[1080px] px-4 pb-16">
          <Receipt className="shine border-accent/40 bg-[radial-gradient(circle_at_top,#f3ffd4_0%,#ffffff_55%)] px-8 py-16 text-center shadow-[0_24px_70px_#11111112]">
            <BagMark className="mx-auto h-14 w-14" />
            <h2 className="display mx-auto mt-8 max-w-2xl text-4xl sm:text-5xl">
              Your timeline already did the shill.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-mute">
              Connect Phantom. Approve the bag. We only open X after that.
            </p>
            <Link href="/app" className="btn-primary mt-8">
              Scan profile
            </Link>
          </Receipt>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
