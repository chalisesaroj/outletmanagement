import React, { useState } from 'react';
import {
  Settings,
  Database,
  Printer,
  Shield,
  Save,
  CheckCircle,
  Copy,
  ExternalLink,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, isLiveSupabase, setIsConfigModalOpen } = useSettings();
  const { currentUser } = useAuth();

  const [storeName, setStoreName] = useState(settings.store_name);
  const [storePhone, setStorePhone] = useState(settings.store_phone);
  const [storeEmail, setStoreEmail] = useState(settings.store_email);
  const [storeAddress, setStoreAddress] = useState(settings.store_address);
  const [panNumber, setPanNumber] = useState(settings.pan_vat_number);
  const [defaultVat, setDefaultVat] = useState(settings.default_vat_percent);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [headerNote, setHeaderNote] = useState(settings.invoice_header_note);
  const [footerNote, setFooterNote] = useState(settings.invoice_footer_note);
  const [printFormat, setPrintFormat] = useState(settings.default_print_format);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updateSettings({
        store_name: storeName,
        store_phone: storePhone,
        store_email: storeEmail,
        store_address: storeAddress,
        pan_vat_number: panNumber,
        default_vat_percent: defaultVat,
        currency_symbol: currencySymbol,
        invoice_header_note: headerNote,
        invoice_footer_note: footerNote,
        default_print_format: printFormat,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Store Profile & System Settings
        </h2>
        <p className="text-xs text-slate-500">
          Configure retail store registration, tax credentials, invoice templates and Supabase database connection
        </p>
      </div>

      {/* Database Connection Status Card */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isLiveSupabase
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200 dark:border-amber-800'
            }`}
          >
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Supabase Backend-as-a-Service
              </h3>
              <Badge variant={isLiveSupabase ? 'success' : 'warning'}>
                {isLiveSupabase ? 'CONNECTED' : 'LOCAL DEMO / STANDALONE'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLiveSupabase
                ? 'Connected to live cloud PostgreSQL instance with RLS policies active'
                : 'Operating in self-contained browser storage mode with sample appliances'}
            </p>
          </div>
        </div>

        <Button
          variant={isLiveSupabase ? 'outline' : 'primary'}
          size="sm"
          onClick={() => setIsConfigModalOpen(true)}
          className="shrink-0"
        >
          {isLiveSupabase ? 'Configure Credentials' : 'Connect Supabase Cloud'}
        </Button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Section 1: Business Identity */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-sky-600" /> Retail Store Identity & Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store / Business Name *"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <Input
              label="Store Phone Numbers *"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              required
            />
            <Input
              label="Store Email"
              type="email"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
            />
            <Input
              label="Physical Showroom Address *"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Section 2: Taxation & Nepal Localization */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-600" /> Nepalese Tax & VAT Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="PAN / VAT Registration Number *"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              helperText="9-Digit Inland Revenue Department Number"
              required
            />
            <Input
              label="Standard VAT Percentage (%)"
              type="number"
              step="0.1"
              value={defaultVat}
              onChange={(e) => setDefaultVat(parseFloat(e.target.value) || 0)}
              helperText="Default 13.00% under Nepal VAT Act"
            />
            <Input
              label="Currency Symbol"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              helperText="Default NPR symbol (रू)"
            />
          </div>
        </div>

        {/* Section 3: Printing & Receipt Preferences */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-600" /> Invoice Printing Preferences
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default POS Invoice Print Layout
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'a4', label: 'Full A4 Tax Invoice', desc: 'Standard formal laser bill with signature blocks' },
                  { id: 'thermal_80', label: '80mm POS Thermal Slip', desc: 'Standard high-speed counter thermal receipt' },
                  { id: 'thermal_58', label: '58mm Compact Receipt', desc: 'Mobile & handheld mini thermal printers' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setPrintFormat(fmt.id as any)}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      printFormat === fmt.id
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="font-semibold">{fmt.label}</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">{fmt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Invoice Header Tagline"
              value={headerNote}
              onChange={(e) => setHeaderNote(e.target.value)}
            />

            <Input
              label="Invoice Footer Note / Warranty Disclaimer"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle className="w-4 h-4" /> Settings updated successfully!
              </span>
            )}
          </div>
          <Button type="submit" variant="primary" isLoading={isSaving} className="gap-2">
            <Save className="w-4 h-4" /> Save System Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
