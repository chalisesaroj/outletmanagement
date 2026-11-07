import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Wrench,
  CreditCard,
  ShoppingCart,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatNPR } from '@/lib/currency';
import { dbService } from '@/lib/supabase';
import { DashboardMetrics, Sale, Product } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardOverviewProps {
  onNavigateTab: (tab: any) => void;
  onPrintSale: (sale: Sale) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onPrintSale,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const m = await dbService.getDashboardMetrics();
      setMetrics(m);

      const sales = await dbService.getSales();
      setRecentSales(sales.slice(0, 5));

      const products = await dbService.getProducts();
      setLowStockProducts(products.filter((p) => p.current_stock <= p.min_stock_level));
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  // Sample weekly trend data for Recharts
  const salesChartData = [
    { day: 'Sun', sales: 42000, profit: 9200 },
    { day: 'Mon', sales: 78000, profit: 16500 },
    { day: 'Tue', sales: 65000, profit: 14000 },
    { day: 'Wed', sales: 94000, profit: 21000 },
    { day: 'Thu', sales: 112000, profit: 24500 },
    { day: 'Fri', sales: 145000, profit: 32000 },
    { day: 'Sat (Today)', sales: metrics?.today_sales || 96276, profit: metrics?.today_gross_profit || 18876 },
  ];

  const categoryDistribution = [
    { category: 'Smart TVs', stockVal: 410000 },
    { category: 'Refrigerators', stockVal: 220000 },
    { category: 'Washers', stockVal: 248000 },
    { category: 'Air Cond.', stockVal: 252000 },
    { category: 'Kitchen Appl.', stockVal: 151200 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Operations & Financial Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time retail metrics, inventory valuation & store performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab('pos')}
            className="shadow-sm"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" /> Launch POS (F2)
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatNPR(metrics?.today_sales || 0)}
          subtitle="Revenue billed today"
          icon={<TrendingUp className="w-5 h-5" />}
          color="sky"
          trend={{ value: '+14.2% vs yesterday', isPositive: true }}
        />
        <StatCard
          title="Today's Gross Profit"
          value={formatNPR(metrics?.today_gross_profit || 0)}
          subtitle="Net margin on units sold"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
          trend={{ value: '19.6% margin', isPositive: true }}
        />
        <StatCard
          title="Total Stock Value"
          value={formatNPR(metrics?.total_stock_value || 0)}
          subtitle="Weighted average cost valuation"
          icon={<Package className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Customer Receivables"
          value={formatNPR(metrics?.customer_receivables || 0)}
          subtitle="Outstanding credit due"
          icon={<CreditCard className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Supplier Payables</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatNPR(metrics?.supplier_payables || 0)}
            </h4>
            <p className="text-[11px] text-slate-400">Total trade dues owed</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('suppliers')}
            className="text-xs"
          >
            Ledger <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</p>
            <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              {metrics?.low_stock_count || 0} Models
            </h4>
            <p className="text-[11px] text-slate-400">At or below reorder threshold</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('inventory')}
            className="text-xs"
          >
            Restock <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Service Tickets</p>
            <h4 className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
              {metrics?.active_service_requests || 0} Open
            </h4>
            <p className="text-[11px] text-slate-400">Repairs & warranty claims</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('warranties')}
            className="text-xs"
          >
            Track <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Profit Trend */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Weekly Sales & Profit Trend (NPR)
              </h3>
              <p className="text-xs text-slate-500">Gross Sales vs Gross Margin</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `रू${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatNPR(val), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                  name="Sales"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Valuation by Category */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Inventory Valuation by Category
              </h3>
              <p className="text-xs text-slate-500">Capital tied in showroom & warehouse stock</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tickFormatter={(v) => `रू${v / 1000}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  formatter={(val: any) => [formatNPR(val), 'Valuation']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="stockVal" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices & Low Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Recent Sales & Invoices
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('reports')}
              className="text-xs"
            >
              View All Invoices
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {s.invoice_number}
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {s.customer ? s.customer.name : 'Walk-in Retail'}
                    </td>
                    <td className="py-2.5 uppercase font-medium text-slate-500">
                      {s.payment_method}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-right text-slate-900 dark:text-slate-100">
                      {formatNPR(s.total_amount)}
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge
                        variant={
                          s.payment_status === 'paid'
                            ? 'success'
                            : s.payment_status === 'partial'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {s.payment_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onPrintSale(s)}
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4 text-sky-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Warning
            </h3>
            <Badge variant="danger">{lowStockProducts.length}</Badge>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                All appliance models are above minimum stock thresholds.
              </p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Model: {p.model_number || p.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {p.current_stock} left
                    </span>
                    <p className="text-[10px] text-slate-400">Min: {p.min_stock_level}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
