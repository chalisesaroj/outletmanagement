import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings } from '@/types';
import { INITIAL_SETTINGS } from '@/lib/mockData';
import {
  dbService,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  resetSupabaseClient,
} from '@/lib/supabase';

interface SettingsContextType {
  settings: StoreSettings;
  updateSettings: (updates: Partial<StoreSettings>) => Promise<void>;
  isLiveSupabase: boolean;
  supabaseConfig: { url: string; anonKey: string } | null;
  saveCredentials: (url: string, key: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  isConfigModalOpen: boolean;
  setIsConfigModalOpen: (open: boolean) => void;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [supabaseConfig, setSupabaseConfig] = useState(getSavedSupabaseConfig());
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const refreshSettings = async () => {
    try {
      const data = await dbService.getSettings();
      setSettings(data);
      setIsLiveSupabase(dbService.isUsingLiveSupabase());
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (updates: Partial<StoreSettings>) => {
    const updated = await dbService.updateSettings(updates);
    setSettings(updated);
  };

  const saveCredentials = async (url: string, key: string): Promise<boolean> => {
    const success = await dbService.testConnection(url, key);
    if (success) {
      saveSupabaseConfig({ url, anonKey: key });
      resetSupabaseClient();
      setSupabaseConfig({ url, anonKey: key });
      setIsLiveSupabase(true);
      await refreshSettings();
      return true;
    }
    return false;
  };

  const disconnectSupabase = () => {
    saveSupabaseConfig(null);
    resetSupabaseClient();
    setSupabaseConfig(null);
    setIsLiveSupabase(false);
    refreshSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isLiveSupabase,
        supabaseConfig,
        saveCredentials,
        disconnectSupabase,
        isConfigModalOpen,
        setIsConfigModalOpen,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
