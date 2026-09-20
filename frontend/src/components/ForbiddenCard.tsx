"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Home,
  UserCheck,
  Bot,
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ForbiddenCardProps {
  requiredRole?: UserRole;
  actionName?: string;
  onReturn?: () => void;
}

export default function ForbiddenCard({
  requiredRole = 'Operator',
  actionName = 'access this restricted engineering surface',
  onReturn,
}: ForbiddenCardProps) {
  const { user } = useAuth();
  const currentRole = user?.role || 'Viewer';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="max-w-lg w-full mx-auto glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl border border-amber-500/25 text-center space-y-6 relative overflow-hidden"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <span>HTTP 403 • ACCESS RESTRICTED BY RBAC</span>
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Elevated Permissions Required
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          You are currently signed in as a{' '}
          <span className="font-mono font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            {currentRole}
          </span>
          . To {actionName}, you must hold the{' '}
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            {requiredRole}
          </span>{' '}
          role or higher.
        </p>
      </div>

      {/* Role Comparison Pill */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
        <div className="text-left">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Your Account</div>
          <div className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Observer'}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Assigned Tier</div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {currentRole}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          onClick={onReturn}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-95 btn-glow-primary"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Radar</span>
        </Link>

        <Link
          href="/settings"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Manage Roles in Settings</span>
        </Link>
      </div>

      {/* Brand Signoff */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Bot className="w-3.5 h-3.5 text-indigo-500" />
        <span>SOMAK AI Security & Compliance Governance</span>
      </div>
    </motion.div>
  );
}
