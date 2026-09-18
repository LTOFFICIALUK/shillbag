import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { SITE_NAME, TOKEN_SYMBOL } from "@/lib/config";

export const metadata: Metadata = {
  title: `Terms · ${SITE_NAME}`,
};

export default function TermsPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="display text-5xl text-slip">Terms</h1>
        <div className="mt-8 space-y-5 text-[14px] leading-7 text-faint">
          <p>
            SHILLBAG pays Solana memecoins for original X posts that tag a
            listed ticker. Payouts are capped by shiller and can fail if the
            treasury lacks that token.
          </p>
          <p>
            You need Phantom, a ${TOKEN_SYMBOL} bag of at least $100, and a
            linked X account. Memecoins are volatile. This is not investment
            advice.
          </p>
        </div>
        <Link href="/" className="btn-ghost mt-10">
          Back
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
