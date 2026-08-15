// Thin, typed client for Supabase's auto-generated REST API (PostgREST).
// Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in
// .env.local (Project Settings -> API in your Supabase dashboard).
//
// Table names below match the ERD: customers, products, sales, sale_items,
// utang_transactions, payments, digital_services. Rename the path segments
// if your actual table names differ.

import type {
  Customer,
  UtangTransaction,
  Payment,
  Product,
  Sale,
  SaleItem,
  DigitalService,
} from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const REST_URL = `${SUPABASE_URL}/rest/v1`;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new ApiError(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. Add both to .env.local and restart `next dev`.",
      0
    );
  }

  const res = await fetch(`${REST_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(
      `${options.method ?? "GET"} ${path} failed (${res.status}): ${body}`,
      res.status
    );
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const get = <T>(path: string) => request<T>(path);

const getOne = <T>(path: string) =>
  request<T>(path, {
    headers: { Accept: "application/vnd.pgrst.object+json" },
  });

const post = <T>(path: string, body: unknown) =>
  request<T[]>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Prefer: "return=representation" },
  }).then((rows) => rows[0]);

const patch = <T>(path: string, body: unknown) =>
  request<T[]>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { Prefer: "return=representation" },
  }).then((rows) => rows[0]);

const del = (path: string) => request<void>(path, { method: "DELETE" });

const eq = (id: string) => `eq.${encodeURIComponent(id)}`;

export const api = {
  customers: {
    list: () => get<Customer[]>("/customers?select=*&order=last_name.asc"),
    get: (id: string) => getOne<Customer>(`/customers?customer_id=${eq(id)}&select=*`),
    create: (data: Omit<Customer, "customer_id">) => post<Customer>("/customers", data),
    update: (id: string, data: Partial<Customer>) =>
      patch<Customer>(`/customers?customer_id=${eq(id)}`, data),
    remove: (id: string) => del(`/customers?customer_id=${eq(id)}`),
  },

  products: {
    list: () => get<Product[]>("/products?select=*&order=product_name.asc"),
    get: (id: string) => getOne<Product>(`/products?product_id=${eq(id)}&select=*`),
    create: (data: Omit<Product, "product_id">) => post<Product>("/products", data),
    update: (id: string, data: Partial<Product>) =>
      patch<Product>(`/products?product_id=${eq(id)}`, data),
    remove: (id: string) => del(`/products?product_id=${eq(id)}`),
  },

  sales: {
    list: () => get<Sale[]>("/sales?select=*&order=created_at.desc"),
    get: (id: string) => getOne<Sale>(`/sales?sale_id=${eq(id)}&select=*`),
    items: (saleId: string) =>
      get<SaleItem[]>(`/sale_items?sale_id=${eq(saleId)}&select=*`),
    create: (data: Omit<Sale, "sale_id" | "created_at">) => post<Sale>("/sales", data),
  },

  saleItems: {
    create: (data: Omit<SaleItem, "sale_item_id">) =>
      post<SaleItem>("/sale_items", data),
  },

  utang: {
    list: () => get<UtangTransaction[]>("/utang_transactions?select=*&order=created_at.desc"),
    listByCustomer: (customerId: string) =>
      get<UtangTransaction[]>(
        `/utang_transactions?customer_id=${eq(customerId)}&select=*&order=created_at.desc`
      ),
    create: (data: Omit<UtangTransaction, "utang_id" | "created_at">) =>
      post<UtangTransaction>("/utang_transactions", data),
    update: (id: string, data: Partial<UtangTransaction>) =>
      patch<UtangTransaction>(`/utang_transactions?utang_id=${eq(id)}`, data),
  },

  payments: {
    list: () => get<Payment[]>("/payments?select=*&order=payment_date.desc"),
    listByCustomer: (customerId: string) =>
      get<Payment[]>(`/payments?customer_id=${eq(customerId)}&select=*&order=payment_date.desc`),
    create: (data: Omit<Payment, "payment_id">) => post<Payment>("/payments", data),
  },

  digitalServices: {
    list: () => get<DigitalService[]>("/digital_services?select=*&order=created_at.desc"),
    create: (data: Omit<DigitalService, "service_id" | "created_at">) =>
      post<DigitalService>("/digital_services", data),
  },
};

export { ApiError };