-- ==============================================================================
-- Electronic Home Appliance Retail Management System
-- Database Schema & Atomic Procedures for Supabase PostgreSQL
-- Default Currency: NPR (Nepalese Rupee), VAT: 13%, Timezone: Asia/Kathmandu
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PROFILES
CREATE TYPE user_role_type AS ENUM ('owner', 'manager', 'cashier', 'storekeeper', 'accountant');

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role_type UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'cashier',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STORE SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'ElectroStore Appliances Hub',
  store_phone TEXT DEFAULT '+977-1-4455660',
  store_email TEXT DEFAULT 'contact@electrostore.np',
  store_address TEXT DEFAULT 'New Road, Kathmandu, Nepal',
  pan_vat_number TEXT DEFAULT '304958129',
  default_vat_percent NUMERIC(5,2) DEFAULT 13.00,
  currency_code TEXT DEFAULT 'NPR',
  currency_symbol TEXT DEFAULT 'रू',
  invoice_header_note TEXT DEFAULT 'Authorized Dealer of Global Home Appliances',
  invoice_footer_note TEXT DEFAULT 'Goods once sold are covered under authorized brand warranty. Thank you for shopping with us!',
  enable_serial_tracking BOOLEAN DEFAULT true,
  default_print_format TEXT DEFAULT 'a4', -- 'a4', 'thermal_80', 'thermal_58'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT CATALOG
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  origin_country TEXT,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- 'pcs', 'box', 'set'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id UUID REFERENCES brands(id) ON DELETE RESTRICT,
  unit_id UUID REFERENCES product_units(id) ON DELETE RESTRICT,
  model_number TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  is_serialized BOOLEAN DEFAULT true,
  purchase_price NUMERIC(14,2) NOT NULL DEFAULT 0.00, -- Weighted average cost
  selling_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  mrp NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  vat_percent NUMERIC(5,2) DEFAULT 13.00,
  min_stock_level INTEGER DEFAULT 2,
  current_stock NUMERIC(12,2) DEFAULT 0.00,
  image_url TEXT,
  warranty_months INTEGER DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERIAL NUMBERS (for TVs, Refrigerators, ACs, Washing Machines, etc.)
CREATE TYPE serial_status_type AS ENUM ('in_stock', 'sold', 'defective', 'returned_to_supplier');

CREATE TABLE IF NOT EXISTS product_serials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status serial_status_type DEFAULT 'in_stock',
  purchase_id UUID,
  sale_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_product_serial UNIQUE (product_id, serial_number)
);

-- 5. SUPPLIERS & CUSTOMERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  pan_number TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  opening_balance NUMERIC(14,2) DEFAULT 0.00,
  current_balance NUMERIC(14,2) DEFAULT 0.00, -- Positive means we owe supplier (payable)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  pan_number TEXT,
  address TEXT,
  opening_balance NUMERIC(14,2) DEFAULT 0.00,
  current_balance NUMERIC(14,2) DEFAULT 0.00, -- Positive means customer owes us (receivable)
  credit_limit NUMERIC(14,2) DEFAULT 100000.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CASH & BANK ACCOUNTS
CREATE TYPE account_type_enum AS ENUM ('cash', 'bank', 'digital_wallet');

CREATE TABLE IF NOT EXISTS cash_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  account_type account_type_enum NOT NULL DEFAULT 'cash',
  account_number TEXT,
  balance NUMERIC(14,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PURCHASES & GOODS RECEIVED
CREATE TYPE purchase_status_enum AS ENUM ('paid', 'partial', 'unpaid');

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(14,2) DEFAULT 0.00,
  vat_amount NUMERIC(14,2) DEFAULT 0.00,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(14,2) DEFAULT 0.00,
  payment_status purchase_status_enum DEFAULT 'unpaid',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1.00,
  unit_cost NUMERIC(14,2) NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  serial_numbers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALES & POS
CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'fonepay', 'bank_transfer', 'credit', 'split');
CREATE TYPE sale_status_enum AS ENUM ('paid', 'partial', 'credit');

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(14,2) DEFAULT 0.00,
  vat_amount NUMERIC(14,2) DEFAULT 0.00,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(14,2) DEFAULT 0.00,
  payment_method payment_method_enum NOT NULL DEFAULT 'cash',
  payment_status sale_status_enum NOT NULL DEFAULT 'paid',
  is_returned BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(14,2) NOT NULL,
  purchase_cost NUMERIC(14,2) DEFAULT 0.00, -- Cached for instant profit calculation
  discount NUMERIC(14,2) DEFAULT 0.00,
  total_price NUMERIC(14,2) NOT NULL,
  serial_numbers TEXT[] DEFAULT '{}',
  warranty_expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STOCK MOVEMENTS (Complete Inventory Audit Trail)
