import React, { useState, useEffect } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Database,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { getNepaliDate } from '@/lib/nepaliDate';
import { UserRole } from '@/types';
import { Button } from '../ui/Button';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenPOS: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenPOS }) => {
  const { currentUser, switchUser, availableUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isLiveSupabase, setIsConfigModalOpen, settings } = useSettings();

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nepaliDate = getNepaliDate(currentDate);

  const roleColors: Record<UserRole, string> = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
    manager: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300',
    cashier: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    storekeeper: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    accountant: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Store Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs md:max-w-md">
            {settings.store_name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              PAN: {settings.pan_vat_number}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
              <Calendar className="w-3 h-3" />
              {currentDate.toISOString().split('T')[0]} ({nepaliDate.formattedEn})
            </span>
          </div>
        </div>
      </div>

      {/* Right controls: Database status, Quick POS, Role Switcher, Theme */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase status badge */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isLiveSupabase
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse'
          }`}
          title="Click to configure or test Supabase Database settings"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {isLiveSupabase ? 'Cloud Supabase' : 'Demo / Standalone'}
          </span>
          <span className="w-2 h-2 rounded-full bg-current" />
        </button>

        {/* Quick POS trigger */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenPOS}
          className="hidden sm:flex shadow-xs"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>New Sale</span>
          <kbd className="hidden md:inline text-[10px] bg-sky-700 px-1.5 py-0.5 rounded text-white font-mono">F2</kbd>
        </Button>

        {/* User Role Switcher Dropdown */}
        <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <select
            value={currentUser.role}
            onChange={(e) => switchUser(e.target.value as UserRole)}
            className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              roleColors[currentUser.role]
            }`}
            title="Switch User Role for Testing Permissions"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.role}>
                {u.role.toUpperCase()} ({u.full_name.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </header>
  );
};
