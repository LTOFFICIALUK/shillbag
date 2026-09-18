import Link from "next/link";
import { BagMark } from "@/components/bag-mark";

export const SiteNav = () => (
  <header className="sticky top-0 z-40 px-4 pt-3">
    <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center justify-between gap-4 rounded-[28px] border border-white/80 bg-white/70 px-4 shadow-[0_8px_24px_#1111110f] backdrop-blur-xl">
      <Link
        href="/"
        className="flex items-center gap-3"
        aria-label="shillbag home"
        tabIndex={0}
      >
        <BagMark className="h-9 w-9" />
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          shillbag
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-[14px] font-medium text-mute sm:gap-2">
        <Link
          href="/coins"
          className="rounded-full px-3 py-2 hover:bg-page hover:text-ink"
          tabIndex={0}
        >
          Coins
        </Link>
        <Link
          href="/ranks"
          className="rounded-full px-3 py-2 hover:bg-page hover:text-ink"
          tabIndex={0}
        >
          Shillers
        </Link>
        <Link
          href="/rules"
          className="hidden rounded-full px-3 py-2 hover:bg-page hover:text-ink sm:inline"
          tabIndex={0}
        >
          Rules
        </Link>
        <Link href="/app" className="btn-primary !min-h-10 px-4 text-[13px]">
          Scan
        </Link>
      </nav>
    </div>
  </header>
);
