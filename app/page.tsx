"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, PackageX, BookOpen, Smartphone, AlertCircle, ShoppingBag, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { formatPeso, formatDateTime } from "@/lib/utils";
import type { Sale, Product, UtangTransaction } from "@/lib/types";

export default function DashboardPage() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [utang, setUtang] = React.useState<UtangTransaction[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([api.sales.list(), api.products.list(), api.utang.list()])
      .then(([s, p, u]) => {
        setSales(s);
        setProducts(p);
        setUtang(u);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingState />;

  const today = new Date().toDateString();
  const todaysSales = sales.filter((s) => new Date(s.created_at).toDateString() === today);
  const todaysTotal = todaysSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const lowStock = products.filter((p) => p.stock_quantity <= p.reorder_level);
  const outstandingUtang = utang
    .filter((u) => u.status !== "paid")
    .reduce((sum, u) => sum + Number(u.amount), 0);
  const overdueCount = utang.filter((u) => u.status === "overdue").length;
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Today's sales"
          value={formatPeso(todaysTotal)}
          tone="primary"
          hint={`${todaysSales.length} transaction${todaysSales.length === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Outstanding utang"
          value={formatPeso(outstandingUtang)}
          tone="utang"
          hint={overdueCount > 0 ? `${overdueCount} overdue` : "None overdue"}
        />
        <StatCard
          icon={<PackageX size={20} />}
          label="Low stock items"
          value={String(lowStock.length)}
          tone="marigold"
          hint="At or below reorder level"
        />
        <StatCard
          icon={<Smartphone size={20} />}
          label="Products tracked"
          value={String(products.length)}
          tone="paid"
          hint="Across all categories"
        />
      </div>

      {/* Content Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Sales Table */}
        <Card className="lg:col-span-2 shadow-sm border border-border/80">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold text-ink">Recent Sales</CardTitle>
            <Link href="/sales" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View POS <ArrowUpRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {recentSales.length === 0 ? (
              <EmptyState text="No sales recorded yet. Ring one up from the POS screen." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Sale ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-ink-soft">When</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Payment</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-ink-soft">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((s) => (
                    <TableRow key={s.sale_id} className="hover:bg-ledger/50 transition-colors">
                      <TableCell className="font-mono text-xs font-medium text-ink">{s.sale_id}</TableCell>
                      <TableCell className="text-xs text-ink-soft">{formatDateTime(s.created_at)}</TableCell>
                      <TableCell>
                        <Badge tone={s.payment_type === "utang" ? "utang" : "primary"}>
                          {s.payment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="figures text-right font-mono font-semibold text-ink">
                        {formatPeso(s.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reorder Soon Panel */}
        <Card className="shadow-sm border border-border/80">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold text-ink">Reorder Soon</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {lowStock.length === 0 ? (
              <EmptyState text="Stock levels look healthy." />
            ) : (
              lowStock.slice(0, 6).map((p) => (
                <Link
                  key={p.product_id}
                  href="/products"
                  className="flex items-center justify-between rounded-xl border border-border/80 p-3 text-sm hover:border-primary/40 hover:bg-ledger/40 transition"
                >
                  <div>
                    <div className="font-medium text-ink">{p.product_name}</div>
                    <div className="text-xs text-ink-soft">{p.category}</div>
                  </div>
                  <Badge tone="marigold">{p.stock_quantity} left</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "utang" | "marigold" | "paid";
}) {
  const toneBg = {
    primary: "bg-primary-light text-primary-dark",
    utang: "bg-utang-light text-utang-dark",
    marigold: "bg-marigold-light text-marigold-dark",
    paid: "bg-paid-light text-paid-dark",
  }[tone];

  return (
    <Card className="shadow-sm hover:shadow-md transition border border-border/80">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
          <span className={`rounded-lg p-2 ${toneBg}`}>{icon}</span>
        </div>
        <div className="figures mt-3 font-mono text-2xl font-bold text-ink">{value}</div>
        <div className="mt-1 text-xs text-ink-soft font-medium">{hint}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="my-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-10 px-4 text-center">
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-sm font-medium text-ink-soft">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3"></div>
      Loading store data…
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark shadow-sm">
      <AlertCircle size={20} className="mt-0.5 shrink-0 text-utang-dark" />
      <div>
        <p className="font-semibold">Couldn't load dashboard data.</p>
        <p className="mt-1 text-xs">{message}</p>
      </div>
    </div>
  );
}