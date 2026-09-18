import Link from "next/link";
import { Receipt } from "@/components/receipt";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page px-5">
      <Receipt className="w-full max-w-lg">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">
          404
        </p>
        <h1 className="display mt-4 text-4xl">This page is not listed.</h1>
        <Link href="/" className="btn-ink mt-8">
          Back to shillbag
        </Link>
      </Receipt>
    </div>
  );
}
