import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Receipt = ({
  children,
  className,
  rotate = 0,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
} & HTMLAttributes<HTMLElement>) => (
  <article
    className={cn("receipt px-6 py-8 sm:px-8", className)}
    style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    {...rest}
  >
    {children}
  </article>
);

export const ReceiptRule = ({ className }: { className?: string }) => (
  <div className={cn("receipt-rule my-5", className)} />
);
