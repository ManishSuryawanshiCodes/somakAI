"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import { validateInviteToken, acceptInvite as apiAcceptInvite } from '@/lib/api';
import { Invite } from '@/lib/types';

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || '';

  const { user, signup, login } = useAuth();
  const { switchOrg, refreshOrgData } = useOrg();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  // Form fields for new users
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setIsInvalid(true);
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        const res = await validateInviteToken(token);
        if (res && res.invite) {
          setInvite(res.invite);
          if (res.is_expired || res.invite.status === 'expired') {
            setIsExpired(true);
          }
        } else {
          // Fallback: search localStorage
          let foundInvite: Invite | null = null;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sentryops_invites_')) {
              try {
                const list: Invite[] = JSON.parse(localStorage.getItem(key) || '[]');
                const match = list.find((item) => item.token === token);
                if (match) {
                  foundInvite = match;
                  break;
                }
              } catch {}
            }
          }

          if (foundInvite) {
            setInvite(foundInvite);
            if (new Date(foundInvite.expires_at).getTime() < Date.now()) {
              setIsExpired(true);
            }
          } else {
            setIsInvalid(true);
          }
        }
      } catch {
        setIsInvalid(true);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  // Handle acceptance for authenticated users
  const handleAcceptLoggedIn = async () => {
    if (!invite) return;
    setSubmitting(true);
    setError('');

    try {
      await apiAcceptInvite(token, {
        user_id: user?.id,
        name: user?.name,
      });
      await refreshOrgData();
      switchOrg(invite.organization_id);

      setTimeout(() => {
        router.push('/');
      }, 400);
    } catch {
      // Fallback local accept
      switchOrg(invite.organization_id);
      router.push('/');
    }
  };

  // Handle simplified signup for new users
  const handleSignupAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    if (!password) {
      setError('Please choose a password to secure your account.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Create account with the pre-filled, locked email
      const newUser = await signup(invite.email, password, name || invite.email.split('@')[0]);

      // 2. Accept the invite with the new user credentials
      await apiAcceptInvite(token, {
        user_id: newUser.id,
        name: newUser.name,
      });

      // 3. Refresh org context and switch directly to this org's Radar
      await refreshOrgData();
      switchOrg(invite.organization_id);

      setTimeout(() => {
        router.push('/');
      }, 400);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete registration.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-radial-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs text-slate-400 font-mono">Verifying invitation token...</span>
        </div>
      </div>
    );
  }

  // Invalid or expired token error state
  if (isInvalid || isExpired || !invite) {
    return (
      <div className="min-h-screen bg-radial-gradient flex flex-col justify-center items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-modal rounded-3xl p-8 shadow-2xl text-center space-y-5"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {isExpired ? 'Invitation Link Expired' : 'Invalid Invitation Link'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {isExpired
                ? 'This 7-day invitation has expired. Please contact your organization administrator to receive a new invitation.'
                : 'We could not locate this invitation token. It may have already been accepted or revoked by your administrator.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>Return to Somak AI Sign In</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-gradient flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-1.5 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-7 h-7 object-contain aspect-square" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Somak AI
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Workspace Invite
              </span>
            </div>
          </div>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Join {invite.organization_name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Invited by {invite.invited_by} as{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{invite.role}</span>
        </p>
      </motion.div>

      {/* Main Acceptance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {user ? (
          /* Case A: Already logged in */
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Target Workspace:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {invite.organization_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Your Assigned Role:</span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {invite.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Authenticated As:</span>
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcceptLoggedIn}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <span>Accept Invitation & Go to Radar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Case B: New user — simplified signup with pre-filled & locked email */
          <form onSubmit={handleSignupAndJoin} className="space-y-4">
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
                  placeholder="Your name"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Invited Email
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Locked to invite</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  readOnly
                  disabled
                  value={invite.email}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono select-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account & Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Join {invite.organization_name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
