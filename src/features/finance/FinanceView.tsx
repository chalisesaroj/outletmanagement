import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Building,
  QrCode,
  Banknote,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { CashAccount, Expense, ExpenseCategory } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export const FinanceView: React.FC = () => {
  const { canViewFinancials } = useAuth();

  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [amount, setAmount] = useState<number>(0);
  const [payee, setPayee] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [accs, exps] = await Promise.all([
        dbService.getAccounts(),
        dbService.getExpenses(),
      ]);
      setAccounts(accs);
      setExpenses(exps);
      if (accs.length > 0) setAccountId(accs[0].id);
    } catch (e) {
      console.error('Failed to load finance data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !payee) return;

    setIsSubmitting(true);
    try {
      await dbService.createExpense({
        category,
        account_id: accountId || undefined,
        amount,
        expense_date: new Date().toISOString().split('T')[0],
        payee,
        description,
      });

      await loadFinanceData();
      setIsExpenseModalOpen(false);
      setAmount(0);
      setPayee('');
      setDescription('');
    } catch (err: any) {
      alert(`Expense failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExpenses = () => {
    const data = expenses.map((e) => ({
      Date: e.expense_date,
      Category: e.category.toUpperCase(),
      Payee: e.payee,
      Description: e.description || '',
      Amount: e.amount,
      Account: e.account?.name || '',
    }));
    exportToExcel(data, `Expenses_Log_${new Date().toISOString().split('T')[0]}`);
  };

  const totalLiquidCash = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Finance, Cashbook & Operating Expenses
          </h2>
          <p className="text-xs text-slate-500">
            Track bank balances, counter cash drawer, Fonepay merchant QR & store overheads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExpenses} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Expenses
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Store Expense
          </Button>
        </div>
      </div>

      {/* Cash & Bank Accounts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {acc.name}
              </span>
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                {acc.account_type === 'cash' ? (
                  <Banknote className="w-4 h-4" />
                ) : acc.account_type === 'digital_wallet' ? (
                  <QrCode className="w-4 h-4" />
                ) : (
                  <Building className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {formatNPR(acc.balance)}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {acc.account_number || 'Cash in counter'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
              Total Liquid Cash & Bank Funds
            </p>
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-1">
              {formatNPR(totalLiquidCash)}
            </h3>
          </div>
          <Wallet className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
              Total Expenses Logged
            </p>
            <h3 className="text-2xl font-black text-rose-900 dark:text-rose-100 font-mono mt-1">
              {formatNPR(totalExpenses)}
            </h3>
          </div>
          <ArrowDownRight className="w-8 h-8 text-rose-600" />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Recent Expense Transactions
          </h3>
          <Badge variant="neutral">{expenses.length} Records</Badge>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Payee / Recipient</th>
              <th className="py-3 px-3">Description</th>
              <th className="py-3 px-3">Paid From</th>
              <th className="py-3 px-4 text-right">Amount (NPR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                  {e.expense_date}
                </td>
                <td className="py-3 px-3 font-semibold uppercase text-slate-800 dark:text-slate-200">
                  <Badge variant="neutral">{e.category}</Badge>
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                  {e.payee}
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {e.description || '-'}
                </td>
                <td className="py-3 px-3 text-slate-500">
                  {e.account?.name || 'Counter Drawer'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                  -{formatNPR(e.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Operating Expense"
        description="Overhead payments will deduct automatically from the selected account"
        size="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 uppercase"
            >
              <option value="rent">Showroom Rent</option>
              <option value="electricity">Electricity & Utilities (NEA)</option>
              <option value="salary">Staff Salary & Allowances</option>
              <option value="logistics">Freight & Delivery Logistics</option>
              <option value="marketing">Advertising & Signboards</option>
              <option value="maintenance">Maintenance & Tools</option>
              <option value="packaging">Packaging Materials</option>
              <option value="office_supplies">Office Supplies</option>
              <option value="other">Other Operating Expenses</option>
            </select>
          </div>

          <Input
            label="Amount (NPR) *"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label="Payee / Recipient *"
            placeholder="e.g. Nepal Electricity Authority (NEA) or Landlord"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deduct from Account *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Balance: {formatNPR(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Description / Bill Details"
            placeholder="e.g. Month of Kartik showroom rental"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
