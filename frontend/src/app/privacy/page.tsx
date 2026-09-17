import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { SITE_NAME, TOKEN_SYMBOL, X_HANDLE } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy · ${SITE_NAME}`,
};

export default function PrivacyPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="display text-5xl text-slip">Privacy</h1>
        <div className="mt-8 space-y-5 text-[14px] leading-7 text-faint">
          <p>
            You start the scan. We do not watch X in the background. We do not
            hold your keys.
          </p>
          <p>
            After Phantom we store a Solana address and a signed permit to size
            your ${TOKEN_SYMBOL} bag. After X login we store handle, user id,
            follow status for @{X_HANDLE}, paid tweet ids, scan times, and
            payouts.
          </p>
          <p>
            A session cookie keeps the wallet on this browser. Logs may include
            IP and user agent to stop abuse.
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
