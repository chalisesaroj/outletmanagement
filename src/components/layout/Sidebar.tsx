import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  Users,
  Building2,
  ShieldCheck,
  Wallet,
  BarChart3,
  Settings,
  Tv,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'warranties'
  | 'finance'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { canViewFinancials, canManageInventory, canManagePurchases, canConfigureSettings } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; allowed: boolean; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, allowed: true },
    { id: 'pos', label: 'POS Billing', icon: <ShoppingCart className="w-5 h-5" />, allowed: true, badge: 'F2' },
    { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" />, allowed: true },
    { id: 'inventory', label: 'Inventory & Serials', icon: <Layers className="w-5 h-5" />, allowed: canManageInventory },
    { id: 'purchases', label: 'Purchases & Receiving', icon: <Truck className="w-5 h-5" />, allowed: canManagePurchases },
    { id: 'customers', label: 'Customers & Credit', icon: <Users className="w-5 h-5" />, allowed: true },
    { id: 'suppliers', label: 'Suppliers & Ledger', icon: <Building2 className="w-5 h-5" />, allowed: canManagePurchases },
    { id: 'warranties', label: 'Warranty & Service', icon: <ShieldCheck className="w-5 h-5" />, allowed: true },
    { id: 'finance', label: 'Finance & Cashbook', icon: <Wallet className="w-5 h-5" />, allowed: canViewFinancials },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-5 h-5" />, allowed: canViewFinancials },
    { id: 'settings', label: 'Settings & Cloud DB', icon: <Settings className="w-5 h-5" />, allowed: canConfigureSettings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Electro<span className="text-sky-600 dark:text-sky-400">Store</span>
            </h2>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Retail ERP & POS
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems
            .filter(item => item.allowed)
            .map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all',
                    isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Store footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
            Kathmandu Retail Hub
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Nepal Edition • 13% VAT
          </p>
        </div>
      </aside>
    </>
  );
};
