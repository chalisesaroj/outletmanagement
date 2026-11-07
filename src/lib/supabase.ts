import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  ProductCategory,
  ProductBrand,
  ProductUnit,
  ProductSerial,
  Customer,
  Supplier,
  Sale,
  Purchase,
  StockMovement,
  CashAccount,
  Expense,
  Payment,
  Warranty,
  ServiceRequest,
  StoreSettings,
  DashboardMetrics,
  UserProfile,
  UserRole
} from '@/types';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_UNITS,
  INITIAL_PRODUCTS,
  INITIAL_SERIALS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_ACCOUNTS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_SERVICE_REQUESTS,
  DEFAULT_USER_PROFILES
} from './mockData';

// Config storage keys
const STORAGE_KEY_SUPABASE = 'electro_supabase_config';
const STORAGE_PREFIX = 'electro_db_';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSavedSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse Supabase config from localStorage', e);
  }

  // Fallback to Vite env variables if set during build
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('placeholder')) {
    return { url: envUrl, anonKey: envKey };
  }
  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig | null) {
  if (config) {
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
  } else {
    localStorage.removeItem(STORAGE_KEY_SUPABASE);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  const cfg = getSavedSupabaseConfig();
  if (cfg) {
    try {
      supabaseInstance = createClient(cfg.url, cfg.anonKey);
      return supabaseInstance;
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
    }
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// ==============================================================================
// LOCAL PERSISTENT REPOSITORY (FALLBACK / OFFLINE / FIRST-RUN TEST MODE)
// ==============================================================================

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

// In-memory / localStorage stores
let localSettings = getStorage<StoreSettings>('settings', INITIAL_SETTINGS);
let localCategories = getStorage<ProductCategory[]>('categories', INITIAL_CATEGORIES);
let localBrands = getStorage<ProductBrand[]>('brands', INITIAL_BRANDS);
let localUnits = getStorage<ProductUnit[]>('units', INITIAL_UNITS);
let localProducts = getStorage<Product[]>('products', INITIAL_PRODUCTS);
let localSerials = getStorage<ProductSerial[]>('serials', INITIAL_SERIALS);
let localCustomers = getStorage<Customer[]>('customers', INITIAL_CUSTOMERS);
let localSuppliers = getStorage<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
let localAccounts = getStorage<CashAccount[]>('accounts', INITIAL_ACCOUNTS);
let localSales = getStorage<Sale[]>('sales', INITIAL_SALES);
let localPurchases = getStorage<Purchase[]>('purchases', INITIAL_PURCHASES);
let localExpenses = getStorage<Expense[]>('expenses', INITIAL_EXPENSES);
let localServices = getStorage<ServiceRequest[]>('services', INITIAL_SERVICE_REQUESTS);
let localMovements = getStorage<StockMovement[]>('movements', []);
let localPayments = getStorage<Payment[]>('payments', []);
let localWarranties = getStorage<Warranty[]>('warranties', []);

// ==============================================================================
// UNIFIED DATABASE SERVICE
// Automatically uses live Supabase if connected, or local persistent store!
// ==============================================================================

export const dbService = {
  // Test connection to live Supabase
  async testConnection(url: string, key: string): Promise<boolean> {
    try {
      const client = createClient(url, key);
      const { error } = await client.from('settings').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Even if table is empty or requires setup, connecting to API without 401/403 means auth key is good
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  },

  isUsingLiveSupabase(): boolean {
    return getSupabase() !== null;
  },

  // 1. SETTINGS
  async getSettings(): Promise<StoreSettings> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('settings').select('*').single();
      if (!error && data) return data;
    }
    return localSettings;
  },

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('settings').update(updates).eq('id', localSettings.id).select().single();
      if (!error && data) return data;
    }
    localSettings = { ...localSettings, ...updates };
    setStorage('settings', localSettings);
    return localSettings;
  },

  // 2. CATEGORIES & BRANDS
  async getCategories(): Promise<ProductCategory[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('categories').select('*').order('name');
      if (!error && data) return data;
    }
    return localCategories;
  },

  async createCategory(cat: Omit<ProductCategory, 'id'>): Promise<ProductCategory> {
    const newCat: ProductCategory = { ...cat, id: 'cat-' + Date.now() };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('categories').insert(cat).select().single();
      if (!error && data) return data;
    }
    localCategories.push(newCat);
    setStorage('categories', localCategories);
    return newCat;
  },

  async getBrands(): Promise<ProductBrand[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('brands').select('*').order('name');
      if (!error && data) return data;
    }
    return localBrands;
  },

  async createBrand(brand: Omit<ProductBrand, 'id'>): Promise<ProductBrand> {
    const newBrand: ProductBrand = { ...brand, id: 'br-' + Date.now() };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('brands').insert(brand).select().single();
      if (!error && data) return data;
    }
    localBrands.push(newBrand);
    setStorage('brands', localBrands);
    return newBrand;
  },

  async getUnits(): Promise<ProductUnit[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('product_units').select('*');
      if (!error && data) return data;
    }
    return localUnits;
  },

  // 3. PRODUCTS & SERIALS
  async getProducts(): Promise<Product[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('products').select(`
        *,
        category:categories(*),
        brand:brands(*),
        unit:product_units(*)
      `).order('name');
      if (!error && data) return data;
    }
    // Enrich with local category and brand
    return localProducts.map(p => ({
      ...p,
      category: localCategories.find(c => c.id === p.category_id),
      brand: localBrands.find(b => b.id === p.brand_id),
      unit: localUnits.find(u => u.id === p.unit_id)
    }));
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const id = 'prod-' + Date.now();
    const newProduct: Product = { ...product, id, current_stock: product.current_stock || 0 };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('products').insert(product).select().single();
      if (!error && data) return data;
    }
    localProducts.unshift(newProduct);
    setStorage('products', localProducts);

    // Opening stock movement if stock > 0
    if (newProduct.current_stock > 0) {
      const movement: StockMovement = {
        id: 'mov-' + Date.now(),
        product_id: id,
        movement_type: 'opening',
        quantity: newProduct.current_stock,
        unit_cost: newProduct.purchase_price,
        notes: 'Initial opening stock',
        created_at: new Date().toISOString()
      };
      localMovements.push(movement);
      setStorage('movements', localMovements);
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('products').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    }
    const idx = localProducts.findIndex(p => p.id === id);
    if (idx !== -1) {
      localProducts[idx] = { ...localProducts[idx], ...updates };
      setStorage('products', localProducts);
      return localProducts[idx];
    }
    throw new Error('Product not found');
  },

  async getProductSerials(productId?: string, statusFilter?: string): Promise<ProductSerial[]> {
    const sb = getSupabase();
    if (sb) {
      let query = sb.from('product_serials').select('*, product:products(name, sku, model_number)');
      if (productId) query = query.eq('product_id', productId);
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    let list = localSerials;
    if (productId) list = list.filter(s => s.product_id === productId);
    if (statusFilter) list = list.filter(s => s.status === statusFilter);
    return list.map(s => ({
      ...s,
      product: localProducts.find(p => p.id === s.product_id)
    }));
  },

  // 4. CUSTOMERS & SUPPLIERS
  async getCustomers(): Promise<Customer[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('customers').select('*').order('name');
      if (!error && data) return data;
    }
    return localCustomers;
  },

  async createCustomer(cust: Omit<Customer, 'id'>): Promise<Customer> {
    const id = 'cust-' + Date.now();
    const newCust: Customer = { ...cust, id, current_balance: cust.opening_balance || 0 };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('customers').insert(cust).select().single();
      if (!error && data) return data;
    }
    localCustomers.push(newCust);
    setStorage('customers', localCustomers);
    return newCust;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('customers').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    }
    const idx = localCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      localCustomers[idx] = { ...localCustomers[idx], ...updates };
      setStorage('customers', localCustomers);
      return localCustomers[idx];
    }
    throw new Error('Customer not found');
  },

  async getSuppliers(): Promise<Supplier[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('suppliers').select('*').order('name');
      if (!error && data) return data;
    }
    return localSuppliers;
  },

  async createSupplier(sup: Omit<Supplier, 'id'>): Promise<Supplier> {
    const id = 'sup-' + Date.now();
    const newSup: Supplier = { ...sup, id, current_balance: sup.opening_balance || 0 };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('suppliers').insert(sup).select().single();
      if (!error && data) return data;
    }
    localSuppliers.push(newSup);
    setStorage('suppliers', localSuppliers);
    return newSup;
  },

  // 5. SALES & POS TRANSACTIONS (Atomic Execution)
  async getSales(): Promise<Sale[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('sales').select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*))
      `).order('sale_date', { ascending: false });
      if (!error && data) return data;
    }
    return localSales.map(s => ({
      ...s,
      customer: localCustomers.find(c => c.id === s.customer_id),
      items: s.items?.map(it => ({
        ...it,
        product: localProducts.find(p => p.id === it.product_id)
      }))
    }));
  },

  async processSaleTransaction(params: {
    invoice_number: string;
    customer_id?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      serial_numbers: string[];
    }[];
    subtotal: number;
    discount_amount: number;
    vat_amount: number;
    total_amount: number;
    paid_amount: number;
    payment_method: any;
    account_id?: string;
    notes?: string;
    created_by?: string;
  }): Promise<Sale> {
    const sb = getSupabase();
    if (sb) {
      // Call Atomic Stored Procedure in PostgreSQL
      const { data: saleId, error } = await sb.rpc('process_pos_sale', {
        p_invoice_number: params.invoice_number,
        p_customer_id: params.customer_id || null,
        p_items: params.items,
        p_subtotal: params.subtotal,
        p_discount: params.discount_amount,
        p_vat: params.vat_amount,
        p_total: params.total_amount,
        p_paid: params.paid_amount,
        p_payment_method: params.payment_method,
        p_account_id: params.account_id || null,
        p_notes: params.notes || '',
        p_created_by: params.created_by || null
      });

      if (!error && saleId) {
        const { data: fullSale } = await sb.from('sales').select('*, customer:customers(*), items:sale_items(*, product:products(*))').eq('id', saleId).single();
        if (fullSale) return fullSale;
      }
    }

    // Atomic Local Fallback Implementation
    const saleId = 'sale-' + Date.now();
    const today = new Date().toISOString().split('T')[0];
    const isPaidInFull = params.paid_amount >= params.total_amount;
    const paymentStatus = isPaidInFull ? 'paid' : params.paid_amount > 0 ? 'partial' : 'credit';

    const saleItems = params.items.map((it, idx) => {
      const prod = localProducts.find(p => p.id === it.product_id);
      const warrantyExp = prod?.warranty_months
        ? new Date(Date.now() + prod.warranty_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;

      // Decrement product current stock
      if (prod) {
        prod.current_stock = Math.max(0, prod.current_stock - it.quantity);
      }

      // Record stock movement
      localMovements.push({
        id: 'mov-' + Date.now() + '-' + idx,
        product_id: it.product_id,
        movement_type: 'sale',
        quantity: -it.quantity,
        unit_cost: prod?.purchase_price || 0,
        reference_type: 'sale',
        reference_id: saleId,
        notes: `POS Invoice #${params.invoice_number}`,
        created_at: new Date().toISOString()
      });

      // Update serial numbers
      if (it.serial_numbers && it.serial_numbers.length > 0) {
        it.serial_numbers.forEach(sn => {
          const serial = localSerials.find(s => s.product_id === it.product_id && s.serial_number === sn);
          if (serial) {
            serial.status = 'sold';
            serial.sale_id = saleId;
          }

          // Generate warranty record
          if (warrantyExp) {
            localWarranties.push({
              id: 'war-' + Date.now() + '-' + sn,
              product_id: it.product_id,
              serial_number: sn,
              sale_id: saleId,
              customer_id: params.customer_id,
              start_date: today,
              expiry_date: warrantyExp,
              status: 'active'
            });
          }
        });
      }

      return {
        id: 'si-' + Date.now() + '-' + idx,
        sale_id: saleId,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        purchase_cost: prod?.purchase_price || 0,
        discount: it.discount,
        total_price: it.quantity * it.unit_price - it.discount,
        serial_numbers: it.serial_numbers,
        warranty_expiry_date: warrantyExp,
        product: prod
      };
    });

    // Update customer receivable balance
    const balanceDue = params.total_amount - params.paid_amount;
    if (params.customer_id && balanceDue > 0) {
      const cust = localCustomers.find(c => c.id === params.customer_id);
      if (cust) {
        cust.current_balance += balanceDue;
      }
    }

    // Cash Account deposit
    if (params.paid_amount > 0 && params.account_id) {
      const acc = localAccounts.find(a => a.id === params.account_id);
      if (acc) {
        acc.balance += params.paid_amount;
      }
      localPayments.push({
        id: 'pay-' + Date.now(),
        payment_type: 'customer_payment',
        party_type: 'customer',
        party_id: params.customer_id,
        reference_id: saleId,
        amount: params.paid_amount,
        payment_method: params.payment_method,
        account_id: params.account_id,
        payment_date: today,
        notes: `POS Invoice #${params.invoice_number} payment`,
        created_at: new Date().toISOString()
      });
    }

    const newSale: Sale = {
      id: saleId,
      invoice_number: params.invoice_number,
      customer_id: params.customer_id,
      sale_date: today,
      subtotal: params.subtotal,
      discount_amount: params.discount_amount,
      vat_amount: params.vat_amount,
      total_amount: params.total_amount,
      paid_amount: params.paid_amount,
      payment_method: params.payment_method,
      payment_status: paymentStatus,
      is_returned: false,
      notes: params.notes,
      created_at: new Date().toISOString(),
      items: saleItems,
      customer: localCustomers.find(c => c.id === params.customer_id)
    };

    localSales.unshift(newSale);

    // Save states to local storage
    setStorage('products', localProducts);
    setStorage('sales', localSales);
    setStorage('serials', localSerials);
    setStorage('customers', localCustomers);
    setStorage('accounts', localAccounts);
    setStorage('movements', localMovements);
    setStorage('payments', localPayments);
    setStorage('warranties', localWarranties);

    return newSale;
  },

  // 6. PURCHASES (Atomic Execution)
  async getPurchases(): Promise<Purchase[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('purchases').select(`
        *,
        supplier:suppliers(*),
        items:purchase_items(*, product:products(*))
      `).order('purchase_date', { ascending: false });
      if (!error && data) return data;
    }
    return localPurchases.map(p => ({
      ...p,
      supplier: localSuppliers.find(s => s.id === p.supplier_id),
      items: p.items?.map(it => ({
        ...it,
        product: localProducts.find(pr => pr.id === it.product_id)
      }))
    }));
  },

  async processPurchaseTransaction(params: {
    invoice_number: string;
    supplier_id: string;
    items: {
      product_id: string;
      quantity: number;
      unit_cost: number;
      serial_numbers: string[];
    }[];
    subtotal: number;
    discount: number;
    vat_amount: number;
    total_amount: number;
    paid_amount: number;
    payment_method: any;
    account_id?: string;
    notes?: string;
    created_by?: string;
  }): Promise<Purchase> {
    const sb = getSupabase();
    if (sb) {
      const { data: purId, error } = await sb.rpc('process_purchase_invoice', {
        p_invoice_number: params.invoice_number,
        p_supplier_id: params.supplier_id,
        p_items: params.items,
        p_subtotal: params.subtotal,
        p_discount: params.discount,
        p_vat: params.vat_amount,
        p_total: params.total_amount,
        p_paid: params.paid_amount,
        p_payment_method: params.payment_method,
        p_account_id: params.account_id || null,
        p_notes: params.notes || '',
        p_created_by: params.created_by || null
      });

      if (!error && purId) {
        const { data: fullPur } = await sb.from('purchases').select('*, supplier:suppliers(*), items:purchase_items(*, product:products(*))').eq('id', purId).single();
        if (fullPur) return fullPur;
      }
    }

    const purId = 'pur-' + Date.now();
    const today = new Date().toISOString().split('T')[0];
    const isPaid = params.paid_amount >= params.total_amount;
    const status = isPaid ? 'paid' : params.paid_amount > 0 ? 'partial' : 'unpaid';

    const purItems = params.items.map((it, idx) => {
      const prod = localProducts.find(p => p.id === it.product_id);
      if (prod) {
        // Weighted average cost update
        const oldStock = prod.current_stock;
        const oldCost = prod.purchase_price;
        const newStock = oldStock + it.quantity;
        const newAvgCost = newStock > 0 ? ((oldStock * oldCost) + (it.quantity * it.unit_cost)) / newStock : it.unit_cost;
        prod.purchase_price = Math.round(newAvgCost * 100) / 100;
        prod.current_stock = newStock;
      }

      // Stock movement
      localMovements.push({
        id: 'mov-' + Date.now() + '-' + idx,
        product_id: it.product_id,
        movement_type: 'purchase',
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        reference_type: 'purchase',
        reference_id: purId,
        notes: `Purchase Bill #${params.invoice_number}`,
        created_at: new Date().toISOString()
      });

      // Register serial numbers
      if (it.serial_numbers && it.serial_numbers.length > 0) {
        it.serial_numbers.forEach(sn => {
          localSerials.push({
            id: 'ser-' + Date.now() + '-' + sn,
            product_id: it.product_id,
            serial_number: sn,
            status: 'in_stock',
            purchase_id: purId
          });
        });
      }

      return {
        id: 'pi-' + Date.now() + '-' + idx,
        purchase_id: purId,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        total_cost: it.quantity * it.unit_cost,
        serial_numbers: it.serial_numbers,
        product: prod
      };
    });

    // Supplier balance
    const due = params.total_amount - params.paid_amount;
    if (due > 0) {
      const sup = localSuppliers.find(s => s.id === params.supplier_id);
      if (sup) {
        sup.current_balance += due;
      }
    }

    // Cash Account deduction
    if (params.paid_amount > 0 && params.account_id) {
      const acc = localAccounts.find(a => a.id === params.account_id);
      if (acc) {
        acc.balance -= params.paid_amount;
      }
      localPayments.push({
        id: 'pay-' + Date.now(),
        payment_type: 'supplier_payment',
        party_type: 'supplier',
        party_id: params.supplier_id,
        reference_id: purId,
        amount: params.paid_amount,
        payment_method: params.payment_method,
        account_id: params.account_id,
        payment_date: today,
        notes: `Purchase Bill #${params.invoice_number} payment`,
        created_at: new Date().toISOString()
      });
    }

    const newPurchase: Purchase = {
      id: purId,
      invoice_number: params.invoice_number,
      supplier_id: params.supplier_id,
      purchase_date: today,
      subtotal: params.subtotal,
      discount: params.discount,
      vat_amount: params.vat_amount,
      total_amount: params.total_amount,
      paid_amount: params.paid_amount,
      payment_status: status,
      notes: params.notes,
      created_at: new Date().toISOString(),
      items: purItems,
      supplier: localSuppliers.find(s => s.id === params.supplier_id)
    };

    localPurchases.unshift(newPurchase);

    setStorage('products', localProducts);
    setStorage('purchases', localPurchases);
    setStorage('serials', localSerials);
    setStorage('suppliers', localSuppliers);
    setStorage('accounts', localAccounts);
    setStorage('movements', localMovements);
    setStorage('payments', localPayments);

    return newPurchase;
  },

  // 7. STOCK MOVEMENTS & ADJUSTMENTS
  async getStockMovements(): Promise<StockMovement[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('stock_movements').select('*, product:products(*)').order('created_at', { ascending: false }).limit(200);
      if (!error && data) return data;
    }
    return localMovements.map(m => ({
      ...m,
      product: localProducts.find(p => p.id === m.product_id)
    }));
  },

  async adjustStock(productId: string, diffQuantity: number, reason: string): Promise<void> {
    const sb = getSupabase();
    const prod = localProducts.find(p => p.id === productId);
    if (!prod) return;

    if (sb) {
      await sb.from('products').update({ current_stock: prod.current_stock + diffQuantity }).eq('id', productId);
      await sb.from('stock_movements').insert({
        product_id: productId,
        movement_type: 'adjustment',
        quantity: diffQuantity,
        unit_cost: prod.purchase_price,
        notes: reason
      });
    }

    prod.current_stock += diffQuantity;
    localMovements.unshift({
      id: 'mov-' + Date.now(),
      product_id: productId,
      movement_type: 'adjustment',
      quantity: diffQuantity,
      unit_cost: prod.purchase_price,
      notes: reason,
      created_at: new Date().toISOString()
    });

    setStorage('products', localProducts);
    setStorage('movements', localMovements);
  },

  // 8. CASH & FINANCE
  async getAccounts(): Promise<CashAccount[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('cash_accounts').select('*').order('name');
      if (!error && data) return data;
    }
    return localAccounts;
  },

  async getExpenses(): Promise<Expense[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('expenses').select('*, account:cash_accounts(*)').order('expense_date', { ascending: false });
      if (!error && data) return data;
    }
    return localExpenses.map(e => ({
      ...e,
      account: localAccounts.find(a => a.id === e.account_id)
    }));
  },

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const id = 'exp-' + Date.now();
    const newExp: Expense = { ...expense, id };
    const sb = getSupabase();

    if (sb) {
      const { data, error } = await sb.from('expenses').insert(expense).select().single();
      if (!error && data) {
        if (expense.account_id) {
          const acc = localAccounts.find(a => a.id === expense.account_id);
          if (acc) {
            await sb.from('cash_accounts').update({ balance: acc.balance - expense.amount }).eq('id', expense.account_id);
          }
        }
        return data;
      }
    }

    if (expense.account_id) {
      const acc = localAccounts.find(a => a.id === expense.account_id);
      if (acc) {
        acc.balance -= expense.amount;
        setStorage('accounts', localAccounts);
      }
    }

    localExpenses.unshift(newExp);
    setStorage('expenses', localExpenses);
    return newExp;
  },

  // 9. WARRANTIES & SERVICE REQUESTS
  async getWarranties(): Promise<Warranty[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('warranties').select('*, product:products(*), customer:customers(*)').order('expiry_date', { ascending: true });
      if (!error && data) return data;
    }
    return localWarranties.map(w => ({
      ...w,
      product: localProducts.find(p => p.id === w.product_id),
      customer: localCustomers.find(c => c.id === w.customer_id)
    }));
  },

  async getServiceRequests(): Promise<ServiceRequest[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('service_requests').select('*, customer:customers(*), product:products(*)').order('received_date', { ascending: false });
      if (!error && data) return data;
    }
    return localServices.map(s => ({
      ...s,
      customer: localCustomers.find(c => c.id === s.customer_id),
      product: localProducts.find(p => p.id === s.product_id)
    }));
  },

  async createServiceRequest(req: Omit<ServiceRequest, 'id'>): Promise<ServiceRequest> {
    const id = 'srv-' + Date.now();
    const newReq: ServiceRequest = { ...req, id };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('service_requests').insert(req).select().single();
      if (!error && data) return data;
    }
    localServices.unshift(newReq);
    setStorage('services', localServices);
    return newReq;
  },

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('service_requests').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    }
    const idx = localServices.findIndex(s => s.id === id);
    if (idx !== -1) {
      localServices[idx] = { ...localServices[idx], ...updates };
      setStorage('services', localServices);
      return localServices[idx];
    }
    throw new Error('Service request not found');
  },

  // 10. DASHBOARD DYNAMIC METRICS
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.rpc('get_dashboard_metrics');
      if (!error && data) {
        return data as DashboardMetrics;
      }
    }

    // Dynamic aggregation from local store
    const today = new Date().toISOString().split('T')[0];
    const todaySales = localSales
      .filter(s => s.sale_date === today)
      .reduce((sum, s) => sum + s.total_amount, 0);

    const todayPurchases = localPurchases
      .filter(p => p.purchase_date === today)
      .reduce((sum, p) => sum + p.total_amount, 0);

    const totalStockValue = localProducts
      .filter(p => p.is_active && p.current_stock > 0)
      .reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);

    const customerReceivables = localCustomers
      .filter(c => c.current_balance > 0)
      .reduce((sum, c) => sum + c.current_balance, 0);

    const supplierPayables = localSuppliers
      .filter(s => s.current_balance > 0)
      .reduce((sum, s) => sum + s.current_balance, 0);

    const todayGrossProfit = localSales
      .filter(s => s.sale_date === today)
      .reduce((profit, s) => {
        const itemProfit = s.items?.reduce((pSum, item) => {
          const cost = item.purchase_cost || 0;
          return pSum + (item.total_price - (cost * item.quantity));
        }, 0) || 0;
        return profit + itemProfit;
      }, 0);

    const lowStockCount = localProducts
      .filter(p => p.is_active && p.current_stock <= p.min_stock_level).length;

    const activeServiceRequests = localServices
      .filter(s => s.status === 'received' || s.status === 'in_repair').length;

    return {
      today_sales: todaySales,
      today_purchases: todayPurchases,
      total_stock_value: totalStockValue,
      customer_receivables: customerReceivables,
      supplier_payables: supplierPayables,
      today_gross_profit: todayGrossProfit,
      low_stock_count: lowStockCount,
      active_service_requests: activeServiceRequests
    };
  }
};
