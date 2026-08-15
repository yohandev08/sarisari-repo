"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Package,
  ShoppingCart,
  BookOpen,
  Wallet,
  Smartphone,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/sales", label: "Sales / POS", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/utang", label: "Utang Ledger", icon: BookOpen },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/digital-services", label: "Digital Services", icon: Smartphone },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-primary-dark bg-primary md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <Store className="text-marigold" size={24} />
        <span className="font-display text-lg font-semibold text-white">
          Tindahan
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-dark text-white"
                  : "text-white/75 hover:bg-primary-dark/60 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-white/50">
        Sari-sari Store Management
      </div>
    </aside>
  );
}
