import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-card border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-card border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
