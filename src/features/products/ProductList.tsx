import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  Barcode,
  Layers,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { Product, ProductCategory, ProductBrand, ProductUnit } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export const ProductList: React.FC = () => {
  const { canManageInventory } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(2);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [isSerialized, setIsSerialized] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prods, cats, brs, uns] = await Promise.all([
        dbService.getProducts(),
        dbService.getCategories(),
        dbService.getBrands(),
        dbService.getUnits(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setBrands(brs);
      setUnits(uns);
      if (cats.length > 0) setCategoryId(cats[0].id);
      if (brs.length > 0) setBrandId(brs[0].id);
      if (uns.length > 0) setUnitId(uns[0].id);
    } catch (e) {
      console.error('Failed to load catalog', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`APPL-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode(`${Math.floor(8800000000000 + Math.random() * 99999999999)}`);
    setModelNumber('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setMrp(0);
    setMinStockLevel(2);
    setInitialStock(0);
    setWarrantyMonths(12);
    setIsSerialized(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setCategoryId(p.category_id);
    setBrandId(p.brand_id);
    setUnitId(p.unit_id);
    setModelNumber(p.model_number || '');
    setPurchasePrice(p.purchase_price);
    setSellingPrice(p.selling_price);
    setMrp(p.mrp);
    setMinStockLevel(p.min_stock_level);
    setInitialStock(p.current_stock);
    setWarrantyMonths(p.warranty_months);
    setIsSerialized(p.is_serialized);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !categoryId || !brandId) return;

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await dbService.updateProduct(editingProduct.id, {
          name,
          sku,
          barcode,
          category_id: categoryId,
          brand_id: brandId,
          unit_id: unitId,
          model_number: modelNumber,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          mrp,
          min_stock_level: minStockLevel,
          warranty_months: warrantyMonths,
          is_serialized: isSerialized,
        });
      } else {
        await dbService.createProduct({
          name,
          sku,
          barcode,
          category_id: categoryId,
          brand_id: brandId,
          unit_id: unitId,
          model_number: modelNumber,
          specifications: {},
          is_serialized: isSerialized,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          mrp: mrp || sellingPrice,
          vat_percent: 13,
          min_stock_level: minStockLevel,
          current_stock: initialStock,
          warranty_months: warrantyMonths,
          is_active: true,
        });
      }
      await loadCatalog();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Error saving product'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportProducts = () => {
    const exportData = products.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Barcode: p.barcode || '',
      Category: p.category?.name || '',
      Brand: p.brand?.name || '',
      Model: p.model_number || '',
      PurchaseCost: p.purchase_price,
      SellingPrice: p.selling_price,
      MRP: p.mrp,
      CurrentStock: p.current_stock,
      MinStock: p.min_stock_level,
      Serialized: p.is_serialized ? 'YES' : 'NO',
      WarrantyMonths: p.warranty_months,
    }));
    exportToExcel(exportData, `Products_Catalog_${new Date().toISOString().split('T')[0]}`);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.model_number?.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchesCat = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchesBrand = brandFilter === 'all' || p.brand_id === brandFilter;
    return matchesSearch && matchesCat && matchesBrand;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Appliance Catalog & Products
          </h2>
          <p className="text-xs text-slate-500">
            Manage electronic appliance registrations, models, prices, and specifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportProducts} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
          {canManageInventory && (
            <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Appliance
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search appliance by name, model, barcode or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Appliance Details</th>
                <th className="py-3 px-3">Brand & Category</th>
                <th className="py-3 px-3">Model / Barcode</th>
                <th className="py-3 px-3 text-right">Cost Price (W.Avg)</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Warranty</th>
                {canManageInventory && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                      {p.sku}
                    </span>
                    {p.is_serialized && (
                      <span className="ml-1.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                        • Serialized
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    <p className="font-semibold">{p.brand?.name || 'Brand'}</p>
                    <p className="text-[11px] text-slate-500">{p.category?.name || 'Category'}</p>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <p className="text-slate-900 dark:text-slate-200">{p.model_number || 'N/A'}</p>
                    <p className="text-slate-400">{p.barcode || 'No barcode'}</p>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                    {formatNPR(p.purchase_price)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                    {formatNPR(p.selling_price)}
                    {p.mrp > p.selling_price && (
                      <span className="block text-[10px] text-slate-400 line-through">
                        {formatNPR(p.mrp)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={p.current_stock > p.min_stock_level ? 'success' : p.current_stock > 0 ? 'warning' : 'danger'}>
                      {p.current_stock} Units
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-600 dark:text-slate-300">
                    {p.warranty_months} Mos
                  </td>
                  {canManageInventory && (
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(p)}
                        title="Edit Appliance"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Appliance' : 'Register New Appliance'}
        description="Enter technical specifications, pricing, model numbers and warranty details"
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Product / Appliance Name *"
            placeholder="e.g. Samsung 55 Inch Crystal 4K UHD Smart TV"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU Code *"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
            <Input
              label="Barcode (EAN-13 / UPC)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand *
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                required
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Manufacturer Model #"
              placeholder="e.g. UA55CU7700"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
            />
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Cost Price (NPR)"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
              helperText="Weighted average cost"
            />
            <Input
              label="Selling Price (NPR) *"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="MRP (NPR)"
              type="number"
              value={mrp}
              onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Stock & Serial options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Min Alert Stock Level"
              type="number"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(parseInt(e.target.value, 10) || 1)}
            />
            {!editingProduct && (
              <Input
                label="Opening Stock Units"
                type="number"
                value={initialStock}
                onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
              />
            )}
            <Input
              label="Warranty (Months)"
              type="number"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          {/* Checkbox for serialized appliance tracking */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="isSerializedCheck"
              checked={isSerialized}
              onChange={(e) => setIsSerialized(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
            <label htmlFor="isSerializedCheck" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Enable Serial Number Tracking (Recommended for TVs, Refrigerators, ACs, Washing Machines)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingProduct ? 'Update Appliance' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
