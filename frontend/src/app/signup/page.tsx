"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Activity,
  Terminal,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { analytics } from '@/lib/analytics';

export default function SignupPage() {
  const router = useRouter();
  const { signup, signInWithOAuth } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = (): boolean => {
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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      valid = false;
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError('Password must contain both letters and numbers.');
      valid = false;
    }

    return valid;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      await signup(email.trim(), password, name.trim());
      analytics.track('signup_completed', {
        method: 'email',
        domain: email.includes('@') ? email.split('@')[1] : undefined,
      });
      // New user has 0 orgs, redirect to /onboarding/create-org
      setTimeout(() => {
        router.push('/onboarding/create-org');
      }, 400);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || msg.includes('409')) {
        setEmailError('An account with this email address already exists. Please sign in instead.');
        setError('An account with this email address already exists. Please sign in instead.');
      } else if ((err as Error)?.name === 'RateLimitError' || (err as { retryAfter?: number })?.retryAfter) {
        setError((err as Error).message);
      } else {
        setError(msg || 'Failed to create account. Please try again.');
      }
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
        await signup(demoEmail, undefined, demoName);
        analytics.track('signup_completed', {
          method: provider.toLowerCase() as 'google' | 'github',
          domain: demoEmail.split('@')[1],
        });
        setTimeout(() => {
          router.push('/onboarding/create-org');
        }, 400);
      }
    } catch (err: unknown) {
      setError((err as Error).message || `${provider} SSO connection failed.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF8F5] dark:bg-[#070709] text-slate-900 dark:text-white">
      {/* LEFT COLUMN: Clean Linear/Vercel Signup Form */}
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

        {/* Center: Signup Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create your account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Start remediating production incidents with autonomous AST verification
            </p>
          </div>

          {/* Social SSO Buttons */}
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
              <span>Google</span>
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
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-mono font-semibold tracking-wider">
              or sign up with email
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full min-h-[42px] bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email <span className="text-rose-500">*</span>
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
                  placeholder="alex.mercer@company.com"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Min 8 characters (letters & numbers)"
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
                  <span>Creating Account...</span>
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign in
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

      {/* RIGHT COLUMN: Desktop-only Visual Preview of Product */}
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
    </div>
  );
}
