import Link from "next/link";
import { Receipt } from "@/components/receipt";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <Receipt className="w-full max-w-lg">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
          404
        </p>
        <h1 className="display mt-4 text-4xl">This slip is not listed.</h1>
        <Link href="/" className="btn-ink mt-8">
          Back to SHILLBAG
        </Link>
      </Receipt>
    </div>
  );
}
