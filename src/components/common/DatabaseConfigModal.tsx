import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useSettings } from '@/context/SettingsContext';
import { Database, CheckCircle, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';

export const DatabaseConfigModal: React.FC = () => {
  const {
    isConfigModalOpen,
    setIsConfigModalOpen,
    isLiveSupabase,
    supabaseConfig,
    saveCredentials,
    disconnectSupabase,
  } = useSettings();

  const [url, setUrl] = useState(supabaseConfig?.url || '');
  const [key, setKey] = useState(supabaseConfig?.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !key) return;

    setTesting(true);
    setStatusMessage(null);
    try {
      const ok = await saveCredentials(url.trim(), key.trim());
      if (ok) {
        setStatusMessage({ text: 'Connected to Supabase PostgreSQL successfully!', success: true });
        setTimeout(() => setIsConfigModalOpen(false), 1200);
      } else {
        setStatusMessage({ text: 'Could not connect. Verify URL and anon public API key.', success: false });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Connection test failed', success: false });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySchemaNotice = () => {
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <Modal
      isOpen={isConfigModalOpen}
      onClose={() => setIsConfigModalOpen(false)}
      title="Supabase Cloud Database Settings"
      description="Connect to your Supabase PostgreSQL backend or run in standalone demo mode"
      size="lg"
    >
      <div className="space-y-4">
        {/* Status card */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isLiveSupabase
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          {isLiveSupabase ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {isLiveSupabase
                ? '🟢 Active Connection: Connected to Live Supabase'
                : '🟡 Standalone / Demo Mode (Local Persistent Storage)'}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {isLiveSupabase
                ? 'Transactions, sales, serials, and inventory movements are synchronized directly with your Supabase PostgreSQL database.'
                : 'All transactions are executing in a high-fidelity local state store with persistent storage and sample electronic appliances data. Connect Supabase anytime below.'}
            </p>
          </div>
        </div>

        {/* Credentials form */}
        <form onSubmit={handleConnect} className="space-y-3 pt-2">
          <Input
            label="Supabase Project URL"
            placeholder="https://xyzcompany.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            helperText="Found in Supabase Dashboard -> Project Settings -> API"
          />
          <Input
            label="Supabase Anon Public API Key"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            helperText="Safe for frontend client usage; RLS policies protect database tables"
          />

          {statusMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold ${
                statusMessage.success
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isLiveSupabase ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={disconnectSupabase}
                className="text-rose-600 hover:text-rose-700"
              >
                Disconnect & Use Demo Mode
              </Button>
            ) : (
              <span className="text-xs text-slate-500">
                Database schema file: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code>
              </span>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConfigModalOpen(false)}
              >
                Close
              </Button>
              <Button type="submit" variant="primary" isLoading={testing}>
                Save & Connect
              </Button>
            </div>
          </div>
        </form>

        {/* Setup guide */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            Deploying with Supabase (3 Simple Steps):
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-sky-600 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
            <li>In Supabase Dashboard, open <b>SQL Editor</b>, paste the content of <b>supabase/schema.sql</b> and click Run.</li>
            <li>Copy your Project URL and Anon Key into the inputs above and click Save.</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
