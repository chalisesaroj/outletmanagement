import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Package,
  Layers,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { dbService } from '@/lib/supabase';
import { Sale, Purchase, Product, Customer, Supplier, Expense } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel, exportToCSV } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [activeReport, setActiveReport] = useState<'sales' | 'vat' | 'profit' | 'stock' | 'credit'>('sales');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [sls, purs, prods, custs, sups, exps] = await Promise.all([
        dbService.getSales(),
        dbService.getPurchases(),
        dbService.getProducts(),
        dbService.getCustomers(),
        dbService.getSuppliers(),
        dbService.getExpenses(),
      ]);
      setSales(sls);
      setPurchases(purs);
      setProducts(prods);
      setCustomers(custs);
      setSuppliers(sups);
      setExpenses(exps);
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalSalesTaxable = sales.reduce((sum, s) => sum + (s.subtotal - s.discount_amount), 0);
  const totalVatCollected = sales.reduce((sum, s) => sum + s.vat_amount, 0);

  const totalPurchasesTotal = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const totalVatPaidOnPurchases = purchases.reduce((sum, p) => sum + p.vat_amount, 0);
  const netVatPayable = totalVatCollected - totalVatPaidOnPurchases;

  const totalStockValuation = products.reduce((sum, p) => sum + p.current_stock * p.purchase_price, 0);
  const totalCustomerReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Gross profit calculation across all sales items
  let totalGrossProfit = 0;
  sales.forEach((s) => {
    s.items?.forEach((it) => {
      const cost = it.purchase_cost || 0;
      totalGrossProfit += it.total_price - cost * it.quantity;
    });
  });

  const netOperatingProfit = totalGrossProfit - totalExpenses;

  // Export handlers
  const handleExportSales = () => {
    const data = sales.map((s) => ({
      InvoiceNumber: s.invoice_number,
      Date: s.sale_date,
      Customer: s.customer?.name || 'Walk-in Cash',
      Subtotal: s.subtotal,
      Discount: s.discount_amount,
      Taxable: s.subtotal - s.discount_amount,
      VAT13: s.vat_amount,
      TotalAmount: s.total_amount,
      PaidAmount: s.paid_amount,
      PaymentMethod: s.payment_method.toUpperCase(),
      Status: s.payment_status.toUpperCase(),
    }));
    exportToExcel(data, `Sales_Tax_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportVat = () => {
    const data = [
      { Metric: 'Total Taxable Sales (NPR)', Value: totalSalesTaxable },
      { Metric: '13% Output VAT Collected on Sales (NPR)', Value: totalVatCollected },
      { Metric: 'Total Purchases Amount (NPR)', Value: totalPurchasesTotal },
      { Metric: '13% Input VAT Paid on Purchases (NPR)', Value: totalVatPaidOnPurchases },
      { Metric: 'Net VAT Payable to IRD Inland Revenue Department (NPR)', Value: netVatPayable },
    ];
    exportToExcel(data, `Nepal_VAT_Return_Summary_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Business Reports & IRD VAT Compliance
          </h2>
          <p className="text-xs text-slate-500">
            Detailed sales registers, 13% Nepalese VAT reports, weighted average profit & loss analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSales} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(sales as any, 'Sales_Raw_Export')}
            className="gap-1.5"
          >
            <Download className="w-4 h-4 text-sky-600" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2">
        {[
          { id: 'sales', label: 'Sales & Invoice Register' },
          { id: 'vat', label: 'Nepalese VAT 13% Report' },
          { id: 'profit', label: 'Profit & Loss Statement' },
          { id: 'stock', label: 'Stock Valuation Report' },
          { id: 'credit', label: 'Credit & Receivables Dues' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all ${
              activeReport === tab.id
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Sales Register */}
      {activeReport === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Sales Billed</span>
              <h3 className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                {formatNPR(totalSalesRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400">{sales.length} Invoices Issued</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Taxable Sales</span>
              <h3 className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                {formatNPR(totalSalesTaxable)}
              </h3>
              <p className="text-[11px] text-slate-400">Net of discounts</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">13% VAT Collected</span>
              <h3 className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
                {formatNPR(totalVatCollected)}
              </h3>
              <p className="text-[11px] text-slate-400">Government Tax Output</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-3 text-right">13% VAT</th>
                  <th className="py-3 px-3 text-right">Total (NPR)</th>
                  <th className="py-3 px-3 text-center">Payment Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {s.invoice_number}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{s.sale_date}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {s.customer?.name || 'Walk-in Cash Customer'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatNPR(s.subtotal - s.discount_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatNPR(s.vat_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatNPR(s.total_amount)}
                    </td>
                    <td className="py-3 px-3 text-center uppercase font-bold text-[10px]">
                      <Badge variant="neutral">{s.payment_method}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: VAT Report (IRD Nepal Compliance) */}
      {activeReport === 'vat' && (
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs space-y-2">
            <h3 className="font-bold text-sky-900 dark:text-sky-200 text-sm">
              Nepal Government Inland Revenue Department (IRD) 13% VAT Summary
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              In accordance with Nepalese Value Added Tax (VAT) Act, 2052. All domestic appliance retail sales are subject to standard 13% VAT.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="py-3 flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Total Taxable Appliance Sales:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatNPR(totalSalesTaxable)}
                </span>
              </div>

              <div className="py-3 flex justify-between text-sky-700 dark:text-sky-400">
                <span className="font-semibold">
                  (A) Output VAT Collected on Sales (13%):
                </span>
                <span className="font-mono font-bold">
                  {formatNPR(totalVatCollected)}
                </span>
              </div>

              <div className="py-3 flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">
                  Total Purchases & Consignments Value:
                </span>
                <span className="font-mono font-bold">
                  {formatNPR(totalPurchasesTotal)}
                </span>
              </div>

              <div className="py-3 flex justify-between text-emerald-700 dark:text-emerald-400">
                <span className="font-semibold">
                  (B) Input VAT Paid on Purchases (13% Claimable):
                </span>
                <span className="font-mono font-bold">
                  {formatNPR(totalVatPaidOnPurchases)}
                </span>
              </div>

              <div className="py-4 flex justify-between text-base font-black border-t-2 border-slate-800 dark:border-slate-200">
                <span>Net VAT Payable to IRD (A - B):</span>
                <span className="font-mono text-sky-600 dark:text-sky-400">
                  {formatNPR(netVatPayable)}
                </span>
              </div>
            </div>

            <Button variant="primary" onClick={handleExportVat} className="gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Download IRD VAT Return Sheet (.xlsx)
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Profit & Loss */}
      {activeReport === 'profit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Profit</span>
              <h3 className="text-xl font-black font-mono text-emerald-600 mt-1">
                {formatNPR(totalGrossProfit)}
              </h3>
              <p className="text-[11px] text-slate-400">Revenue minus cost of goods sold</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Operating Overheads</span>
              <h3 className="text-xl font-black font-mono text-rose-600 mt-1">
                {formatNPR(totalExpenses)}
              </h3>
              <p className="text-[11px] text-slate-400">Rent, electricity, salaries, freight</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Net Operating Profit</span>
              <h3 className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
                {formatNPR(netOperatingProfit)}
              </h3>
              <p className="text-[11px] text-slate-400">Store net earnings</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Stock Valuation */}
      {activeReport === 'stock' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Inventory Valuation</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                {formatNPR(totalStockValuation)}
              </h3>
              <p className="text-xs text-slate-400">
                Based on weighted-average acquisition costing formula
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Appliance</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">In Stock</th>
                  <th className="py-3 px-3 text-right">Unit Weighted Cost</th>
                  <th className="py-3 px-3 text-right">Total Valuation (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{p.sku}</td>
                    <td className="py-3 px-3 text-center font-bold font-mono">{p.current_stock}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatNPR(p.purchase_price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                      {formatNPR(p.current_stock * p.purchase_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Credit & Receivables */}
      {activeReport === 'credit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase">Customer Receivables</p>
              <h3 className="text-xl font-black font-mono text-amber-600 mt-1">
                {formatNPR(totalCustomerReceivables)}
              </h3>
              <p className="text-[11px] text-slate-400">Credit extended to customers</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase">Supplier Payables</p>
              <h3 className="text-xl font-black font-mono text-rose-600 mt-1">
                {formatNPR(totalSupplierPayables)}
              </h3>
              <p className="text-[11px] text-slate-400">Consignments owed to distributors</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
