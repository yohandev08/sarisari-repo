"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Today at a glance" },
  "/sales": { title: "Sales / POS", subtitle: "Ring up a new sale" },
  "/products": { title: "Products", subtitle: "Inventory and pricing" },
  "/customers": { title: "Customers", subtitle: "Regulars and their accounts" },
  "/utang": { title: "Utang Ledger", subtitle: "Who owes what, and since when" },
  "/payments": { title: "Payments", subtitle: "Amounts collected against utang" },
  "/digital-services": { title: "Digital Services", subtitle: "GCash, load, bills, and remittance" },
};

export default function Header() {
  const pathname = usePathname();
  const match =
    Object.keys(titles).find(
      (key) => key !== "/" && pathname.startsWith(key)
    ) ?? pathname;
  const { title, subtitle } = titles[match] ?? titles["/"];

  return (
    <header className="flex items-center justify-between border-b border-border bg-paper px-6 py-4 md:px-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        <p className="text-sm text-ink-soft">{subtitle}</p>
      </div>
    </header>
  );
}
