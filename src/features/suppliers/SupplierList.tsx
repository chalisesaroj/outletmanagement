import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  History,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { Supplier, Purchase, CashAccount } from '@/types';
import { formatNPR } from '@/lib/currency';
import { exportToExcel } from '@/lib/utils';

export const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Supplier Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier Ledger Modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Pay Supplier Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const [sups, purs, accs] = await Promise.all([
        dbService.getSuppliers(),
        dbService.getPurchases(),
        dbService.getAccounts(),
      ]);
      setSuppliers(sups);
      setPurchases(purs);
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    } catch (e) {
      console.error('Failed to load suppliers', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone) return;

    setIsSubmitting(true);
    try {
      await dbService.createSupplier({
        name: name || companyName,
        company_name: companyName,
        phone,
        email: email || undefined,
        pan_number: pan || undefined,
        address: address || undefined,
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
      });
      await loadSuppliers();
      setIsAddModalOpen(false);
      setName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setPan('');
      setAddress('');
    } catch (err: any) {
      alert(`Supplier creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayModal = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setPayAmount(sup.current_balance);
    setIsPayModalOpen(true);
  };

  const handleConfirmSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const sup = suppliers.find((s) => s.id === selectedSupplier.id);
      if (sup) {
        sup.current_balance = Math.max(0, sup.current_balance - payAmount);
      }

      if (selectedAccountId) {
        const acc = accounts.find((a) => a.id === selectedAccountId);
        if (acc) {
          acc.balance -= payAmount;
        }
      }

      setIsPayModalOpen(false);
      await loadSuppliers();
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSuppliers = () => {
    const data = suppliers.map((s) => ({
      Company: s.company_name,
      ContactPerson: s.name,
      Phone: s.phone,
      PAN: s.pan_number || '',
      Address: s.address || '',
      CurrentPayableDue: s.current_balance,
    }));
    exportToExcel(data, `Suppliers_Ledger_${new Date().toISOString().split('T')[0]}`);
  };

  const filtered = suppliers.filter(
    (s) =>
      s.company_name.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.pan_number && s.pan_number.includes(search))
  );

  const totalPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Suppliers & Vendor Accounts
          </h2>
          <p className="text-xs text-slate-500">
            Total Trade Payables Due to Suppliers:{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatNPR(totalPayables)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSuppliers} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier by company name, contact person or PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Supplier / Vendor</th>
              <th className="py-3 px-3">Contact Details</th>
              <th className="py-3 px-3">PAN Number</th>
              <th className="py-3 px-3 text-right">Outstanding Payable Due</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{s.company_name}</p>
                  <p className="text-[11px] text-slate-500">Rep: {s.name}</p>
                </td>
                <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {s.phone}
                  </p>
                  {s.address && (
                    <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {s.address}
                    </p>
                  )}
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                  {s.pan_number ? (
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {s.pan_number}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                  {s.current_balance > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      {formatNPR(s.current_balance)}
                    </span>
                  ) : (
                    <span className="text-emerald-600">रू 0.00 (Settled)</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {s.current_balance > 0 && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenPayModal(s)}
                      className="text-xs py-1"
                    >
                      Make Payment
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSupplier(s)}
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

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Supplier / Distributor"
        description="Add authorized distributor or manufacturer for purchase invoices"
        size="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <Input
            label="Company Name *"
            placeholder="e.g. Him Electronics Pvt. Ltd."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          <Input
            label="Contact Person Name"
            placeholder="e.g. Manoj Adhikari"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Phone Number *"
            placeholder="e.g. 01-4261820"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="PAN Number (9 Digits) *"
            placeholder="e.g. 300182749"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="info@distributor.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Address / Depot Location"
            placeholder="e.g. Tinkune, Kathmandu"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Ledger Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSupplier(null)}
          title={`Supplier Ledger: ${selectedSupplier.company_name}`}
          description={`Outstanding Due: ${formatNPR(selectedSupplier.current_balance)} | PAN: ${selectedSupplier.pan_number}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 uppercase">Purchase Consignments:</h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">Bill #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Bill Total</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchases
                    .filter((p) => p.supplier_id === selectedSupplier.id)
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {p.invoice_number}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{p.purchase_date}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formatNPR(p.total_amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600">
                          {formatNPR(p.paid_amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={p.payment_status === 'paid' ? 'success' : 'warning'}>
                            {p.payment_status.toUpperCase()}
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

      {/* Pay Supplier Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Disburse Payment to ${selectedSupplier?.company_name}`}
        description={`Current Trade Payable: ${formatNPR(selectedSupplier?.current_balance || 0)}`}
        size="md"
      >
        <form onSubmit={handleConfirmSupplierPayment} className="space-y-3">
          <Input
            label="Payment Amount (NPR) *"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Disburse from Account *
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
            <Button type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Disbursement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
