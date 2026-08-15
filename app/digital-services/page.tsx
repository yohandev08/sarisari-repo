"use client";

import * as React from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { formatPeso, formatDateTime } from "@/lib/utils";
import type { DigitalService, DigitalServiceType } from "@/lib/types";

const serviceLabels: Record<DigitalServiceType, string> = {
  gcash_cash_in: "GCash cash-in",
  gcash_cash_out: "GCash cash-out",
  load: "Load",
  bills_payment: "Bills payment",
  remittance: "Remittance",
};

export default function DigitalServicesPage() {
  const [services, setServices] = React.useState<DigitalService[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    api.digitalServices
      .list()
      .then(setServices)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load digital services."))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const sorted = [...services].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const feesToday = services
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + Number(s.convenience_fee), 0);

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
          Convenience fees earned today:{" "}
          <span className="figures font-mono font-semibold text-paid-dark">{formatPeso(feesToday)}</span>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Log transaction
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-center text-sm text-ink-soft">Loading transactions…</p>
          ) : sorted.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">No digital service transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Account / phone</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((s) => (
                  <TableRow key={s.service_id}>
                    <TableCell>
                      <Badge tone="primary">{serviceLabels[s.service_type]}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.account_number_phone}</TableCell>
                    <TableCell className="font-mono text-xs text-ink-soft">{s.reference_number}</TableCell>
                    <TableCell>{formatDateTime(s.created_at)}</TableCell>
                    <TableCell className="figures text-right font-mono">
                      {formatPeso(s.transaction_amount)}
                    </TableCell>
                    <TableCell className="figures text-right font-mono text-paid-dark">
                      {formatPeso(s.convenience_fee)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LogTransactionDialog open={open} onClose={() => setOpen(false)} onSaved={load} />
    </div>
  );
}

function LogTransactionDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({
    service_type: "gcash_cash_in" as DigitalServiceType,
    account_number_phone: "",
    transaction_amount: "",
    convenience_fee: "",
    reference_number: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.digitalServices.create({
        sale_id: null,
        service_type: form.service_type,
        account_number_phone: form.account_number_phone,
        transaction_amount: parseFloat(form.transaction_amount) || 0,
        convenience_fee: parseFloat(form.convenience_fee) || 0,
        reference_number: form.reference_number,
      });
      onSaved();
      onClose();
      setForm({
        service_type: "gcash_cash_in",
        account_number_phone: "",
        transaction_amount: "",
        convenience_fee: "",
        reference_number: "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Log transaction" description="GCash, load, bills payment, or remittance.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="service_type">Service type</Label>
          <Select
            id="service_type"
            value={form.service_type}
            onChange={(e) => setForm({ ...form, service_type: e.target.value as DigitalServiceType })}
          >
            {Object.entries(serviceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="account_number_phone">Account number / phone</Label>
          <Input
            id="account_number_phone"
            required
            value={form.account_number_phone}
            onChange={(e) => setForm({ ...form, account_number_phone: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="transaction_amount">Amount (₱)</Label>
            <Input
              id="transaction_amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.transaction_amount}
              onChange={(e) => setForm({ ...form, transaction_amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="convenience_fee">Convenience fee (₱)</Label>
            <Input
              id="convenience_fee"
              type="number"
              min="0"
              step="0.01"
              value={form.convenience_fee}
              onChange={(e) => setForm({ ...form, convenience_fee: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="reference_number">Reference number</Label>
          <Input
            id="reference_number"
            required
            value={form.reference_number}
            onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-utang-dark">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Log transaction"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