CREATE TYPE stock_movement_type AS ENUM (
  'opening', 'purchase', 'sale', 'purchase_return', 'sale_return', 'adjustment', 'damage'
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type stock_movement_type NOT NULL,
  quantity NUMERIC(12,2) NOT NULL, -- Positive for in, negative for out
  unit_cost NUMERIC(14,2) DEFAULT 0.00,
  reference_type TEXT, -- 'purchase', 'sale', 'return', 'adjustment'
  reference_id UUID,
  serial_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PAYMENTS & TRANSACTIONS
CREATE TYPE payment_record_type AS ENUM ('customer_payment', 'supplier_payment', 'expense', 'customer_refund');

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_type payment_record_type NOT NULL,
  party_type TEXT NOT NULL, -- 'customer', 'supplier', 'expense', 'other'
  party_id UUID,
  reference_id UUID, -- sale_id, purchase_id, etc.
  amount NUMERIC(14,2) NOT NULL,
  payment_method payment_method_enum NOT NULL DEFAULT 'cash',
  account_id UUID REFERENCES cash_accounts(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXPENSES
CREATE TYPE expense_category_enum AS ENUM (
  'rent', 'electricity', 'salary', 'packaging', 'maintenance', 'marketing', 'logistics', 'office_supplies', 'other'
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category expense_category_enum NOT NULL DEFAULT 'other',
  account_id UUID REFERENCES cash_accounts(id),
  amount NUMERIC(14,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payee TEXT NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RETURNS (Sales Returns & Purchase Returns)
CREATE TYPE return_type_enum AS ENUM ('sale_return', 'purchase_return');

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_type return_type_enum NOT NULL,
  reference_id UUID NOT NULL, -- sale_id or purchase_id
  party_id UUID, -- customer_id or supplier_id
  total_refund_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(14,2) NOT NULL,
  serial_numbers TEXT[] DEFAULT '{}',
  condition TEXT DEFAULT 'good', -- 'good', 'defective'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. WARRANTIES & SERVICE MANAGEMENT
CREATE TYPE warranty_status_enum AS ENUM ('active', 'expired', 'claimed', 'voided');

CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  serial_number TEXT NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status warranty_status_enum DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE service_status_enum AS ENUM (
  'received', 'in_repair', 'repaired', 'replaced', 'delivered', 'cancelled'
);

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  serial_number TEXT,
  issue_description TEXT NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status service_status_enum DEFAULT 'received',
  repair_cost NUMERIC(14,2) DEFAULT 0.00,
  customer_charge NUMERIC(14,2) DEFAULT 0.00,
  technician_notes TEXT,
  completed_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ATOMIC BUSINESS STORED PROCEDURES / RPCs
-- ==============================================================================

-- 1. ATOMIC POS SALE EXECUTION
-- Handles: Sales record, Sale Items, Serial Number marking, Stock Movement deduction,
-- Product current_stock decrement, Customer Ledger balance, Payment creation, Cash Account balance.
CREATE OR REPLACE FUNCTION process_pos_sale(
  p_invoice_number TEXT,
  p_customer_id UUID,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_vat NUMERIC,
  p_total NUMERIC,
  p_paid NUMERIC,
  p_payment_method payment_method_enum,
  p_account_id UUID,
  p_notes TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_prod_id UUID;
  v_qty NUMERIC;
  v_price NUMERIC;
  v_prod_cost NUMERIC;
  v_item_discount NUMERIC;
  v_total_price NUMERIC;
  v_warranty_months INT;
  v_warranty_expiry DATE;
  v_serials_arr TEXT[];
  v_serial TEXT;
  v_sale_status sale_status_enum;
  v_balance_due NUMERIC;
BEGIN
  -- Determine payment status
  IF p_paid >= p_total THEN
    v_sale_status := 'paid';
  ELSIF p_paid > 0 THEN
    v_sale_status := 'partial';
  ELSE
    v_sale_status := 'credit';
  END IF;

  -- 1. Insert Sales Record
  INSERT INTO sales (
    invoice_number, customer_id, sale_date, subtotal, discount_amount,
    vat_amount, total_amount, paid_amount, payment_method, payment_status,
    notes, created_by
  ) VALUES (
    p_invoice_number, p_customer_id, CURRENT_DATE, p_subtotal, p_discount,
    p_vat, p_total, p_paid, p_payment_method, v_sale_status,
    p_notes, p_created_by
  ) RETURNING id INTO v_sale_id;

  -- 2. Process Each Item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;
    v_price := (v_item->>'unit_price')::NUMERIC;
    v_item_discount := COALESCE((v_item->>'discount')::NUMERIC, 0.00);
    v_total_price := (v_qty * v_price) - v_item_discount;
    
    -- Extract purchase cost and warranty months
    SELECT purchase_price, warranty_months 
    INTO v_prod_cost, v_warranty_months
    FROM products WHERE id = v_prod_id;

    IF v_warranty_months > 0 THEN
      v_warranty_expiry := CURRENT_DATE + (v_warranty_months || ' months')::INTERVAL;
    ELSE
      v_warranty_expiry := NULL;
    END IF;

    -- Extract serials if present
    IF v_item ? 'serial_numbers' AND jsonb_typeof(v_item->'serial_numbers') = 'array' THEN
      SELECT array_agg(elem::text)
      INTO v_serials_arr
      FROM jsonb_array_elements_text(v_item->'serial_numbers') AS elem;
    ELSE
      v_serials_arr := '{}';
    END IF;

    -- Insert into sale_items
    INSERT INTO sale_items (
      sale_id, product_id, quantity, unit_price, purchase_cost,
      discount, total_price, serial_numbers, warranty_expiry_date
    ) VALUES (
      v_sale_id, v_prod_id, v_qty, v_price, v_prod_cost,
      v_item_discount, v_total_price, v_serials_arr, v_warranty_expiry
    );

    -- Stock Movement (deduction)
    INSERT INTO stock_movements (
      product_id, movement_type, quantity, unit_cost,
      reference_type, reference_id, notes, created_by
    ) VALUES (
      v_prod_id, 'sale', -v_qty, v_prod_cost,
      'sale', v_sale_id, 'POS Invoice #' || p_invoice_number, p_created_by
    );

    -- Decrement Product Stock
    UPDATE products
    SET current_stock = current_stock - v_qty,
        updated_at = NOW()
    WHERE id = v_prod_id;

    -- Handle Serial Numbers
    IF array_length(v_serials_arr, 1) > 0 THEN
      FOREACH v_serial IN ARRAY v_serials_arr
      LOOP
        UPDATE product_serials
        SET status = 'sold',
            sale_id = v_sale_id,
            updated_at = NOW()
        WHERE product_id = v_prod_id AND serial_number = v_serial;

        -- Create warranty card
        IF v_warranty_expiry IS NOT NULL THEN
          INSERT INTO warranties (
            product_id, serial_number, sale_id, customer_id,
            start_date, expiry_date, status
          ) VALUES (
            v_prod_id, v_serial, v_sale_id, p_customer_id,
            CURRENT_DATE, v_warranty_expiry, 'active'
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 3. Update Customer Outstanding Balance (Credit sales / partial)
  v_balance_due := p_total - p_paid;
  IF p_customer_id IS NOT NULL AND v_balance_due > 0 THEN
    UPDATE customers
    SET current_balance = current_balance + v_balance_due,
        updated_at = NOW()
    WHERE id = p_customer_id;
  END IF;

  -- 4. Record Payment if paid > 0
  IF p_paid > 0 THEN
    INSERT INTO payments (
      payment_type, party_type, party_id, reference_id,
      amount, payment_method, account_id, payment_date,
      notes, created_by
    ) VALUES (
      'customer_payment', 'customer', p_customer_id, v_sale_id,
      p_paid, p_payment_method, p_account_id, CURRENT_DATE,
      'Payment for POS Invoice #' || p_invoice_number, p_created_by
    );

    -- Update Cash/Bank account balance
    IF p_account_id IS NOT NULL THEN
      UPDATE cash_accounts
      SET balance = balance + p_paid
      WHERE id = p_account_id;
    END IF;
  END IF;

  -- 5. Audit Log
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, new_values
  ) VALUES (
    p_created_by, 'CREATE_SALE', 'sales', v_sale_id,
    jsonb_build_object('invoice_number', p_invoice_number, 'total', p_total, 'paid', p_paid)
  );

  RETURN v_sale_id;
END;
$$;

-- 2. ATOMIC PURCHASE RECORDING
-- Handles: Purchase record, Purchase Items, Weighted-Average Cost calculation,
-- Serial Number registration, Stock Movement addition, Supplier Ledger balance, Payment creation.
CREATE OR REPLACE FUNCTION process_purchase_invoice(
  p_invoice_number TEXT,
  p_supplier_id UUID,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_vat NUMERIC,
  p_total NUMERIC,
  p_paid NUMERIC,
  p_payment_method payment_method_enum,
  p_account_id UUID,
  p_notes TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase_id UUID;
  v_item JSONB;
  v_prod_id UUID;
  v_qty NUMERIC;
  v_cost NUMERIC;
  v_total_cost NUMERIC;
  v_serials_arr TEXT[];
  v_serial TEXT;
  v_status purchase_status_enum;
  v_balance_due NUMERIC;
  v_old_stock NUMERIC;
  v_old_cost NUMERIC;
  v_new_avg_cost NUMERIC;
BEGIN
  IF p_paid >= p_total THEN
    v_status := 'paid';
  ELSIF p_paid > 0 THEN
    v_status := 'partial';
  ELSE
    v_status := 'unpaid';
  END IF;

  -- 1. Insert Purchase Record
  INSERT INTO purchases (
    invoice_number, supplier_id, purchase_date, subtotal, discount,
    vat_amount, total_amount, paid_amount, payment_status, notes, created_by
  ) VALUES (
    p_invoice_number, p_supplier_id, CURRENT_DATE, p_subtotal, p_discount,
    p_vat, p_total, p_paid, v_status, p_notes, p_created_by
  ) RETURNING id INTO v_purchase_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;
    v_cost := (v_item->>'unit_cost')::NUMERIC;
    v_total_cost := v_qty * v_cost;

    IF v_item ? 'serial_numbers' AND jsonb_typeof(v_item->'serial_numbers') = 'array' THEN
      SELECT array_agg(elem::text)
      INTO v_serials_arr
      FROM jsonb_array_elements_text(v_item->'serial_numbers') AS elem;
    ELSE
      v_serials_arr := '{}';
    END IF;

    -- Insert purchase_items
    INSERT INTO purchase_items (
      purchase_id, product_id, quantity, unit_cost, total_cost, serial_numbers
    ) VALUES (
      v_purchase_id, v_prod_id, v_qty, v_cost, v_total_cost, v_serials_arr
    );

    -- Calculate weighted average costing
    SELECT current_stock, purchase_price
    INTO v_old_stock, v_old_cost
    FROM products WHERE id = v_prod_id;

    IF (v_old_stock + v_qty) > 0 THEN
      v_new_avg_cost := ((v_old_stock * v_old_cost) + (v_qty * v_cost)) / (v_old_stock + v_qty);
    ELSE
      v_new_avg_cost := v_cost;
    END IF;

    -- Update Product Stock & Average Cost
    UPDATE products
    SET current_stock = current_stock + v_qty,
        purchase_price = ROUND(v_new_avg_cost, 2),
        updated_at = NOW()
    WHERE id = v_prod_id;

    -- Stock Movement
    INSERT INTO stock_movements (
      product_id, movement_type, quantity, unit_cost,
      reference_type, reference_id, notes, created_by
    ) VALUES (
      v_prod_id, 'purchase', v_qty, v_cost,
      'purchase', v_purchase_id, 'Purchase Bill #' || p_invoice_number, p_created_by
    );

    -- Insert Serial Numbers into Inventory
    IF array_length(v_serials_arr, 1) > 0 THEN
      FOREACH v_serial IN ARRAY v_serials_arr
      LOOP
        INSERT INTO product_serials (
          product_id, serial_number, status, purchase_id
        ) VALUES (
          v_prod_id, v_serial, 'in_stock', v_purchase_id
        )
        ON CONFLICT (product_id, serial_number)
        DO UPDATE SET status = 'in_stock', purchase_id = v_purchase_id, updated_at = NOW();
      END LOOP;
    END IF;
  END LOOP;

  -- 3. Update Supplier Payable Balance
  v_balance_due := p_total - p_paid;
  IF v_balance_due > 0 THEN
    UPDATE suppliers
    SET current_balance = current_balance + v_balance_due,
        updated_at = NOW()
    WHERE id = p_supplier_id;
  END IF;

  -- 4. Record Payment if paid > 0
  IF p_paid > 0 THEN
    INSERT INTO payments (
      payment_type, party_type, party_id, reference_id,
      amount, payment_method, account_id, payment_date,
      notes, created_by
    ) VALUES (
      'supplier_payment', 'supplier', p_supplier_id, v_purchase_id,
      p_paid, p_payment_method, p_account_id, CURRENT_DATE,
      'Payment for Purchase Bill #' || p_invoice_number, p_created_by
    );

    IF p_account_id IS NOT NULL THEN
      UPDATE cash_accounts
      SET balance = balance - p_paid
      WHERE id = p_account_id;
    END IF;
  END IF;

  RETURN v_purchase_id;
END;
$$;

-- 3. ATOMIC SALES RETURN
CREATE OR REPLACE FUNCTION process_sales_return(
  p_sale_id UUID,
  p_items JSONB,
  p_refund_amount NUMERIC,
  p_account_id UUID,
  p_reason TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_return_id UUID;
  v_cust_id UUID;
  v_item JSONB;
  v_prod_id UUID;
  v_qty NUMERIC;
  v_price NUMERIC;
  v_condition TEXT;
  v_serials_arr TEXT[];
  v_serial TEXT;
BEGIN
  SELECT customer_id INTO v_cust_id FROM sales WHERE id = p_sale_id;

  INSERT INTO returns (
    return_type, reference_id, party_id, total_refund_amount,
    return_date, reason, created_by
  ) VALUES (
    'sale_return', p_sale_id, v_cust_id, p_refund_amount,
    CURRENT_DATE, p_reason, p_created_by
  ) RETURNING id INTO v_return_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;
    v_price := (v_item->>'unit_price')::NUMERIC;
    v_condition := COALESCE(v_item->>'condition', 'good');

    IF v_item ? 'serial_numbers' AND jsonb_typeof(v_item->'serial_numbers') = 'array' THEN
      SELECT array_agg(elem::text)
      INTO v_serials_arr
      FROM jsonb_array_elements_text(v_item->'serial_numbers') AS elem;
    ELSE
      v_serials_arr := '{}';
    END IF;

    INSERT INTO return_items (
      return_id, product_id, quantity, unit_price, serial_numbers, condition
    ) VALUES (
      v_return_id, v_prod_id, v_qty, v_price, v_serials_arr, v_condition
    );

    -- If condition is good, restore stock
    IF v_condition = 'good' THEN
      UPDATE products
      SET current_stock = current_stock + v_qty, updated_at = NOW()
      WHERE id = v_prod_id;

      INSERT INTO stock_movements (
        product_id, movement_type, quantity,
        reference_type, reference_id, notes, created_by
      ) VALUES (
        v_prod_id, 'sale_return', v_qty,
        'return', v_return_id, 'Returned in good condition: ' || p_reason, p_created_by
      );

      IF array_length(v_serials_arr, 1) > 0 THEN
        FOREACH v_serial IN ARRAY v_serials_arr
        LOOP
          UPDATE product_serials
          SET status = 'in_stock', sale_id = NULL, updated_at = NOW()
          WHERE product_id = v_prod_id AND serial_number = v_serial;
        END LOOP;
      END IF;
    ELSE
      -- Defective
      INSERT INTO stock_movements (
        product_id, movement_type, quantity,
        reference_type, reference_id, notes, created_by
      ) VALUES (
        v_prod_id, 'damage', 0,
        'return', v_return_id, 'Returned defective: ' || p_reason, p_created_by
      );

      IF array_length(v_serials_arr, 1) > 0 THEN
        FOREACH v_serial IN ARRAY v_serials_arr
        LOOP
          UPDATE product_serials
          SET status = 'defective', updated_at = NOW()
          WHERE product_id = v_prod_id AND serial_number = v_serial;
        END LOOP;
      END IF;
    END IF;
  END LOOP;

  -- Handle Refund Payment
  IF p_refund_amount > 0 AND p_account_id IS NOT NULL THEN
    INSERT INTO payments (
      payment_type, party_type, party_id, reference_id,
      amount, payment_method, account_id, payment_date,
      notes, created_by
    ) VALUES (
      'customer_refund', 'customer', v_cust_id, v_return_id,
      p_refund_amount, 'cash', p_account_id, CURRENT_DATE,
      'Refund for Sales Return #' || v_return_id, p_created_by
    );

    UPDATE cash_accounts
    SET balance = balance - p_refund_amount
    WHERE id = p_account_id;
  END IF;

  UPDATE sales SET is_returned = true WHERE id = p_sale_id;

  RETURN v_return_id;
END;
$$;

-- 4. AGGREGATED METRICS DASHBOARD FUNCTION
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_sales NUMERIC := 0.00;
  v_today_purchases NUMERIC := 0.00;
  v_total_stock_value NUMERIC := 0.00;
  v_customer_receivables NUMERIC := 0.00;
  v_supplier_payables NUMERIC := 0.00;
  v_today_gross_profit NUMERIC := 0.00;
  v_low_stock_count INT := 0;
  v_active_service_requests INT := 0;
  v_result JSONB;
BEGIN
  -- Today Sales
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_today_sales
  FROM sales WHERE sale_date = CURRENT_DATE;

  -- Today Purchases
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_today_purchases
  FROM purchases WHERE purchase_date = CURRENT_DATE;

  -- Inventory Valuation (Current Stock * Weighted Avg Purchase Price)
  SELECT COALESCE(SUM(current_stock * purchase_price), 0.00) INTO v_total_stock_value
  FROM products WHERE is_active = true AND current_stock > 0;

  -- Customer Receivables
  SELECT COALESCE(SUM(current_balance), 0.00) INTO v_customer_receivables
  FROM customers WHERE current_balance > 0;

  -- Supplier Payables
  SELECT COALESCE(SUM(current_balance), 0.00) INTO v_supplier_payables
  FROM suppliers WHERE current_balance > 0;

  -- Gross Profit Today
  SELECT COALESCE(SUM(si.total_price - (si.purchase_cost * si.quantity)), 0.00)
  INTO v_today_gross_profit
  FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  WHERE s.sale_date = CURRENT_DATE;

  -- Low stock items count
  SELECT COUNT(*) INTO v_low_stock_count
  FROM products
  WHERE is_active = true AND current_stock <= min_stock_level;

  -- Active service tickets
  SELECT COUNT(*) INTO v_active_service_requests
  FROM service_requests
  WHERE status IN ('received', 'in_repair');

  v_result := jsonb_build_object(
    'today_sales', v_today_sales,
    'today_purchases', v_today_purchases,
    'total_stock_value', v_total_stock_value,
    'customer_receivables', v_customer_receivables,
    'supplier_payables', v_supplier_payables,
    'today_gross_profit', v_today_gross_profit,
    'low_stock_count', v_low_stock_count,
    'active_service_requests', v_active_service_requests
  );

  RETURN v_result;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role_type
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Authenticated users have read access to catalog and general business data
CREATE POLICY "Authenticated users can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read brands" ON brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read units" ON product_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read serials" ON product_serials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read sale items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read settings" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read cash accounts" ON cash_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read warranties" ON warranties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read service requests" ON service_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read stock movements" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read purchases" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read purchase items" ON purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read returns" ON returns FOR SELECT TO authenticated USING (true);

-- Insert/Update permissions based on roles
CREATE POLICY "Cashiers and Managers can create sales" ON sales FOR INSERT TO authenticated
WITH CHECK (auth_user_role() IN ('owner', 'manager', 'cashier'));

CREATE POLICY "Cashiers and Managers can create sale items" ON sale_items FOR INSERT TO authenticated
WITH CHECK (auth_user_role() IN ('owner', 'manager', 'cashier'));

CREATE POLICY "Storekeepers and Managers can update inventory" ON products FOR ALL TO authenticated
USING (auth_user_role() IN ('owner', 'manager', 'storekeeper'));

CREATE POLICY "Accountants and Managers can manage finance" ON payments FOR ALL TO authenticated
USING (auth_user_role() IN ('owner', 'manager', 'accountant'));

CREATE POLICY "Accountants and Managers can manage expenses" ON expenses FOR ALL TO authenticated
USING (auth_user_role() IN ('owner', 'manager', 'accountant'));

CREATE POLICY "Owner and Managers have full profile access" ON profiles FOR ALL TO authenticated
USING (auth_user_role() IN ('owner', 'manager') OR auth.uid() = id);

-- ==============================================================================
-- REALISTIC SEED DATA (Nepal Retail Appliance Store)
-- ==============================================================================

-- 1. Insert Default Settings
INSERT INTO settings (id, store_name, store_phone, store_email, store_address, pan_vat_number, default_vat_percent, currency_code, currency_symbol)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Himalayan Smart Appliances & Electronics',
  '+977-1-4228900',
  'sales@himalayanappliances.com.np',
  'Maha Boudha, New Road, Kathmandu 44600, Nepal',
  '301294856',
  13.00,
  'NPR',
  'रू'
) ON CONFLICT DO NOTHING;

-- 2. Insert Product Units
INSERT INTO product_units (id, name, code) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Piece', 'pcs'),
  ('11111111-1111-1111-1111-111111111102', 'Set', 'set'),
  ('11111111-1111-1111-1111-111111111103', 'Box', 'box')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Appliance Categories
INSERT INTO categories (id, name, code, description) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Smart Televisions', 'CAT-TV', '4K Ultra HD, OLED, QLED & Smart LED TVs'),
  ('22222222-2222-2222-2222-222222222202', 'Refrigerators & Freezers', 'CAT-REF', 'Double Door, Side-by-Side & Deep Freezers'),
  ('22222222-2222-2222-2222-222222222203', 'Washing Machines', 'CAT-WASH', 'Front Load, Top Load & Semi-Automatic Washers'),
  ('22222222-2222-2222-2222-222222222204', 'Inverter Air Conditioners', 'CAT-AC', 'Split Inverter ACs, Dual Inverter, Hot & Cold'),
  ('22222222-2222-2222-2222-222222222205', 'Kitchen Appliances', 'CAT-KTCH', 'Microwave Ovens, Induction Cookers, Air Fryers, Chimneys'),
  ('22222222-2222-2222-2222-222222222206', 'Small Home Appliances', 'CAT-SMAL', 'Steam Irons, Vacuum Cleaners, Geysers, Water Purifiers')
ON CONFLICT (code) DO NOTHING;

-- 4. Insert Global & Local Appliance Brands
INSERT INTO brands (id, name, origin_country, description) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Samsung', 'South Korea', 'Leading electronics & digital appliance innovator'),
  ('33333333-3333-3333-3333-333333333302', 'LG Electronics', 'South Korea', 'Life''s Good premium appliances & Smart Inverter technology'),
  ('33333333-3333-3333-3333-333333333303', 'Sony Bravia', 'Japan', 'World-class audio-visual excellence'),
  ('33333333-3333-3333-3333-333333333304', 'Whirlpool', 'USA', '6th Sense consumer home appliances'),
  ('33333333-3333-3333-3333-333333333305', 'Bosch', 'Germany', 'German engineered durable appliances'),
  ('33333333-3333-3333-3333-333333333306', 'Philips', 'Netherlands', 'High quality kitchen & home care appliances'),
  ('33333333-3333-3333-3333-333333333307', 'Midea', 'China', 'World renowned HVAC & home solutions')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert Cash / Bank Accounts
INSERT INTO cash_accounts (id, name, account_type, account_number, balance) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Cash in Counter Drawer', 'cash', 'CASH-MAIN-01', 85000.00),
  ('44444444-4444-4444-4444-444444444402', 'Nabil Bank Current A/C', 'bank', '01900128472910', 450000.00),
  ('44444444-4444-4444-4444-444444444403', 'Fonepay Merchant QR', 'digital_wallet', 'FONEPAY-9801234567', 124500.00),
  ('44444444-4444-4444-4444-444444444404', 'Global IME Bank POS Card A/C', 'bank', '1092837465019', 310000.00)
ON CONFLICT DO NOTHING;

-- 6. Insert Suppliers
INSERT INTO suppliers (id, name, company_name, pan_number, email, phone, address, opening_balance, current_balance) VALUES
  ('55555555-5555-5555-5555-555555555501', 'Him Electronics Pvt. Ltd.', 'Him Electronics (Samsung Nepal)', '300182749', 'info@himelectronics.com', '+977-1-4261820', 'Tinkune, Kathmandu', 0.00, 185000.00),
  ('55555555-5555-5555-5555-555555555502', 'CG Electronics Nepal', 'Chaudhary Group Appliances (LG/TCL/Midea)', '300293847', 'trade@cgelectronics.com.np', '+977-1-5542100', 'Sanepa, Lalitpur', 0.00, 320000.00),
  ('55555555-5555-5555-5555-555555555503', 'Nepa Hima Technologies', 'Nepa Hima (Sony Nepal)', '300481927', 'sales@nepahima.com', '+977-1-4433100', 'Bhatbhateni, Kathmandu', 0.00, 95000.00)
ON CONFLICT DO NOTHING;

-- 7. Insert Customers
INSERT INTO customers (id, name, phone, email, pan_number, address, opening_balance, current_balance, credit_limit) VALUES
  ('66666666-6666-6666-6666-666666666601', 'Rajesh Shrestha', '+977-9851023456', 'rajesh.shrestha@gmail.com', '601928374', 'Jhamsikhel, Lalitpur', 0.00, 45000.00, 150000.00),
  ('66666666-6666-6666-6666-666666666602', 'Bikash Adhikari', '+977-9841892746', 'bikash.adh@yahoo.com', NULL, 'Baneshwor, Kathmandu', 0.00, 0.00, 100000.00),
  ('66666666-6666-6666-6666-666666666603', 'Himalayan Boutique Hotel', '+977-1-4701234', 'procure@himalayanboutique.np', '302918475', 'Thamel, Kathmandu', 0.00, 128000.00, 500000.00)
ON CONFLICT DO NOTHING;

-- 8. Insert Products with Model Numbers, Specifications, Warranty, and Prices
INSERT INTO products (id, name, sku, barcode, category_id, brand_id, unit_id, model_number, specifications, is_serialized, purchase_price, selling_price, mrp, vat_percent, min_stock_level, current_stock, warranty_months) VALUES
  ('77777777-7777-7777-7777-777777777701', 'Samsung 55" Crystal 4K UHD Smart TV', 'SAM-TV-55CU7700', '8806091827361',
   '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101',
   'UA55CU7700RXZN', '{"screen_size": "55 inch", "resolution": "3840x2160 4K", "hdr": "HDR10+", "smart_os": "Tizen OS", "audio": "20W Dolby Digital"}',
   true, 68000.00, 82500.00, 94990.00, 13.00, 3, 6, 24),

  ('77777777-7777-7777-7777-777777777702', 'LG 8.0 Kg Front Load AI DD Washing Machine', 'LG-WM-FHP1408Z9B', '8801048291024',
   '22222222-2222-2222-2222-222222222203', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101',
   'FHP1408Z9B', '{"capacity": "8.0 Kg", "motor": "Direct Drive Inverter", "spin_speed": "1400 RPM", "steam": "SteamWash 99.9% Allergy Care", "color": "Black Steel"}',
   true, 62000.00, 74900.00, 86990.00, 13.00, 2, 4, 24),

  ('77777777-7777-7777-7777-777777777703', 'Samsung 253L Digital Inverter Double Door Refrigerator', 'SAM-REF-RT28K', '8806094918274',
   '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101',
   'RT28K3032GS', '{"capacity": "253 Liters", "compressor": "Digital Inverter 10-Yr Warranty", "cooling": "All Around Cooling", "star_rating": "3 Star"}',
   true, 44000.00, 52900.00, 59990.00, 13.00, 3, 5, 24),

  ('77777777-7777-7777-7777-777777777704', 'LG Dual Inverter 1.5 Ton Hot & Cold Split AC', 'LG-AC-18T-HC', '8801039485721',
   '22222222-2222-2222-2222-222222222204', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102',
   'LS-Q18PWXA', '{"capacity": "1.5 Ton (18000 BTU)", "mode": "Hot and Cold (Year-round)", "refrigerant": "R32 Eco", "copper": "100% Ocean Black Fin Copper"}',
   true, 84000.00, 99500.00, 114990.00, 13.00, 2, 3, 36),

  ('77777777-7777-7777-7777-777777777705', 'Philips Viva Collection 2100W Induction Cooktop', 'PHI-IND-HD4928', '8710103628192',
   '22222222-2222-2222-2222-222222222205', '33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111101',
   'HD4928/01', '{"power": "2100 Watts", "timer": "0 to 3 Hours", "presets": "Indian/Nepali Auto Cook Menus", "glass": "Full Crystal Glass"}',
   false, 4200.00, 5490.00, 6290.00, 13.00, 5, 18, 12),

  ('77777777-7777-7777-7777-777777777706', 'Bosch 28L Convection Microwave Oven', 'BOS-MW-HMB28', '4242005281920',
   '22222222-2222-2222-2222-222222222205', '33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111101',
   'HMB28C50IN', '{"capacity": "28 Liters", "functions": "Bake, Grill, Reheat, Defrost", "cavity": "Stainless Steel", "programs": "Auto 120 Menus"}',
   true, 21000.00, 26900.00, 31990.00, 13.00, 2, 4, 12),

  ('77777777-7777-7777-7777-777777777707', 'Sony Bravia 65" 4K Google TV X75L', 'SNY-TV-65X75L', '4548736142981',
   '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111101',
   'KD-65X75L', '{"screen": "65 Inch 4K HDR", "processor": "X1 4K Processor", "motion": "Motionflow XR 200", "sound": "Open Baffle Speaker 20W Dolby Audio"}',
   true, 124000.00, 148000.00, 169900.00, 13.00, 2, 3, 24)
ON CONFLICT (sku) DO NOTHING;

-- 9. Insert Serial Numbers for Appliance Inventory
INSERT INTO product_serials (product_id, serial_number, status) VALUES
  ('77777777-7777-7777-7777-777777777701', 'SAMTV55-CU7700-001', 'in_stock'),
  ('77777777-7777-7777-7777-777777777701', 'SAMTV55-CU7700-002', 'in_stock'),
  ('77777777-7777-7777-7777-777777777701', 'SAMTV55-CU7700-003', 'in_stock'),
  ('77777777-7777-7777-7777-777777777701', 'SAMTV55-CU7700-004', 'in_stock'),
  ('77777777-7777-7777-7777-777777777701', 'SAMTV55-CU7700-005', 'in_stock'),
  ('77777777-7777-7777-7777-777777777701', 'SAMTV55-CU7700-006', 'in_stock'),

  ('77777777-7777-7777-7777-777777777702', 'LGWM80-FHP140-001', 'in_stock'),
  ('77777777-7777-7777-7777-777777777702', 'LGWM80-FHP140-002', 'in_stock'),
  ('77777777-7777-7777-7777-777777777702', 'LGWM80-FHP140-003', 'in_stock'),
  ('77777777-7777-7777-7777-777777777702', 'LGWM80-FHP140-004', 'in_stock'),

  ('77777777-7777-7777-7777-777777777703', 'SAMREF253-RT28-001', 'in_stock'),
  ('77777777-7777-7777-7777-777777777703', 'SAMREF253-RT28-002', 'in_stock'),
  ('77777777-7777-7777-7777-777777777703', 'SAMREF253-RT28-003', 'in_stock'),
  ('77777777-7777-7777-7777-777777777703', 'SAMREF253-RT28-004', 'in_stock'),
  ('77777777-7777-7777-7777-777777777703', 'SAMREF253-RT28-005', 'in_stock'),

  ('77777777-7777-7777-7777-777777777704', 'LGAC15-LSQ18-001', 'in_stock'),
  ('77777777-7777-7777-7777-777777777704', 'LGAC15-LSQ18-002', 'in_stock'),
  ('77777777-7777-7777-7777-777777777704', 'LGAC15-LSQ18-003', 'in_stock'),

  ('77777777-7777-7777-7777-777777777707', 'SNYTV65-KD75-001', 'in_stock'),
  ('77777777-7777-7777-7777-777777777707', 'SNYTV65-KD75-002', 'in_stock'),
  ('77777777-7777-7777-7777-777777777707', 'SNYTV65-KD75-003', 'in_stock')
ON CONFLICT (product_id, serial_number) DO NOTHING;

-- 10. Initial Stock Movements Log
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, notes) VALUES
  ('77777777-7777-7777-7777-777777777701', 'opening', 6, 68000.00, 'system_opening', 'Opening showroom inventory'),
  ('77777777-7777-7777-7777-777777777702', 'opening', 4, 62000.00, 'system_opening', 'Opening showroom inventory'),
  ('77777777-7777-7777-7777-777777777703', 'opening', 5, 44000.00, 'system_opening', 'Opening showroom inventory'),
  ('77777777-7777-7777-7777-777777777704', 'opening', 3, 84000.00, 'system_opening', 'Opening showroom inventory'),
  ('77777777-7777-7777-7777-777777777705', 'opening', 18, 4200.00, 'system_opening', 'Opening warehouse stock'),
  ('77777777-7777-7777-7777-777777777706', 'opening', 4, 21000.00, 'system_opening', 'Opening showroom inventory'),
  ('77777777-7777-7777-7777-777777777707', 'opening', 3, 124000.00, 'system_opening', 'Opening showroom inventory');

-- 11. Initial Sample Service Requests
INSERT INTO service_requests (id, ticket_number, customer_id, product_id, serial_number, issue_description, status, repair_cost, customer_charge, technician_notes)
VALUES (
  '88888888-8888-8888-8888-888888888801',
  'SRV-2081-0089',
  '66666666-6666-6666-6666-666666666601',
  '77777777-7777-7777-7777-777777777703',
  'SAMREF253-RT28-001',
  'Cooling not adequate in lower fresh food compartment',
  'in_repair',
  1200.00,
  0.00,
  'Defrost sensor checked; ordered replacement thermostat under warranty'
) ON CONFLICT (ticket_number) DO NOTHING;
