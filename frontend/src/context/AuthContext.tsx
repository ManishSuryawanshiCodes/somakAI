"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { backendSignup, backendLogin } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

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
  login: (email: string, password?: string, role?: UserRole, name?: string) => Promise<{ user?: User; hasOrgs?: boolean; mfaRequired?: boolean; mfaTicket?: string }>;
  completeMfaLogin: (ticket: string, code: string) => Promise<{ user: User; hasOrgs: boolean }>;
  loginAsDemo: () => Promise<User>;
  signup: (email: string, password?: string, name?: string) => Promise<User>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void> | void;
  switchRole: (role: UserRole) => void;
  canDeploy: boolean;
  canRollback: boolean;
  canManageSettings: boolean;
}

const DEFAULT_USER: User = {
  id: 'usr_demo_operator',
  name: 'Marcus Vance',
  email: 'demo-operator@somakai.dev',
  role: 'Operator',
  avatar: 'MV',
  team: 'Platform Reliability SRE',
  email_verified: true,
  mfa_enabled: false,
};

function setSessionCookie(token: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `somak_session_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'somak_session_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'somak_session=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'sentryops_session=; path=/; max-age=0; SameSite=Lax';
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const cleanEmail = u.email || '';
        const fullName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (cleanEmail ? cleanEmail.split('@')[0] : 'User');
        const role: UserRole = (u.user_metadata?.role as UserRole) || 'Admin';
        const parsedUser: User = {
          id: u.id,
          name: fullName,
          email: cleanEmail,
          role,
          avatar: fullName.substring(0, 2).toUpperCase(),
          team: role === 'Admin' ? 'SecOps & Infrastructure' : 'Platform Reliability SRE',
          email_verified: !!u.email_confirmed_at,
          mfa_enabled: false,
        };
        setUser(parsedUser);
        setSessionCookie(session.access_token);
        try {
          localStorage.setItem('somak_user', JSON.stringify(parsedUser));
        } catch {}
        setMounted(true);
        return;
      }

      // Fallback to localStorage session
      try {
        const stored = localStorage.getItem('somak_user') || localStorage.getItem('sentryops_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setSessionCookie('local_' + parsed.id);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setMounted(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const cleanEmail = u.email || '';
        const fullName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (cleanEmail ? cleanEmail.split('@')[0] : 'User');
        const role: UserRole = (u.user_metadata?.role as UserRole) || 'Admin';
        const parsedUser: User = {
          id: u.id,
          name: fullName,
          email: cleanEmail,
          role,
          avatar: fullName.substring(0, 2).toUpperCase(),
          team: role === 'Admin' ? 'SecOps & Infrastructure' : 'Platform Reliability SRE',
          email_verified: !!u.email_confirmed_at,
          mfa_enabled: false,
        };
        setUser(parsedUser);
        setSessionCookie(session.access_token);
        try {
          localStorage.setItem('somak_user', JSON.stringify(parsedUser));
        } catch {}
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password?: string, name?: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const defaultName = name || cleanEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

    // 1. Supabase Auth registration
    let supabaseId = '';
    let supabaseToken = '';
    if (password) {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: defaultName,
              name: defaultName,
              role: 'Admin',
            },
          },
        });
        if (data?.user) {
          supabaseId = data.user.id;
          supabaseToken = data.session?.access_token || '';
        }
      } catch (e) {
        console.warn('[Supabase Auth] registration notice:', e);
      }
    }

    // 2. Call backend endpoint
    let backendRes: any = null;
    try {
      backendRes = await backendSignup({ email: cleanEmail, password, name: defaultName });
    } catch (e) {
      // Backend rate limiting or connection failure fallback
      if (!supabaseId) throw e;
    }

    const u = backendRes?.user;

    const newUser: User = {
      id: supabaseId || u?.id || backendRes?.user_id || ('usr_' + Math.random().toString(36).substring(2, 9)),
      name: u?.name || defaultName,
      email: u?.email || cleanEmail,
      role: (u?.role as UserRole) || 'Admin',
      avatar: (u?.name || defaultName).substring(0, 2).toUpperCase(),
      team: u?.team || 'SecOps & Infrastructure',
      email_verified: u?.email_verified ?? false,
      mfa_enabled: u?.mfa_enabled ?? false,
    };

    const sessionToken = supabaseToken || backendRes?.session_token || ('tok_' + Math.random().toString(36).substring(2, 12));

    setUser(newUser);
    setSessionCookie(sessionToken);
    try {
      localStorage.setItem('somak_user', JSON.stringify(newUser));
      localStorage.setItem('sentryops_user', JSON.stringify(newUser));
      localStorage.setItem('somak_session_token', sessionToken);
      // Brand new user has 0 organizations initially
      localStorage.removeItem(`sentryops_orgs_${newUser.id}`);
      localStorage.removeItem(`sentryops_active_org_${newUser.id}`);
    } catch {}

    return newUser;
  };

  const login = async (
    email: string,
    password?: string,
    role: UserRole = 'Operator',
    name?: string
  ): Promise<{ user?: User; hasOrgs?: boolean; mfaRequired?: boolean; mfaTicket?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const defaultName = name || (cleanEmail
      ? cleanEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
      : 'Demo Operator');

    // Dedicated Seeded Demo Users (No raw credentials exposed)
    const isDemo =
      cleanEmail === 'demo-admin@somakai.dev' ||
      cleanEmail === 'demo-operator@somakai.dev' ||
      cleanEmail === 'demo-viewer@somakai.dev' ||
      cleanEmail.includes('somak.internal') ||
      cleanEmail.includes('sentryops.internal');

    if (isDemo) {
      let demoRole: UserRole = role;
      let demoName = name || 'Demo Operator';
      let demoId = 'usr_demo_operator';
      let demoTeam = 'Platform Reliability SRE';

      if (cleanEmail.includes('admin') || cleanEmail.includes('elena')) {
        demoRole = 'Admin';
        demoName = 'Elena Rostova';
        demoId = 'usr_demo_admin';
        demoTeam = 'SecOps & Infrastructure';
      } else if (cleanEmail.includes('viewer') || cleanEmail.includes('observer')) {
        demoRole = 'Viewer';
        demoName = 'Audit Observer';
        demoId = 'usr_demo_viewer';
        demoTeam = 'Read-Only Compliance';
      } else {
        demoRole = 'Operator';
        demoName = 'Marcus Vance';
        demoId = 'usr_demo_operator';
        demoTeam = 'Platform Reliability SRE';
      }

      const demoUser: User = {
        id: demoId,
        name: demoName,
        email: cleanEmail,
        role: demoRole,
        avatar: demoName.substring(0, 2).toUpperCase(),
        team: demoTeam,
        email_verified: true,
        mfa_enabled: false,
      };

      setUser(demoUser);
      setSessionCookie('demo_session_' + demoRole.toLowerCase());
      try {
        localStorage.setItem('somak_user', JSON.stringify(demoUser));
        localStorage.setItem('sentryops_user', JSON.stringify(demoUser));
        localStorage.setItem('somak_session_token', 'demo_session_' + demoRole.toLowerCase());
      } catch {}

      return { user: demoUser, hasOrgs: true };
    }

    // 1. Try Supabase Auth login
    let supabaseUser = null;
    let supabaseToken = '';
    if (password) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data?.user) {
          supabaseUser = data.user;
          supabaseToken = data.session?.access_token || '';
        }
      } catch (sbErr) {
        console.warn('[Supabase Auth] sign-in fallback:', sbErr);
      }
    }

    // 2. Call backend endpoint with actual credentials
    const backendRes = await backendLogin({ email: cleanEmail, password, role, name: defaultName });

    if (backendRes?.status === 'mfa_required' && backendRes.mfa_ticket) {
      return { mfaRequired: true, mfaTicket: backendRes.mfa_ticket };
    }

    const u = (backendRes as any)?.user;
    const sessionToken = supabaseToken || backendRes?.session_token || ('tok_' + Math.random().toString(36).substring(2, 12));

    const newUser: User = {
      id: supabaseUser?.id || u?.id || ('usr_' + Math.random().toString(36).substring(2, 9)),
      name: supabaseUser?.user_metadata?.full_name || u?.name || name || defaultName,
      email: supabaseUser?.email || u?.email || cleanEmail,
      role: (u?.role as UserRole) || role,
      avatar: (u?.name || name || defaultName).substring(0, 2).toUpperCase(),
      team: u?.team || (
        role === 'Admin'
          ? 'SecOps & Infrastructure'
          : role === 'Operator'
          ? 'Platform Reliability SRE'
          : 'Read-Only Observer'
      ),
      email_verified: supabaseUser ? !!supabaseUser.email_confirmed_at : (u?.email_verified ?? true),
      mfa_enabled: u?.mfa_enabled ?? false,
    };

    setUser(newUser);
    setSessionCookie(sessionToken);
    try {
      localStorage.setItem('somak_user', JSON.stringify(newUser));
      localStorage.setItem('sentryops_user', JSON.stringify(newUser));
      localStorage.setItem('somak_session_token', sessionToken);
    } catch {}

    const hasOrgs = ((backendRes as any)?.organizations?.length > 0) || (backendRes as any)?.has_organizations || false;
    return { user: newUser, hasOrgs };
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const supabase = createClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      throw error;
    }
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
    setSessionCookie(res.session_token || 'mfa_verified');
    try {
      localStorage.setItem('somak_user', JSON.stringify(newUser));
      localStorage.setItem('sentryops_user', JSON.stringify(newUser));
      if (res.session_token) {
        localStorage.setItem('somak_session_token', res.session_token);
      }
    } catch {}
    const hasOrgs = (res.organizations?.length || 0) > 0;
    return { user: newUser, hasOrgs };
  };

  const loginAsDemo = async (): Promise<User> => {
    setUser(DEFAULT_USER);
    setSessionCookie('demo_session_operator');
    try {
      localStorage.setItem('somak_user', JSON.stringify(DEFAULT_USER));
      localStorage.setItem('sentryops_user', JSON.stringify(DEFAULT_USER));
      localStorage.setItem('somak_session_token', 'demo_session_operator');
    } catch {}
    return DEFAULT_USER;
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut notice:', e);
    }
    try {
      const { backendLogout } = await import('@/lib/api');
      await backendLogout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    clearSessionCookie();
    try {
      localStorage.removeItem('somak_user');
      localStorage.removeItem('sentryops_user');
      localStorage.removeItem('somak_session_token');
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
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
        signInWithOAuth,
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
