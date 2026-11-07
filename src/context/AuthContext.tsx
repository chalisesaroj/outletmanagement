import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { DEFAULT_USER_PROFILES } from '@/lib/mockData';
import { getSupabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  switchUser: (role: UserRole) => void;
  canManageInventory: boolean;
  canSell: boolean;
  canViewFinancials: boolean;
  canConfigureSettings: boolean;
  canManagePurchases: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('electro_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_USER_PROFILES[0]; // Owner by default
  });

  const availableUsers = DEFAULT_USER_PROFILES;

  useEffect(() => {
    localStorage.setItem('electro_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchUser = (role: UserRole) => {
    const user = availableUsers.find(u => u.role === role) || availableUsers[0];
    setCurrentUser(user);
  };

  const logout = () => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut();
    }
    // Switch to cashier for demo logout simulation
    switchUser('cashier');
  };

  const role = currentUser.role;

  // Role permissions
  const canConfigureSettings = role === 'owner';
  const canViewFinancials = role === 'owner' || role === 'manager' || role === 'accountant';
  const canManagePurchases = role === 'owner' || role === 'manager' || role === 'storekeeper';
  const canManageInventory = role === 'owner' || role === 'manager' || role === 'storekeeper';
  const canSell = role === 'owner' || role === 'manager' || role === 'cashier';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers,
        switchUser,
        canManageInventory,
        canSell,
        canViewFinancials,
        canConfigureSettings,
        canManagePurchases,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
