"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, PackageX, BookOpen, Smartphone, AlertCircle } from "lucide-react";
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Today's sales"
          value={formatPeso(todaysTotal)}
          tone="primary"
          hint={`${todaysSales.length} transaction${todaysSales.length === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={<BookOpen size={18} />}
          label="Outstanding utang"
          value={formatPeso(outstandingUtang)}
          tone="utang"
          hint={overdueCount > 0 ? `${overdueCount} overdue` : "None overdue"}
        />
        <StatCard
          icon={<PackageX size={18} />}
          label="Low stock items"
          value={String(lowStock.length)}
          tone="marigold"
          hint="At or below reorder level"
        />
        <StatCard
          icon={<Smartphone size={18} />}
          label="Products tracked"
          value={String(products.length)}
          tone="paid"
          hint="Across all categories"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <EmptyRow text="No sales recorded yet. Ring one up from the POS screen." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((s) => (
                    <TableRow key={s.sale_id}>
                      <TableCell className="font-mono text-xs">{s.sale_id}</TableCell>
                      <TableCell>{formatDateTime(s.created_at)}</TableCell>
                      <TableCell>
                        <Badge tone={s.payment_type === "utang" ? "utang" : "primary"}>
                          {s.payment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="figures text-right font-mono">
                        {formatPeso(s.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reorder soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <EmptyRow text="Stock levels look healthy." />
            ) : (
              lowStock.slice(0, 6).map((p) => (
                <Link
                  key={p.product_id}
                  href="/products"
                  className="flex items-center justify-between rounded-card border border-border p-3 text-sm hover:bg-ledger"
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
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-soft">{label}</span>
          <span className={`rounded-full p-1.5 ${toneBg}`}>{icon}</span>
        </div>
        <div className="figures mt-2 font-mono text-2xl font-semibold text-ink">{value}</div>
        <div className="mt-1 text-xs text-ink-soft">{hint}</div>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-ink-soft">{text}</p>;
}

function LoadingState() {
  return <p className="text-sm text-ink-soft">Loading store data…</p>;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Couldn't load dashboard data.</p>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  );
}

