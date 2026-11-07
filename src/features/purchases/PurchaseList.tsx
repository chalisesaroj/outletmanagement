import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { Purchase, Supplier, Product, CashAccount } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

interface NewPurchaseItem {
  product_id: string;
  quantity: number;
  unit_cost: number;
  serial_numbers_text: string; // Comma separated serials
}

export const PurchaseList: React.FC = () => {
  const { canManagePurchases } = useAuth();
  const { settings } = useSettings();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [items, setItems] = useState<NewPurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Purchase Modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    loadPurchasesData();
  }, []);

  const loadPurchasesData = async () => {
    setLoading(true);
    try {
      const [purs, sups, prods, accs] = await Promise.all([
        dbService.getPurchases(),
        dbService.getSuppliers(),
        dbService.getProducts(),
        dbService.getAccounts(),
      ]);
      setPurchases(purs);
      setSuppliers(sups);
      setProducts(prods);
      setAccounts(accs);
      if (sups.length > 0) setSupplierId(sups[0].id);
      if (accs.length > 0) setAccountId(accs[0].id);
    } catch (e) {
      console.error('Failed to load purchases', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = () => {
    setBillNumber(`BILL-${Math.floor(10000 + Math.random() * 90000)}`);
    setItems([
      {
        product_id: products[0]?.id || '',
        quantity: 1,
        unit_cost: products[0]?.purchase_price || 0,
        serial_numbers_text: '',
      },
    ]);
    setPaidAmount(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_id: products[0]?.id || '',
        quantity: 1,
        unit_cost: products[0]?.purchase_price || 0,
        serial_numbers_text: '',
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, updates: Partial<NewPurchaseItem>) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], ...updates };

    // Auto update cost if product changed
    if (updates.product_id) {
      const prod = products.find((p) => p.id === updates.product_id);
      if (prod) {
        updated[idx].unit_cost = prod.purchase_price;
      }
    }
    setItems(updated);
  };

  // Totals
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_cost, 0);
  const vatAmount = (subtotal * settings.default_vat_percent) / 100;
  const totalAmount = Math.round(subtotal + vatAmount);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !billNumber || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const formattedItems = items.map((it) => {
        const serials = it.serial_numbers_text
          ? it.serial_numbers_text
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        return {
          product_id: it.product_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          serial_numbers: serials,
        };
      });

      await dbService.processPurchaseTransaction({
        invoice_number: billNumber,
        supplier_id: supplierId,
        items: formattedItems,
        subtotal,
        discount: 0,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        payment_method: 'bank_transfer',
        account_id: accountId || undefined,
        notes,
      });

      await loadPurchasesData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Purchase failed: ${err.message || 'Error processing purchase bill'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPurchases = () => {
    const data = purchases.map((p) => ({
      BillNumber: p.invoice_number,
      Supplier: p.supplier?.company_name || p.supplier?.name || '',
      Date: p.purchase_date,
      Subtotal: p.subtotal,
      VAT: p.vat_amount,
      Total: p.total_amount,
      Paid: p.paid_amount,
      Status: p.payment_status.toUpperCase(),
    }));
    exportToExcel(data, `Purchases_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const filtered = purchases.filter(
    (p) =>
      p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Purchases & Goods Receiving (GRN)
          </h2>
          <p className="text-xs text-slate-500">
            Record incoming supplier consignments, enter serial numbers & update weighted average costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPurchases} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
          {canManagePurchases && (
            <Button variant="primary" size="sm" onClick={handleOpenNewModal} className="gap-1.5">
              <Plus className="w-4 h-4" /> Receive Shipment (GRN)
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by supplier name or purchase bill #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Purchase Bill #</th>
              <th className="py-3 px-3">Supplier Name & PAN</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3 text-right">Bill Total (NPR)</th>
              <th className="py-3 px-3 text-right">Paid Amount</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                  {p.invoice_number}
                </td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {p.supplier?.company_name || p.supplier?.name}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    PAN: {p.supplier?.pan_number || 'N/A'}
                  </p>
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                  {p.purchase_date}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatNPR(p.total_amount)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-600">
                  {formatNPR(p.paid_amount)}
                </td>
                <td className="py-3 px-3 text-center">
                  <Badge
                    variant={
                      p.payment_status === 'paid'
                        ? 'success'
                        : p.payment_status === 'partial'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {p.payment_status.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPurchase(p)}
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Items
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Purchase GRN Receiving Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Receive Consignment (GRN / Purchase Bill)"
        description="Incoming stock items will be added to inventory and weighted-average costs will recalculate"
        size="xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} (Due: {formatNPR(s.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier Invoice / Bill #"
              placeholder="e.g. HIM-2081-998"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              required
            />
          </div>

          {/* Items Table in Modal */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Consignment Items
              </span>
              <Button type="button" size="sm" variant="outline" onClick={addItemRow}>
                <Plus className="w-3 h-3 mr-1" /> Add Appliance Row
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((it, idx) => {
                const prod = products.find((p) => p.id === it.product_id);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Appliance
                        </label>
                        <select
                          value={it.product_id}
                          onChange={(e) => updateItemRow(idx, { product_id: e.target.value })}
                          className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 p-1.5"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItemRow(idx, { quantity: parseInt(e.target.value, 10) || 1 })
                          }
                          className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 p-1.5"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Unit Cost (NPR)
                        </label>
                        <input
                          type="number"
                          value={it.unit_cost}
                          onChange={(e) =>
                            updateItemRow(idx, { unit_cost: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 p-1.5"
                        />
                      </div>
                    </div>

                    {/* Serial Numbers Input for Serialized Items */}
                    {prod?.is_serialized && (
                      <div>
                        <label className="block text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-0.5">
                          Unit Serial Numbers (Comma-separated, exactly {it.quantity} expected)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SAMTV55-CU-101, SAMTV55-CU-102"
                          value={it.serial_numbers_text}
                          onChange={(e) =>
                            updateItemRow(idx, { serial_numbers_text: e.target.value })
                          }
                          className="w-full text-xs rounded border border-sky-300 dark:border-sky-800 p-1.5 font-mono"
                        />
                      </div>
                    )}

                    {items.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-rose-600 text-[11px] hover:underline"
                        >
                          Remove Line
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Account (If paying supplier now)
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Balance: {formatNPR(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={`Paid to Supplier Now (Max: ${formatNPR(totalAmount)})`}
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              helperText={`Remaining ${formatNPR(totalAmount - paidAmount)} will be added to Supplier Payable`}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">
            <span>Bill Total (Including 13% VAT):</span>
            <span className="font-mono text-base text-sky-600 dark:text-sky-400">
              {formatNPR(totalAmount)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm GRN & Receive Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPurchase(null)}
          title={`Purchase Bill #${selectedPurchase.invoice_number}`}
          description={`Supplier: ${selectedPurchase.supplier?.company_name || selectedPurchase.supplier?.name}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-500">Purchase Date:</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedPurchase.purchase_date}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-500">Payment Status:</p>
                <Badge variant={selectedPurchase.payment_status === 'paid' ? 'success' : 'warning'}>
                  {selectedPurchase.payment_status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                  <th className="pb-2">Appliance</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Cost</th>
                  <th className="pb-2 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedPurchase.items?.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {it.product?.name || 'Appliance'}
                      </p>
                      {it.serial_numbers?.length > 0 && (
                        <p className="text-[10px] font-mono text-sky-600">
                          Serials: {it.serial_numbers.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-2 text-center font-bold">{it.quantity}</td>
                    <td className="py-2 text-right font-mono">{formatNPR(it.unit_cost)}</td>
                    <td className="py-2 text-right font-mono font-bold">
                      {formatNPR(it.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
              <span>Grand Total:</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {formatNPR(selectedPurchase.total_amount)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
