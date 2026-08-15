"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { formatPeso } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    api.customers
      .list()
      .then(setCustomers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load customers."))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const filtered = customers.filter((c) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            placeholder="Search customers…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add customer
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-center text-sm text-ink-soft">Loading customers…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">
              {query ? "No customers match that search." : "No customers yet. Add your first regular."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Utang</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Credit limit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.customer_id}>
                    <TableCell>
                      <Link
                        href={`/customers/${c.customer_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.first_name} {c.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.phone_number ?? "—"}</TableCell>
                    <TableCell>
                      <Badge tone={c.is_allowed_utang ? "primary" : "neutral"}>
                        {c.is_allowed_utang ? "Allowed" : "Not allowed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="figures text-right font-mono">
                      {formatPeso(c.current_balance)}
                    </TableCell>
                    <TableCell className="figures text-right font-mono text-ink-soft">
                      {formatPeso(c.credit_limit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddCustomerDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
  );
}

function AddCustomerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    credit_limit: "0",
    is_allowed_utang: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.customers.create({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number || null,
        credit_limit: parseFloat(form.credit_limit) || 0,
        current_balance: 0,
        is_allowed_utang: form.is_allowed_utang,
      });
      onCreated();
      onClose();
      setForm({ first_name: "", last_name: "", phone_number: "", credit_limit: "0", is_allowed_utang: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add customer" description="For regulars you'll extend utang to.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="phone_number">Phone number</Label>
          <Input
            id="phone_number"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="credit_limit">Credit limit (₱)</Label>
          <Input
            id="credit_limit"
            type="number"
            min="0"
            step="0.01"
            value={form.credit_limit}
            onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.is_allowed_utang}
            onChange={(e) => setForm({ ...form, is_allowed_utang: e.target.checked })}
          />
          Allow this customer to utang
        </label>
        {error && <p className="text-sm text-utang-dark">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save customer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
