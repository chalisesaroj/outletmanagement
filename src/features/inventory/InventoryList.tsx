import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  AlertTriangle,
  History,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { Product, ProductSerial, StockMovement } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export const InventoryList: React.FC = () => {
  const { canManageInventory } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [serials, setSerials] = useState<ProductSerial[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'serials' | 'movements'>('stock');
  const [search, setSearch] = useState('');
  const [serialStatusFilter, setSerialStatusFilter] = useState('all');

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const [prods, sers, movs] = await Promise.all([
        dbService.getProducts(),
        dbService.getProductSerials(),
        dbService.getStockMovements(),
      ]);
      setProducts(prods);
      setSerials(sers);
      setMovements(movs);
    } catch (e) {
      console.error('Failed to load inventory', e);
    }
  };

  const handleOpenAdjust = (p: Product) => {
    setSelectedProductForAdjust(p);
    setAdjustQty(0);
    setAdjustReason('Physical stock audit verification');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust || adjustQty === 0) return;

    setIsSubmitting(true);
    try {
      await dbService.adjustStock(selectedProductForAdjust.id, adjustQty, adjustReason);
      await loadInventory();
      setIsAdjustModalOpen(false);
    } catch (err: any) {
      alert(`Adjustment failed: ${err.message || 'Error adjusting stock'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportStock = () => {
    const data = products.map((p) => ({
      Appliance: p.name,
      SKU: p.sku,
      Model: p.model_number || '',
      CurrentStock: p.current_stock,
      WeightedCost: p.purchase_price,
      TotalValuation: p.current_stock * p.purchase_price,
      SellingPrice: p.selling_price,
      Serialized: p.is_serialized ? 'YES' : 'NO',
    }));
    exportToExcel(data, `Inventory_Valuation_${new Date().toISOString().split('T')[0]}`);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.model_number?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSerials = serials.filter((s) => {
    const matchesSearch =
      s.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      s.product?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = serialStatusFilter === 'all' || s.status === serialStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + p.current_stock * p.purchase_price,
    0
  );

  return (
    <div className="space-y-4">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Inventory & Serial Management
          </h2>
          <p className="text-xs text-slate-500">
            Total Inventory Valuation (Weighted Avg):{' '}
            <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">
              {formatNPR(totalInventoryValuation)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStock} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Stock Sheet
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('stock')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'stock'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Physical Stock Balances ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('serials')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'serials'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Hash className="w-4 h-4" /> Serial Numbers Registry ({serials.length})
        </button>
        <button
          onClick={() => setActiveSubTab('movements')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'movements'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Stock Movement Log ({movements.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'serials'
                ? 'Search by serial number (e.g. SAMTV55-CU7700-001)...'
                : 'Search appliance name, SKU or model...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
          />
        </div>

        {activeSubTab === 'serials' && (
          <select
            value={serialStatusFilter}
            onChange={(e) => setSerialStatusFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
            <option value="defective">Defective</option>
          </select>
        )}
      </div>

      {/* Tab 1: Stock Balances Table */}
      {activeSubTab === 'stock' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Appliance</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3 text-center">Available Stock</th>
                <th className="py-3 px-3 text-right">Weighted Avg Cost</th>
                <th className="py-3 px-3 text-right">Stock Valuation</th>
                <th className="py-3 px-3 text-center">Status</th>
                {canManageInventory && <th className="py-3 px-4 text-right">Stock Audit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const valuation = p.current_stock * p.purchase_price;
                const isLow = p.current_stock <= p.min_stock_level;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{p.sku}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {p.model_number || 'Standard'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-sm font-mono text-slate-900 dark:text-slate-100">
                      {p.current_stock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatNPR(p.purchase_price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                      {formatNPR(valuation)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={isLow ? 'danger' : 'success'}>
                        {isLow ? 'LOW STOCK' : 'IN STOCK'}
                      </Badge>
                    </td>
                    {canManageInventory && (
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAdjust(p)}
                          className="text-xs"
                        >
                          <SlidersHorizontal className="w-3 h-3 mr-1" /> Adjust Stock
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Serials Registry Table */}
      {activeSubTab === 'serials' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-3">Appliance Model</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Purchase Batch Ref</th>
                <th className="py-3 px-4">Sale Invoice Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSerials.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {s.serial_number}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    {s.product?.name || 'Appliance'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant={
                        s.status === 'in_stock'
                          ? 'success'
                          : s.status === 'sold'
                          ? 'neutral'
                          : 'danger'
                      }
                    >
                      {s.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {s.purchase_id || 'Opening Stock Batch'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {s.sale_id ? `Sold on ${s.sale_id}` : 'Unsold (In Showroom)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Stock Movement Audit Log */}
      {activeSubTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Appliance</th>
                <th className="py-3 px-3">Movement Type</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-4">Reason / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                    {m.product?.name || 'Appliance'}
                  </td>
                  <td className="py-3 px-3 uppercase font-bold text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        m.quantity > 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {m.movement_type}
                    </span>
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {m.notes || m.reference_type || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Adjustment Dialog */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment & Verification"
        description={`Adjust physical stock for ${selectedProductForAdjust?.name}`}
        size="md"
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <span>Current Recorded Stock:</span>
            <span className="font-mono font-bold text-sm">
              {selectedProductForAdjust?.current_stock} Units
            </span>
          </div>

          <Input
            label="Stock Change Quantity (+ to add, - to deduct) *"
            type="number"
            placeholder="e.g. -1 for damaged unit or +2 for unrecorded shipment"
            value={adjustQty}
            onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
            required
            helperText={`Resulting stock will be: ${(selectedProductForAdjust?.current_stock || 0) + adjustQty} Units`}
          />

          <Input
            label="Audit Reason / Explanation *"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
