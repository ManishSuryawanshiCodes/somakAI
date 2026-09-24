"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { analytics } from '@/lib/analytics';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signup(email, password, name);
      analytics.track('signup_completed', {
        method: 'email',
        domain: email.includes('@') ? email.split('@')[1] : undefined,
      });
      // New user has 0 orgs, redirect to /onboarding/create-org
      setTimeout(() => {
        router.push('/onboarding/create-org');
      }, 400);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'RateLimitError' || (err as { retryAfter?: number })?.retryAfter) {
        setError((err as Error).message);
      } else {
        setError('Failed to create account. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: 'Google' | 'GitHub') => {
    setIsLoading(true);
    setError('');
    const demoEmail = provider === 'Google' ? 'developer@google-workspace.io' : 'octocat@github-enterprise.io';
    const demoName = provider === 'Google' ? 'Google Developer' : 'GitHub Engineer';
    try {
      await signup(demoEmail, 'sso-session-token', demoName);
      analytics.track('signup_completed', {
        method: provider.toLowerCase() as 'google' | 'github',
        domain: demoEmail.split('@')[1],
      });
      setTimeout(() => {
        router.push('/onboarding/create-org');
      }, 400);
    } catch {
      setError(`${provider} SSO connection failed.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial-gradient flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background atmospheric mesh glows */}
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
          Create your SOMAK AI account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Start remediating production incidents with autonomous AST verification
        </p>
      </motion.div>

      {/* Main Signup Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Social SSO Buttons */}
        <div className="space-y-2 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSSO('Google')}
              disabled={isLoading}
              className="min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSSO('GitHub')}
              disabled={isLoading}
              className="min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              or sign up with email
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Single primary button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary"
          >
            {isLoading ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <span>Continue to Organization Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Terms & Privacy Agreement Notice */}
          <p className="mt-3.5 text-[11px] text-center text-slate-500 dark:text-slate-400 leading-normal">
            By signing up, you agree to our{' '}
            <Link
              href="/terms"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Privacy Policy
            </Link>.
          </p>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have a SOMAK AI account?{' '}
            <Link
              href="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Security & Trust Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          SOC-2 Type II Certified
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Zero-Retention AST Sandboxes
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
