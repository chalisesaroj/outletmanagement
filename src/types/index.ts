// ==============================================================================
// Domain & Database TypeScript Type Definitions
// ==============================================================================

export type UserRole = 'owner' | 'manager' | 'cashier' | 'storekeeper' | 'accountant';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  store_phone: string;
  store_email: string;
  store_address: string;
  pan_vat_number: string;
  default_vat_percent: number;
  currency_code: string;
  currency_symbol: string;
  invoice_header_note: string;
  invoice_footer_note: string;
  enable_serial_tracking: boolean;
  default_print_format: 'a4' | 'thermal_80' | 'thermal_58';
  created_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  origin_country?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ProductUnit {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id: string;
  brand_id: string;
  unit_id: string;
  model_number?: string;
  specifications: Record<string, string>;
  is_serialized: boolean;
  purchase_price: number; // Weighted average cost
  selling_price: number;
  mrp: number;
  vat_percent: number;
  min_stock_level: number;
  current_stock: number;
  image_url?: string;
  warranty_months: number;
  is_active: boolean;
  created_at?: string;
  // Joined relation fields
  category?: ProductCategory;
  brand?: ProductBrand;
  unit?: ProductUnit;
}

export type SerialStatus = 'in_stock' | 'sold' | 'defective' | 'returned_to_supplier';

export interface ProductSerial {
  id: string;
  product_id: string;
  serial_number: string;
  status: SerialStatus;
  purchase_id?: string;
  sale_id?: string;
  created_at?: string;
  updated_at?: string;
  product?: Product;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  pan_number?: string;
  address?: string;
  opening_balance: number;
  current_balance: number; // Positive = customer owes store (receivable)
  credit_limit: number;
  is_active: boolean;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company_name: string;
  pan_number?: string;
  email?: string;
  phone: string;
  address?: string;
  opening_balance: number;
  current_balance: number; // Positive = store owes supplier (payable)
  is_active: boolean;
  created_at?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'fonepay' | 'bank_transfer' | 'credit' | 'split';
export type SalePaymentStatus = 'paid' | 'partial' | 'credit';

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  purchase_cost?: number;
  discount: number;
  total_price: number;
  serial_numbers: string[];
  warranty_expiry_date?: string;
  product?: Product;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  payment_status: SalePaymentStatus;
  is_returned: boolean;
  notes?: string;
  created_by?: string;
  created_at?: string;
  customer?: Customer;
  items?: SaleItem[];
}

export type PurchasePaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  serial_numbers: string[];
  product?: Product;
}

export interface Purchase {
  id: string;
  invoice_number: string;
  supplier_id: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PurchasePaymentStatus;
  notes?: string;
  created_by?: string;
  created_at?: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
}

export type StockMovementType =
  | 'opening'
  | 'purchase'
  | 'sale'
  | 'purchase_return'
  | 'sale_return'
  | 'adjustment'
  | 'damage';

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number;
  reference_type?: string;
  reference_id?: string;
  serial_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
}

export type AccountType = 'cash' | 'bank' | 'digital_wallet';

export interface CashAccount {
  id: string;
  name: string;
  account_type: AccountType;
  account_number?: string;
  balance: number;
  is_active: boolean;
  created_at?: string;
}

export type PaymentRecordType = 'customer_payment' | 'supplier_payment' | 'expense' | 'customer_refund';

export interface Payment {
  id: string;
  payment_type: PaymentRecordType;
  party_type: 'customer' | 'supplier' | 'expense' | 'other';
  party_id?: string;
  reference_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  account_id?: string;
  payment_date: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  account?: CashAccount;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'salary'
  | 'packaging'
  | 'maintenance'
  | 'marketing'
  | 'logistics'
  | 'office_supplies'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  account_id?: string;
  amount: number;
  expense_date: string;
  payee: string;
  description?: string;
  receipt_url?: string;
  created_by?: string;
  created_at?: string;
  account?: CashAccount;
}

export type WarrantyStatus = 'active' | 'expired' | 'claimed' | 'voided';

export interface Warranty {
  id: string;
  product_id: string;
  serial_number: string;
  sale_id?: string;
  customer_id?: string;
  start_date: string;
  expiry_date: string;
  status: WarrantyStatus;
  created_at?: string;
  product?: Product;
  customer?: Customer;
}

export type ServiceStatus = 'received' | 'in_repair' | 'repaired' | 'replaced' | 'delivered' | 'cancelled';

export interface ServiceRequest {
  id: string;
  ticket_number: string;
  customer_id: string;
  product_id: string;
  serial_number?: string;
  issue_description: string;
  received_date: string;
  status: ServiceStatus;
  repair_cost: number;
  customer_charge: number;
  technician_notes?: string;
  completed_date?: string;
  created_by?: string;
  created_at?: string;
  customer?: Customer;
  product?: Product;
}

export interface DashboardMetrics {
  today_sales: number;
  today_purchases: number;
  total_stock_value: number;
  customer_receivables: number;
  supplier_payables: number;
  today_gross_profit: number;
  low_stock_count: number;
  active_service_requests: number;
}
