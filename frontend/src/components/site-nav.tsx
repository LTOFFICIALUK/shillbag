import Link from "next/link";
import { BagMark } from "@/components/bag-mark";
import { SITE_NAME } from "@/lib/config";

export const SiteNav = () => (
  <header className="sticky top-0 z-40 border-b border-white/8 bg-night/80 px-4 py-3 backdrop-blur-md">
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3" aria-label={`${SITE_NAME} home`}>
        <BagMark className="h-9 w-9" />
        <span className="text-[15px] font-semibold tracking-tight text-slip">{SITE_NAME}</span>
      </Link>
      <nav className="flex items-center gap-5 text-[13px] text-faint">
        <Link href="/coins" className="hover:text-slip">
          Coins
        </Link>
        <Link href="/ranks" className="hover:text-slip">
          Ranks
        </Link>
        <Link href="/rules" className="hover:text-slip">
          Rules
        </Link>
        <Link href="/app" className="btn-primary !min-h-9 px-3 text-[12px]">
          Scan profile
        </Link>
      </nav>
    </div>
  </header>
);
