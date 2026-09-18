import Link from "next/link";
import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "@/lib/config";

export const SiteFooter = () => (
  <footer className="px-4 pb-10 pt-8">
    <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-6 rounded-[24px] border border-line bg-white px-6 py-6">
      <div>
        <p className="text-[15px] font-semibold text-ink">shillbag</p>
        <p className="mt-1 text-[13px] text-mute">
          ${TOKEN_SYMBOL} · {TOKEN_ADDRESS ?? "CA soon"}
        </p>
      </div>
      <div className="flex gap-5 text-[13px] text-mute">
        <Link href="/privacy" className="hover:text-ink" tabIndex={0}>
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-ink" tabIndex={0}>
          Terms
        </Link>
        <Link href="/admin" className="hover:text-ink" tabIndex={0}>
          Ops
        </Link>
      </div>
    </div>
  </footer>
);
