"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
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
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, completeMfaLogin } = useAuth();
  const { refreshOrgData } = useOrg();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Operator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaTicket, setMfaTicket] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !selectedRole) {
      setError('Please provide an email address or select a demo role');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await login(email || 'marcus.vance@sentryops.internal', selectedRole);

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
    const { hasOrgs } = await login(emailStr, role, name);
    await refreshOrgData();
    setTimeout(() => {
      if (hasOrgs) {
        router.push('/');
      } else {
        router.push('/onboarding/create-org');
      }
    }, 400);
  };

  const handleSSO = async (provider: 'Google' | 'GitHub') => {
    setIsLoading(true);
    setError('');
    const demoEmail = provider === 'Google' ? 'developer@google-workspace.io' : 'octocat@github-enterprise.io';
    const demoName = provider === 'Google' ? 'Google Developer' : 'GitHub Engineer';
    try {
      const { hasOrgs } = await login(demoEmail, 'Operator', demoName);
      await refreshOrgData();
      setTimeout(() => {
        if (hasOrgs) {
          router.push('/');
        } else {
          router.push('/onboarding/create-org');
        }
      }, 400);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'RateLimitError' || (err as { retryAfter?: number })?.retryAfter) {
        setError((err as Error).message);
      } else {
        setError(`${provider} SSO connection failed.`);
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setResetSent(false);
      setResetEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-radial-gradient flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              SOMAK AI
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                SRE
              </span>
            </div>
          </div>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Sign in to your reliability control plane
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Autonomous telemetry ingestion, AST synthesis, and safe canary rollout
        </p>
      </motion.div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {mfaRequired ? (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter the 6-digit verification code from your authenticator app (e.g., Google Authenticator, 1Password).
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Authenticator Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-center font-mono text-lg tracking-widest text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || mfaCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {isLoading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
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
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-center"
              >
                ← Back to standard sign in
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Quick Demo Sign-in Pills */}
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Demo 1-Click Access
                </span>
                <span className="text-[10px] text-slate-400 font-mono">No password required</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Admin', 'elena.rostova@sentryops.internal', 'Elena Rostova')}
                  className="px-2 py-2 rounded-xl border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/15 text-purple-700 dark:text-purple-300 transition-all flex flex-col items-center text-center group"
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">
                    Admin
                  </span>
                  <span className="text-[11px] font-semibold truncate w-full mt-0.5 group-hover:underline">
                    Elena R.
                  </span>
                  <span className="text-[9px] text-slate-400">Full RBAC</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('Operator', 'marcus.vance@sentryops.internal', 'Marcus Vance')}
                  className="px-2 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 transition-all flex flex-col items-center text-center group"
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Operator
                  </span>
                  <span className="text-[11px] font-semibold truncate w-full mt-0.5 group-hover:underline">
                    Marcus V.
                  </span>
                  <span className="text-[9px] text-slate-400">Canary SRE</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('Viewer', 'audit.observer@sentryops.internal', 'Audit Observer')}
                  className="px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center text-center group"
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                    Viewer
                  </span>
                  <span className="text-[11px] font-semibold truncate w-full mt-0.5 group-hover:underline">
                    Observer
                  </span>
                  <span className="text-[9px] text-slate-400">Read Only</span>
                </button>
              </div>
            </div>

            {/* Google & GitHub SSO Buttons */}
            <div className="space-y-2 mb-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSSO('Google')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google SSO</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSSO('GitHub')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub SSO</span>
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  or enter credentials
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Single primary button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary"
              >
                {isLoading ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-modal rounded-3xl p-6 shadow-2xl space-y-4"
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
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password reset instructions sent to your email.</span>
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Send Recovery Link
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security & Compliance Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          SOC-2 Type II Certified
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ISO 27001 Encrypted
        </span>
        <span>•</span>
        <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 underline">
          Privacy
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 underline">
          Terms
        </Link>
      </div>
    </div>
  );
}
