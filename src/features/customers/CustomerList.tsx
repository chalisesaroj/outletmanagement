import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CreditCard,
  History,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { Customer, Sale, CashAccount } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel } from '@/lib/utils';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(100000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ledger / Details Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Receive Credit Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const [custs, sls, accs] = await Promise.all([
        dbService.getCustomers(),
        dbService.getSales(),
        dbService.getAccounts(),
      ]);
      setCustomers(custs);
      setSales(sls);
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    try {
      await dbService.createCustomer({
        name,
        phone,
        email: email || undefined,
        pan_number: pan || undefined,
        address: address || undefined,
        opening_balance: 0,
        current_balance: 0,
        credit_limit: creditLimit,
        is_active: true,
      });
      await loadCustomers();
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setPan('');
      setAddress('');
    } catch (err: any) {
      alert(`Registration failed: ${err.message || 'Error creating customer'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayment = (cust: Customer) => {
    setSelectedCustomer(cust);
    setPaymentAmount(cust.current_balance);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
      // Deduct customer balance
      await dbService.updateCustomer(selectedCustomer.id, {
        current_balance: Math.max(0, selectedCustomer.current_balance - paymentAmount),
      });

      // Update cash account balance
      if (selectedAccountId) {
        const acc = accounts.find((a) => a.id === selectedAccountId);
        if (acc) {
          acc.balance += paymentAmount;
        }
      }

      await loadCustomers();
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCustomers = () => {
    const data = customers.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      Email: c.email || '',
      PAN: c.pan_number || '',
      Address: c.address || '',
      OutstandingBalance: c.current_balance,
      CreditLimit: c.credit_limit,
    }));
    exportToExcel(data, `Customers_Directory_${new Date().toISOString().split('T')[0]}`);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.pan_number && c.pan_number.includes(search))
  );

  const totalReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Customer Directory & Credit Ledgers
          </h2>
          <p className="text-xs text-slate-500">
            Total Customer Receivables Outstanding:{' '}
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              {formatNPR(totalReceivables)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCustomers} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number or PAN number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-3">Contact & Address</th>
              <th className="py-3 px-3">PAN Number</th>
              <th className="py-3 px-3 text-right">Credit Balance Due</th>
              <th className="py-3 px-3 text-right">Credit Limit</th>
              <th className="py-3 px-4 text-right">Ledger & Payments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-[10px] text-slate-400">ID: {c.id}</p>
                </td>
                <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                  </p>
                  {c.address && (
                    <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {c.address}
                    </p>
                  )}
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                  {c.pan_number ? (
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {c.pan_number}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unregistered</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                  {c.current_balance > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      {formatNPR(c.current_balance)}
                    </span>
                  ) : (
                    <span className="text-emerald-600">रू 0.00 (Clear)</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-500">
                  {formatNPR(c.credit_limit)}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {c.current_balance > 0 && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleOpenPayment(c)}
                      className="text-xs py-1"
                    >
                      Receive Payment
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(c)}
                    className="text-xs py-1"
                  >
                    <History className="w-3.5 h-3.5 mr-1" /> Ledger
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        description="Register customer profile for billing, VAT tax invoice & warranty cards"
        size="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <Input
            label="Full Name / Company Name *"
            placeholder="e.g. Shyam Lal Shrestha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Phone Number *"
            placeholder="e.g. 9851000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="PAN Number (Optional, 9 Digits)"
            placeholder="e.g. 601928374"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. shyam@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Address"
            placeholder="e.g. Baneshwor, Kathmandu"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label="Credit Limit (NPR)"
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Ledger Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Ledger: ${selectedCustomer.name}`}
          description={`Phone: ${selectedCustomer.phone} | Outstanding Due: ${formatNPR(selectedCustomer.current_balance)}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 uppercase">Purchase Invoice History:</h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">Invoice #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Total Bill</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sales
                    .filter((s) => s.customer_id === selectedCustomer.id)
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {s.invoice_number}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{s.sale_date}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formatNPR(s.total_amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600">
                          {formatNPR(s.paid_amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={s.payment_status === 'paid' ? 'success' : 'warning'}>
                            {s.payment_status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Receive Credit Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Receive Credit Payment from ${selectedCustomer?.name}`}
        description={`Current Balance Owed: ${formatNPR(selectedCustomer?.current_balance || 0)}`}
        size="md"
      >
        <form onSubmit={handleConfirmReceivePayment} className="space-y-3">
          <Input
            label="Payment Amount Received (NPR) *"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deposit Account *
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatNPR(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" isLoading={isSubmitting}>
              Confirm Payment Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
