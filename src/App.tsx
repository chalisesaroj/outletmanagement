import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DatabaseConfigModal } from './components/common/DatabaseConfigModal';
import { A4TaxInvoice } from './components/print/A4TaxInvoice';
import { ThermalReceipt } from './components/print/ThermalReceipt';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';

// Features
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { POSView } from './features/pos/POSView';
import { ProductList } from './features/products/ProductList';
import { InventoryList } from './features/inventory/InventoryList';
import { PurchaseList } from './features/purchases/PurchaseList';
import { CustomerList } from './features/customers/CustomerList';
import { SupplierList } from './features/suppliers/SupplierList';
import { WarrantyTracker } from './features/warranties/WarrantyTracker';
import { FinanceView } from './features/finance/FinanceView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';

import { useSettings } from './context/SettingsContext';
import { Sale } from './types';

export const AppContent: React.FC = () => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Invoice Print Modal State
  const [printableSale, setPrintableSale] = useState<Sale | null>(null);
  const [activePrintFormat, setActivePrintFormat] = useState<'a4' | '80mm' | '58mm'>(
    settings.default_print_format === 'thermal_80'
      ? '80mm'
      : settings.default_print_format === 'thermal_58'
      ? '58mm'
      : 'a4'
  );

  const handleSaleCompleted = (sale: Sale) => {
    setPrintableSale(sale);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenPOS={() => setActiveTab('pos')}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onNavigateTab={(tab) => setActiveTab(tab)}
              onPrintSale={(s) => setPrintableSale(s)}
            />
          )}

          {activeTab === 'pos' && (
            <POSView onCompleteSale={handleSaleCompleted} />
          )}

          {activeTab === 'products' && <ProductList />}

          {activeTab === 'inventory' && <InventoryList />}

          {activeTab === 'purchases' && <PurchaseList />}

          {activeTab === 'customers' && <CustomerList />}

          {activeTab === 'suppliers' && <SupplierList />}

          {activeTab === 'warranties' && <WarrantyTracker />}

          {activeTab === 'finance' && <FinanceView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Supabase Database Connection Modal */}
      <DatabaseConfigModal />

      {/* Invoice Print & Receipt Dialog */}
      {printableSale && (
        <Modal
          isOpen={true}
          onClose={() => setPrintableSale(null)}
          title={`Invoice Generated: ${printableSale.invoice_number}`}
          description="Choose printing layout: Full A4 Tax Invoice or POS Thermal Slip"
          size={activePrintFormat === 'a4' ? 'xl' : 'md'}
        >
          <div className="space-y-4">
            {/* Format Selector */}
            <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg print:hidden">
              <button
                onClick={() => setActivePrintFormat('a4')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activePrintFormat === 'a4'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Full A4 Tax Invoice
              </button>
              <button
                onClick={() => setActivePrintFormat('80mm')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activePrintFormat === '80mm'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                80mm POS Thermal Slip
              </button>
              <button
                onClick={() => setActivePrintFormat('58mm')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activePrintFormat === '58mm'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                58mm Mini Receipt
              </button>
            </div>

            {/* Template Render */}
            {activePrintFormat === 'a4' ? (
              <A4TaxInvoice
                sale={printableSale}
                settings={settings}
                onClose={() => setPrintableSale(null)}
              />
            ) : (
              <ThermalReceipt
                sale={printableSale}
                settings={settings}
                format={activePrintFormat}
                onClose={() => setPrintableSale(null)}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
