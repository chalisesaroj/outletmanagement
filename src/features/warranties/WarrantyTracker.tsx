import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Wrench,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Tv,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { dbService } from '@/lib/supabase';
import { Warranty, ServiceRequest, Product, Customer } from '@/types';
import { formatNPR } from '@/lib/currency';

export const WarrantyTracker: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [activeTab, setActiveTab] = useState<'service' | 'warranties'>('service');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Service Ticket Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [customerCharge, setCustomerCharge] = useState<number>(0);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update Status Modal
  const [selectedTicket, setSelectedTicket] = useState<ServiceRequest | null>(null);
  const [newStatus, setNewStatus] = useState<any>('in_repair');
  const [updateNotes, setUpdateNotes] = useState('');

  useEffect(() => {
    loadWarrantyData();
  }, []);

  const loadWarrantyData = async () => {
    setLoading(true);
    try {
      const [wars, srvs, prods, custs] = await Promise.all([
        dbService.getWarranties(),
        dbService.getServiceRequests(),
        dbService.getProducts(),
        dbService.getCustomers(),
      ]);
      setWarranties(wars);
      setServices(srvs);
      setProducts(prods);
      setCustomers(custs);
      if (custs.length > 0) setCustomerId(custs[0].id);
      if (prods.length > 0) setProductId(prods[0].id);
    } catch (e) {
      console.error('Failed to load warranty data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTicket = () => {
    setTicketNumber(`SRV-2081-${Math.floor(1000 + Math.random() * 9000)}`);
    setSerialNumber('');
    setIssueDescription('');
    setCustomerCharge(0);
    setTechnicianNotes('');
    setIsModalOpen(true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !productId || !issueDescription) return;

    setIsSubmitting(true);
    try {
      await dbService.createServiceRequest({
        ticket_number: ticketNumber,
        customer_id: customerId,
        product_id: productId,
        serial_number: serialNumber || undefined,
        issue_description: issueDescription,
        received_date: new Date().toISOString().split('T')[0],
        status: 'received',
        repair_cost: 0,
        customer_charge: customerCharge,
        technician_notes: technicianNotes,
      });

      await loadWarrantyData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to create ticket: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusModal = (ticket: ServiceRequest) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setUpdateNotes(ticket.technician_notes || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      await dbService.updateServiceRequest(selectedTicket.id, {
        status: newStatus,
        technician_notes: updateNotes,
        completed_date:
          newStatus === 'delivered' || newStatus === 'repaired'
            ? new Date().toISOString().split('T')[0]
            : undefined,
      });
      await loadWarrantyData();
      setSelectedTicket(null);
    } catch (err) {
      alert('Failed to update service ticket status');
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.serial_number && s.serial_number.toLowerCase().includes(search.toLowerCase())) ||
      s.product?.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWarranties = warranties.filter(
    (w) =>
      w.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      w.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      w.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Warranty Tracking & Repair Service Desk
          </h2>
          <p className="text-xs text-slate-500">
            Serial-number warranty validations, technician repair logs & customer service tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenNewTicket} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Service Ticket
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('service')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'service'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" /> Active Service Tickets ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('warranties')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'warranties'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Warranty Registry by Serial ({warranties.length})
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, serial number, customer name, or appliance model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Service Tickets Table */}
      {activeTab === 'service' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-3">Customer & Phone</th>
                <th className="py-3 px-3">Appliance & Serial #</th>
                <th className="py-3 px-3">Reported Issue</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {s.ticket_number}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      Recv: {s.received_date}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {s.customer?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{s.customer?.phone}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {s.product?.name}
                    </p>
                    <p className="font-mono text-[10px] text-sky-600">
                      S/N: {s.serial_number || 'N/A'}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                    {s.issue_description}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant={
                        s.status === 'delivered'
                          ? 'success'
                          : s.status === 'in_repair'
                          ? 'warning'
                          : s.status === 'received'
                          ? 'primary'
                          : 'neutral'
                      }
                    >
                      {s.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenStatusModal(s)}
                      className="text-xs"
                    >
                      Update Status
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warranties Table */}
      {activeTab === 'warranties' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-3">Appliance Model</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Warranty Period</th>
                <th className="py-3 px-3 text-center">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWarranties.map((w) => {
                const isExpired = new Date(w.expiry_date) < new Date();
                return (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {w.serial_number}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {w.product?.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {w.customer?.name || 'Retail Buyer'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {w.start_date} to {w.expiry_date}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={isExpired ? 'danger' : 'success'}>
                        {isExpired ? 'EXPIRED' : 'ACTIVE COVERAGE'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Service Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Open Repair & Service Ticket"
        description="Register appliance for diagnostics, repair or warranty replacement"
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-3">
          <Input label="Ticket #" value={ticketNumber} readOnly />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Appliance Model *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Appliance Serial Number"
            placeholder="e.g. SAMREF253-RT28-001"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />

          <Input
            label="Customer Reported Issue Description *"
            placeholder="e.g. Display lines or cooling issue"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            required
          />

          <Input
            label="Customer Service Charge (0 if under warranty)"
            type="number"
            value={customerCharge}
            onChange={(e) => setCustomerCharge(parseFloat(e.target.value) || 0)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Ticket Status Modal */}
      {selectedTicket && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          title={`Update Ticket: ${selectedTicket.ticket_number}`}
          description={`Appliance: ${selectedTicket.product?.name}`}
          size="md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ticket Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                <option value="received">Received (Awaiting Diagnostics)</option>
                <option value="in_repair">In Repair (Parts Ordered / In Lab)</option>
                <option value="repaired">Repaired & Tested</option>
                <option value="replaced">Replaced Under Warranty</option>
                <option value="delivered">Delivered / Handed Over to Customer</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <Input
              label="Technician Notes / Parts Replaced"
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedTicket(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Status
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
