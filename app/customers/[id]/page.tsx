"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { formatPeso, formatDate, formatDateTime } from "@/lib/utils";
import type { Customer, UtangTransaction, Payment } from "@/lib/types";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params.id;

  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [utang, setUtang] = React.useState<UtangTransaction[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [payOpen, setPayOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      api.customers.get(customerId),
      api.utang.listByCustomer(customerId),
      api.payments.listByCustomer(customerId),
    ])
      .then(([c, u, p]) => {
        setCustomer(c);
        setUtang(u);
        setPayments(p);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load this customer."))
      .finally(() => setLoading(false));
  }, [customerId]);

  React.useEffect(load, [load]);

  if (loading) return <p className="text-sm text-ink-soft">Loading customer…</p>;
  if (error || !customer)
    return (
      <div className="rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
        {error ?? "Customer not found."}
      </div>
    );

  const openUtang = utang.filter((u) => u.status !== "paid");
  const openTotal = openUtang.reduce((sum, u) => sum + Number(u.amount), 0);

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/customers")}
        className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to customers
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            {customer.first_name} {customer.last_name}
          </h2>
          <p className="text-sm text-ink-soft">{customer.phone_number ?? "No phone on file"}</p>
        </div>
        <Button onClick={() => setPayOpen(true)}>
          <Plus size={16} /> Record payment
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-ink-soft">Current balance</p>
            <p className="figures mt-1 font-mono text-xl font-semibold text-ink">
              {formatPeso(customer.current_balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-ink-soft">Open utang</p>
            <p className="figures mt-1 font-mono text-xl font-semibold text-utang-dark">
              {formatPeso(openTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-ink-soft">Credit limit</p>
            <p className="figures mt-1 font-mono text-xl font-semibold text-ink">
              {formatPeso(customer.credit_limit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="utang">
        <TabsList>
          <TabsTrigger value="utang">Utang ledger</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="utang">
          <Card>
            <CardHeader>
              <CardTitle>Libreta</CardTitle>
            </CardHeader>
            <CardContent>
              {utang.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-soft">No utang entries for this customer.</p>
              ) : (
                <div className="notebook-edge space-y-3">
                  {utang
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((u) => (
                      <div key={u.utang_id} className="ledger-row">
                        <span className="text-sm text-ink">
                          {formatDate(u.created_at)}
                          <span className="text-ink-soft"> · due {formatDate(u.due_date)}</span>
                        </span>
                        <span className="leader" />
                        <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                        <span className="figures font-mono text-sm font-medium text-ink w-24 text-right">
                          {formatPeso(u.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-soft">No payments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {payments
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map((p) => (
                      <div
                        key={p.payment_id}
                        className="flex items-center justify-between rounded-card border border-border p-3"
                      >
                        <div>
                          <p className="text-sm text-ink">{formatDateTime(p.payment_date)}</p>
                          {p.notes && <p className="text-xs text-ink-soft">{p.notes}</p>}
                        </div>
                        <span className="figures font-mono text-sm font-semibold text-paid-dark">
                          + {formatPeso(p.amount_paid)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecordPaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        customerId={customerId}
        onSaved={load}
      />
    </div>
  );
}

function RecordPaymentDialog({
  open,
  onClose,
  customerId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onSaved: () => void;
}) {
  const [amount, setAmount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      setAmount("");
      setNotes("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record this payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Record payment" description="Applied against this customer's open utang.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
