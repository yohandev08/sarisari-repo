"use client";

import * as React from "react";
import { Search, Plus, Minus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { formatPeso } from "@/lib/utils";
import type { Product, Customer, PaymentType } from "@/lib/types";

interface CartLine {
  product: Product;
  quantity: number;
}

export default function SalesPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [cart, setCart] = React.useState<CartLine[]>([]);

  const [paymentType, setPaymentType] = React.useState<PaymentType>("cash");
  const [customerId, setCustomerId] = React.useState("");
  const [tendered, setTendered] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([api.products.list(), api.customers.list()])
      .then(([p, c]) => {
        setProducts(p);
        setCustomers(c);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load POS data."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => p.product_name.toLowerCase().includes(query.toLowerCase()));
  const total = cart.reduce((sum, l) => sum + l.quantity * Number(l.product.selling_price), 0);
  const change = paymentType === "cash" ? Math.max(0, (parseFloat(tendered) || 0) - total) : 0;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.product_id === product.product_id);
      if (existing) {
        return prev.map((l) =>
          l.product.product_id === product.product_id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.product_id === productId ? { ...l, quantity: l.quantity + delta } : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.product_id !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (paymentType === "utang" && !customerId) {
      setCheckoutError("Choose a customer for utang sales.");
      return;
    }
    setSaving(true);
    setCheckoutError(null);
    try {
      const sale = await api.sales.create({
        customer_id: customerId || null,
        total_amount: total,
        payment_type: paymentType,
        amount_tendered: paymentType === "cash" ? parseFloat(tendered) || total : null,
        change_given: paymentType === "cash" ? change : null,
      });
      await Promise.all(
        cart.map((l) =>
          api.saleItems.create({
            sale_id: sale.sale_id,
            product_id: l.product.product_id,
            quantity: l.quantity,
            unit_price: l.product.selling_price,
            subtotal: l.quantity * Number(l.product.selling_price),
          })
        )
      );
      if (paymentType === "utang" && customerId) {
        await api.utang.create({
          customer_id: customerId,
          sale_id: sale.sale_id,
          amount: total,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: "pending",
        });
      }
      setSuccess(`Sale ${sale.sale_id} recorded — ${formatPeso(total)}.`);
      setCart([]);
      setTendered("");
      setCustomerId("");
      setPaymentType("cash");
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Could not complete this sale.");
    } finally {
      setSaving(false);
    }
  }

  if (error)
    return (
      <div className="flex items-start gap-3 rounded-card border border-utang-light bg-utang-light/40 p-4 text-sm text-utang-dark">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>{error}</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            placeholder="Search products…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm text-ink-soft">Loading products…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.product_id}
                onClick={() => addToCart(p)}
                disabled={p.stock_quantity <= 0}
                className="flex flex-col items-start rounded-card border border-border bg-white p-3 text-left shadow-card transition-colors hover:border-primary disabled:opacity-40"
              >
                <span className="text-sm font-medium text-ink line-clamp-2">{p.product_name}</span>
                <span className="figures mt-1 font-mono text-sm text-primary-dark">
                  {formatPeso(p.selling_price)}
                </span>
                <span className="mt-1 text-xs text-ink-soft">{p.stock_quantity} {p.unit_type} left</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-ink-soft">No products match.</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Current sale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-ink-soft">Tap a product to add it to the cart.</p>
            ) : (
              <div className="space-y-2">
                {cart.map((l) => (
                  <div key={l.product.product_id} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-ink">{l.product.product_name}</p>
                      <p className="figures font-mono text-xs text-ink-soft">
                        {formatPeso(l.product.selling_price)} × {l.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => updateQty(l.product.product_id, -1)}
                      className="rounded-full p-1 hover:bg-ledger"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="figures w-5 text-center font-mono">{l.quantity}</span>
                    <button
                      onClick={() => updateQty(l.product.product_id, 1)}
                      className="rounded-full p-1 hover:bg-ledger"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeLine(l.product.product_id)}
                      className="rounded-full p-1 text-utang-dark hover:bg-utang-light"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium text-ink">Total</span>
              <span className="figures font-mono text-lg font-semibold text-ink">{formatPeso(total)}</span>
            </div>

            <div>
              <Label htmlFor="payment_type">Payment type</Label>
              <Select
                id="payment_type"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="utang">Utang</option>
                <option value="mixed">Mixed</option>
              </Select>
            </div>

            {paymentType === "utang" && (
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select a customer…</option>
                  {customers
                    .filter((c) => c.is_allowed_utang)
                    .map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                </Select>
              </div>
            )}

            {paymentType === "cash" && (
              <div>
                <Label htmlFor="tendered">Amount tendered (₱)</Label>
                <Input
                  id="tendered"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={total.toFixed(2)}
                />
                {tendered && (
                  <p className="mt-1 text-xs text-ink-soft">
                    Change: <span className="figures font-mono">{formatPeso(change)}</span>
                  </p>
                )}
              </div>
            )}

            {checkoutError && <p className="text-sm text-utang-dark">{checkoutError}</p>}
            {success && (
              <div className="flex items-center gap-2 rounded-card bg-paid-light p-2.5 text-sm text-paid-dark">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <Button className="w-full" size="lg" disabled={cart.length === 0 || saving} onClick={handleCheckout}>
              {saving ? "Recording…" : `Charge ${formatPeso(total)}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
