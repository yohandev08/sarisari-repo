export interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  credit_limit: number;
  current_balance: number;
  is_allowed_utang: boolean;
}

export type UtangStatus = "pending" | "partial" | "paid" | "overdue";

export interface UtangTransaction {
  utang_id: string;
  customer_id: string;
  sale_id: string | null;
  amount: number;
  due_date: string; // ISO date
  status: UtangStatus;
  created_at: string; // ISO datetime
}

export interface Payment {
  payment_id: string;
  customer_id: string;
  amount_paid: number;
  payment_date: string; // ISO datetime
  notes: string | null;
}

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  unit_type: string; // e.g. "piece", "sachet", "kg"
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
}

export type PaymentType = "cash" | "utang" | "gcash" | "mixed";

export interface Sale {
  sale_id: string;
  customer_id: string | null;
  total_amount: number;
  payment_type: PaymentType;
  amount_tendered: number | null;
  change_given: number | null;
  created_at: string; // ISO datetime
}

export interface SaleItem {
  sale_item_id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type DigitalServiceType =
  | "gcash_cash_in"
  | "gcash_cash_out"
  | "load"
  | "bills_payment"
  | "remittance";

export interface DigitalService {
  service_id: string;
  sale_id: string | null;
  service_type: DigitalServiceType;
  account_number_phone: string;
  transaction_amount: number;
  convenience_fee: number;
  reference_number: string;
  created_at: string; // ISO datetime
}

// Convenience composites for UI, hydrated client-side from the base entities above.
export interface CustomerWithSummary extends Customer {
  open_utang_total?: number;
  last_payment_date?: string | null;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customer?: Customer | null;
}
