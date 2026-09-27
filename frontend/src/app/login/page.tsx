"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  KeyRound,
  ArrowLeft,
  Loader2,
  Activity,
  Terminal,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, completeMfaLogin, signInWithOAuth } = useAuth();
  const { refreshOrgData } = useOrg();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole] = useState<UserRole>('Operator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaTicket, setMfaTicket] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateLoginForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Work email address is required.');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailError('Please enter a valid work email format (e.g. name@company.com).');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await login(email.trim(), password, selectedRole);

      if (res?.mfaRequired && res?.mfaTicket) {
        setMfaRequired(true);
        setMfaTicket(res.mfaTicket);
        setIsLoading(false);
        return;
      }

      await refreshOrgData();

      setTimeout(() => {
        if (res?.hasOrgs) {
          router.push('/');
        } else {
          router.push('/onboarding/create-org');
        }
      }, 400);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AccountLockedError' || (err as Error)?.name === 'RateLimitError' || (err as { retryAfter?: number })?.retryAfter) {
        setError((err as Error).message);
      } else {
        setError((err as Error).message || 'Authentication failed. Please verify credentials.');
      }
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.trim().length < 6) {
      setError('Please enter a valid 6-digit authentication code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { hasOrgs } = await completeMfaLogin(mfaTicket, mfaCode.trim());
      await refreshOrgData();
      setTimeout(() => {
        if (hasOrgs) {
          router.push('/');
        } else {
          router.push('/onboarding/create-org');
        }
      }, 400);
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid two-factor authentication code.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole, emailStr: string, name: string) => {
    setIsLoading(true);
    setError('');
    try {
      const { hasOrgs } = await login(emailStr, undefined, role, name);
      await refreshOrgData();
      setTimeout(() => {
        if (hasOrgs) {
          router.push('/');
        } else {
          router.push('/onboarding/create-org');
        }
      }, 400);
    } catch (err: unknown) {
      setError((err as Error).message || 'Demo sign-in failed.');
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: 'Google' | 'GitHub') => {
    setIsLoading(true);
    setError('');
    try {
      if (signInWithOAuth) {
        await signInWithOAuth(provider.toLowerCase() as 'google' | 'github');
      } else {
        const demoEmail = provider === 'Google' ? 'developer@google-workspace.io' : 'octocat@github-enterprise.io';
        const demoName = provider === 'Google' ? 'Google Developer' : 'GitHub Engineer';
        const { hasOrgs } = await login(demoEmail, undefined, 'Operator', demoName);
        await refreshOrgData();
        setTimeout(() => {
          if (hasOrgs) {
            router.push('/');
          } else {
            router.push('/onboarding/create-org');
          }
        }, 400);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'RateLimitError' || (err as { retryAfter?: number })?.retryAfter) {
        setError((err as Error).message);
      } else {
        setError((err as Error).message || `${provider} SSO authentication failed.`);
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?reset=success` : undefined,
      });
    } catch (err) {
      console.warn('Password reset notice:', err);
    }
    setResetSent(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setResetSent(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF8F5] dark:bg-[#070709] text-slate-900 dark:text-white">
      {/* LEFT COLUMN: Clean Linear/Vercel Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 overflow-y-auto">
        {/* Top Header: Brand + Back Button */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-1 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-6 h-6 object-contain aspect-square" />
            </div>
            <span className="font-mono font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              SOMAK AI
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        {/* Center: Auth Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to SOMAK AI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Autonomous site reliability & microVM self-healing platform
            </p>
          </div>

          {mfaRequired ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-2.5 text-center font-mono text-base tracking-widest text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || mfaCode.length < 6}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaCode('');
                    setError('');
                  }}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-center"
                >
                  &larr; Back to sign in
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Quick Demo Sign-in Pills */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Demo 1-Click Access
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">No password required</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('Admin', 'demo-admin@somakai.dev', 'Demo Admin')}
                    className="p-2 rounded-xl border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/15 text-purple-700 dark:text-purple-300 transition-all flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">
                      Admin
                    </span>
                    <span className="text-[11px] font-medium truncate w-full mt-0.5">
                      Demo Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('Operator', 'demo-operator@somakai.dev', 'Demo Operator')}
                    className="p-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 transition-all flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                      Operator
                    </span>
                    <span className="text-[11px] font-medium truncate w-full mt-0.5">
                      Demo Operator
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('Viewer', 'demo-viewer@somakai.dev', 'Demo Viewer')}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                      Viewer
                    </span>
                    <span className="text-[11px] font-medium truncate w-full mt-0.5">
                      Demo Viewer
                    </span>
                  </button>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleSSO('Google')}
                  disabled={isLoading}
                  className="min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google SSO</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSSO('GitHub')}
                  disabled={isLoading}
                  className="min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub SSO</span>
                </button>
              </div>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-mono font-semibold tracking-wider">
                  or enter credentials
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="marcus.vance@company.com"
                      className={`w-full min-h-[42px] bg-white dark:bg-white/5 border ${
                        emailError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-white/10 focus:ring-indigo-500'
                      } rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="••••••••••••"
                      className={`w-full min-h-[42px] bg-white dark:bg-white/5 border ${
                        passwordError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-white/10 focus:ring-indigo-500'
                      } rounded-xl py-2 pl-9 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[42px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating Session...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account yet?{' '}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 text-center sm:text-left text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              SOC-2 Type II
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ISO 27001
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Desktop-only Visual Preview of Product (Radar / Stepper) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#090C10] border-l border-white/10 relative overflow-hidden flex-col justify-center items-center p-8 xl:p-14">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Product Pipeline Preview Frame */}
        <div className="w-full max-w-lg bg-[#0F1319] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-[#0A0D12] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 font-mono text-[10px] text-slate-400">
                somak-orchestrator — live pipeline
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>LIVE</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Active Incident Header Card */}
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">INC-2041</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded">SEV-1</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    auth-service V8 OOM Memory Leak
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                99.4% Match
              </span>
            </div>

            {/* 4-Stage Stepper Pipeline */}
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">1. Telemetry Ingest & Sentry Hook</div>
                  <div className="text-slate-400 text-[10px]">Stacktrace normalized in 0.12s across 3 clusters</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">2. Nemotron-3 AST Synthesis</div>
                  <div className="text-slate-400 text-[10px]">Synthesized exact LRU cache patch (zero hallucination)</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">3. MicroVM Sandbox Verification</div>
                  <div className="text-slate-400 text-[10px]">14 unit + 6 e2e regression tests passed in Firecracker</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25">
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Terminal className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-indigo-300 font-semibold flex items-center justify-between">
                    <span>4. Autonomous Canary Rollout</span>
                    <span className="text-[10px] text-emerald-400">100% HEALTHY</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">5% &rarr; 25% &rarr; 100% traffic shift with zero latency regression</div>
                </div>
              </div>
            </div>

            {/* AST Code Diff Preview */}
            <div className="p-3 bg-[#0A0D12] rounded-xl border border-white/5 font-mono text-[10px] space-y-1">
              <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>diff --git a/services/auth.ts b/services/auth.ts</span>
                <span className="text-emerald-400">+1 / -1</span>
              </div>
              <div className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                - const leak = globalCache.set(req.id, buffer);
              </div>
              <div className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                + const leak = lruCache.set(req.id, buffer, &#123; ttl: 60000 &#125;);
              </div>
            </div>

            {/* Bottom Metrics Pill */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div>MTTR: <span className="text-emerald-400 font-semibold">3m 42s</span></div>
              <div>Auto-Remediated: <span className="text-indigo-400 font-semibold">95.2%</span></div>
              <div>Zero-Human Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-modal rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Reset Password
                </h3>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetSent ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password reset instructions dispatched to your email.</span>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your work email and we&apos;ll dispatch a secure recovery link.
                  </p>
                  <div>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    Send Recovery Link
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
