"use client";

import * as React from "react";
import { Plus, Search, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { formatPeso } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    api.products
      .list()
      .then(setProducts)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load products."))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const filtered = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            placeholder="Search products or category…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add product
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-center text-sm text-ink-soft">Loading products…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">
              {query ? "No products match that search." : "No products yet. Add your first item."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const low = p.stock_quantity <= p.reorder_level;
                  return (
                    <TableRow key={p.product_id}>
                      <TableCell className="font-medium">{p.product_name}</TableCell>
                      <TableCell className="text-ink-soft">{p.category}</TableCell>
                      <TableCell className="text-ink-soft">{p.unit_type}</TableCell>
                      <TableCell className="figures text-right font-mono text-ink-soft">
                        {formatPeso(p.cost_price)}
                      </TableCell>
                      <TableCell className="figures text-right font-mono">
                        {formatPeso(p.selling_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge tone={low ? "utang" : "paid"}>{p.stock_quantity}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddProductDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
  );
}

function AddProductDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({
    product_name: "",
    category: "",
    unit_type: "piece",
    cost_price: "",
    selling_price: "",
    stock_quantity: "0",
    reorder_level: "5",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.products.create({
        product_name: form.product_name,
        category: form.category,
        unit_type: form.unit_type,
        cost_price: parseFloat(form.cost_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        reorder_level: parseInt(form.reorder_level) || 0,
      });
      onCreated();
      onClose();
      setForm({
        product_name: "",
        category: "",
        unit_type: "piece",
        cost_price: "",
        selling_price: "",
        stock_quantity: "0",
        reorder_level: "5",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add product" description="New item for your inventory.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="product_name">Product name</Label>
          <Input
            id="product_name"
            required
            value={form.product_name}
            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="unit_type">Unit</Label>
            <Input
              id="unit_type"
              required
              value={form.unit_type}
              onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cost_price">Cost price (₱)</Label>
            <Input
              id="cost_price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="selling_price">Selling price (₱)</Label>
            <Input
              id="selling_price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="stock_quantity">Starting stock</Label>
            <Input
              id="stock_quantity"
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="reorder_level">Reorder level</Label>
            <Input
              id="reorder_level"
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
            />
          </div>
        </div>
        {error && <p className="text-sm text-utang-dark">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save product"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
