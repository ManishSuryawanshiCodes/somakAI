"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bot,
  ArrowRight,
  Home,
  Activity,
  AlertTriangle,
  Compass,
  Radio,
} from 'lucide-react';
import AuroraBackground from '@/components/AuroraBackground';
import { useAuth } from '@/context/AuthContext';

export default function NotFoundPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/25">
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-6 relative overflow-hidden"
      >
        {/* Subtle Ambient Glow Behind Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        {/* Error Code Tag */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span>HTTP 404 • ROUTE NOT FOUND</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            This page wandered off during a canary rollout.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            The endpoint you requested does not exist or was decommissioned in an autonomous AST refactoring cycle.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-95 btn-glow-primary"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isAuthenticated && user ? 'Back to Incident Radar' : 'Back to Home'}</span>
          </Link>

          <Link
            href="/status"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>System Status</span>
          </Link>
        </div>

        {/* Brand Signoff */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Bot className="w-3.5 h-3.5 text-indigo-500" />
          <span>SOMAK AI Autonomous Cloud SRE</span>
        </div>
      </motion.div>
    </div>
  );
}
