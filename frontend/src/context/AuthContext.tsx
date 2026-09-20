"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { backendSignup, backendLogin, RateLimitError } from '@/lib/api';

export type UserRole = 'Viewer' | 'Operator' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  team: string;
  mfa_enabled?: boolean;
  email_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole, name?: string) => Promise<{ user?: User; hasOrgs?: boolean; mfaRequired?: boolean; mfaTicket?: string }>;
  completeMfaLogin: (ticket: string, code: string) => Promise<{ user: User; hasOrgs: boolean }>;
  loginAsDemo: () => Promise<User>;
  signup: (email: string, password?: string, name?: string) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  canDeploy: boolean;
  canRollback: boolean;
  canManageSettings: boolean;
}

const DEFAULT_USER: User = {
  id: 'usr_elena',
  name: 'Elena Rostova',
  email: 'elena@somak.internal',
  role: 'Admin',
  avatar: 'ER',
  team: 'Platform Reliability SRE',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('somak_user') || localStorage.getItem('sentryops_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setMounted(true);
  }, []);

  const signup = async (email: string, password?: string, name?: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const defaultName = name || cleanEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

    // Call backend endpoint (rate-limited via RateLimiterMiddleware)
    const backendRes = await backendSignup({ email: cleanEmail, password, name: defaultName });

    const newUser: User = {
      id: backendRes?.user_id || ('usr_' + Math.random().toString(36).substring(2, 9)),
      name: defaultName,
      email: cleanEmail,
      role: 'Admin',
      avatar: defaultName.substring(0, 2).toUpperCase(),
      team: 'SecOps & Infrastructure',
    };

    setUser(newUser);
    try {
      localStorage.setItem('somak_user', JSON.stringify(newUser));
      localStorage.setItem('sentryops_user', JSON.stringify(newUser));
      // Brand new user has 0 organizations initially
      localStorage.removeItem(`sentryops_orgs_${newUser.id}`);
      localStorage.removeItem(`sentryops_active_org_${newUser.id}`);
    } catch {}

    return newUser;
  };

  const login = async (
    email: string,
    role: UserRole = 'Operator',
    name?: string
  ): Promise<{ user?: User; hasOrgs?: boolean; mfaRequired?: boolean; mfaTicket?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const defaultName = name || (cleanEmail
      ? cleanEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
      : 'Demo Operator');

    // Call backend endpoint (rate-limited via RateLimiterMiddleware)
    const backendRes = await backendLogin({ email: cleanEmail, role, name: defaultName });

    if (backendRes?.status === 'mfa_required' && backendRes.mfa_ticket) {
      return { mfaRequired: true, mfaTicket: backendRes.mfa_ticket };
    }

    const isDemoUser =
      cleanEmail.includes('elena') ||
      cleanEmail.includes('marcus') ||
      cleanEmail.includes('observer') ||
      cleanEmail.includes('somak.internal') ||
      cleanEmail.includes('sentryops.internal');

    const userId = cleanEmail.includes('elena')
      ? 'usr_elena'
      : cleanEmail.includes('marcus')
      ? 'usr_mv492'
      : cleanEmail.includes('observer')
      ? 'usr_observer'
      : 'usr_' + Math.random().toString(36).substring(2, 9);

    const newUser: User = {
      id: userId,
      name: name || defaultName,
      email: cleanEmail || 'operator@somak.internal',
      role,
      avatar: (name || defaultName).substring(0, 2).toUpperCase(),
      team:
        role === 'Admin'
          ? 'SecOps & Infrastructure'
          : role === 'Operator'
          ? 'Platform Reliability SRE'
          : 'Read-Only Observer',
    };

    setUser(newUser);
    try {
      localStorage.setItem('sentryops_user', JSON.stringify(newUser));
    } catch {}

    // Check if user has organizations
    let hasOrgs = isDemoUser;
    if (!hasOrgs) {
      try {
        const storedOrgs = localStorage.getItem(`sentryops_orgs_${newUser.id}`);
        if (storedOrgs) {
          const parsed = JSON.parse(storedOrgs);
          hasOrgs = Array.isArray(parsed) && parsed.length > 0;
        }
      } catch {}
    }

    return { user: newUser, hasOrgs };
  };

  const completeMfaLogin = async (ticket: string, code: string): Promise<{ user: User; hasOrgs: boolean }> => {
    const { verifyMfa } = await import('@/lib/api');
    const res = await verifyMfa(ticket, code);
    if (!res || !res.user) {
      throw new Error('Failed to verify MFA code.');
    }
    const u: any = res.user;
    const newUser: User = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'Operator',
      avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
      team: u.team || 'Reliability Engineering',
    };
    setUser(newUser);
    try {
      localStorage.setItem('somak_user', JSON.stringify(newUser));
      localStorage.setItem('sentryops_user', JSON.stringify(newUser));
    } catch {}
    const hasOrgs = (res.organizations?.length || 0) > 0;
    return { user: newUser, hasOrgs };
  };

  const loginAsDemo = async (): Promise<User> => {
    setUser(DEFAULT_USER);
    try {
      localStorage.setItem('somak_user', JSON.stringify(DEFAULT_USER));
      localStorage.setItem('sentryops_user', JSON.stringify(DEFAULT_USER));
    } catch {}
    return DEFAULT_USER;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('somak_user');
      localStorage.removeItem('sentryops_user');
    } catch {}
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    const updated: User = {
      ...user,
      role,
      team:
        role === 'Admin'
          ? 'SecOps & Infrastructure'
          : role === 'Operator'
          ? 'Platform Reliability SRE'
          : 'Read-Only Observer',
    };
    setUser(updated);
    try {
      localStorage.setItem('somak_user', JSON.stringify(updated));
      localStorage.setItem('sentryops_user', JSON.stringify(updated));
    } catch {}
  };

  const canDeploy = user?.role === 'Operator' || user?.role === 'Admin';
  const canRollback = user?.role === 'Operator' || user?.role === 'Admin';
  const canManageSettings = user?.role === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        user: mounted ? user : null,
        isAuthenticated: mounted ? !!user : false,
        signup,
        login,
        completeMfaLogin,
        loginAsDemo,
        logout,
        switchRole,
        canDeploy,
        canRollback,
        canManageSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
