"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { formatPeso, formatDateTime } from "@/lib/utils";
import type { Payment, Customer } from "@/lib/types";

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([api.payments.list(), api.customers.list()])
      .then(([p, c]) => {
        setPayments(p);
        setCustomers(c);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load payments."))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const customerName = (id: string) => {
    const c = customers.find((c) => c.customer_id === id);
    return c ? `${c.first_name} ${c.last_name}` : id;
  };

  const sorted = [...payments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );

  if (error)
    return (
      <div className="flex items-start gap-3 rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>{error}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Record payment
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-center text-sm text-ink-soft">Loading payments…</p>
          ) : sorted.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => (
                  <TableRow key={p.payment_id}>
                    <TableCell>
                      <Link
                        href={`/customers/${p.customer_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {customerName(p.customer_id)}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDateTime(p.payment_date)}</TableCell>
                    <TableCell className="text-ink-soft">{p.notes ?? "—"}</TableCell>
                    <TableCell className="figures text-right font-mono font-medium text-paid-dark">
                      + {formatPeso(p.amount_paid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={open}
        onClose={() => setOpen(false)}
        customers={customers}
        onSaved={load}
      />
    </div>
  );
}

function RecordPaymentDialog({
  open,
  onClose,
  customers,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onSaved: () => void;
}) {
  const [customerId, setCustomerId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Choose a customer.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.payments.create({
        customer_id: customerId,
        amount_paid: parseFloat(amount) || 0,
        payment_date: new Date().toISOString(),
        notes: notes || null,
      });
      onSaved();
      onClose();
      setCustomerId("");
      setAmount("");
      setNotes("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record this payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Record payment" description="Applied against a customer's open utang.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="customer">Customer</Label>
          <Select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount paid (₱)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
        {error && <p className="text-sm text-utang-dark">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Record payment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
