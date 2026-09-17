import Link from "next/link";
import { SITE_NAME, TOKEN_ADDRESS, TOKEN_SYMBOL } from "@/lib/config";

export const SiteFooter = () => (
  <footer className="border-t border-white/8 px-4 py-12">
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-6">
      <div>
        <p className="text-[15px] font-semibold text-slip">{SITE_NAME}</p>
        <p className="mt-2 font-mono text-[11px] text-faint">
          ${TOKEN_SYMBOL} · {TOKEN_ADDRESS ?? "CA soon"}
        </p>
      </div>
      <div className="flex gap-5 text-[13px] text-faint">
        <Link href="/privacy" className="hover:text-slip">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-slip">
          Terms
        </Link>
        <Link href="/admin" className="hover:text-slip">
          Ops
        </Link>
      </div>
    </div>
  </footer>
);
