import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  UserPlus,
  CheckCircle,
  Printer,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { BarcodeScannerModal } from '@/components/common/BarcodeScannerModal';
import { SerialPickerModal } from '@/components/common/SerialPickerModal';
import { formatNPR, calculateVat } from '@/lib/currency';
import { dbService } from '@/lib/supabase';
import { Product, Customer, ProductSerial, Sale, CashAccount, PaymentMethod } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  serial_numbers: string[];
}

interface POSViewProps {
  onCompleteSale: (sale: Sale) => void;
}

export const POSView: React.FC<POSViewProps> = ({ onCompleteSale }) => {
  const { settings } = useSettings();
  const { currentUser } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [availableSerials, setAvailableSerials] = useState<ProductSerial[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeSerialPickerItem, setActiveSerialPickerItem] = useState<{
    index: number;
    product: Product;
    count: number;
    current: string[];
  } | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Customer Quick Add Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPan, setNewCustPan] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPOSData();
  }, []);

  const loadPOSData = async () => {
    try {
      const [prodList, custList, accList, serialList] = await Promise.all([
        dbService.getProducts(),
        dbService.getCustomers(),
        dbService.getAccounts(),
        dbService.getProductSerials(undefined, 'in_stock'),
      ]);
      setProducts(prodList.filter((p) => p.is_active));
      setCustomers(custList.filter((c) => c.is_active));
      setAccounts(accList);
      setAvailableSerials(serialList);
      if (accList.length > 0) setSelectedAccountId(accList[0].id);
    } catch (e) {
      console.error('Failed to load POS data', e);
    }
  };

  // Keyboard shortcut listener for F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          openCheckout();
        } else {
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      alert(`Product ${product.name} is out of stock!`);
      return;
    }

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((it) => it.product.id === product.id);
      if (existingIdx !== -1) {
        const item = prevCart[existingIdx];
        if (item.quantity + 1 > product.current_stock) {
          alert(`Cannot exceed available stock of ${product.current_stock} units.`);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            unit_price: product.selling_price,
            discount: 0,
            serial_numbers: [],
          },
        ];
      }
    });
  };

  const updateQuantity = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(idx);
      return;
    }
    const item = cart[idx];
    if (newQty > item.product.current_stock) {
      alert(`Cannot exceed available stock of ${item.product.current_stock} units.`);
      return;
    }
    const updated = [...cart];
    updated[idx] = {
      ...item,
      quantity: newQty,
      serial_numbers: item.serial_numbers.slice(0, newQty), // trim excess serials if quantity reduced
    };
    setCart(updated);
  };

  const removeFromCart = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const updateItemDiscount = (idx: number, disc: number) => {
    const updated = [...cart];
    updated[idx].discount = Math.max(0, disc);
    setCart(updated);
  };

  // Calculations
  const grossSubtotal = cart.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  const itemsDiscount = cart.reduce((sum, it) => sum + it.discount, 0);
  const totalDiscount = itemsDiscount + cartDiscount;
  const taxableAmount = Math.max(0, grossSubtotal - totalDiscount);
  const vatAmount = (taxableAmount * settings.default_vat_percent) / 100;
  const grandTotal = Math.round(taxableAmount + vatAmount);

  const openCheckout = () => {
    // Check if any serialized item is missing serial number selection
    for (let i = 0; i < cart.length; i++) {
      const it = cart[i];
      if (it.product.is_serialized && it.serial_numbers.length !== it.quantity) {
        setActiveSerialPickerItem({
          index: i,
          product: it.product,
          count: it.quantity,
          current: it.serial_numbers,
        });
        return;
      }
    }
    setPaidAmount(grandTotal);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmSerials = (serials: string[]) => {
    if (activeSerialPickerItem !== null) {
      const updated = [...cart];
      updated[activeSerialPickerItem.index].serial_numbers = serials;
      setCart(updated);
      setActiveSerialPickerItem(null);
    }
  };

  const handleCompleteTransaction = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const sale = await dbService.processSaleTransaction({
        invoice_number: invoiceNumber,
        customer_id: selectedCustomerId || undefined,
        items: cart.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount,
          serial_numbers: it.serial_numbers,
        })),
        subtotal: grossSubtotal,
        discount_amount: totalDiscount,
        vat_amount: vatAmount,
        total_amount: grandTotal,
        paid_amount: paidAmount,
        payment_method: paymentMethod,
        account_id: selectedAccountId || undefined,
        notes: saleNotes,
        created_by: currentUser.id,
      });

      // Reset cart
      setCart([]);
      setCartDiscount(0);
      setSelectedCustomerId('');
      setSaleNotes('');
      setIsPaymentModalOpen(false);

      // Refresh stock data
      await loadPOSData();

      // Trigger Print modal via parent
      onCompleteSale(sale);
    } catch (err: any) {
      alert(`Transaction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    try {
      const newCust = await dbService.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        pan_number: newCustPan || undefined,
        address: newCustAddress || undefined,
        opening_balance: 0,
        current_balance: 0,
        credit_limit: 100000,
        is_active: true,
      });
      setCustomers([...customers, newCust]);
      setSelectedCustomerId(newCust.id);
      setIsNewCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustPan('');
      setNewCustAddress('');
    } catch (err) {
      alert('Failed to register customer');
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Left Column: Product Catalog & Search */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Search Bar & Barcode Scanner Trigger */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by appliance name, brand, model or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsScannerOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <Barcode className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Barcode Scanner</span>
          </Button>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const inStock = p.current_stock > 0;
            return (
              <div
                key={p.id}
                onClick={() => inStock && addToCart(p)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all select-none ${
                  inStock
                    ? 'border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md cursor-pointer bg-white dark:bg-slate-900'
                    : 'opacity-50 border-slate-200 dark:border-slate-800 cursor-not-allowed bg-slate-50 dark:bg-slate-800/20'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      {p.sku}
                    </span>
                    <Badge variant={p.current_stock > 2 ? 'neutral' : inStock ? 'warning' : 'danger'}>
                      {p.current_stock} in stock
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-2">
                    {p.name}
                  </h4>
                  {p.model_number && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Model: {p.model_number}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black font-mono text-sky-600 dark:text-sky-400">
                      {formatNPR(p.selling_price)}
                    </span>
                    {p.mrp > p.selling_price && (
                      <span className="block text-[10px] line-through text-slate-400">
                        {formatNPR(p.mrp)}
                      </span>
                    )}
                  </div>
                  {p.is_serialized && (
                    <span className="text-[9px] bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 px-1 py-0.5 rounded font-semibold">
                      Serialized
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Shopping Cart & Bill Terminal */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Customer Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Customer / Buyer Info
            </span>
            <button
              onClick={() => setIsNewCustModalOpen(true)}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> + New
            </button>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Walk-in Retail Customer (Cash Sale)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} {c.pan_number ? `[PAN: ${c.pan_number}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Barcode className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">Cart is currently empty</p>
              <p className="text-xs mt-1">
                Scan barcode or click appliances on the left to add items
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const needsSerials = item.product.is_serialized && item.serial_numbers.length !== item.quantity;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.product.sku}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity & Price Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatNPR(item.quantity * item.unit_price - item.discount)}
                      </span>
                    </div>
                  </div>

                  {/* Serial Numbers Badge / Picker Button */}
                  {item.product.is_serialized && (
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-medium">Serials:</span>
                        {item.serial_numbers.length > 0 ? (
                          <span className="text-[10px] font-mono text-emerald-700 font-bold">
                            {item.serial_numbers.length} of {item.quantity}
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold">Required</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={needsSerials ? 'danger' : 'outline'}
                        onClick={() =>
                          setActiveSerialPickerItem({
                            index: idx,
                            product: item.product,
                            count: item.quantity,
                            current: item.serial_numbers,
                          })
                        }
                        className="text-[10px] py-0.5 px-2 h-auto"
                      >
                        {needsSerials ? 'Assign S/N' : 'Change S/N'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary Calculations */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal:</span>
            <span className="font-mono">{formatNPR(grossSubtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Discount / छुट:</span>
            <div className="flex items-center gap-1 w-24">
              <input
                type="number"
                min="0"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-right font-mono text-xs p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Taxable Amount:</span>
            <span className="font-mono">{formatNPR(taxableAmount)}</span>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>VAT ({settings.default_vat_percent}%):</span>
            <span className="font-mono">{formatNPR(vatAmount)}</span>
          </div>

          <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Grand Total:</span>
            <span className="font-mono text-sky-600 dark:text-sky-400">{formatNPR(grandTotal)}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={cart.length === 0}
            onClick={openCheckout}
            className="w-full mt-2 font-bold shadow-md"
          >
            <span>Proceed to Payment (F2)</span>
          </Button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onProductFound={(p) => addToCart(p)}
      />

      {/* Serial Picker Modal */}
      {activeSerialPickerItem && (
        <SerialPickerModal
          isOpen={true}
          onClose={() => setActiveSerialPickerItem(null)}
          productName={activeSerialPickerItem.product.name}
          requiredCount={activeSerialPickerItem.count}
          availableSerials={availableSerials.filter(
            (s) => s.product_id === activeSerialPickerItem.product.id
          )}
          selectedSerials={activeSerialPickerItem.current}
          onConfirm={handleConfirmSerials}
        />
      )}

      {/* Checkout / Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Payment & POS Checkout"
        description={`Total Payable Amount: ${formatNPR(grandTotal)}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={isSubmitting}
              onClick={handleCompleteTransaction}
              className="gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Complete & Print Invoice
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                { id: 'fonepay', label: 'Fonepay QR', icon: <QrCode className="w-4 h-4" /> },
                { id: 'card', label: 'Card POS', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'bank_transfer', label: 'Bank Transfer', icon: <Building className="w-4 h-4" /> },
                { id: 'credit', label: 'Credit (Udhāro)', icon: <Percent className="w-4 h-4" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m.id as PaymentMethod);
                    if (m.id === 'credit') {
                      setPaidAmount(0);
                    } else {
                      setPaidAmount(grandTotal);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                    paymentMethod === m.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Selection & Amount Paid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deposit Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatNPR(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Paid Amount (NPR)"
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Balance Due calculation */}
          {grandTotal - paidAmount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs flex justify-between items-center text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Credit Balance will be charged to customer's ledger:</span>
              </div>
              <span className="font-mono font-bold text-sm">
                {formatNPR(grandTotal - paidAmount)}
              </span>
            </div>
          )}

          <Input
            label="Internal Notes / Remarks"
            placeholder="e.g. Fonepay ref #9839420 or customer requested home delivery"
            value={saleNotes}
            onChange={(e) => setSaleNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isNewCustModalOpen}
        onClose={() => setIsNewCustModalOpen(false)}
        title="Quick Add Customer"
        description="Register customer for invoice and warranty tracking"
        size="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <Input
            label="Customer Full Name *"
            placeholder="e.g. Ramesh Karki"
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
            required
          />
          <Input
            label="Phone Number *"
            placeholder="e.g. 9841000000"
            value={newCustPhone}
            onChange={(e) => setNewCustPhone(e.target.value)}
            required
          />
          <Input
            label="PAN Number (Optional, for VAT Invoice)"
            placeholder="9 digit PAN number"
            value={newCustPan}
            onChange={(e) => setNewCustPan(e.target.value)}
          />
          <Input
            label="Address"
            placeholder="e.g. Putalisadak, Kathmandu"
            value={newCustAddress}
            onChange={(e) => setNewCustAddress(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsNewCustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
