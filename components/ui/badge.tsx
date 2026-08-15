import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "marigold" | "utang" | "paid";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-ledger text-ink-soft",
  primary: "bg-primary-light text-primary-dark",
  marigold: "bg-marigold-light text-marigold-dark",
  utang: "bg-utang-light text-utang-dark",
  paid: "bg-paid-light text-paid-dark",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}

// Maps ERD/domain status strings to a sensible tone automatically.
export function statusTone(status: string): Tone {
  switch (status.toLowerCase()) {
    case "paid":
      return "paid";
    case "overdue":
      return "utang";
    case "partial":
      return "marigold";
    case "pending":
    default:
      return "neutral";
  }
}
