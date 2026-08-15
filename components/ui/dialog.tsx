"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-card border border-border bg-white p-6 shadow-lg",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="dialog-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-ink-soft">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-ink-soft hover:bg-ledger"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
