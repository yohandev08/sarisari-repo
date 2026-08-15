"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { formatPeso, formatDate } from "@/lib/utils";
import type { UtangTransaction, Customer, UtangStatus } from "@/lib/types";

export default function UtangPage() {
  const [utang, setUtang] = React.useState<UtangTransaction[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<UtangStatus | "all">("all");

  React.useEffect(() => {
    Promise.all([api.utang.list(), api.customers.list()])
      .then(([u, c]) => {
        setUtang(u);
        setCustomers(c);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load the utang ledger."))
      .finally(() => setLoading(false));
  }, []);

  const customerName = (id: string) => {
    const c = customers.find((c) => c.customer_id === id);
    return c ? `${c.first_name} ${c.last_name}` : id;
  };

  const filtered = utang
    .filter((u) => statusFilter === "all" || u.status === statusFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalOpen = utang
    .filter((u) => u.status !== "paid")
    .reduce((sum, u) => sum + Number(u.amount), 0);

  if (error)
    return (
      <div className="flex items-start gap-3 rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>{error}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-ink-soft">
          Total open across all customers:{" "}
          <span className="figures font-mono font-semibold text-utang-dark">{formatPeso(totalOpen)}</span>
        </div>
        <Select
          className="sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UtangStatus | "all")}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-center text-sm text-ink-soft">Loading ledger…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">No entries for this filter.</p>
          ) : (
            <div className="notebook-edge m-4 space-y-3">
              {filtered.map((u) => (
                <div key={u.utang_id} className="ledger-row">
                  <Link
                    href={`/customers/${u.customer_id}`}
                    className="text-sm font-medium text-ink hover:text-primary hover:underline"
                  >
                    {customerName(u.customer_id)}
                  </Link>
                  <span className="leader" />
                  <span className="text-xs text-ink-soft">due {formatDate(u.due_date)}</span>
                  <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                  <span className="figures w-24 text-right font-mono text-sm font-medium text-ink">
                    {formatPeso(u.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
