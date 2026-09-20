"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cpu,
  Zap,
  Terminal,
  Search,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';

export default function UsagePage() {
  const quotas = [
    {
      title: 'NVIDIA Nemotron-3 Token Consumption',
      current: '1,428,500',
      limit: '5,000,000',
      unit: 'Tokens',
      percent: 28.5,
      detail: 'Ultra-550B (AST Synthesis): 1.1M • Nano-30B (Triage): 328k',
      color: 'bg-indigo-500',
    },
    {
      title: 'Isolated Nebius Container Sandbox Executions',
      current: '84',
      limit: '250',
      unit: 'Runs',
      percent: 33.6,
      detail: 'Average verification execution latency: 4.2s (Exit 0)',
      color: 'bg-emerald-500',
    },
    {
      title: 'Tavily Diagnostic Search Grounding Queries',
      current: '142',
      limit: '1,000',
      unit: 'Queries',
      percent: 14.2,
      detail: 'Zero rate-limit throttling observed',
      color: 'bg-cyan-500',
    },
    {
      title: 'Envoy High-Throughput Telemetry Ingestion',
      current: '112,000',
      limit: '500,000',
      unit: 'Req/min Peak',
      percent: 22.4,
      detail: 'Ingress bandwidth: 18.4 MB/s stream',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Platform Usage & Quota
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Billing Cycle: Sep 1 – Sep 30
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Token consumption, autonomous agent compute hours, and monthly organization quotas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-mono font-bold border border-indigo-200 dark:border-indigo-800">
              Plan: Enterprise Tier (Dedicated)
            </span>
          </div>
        </div>

        {/* Cumulative Savings Hero Banner */}
        <div className="p-6 rounded-3xl glass-card border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Autonomous Value Delivered
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
              $418,200 <span className="text-sm font-sans font-normal text-slate-500">Saved in Avoided Downtime</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Based on enterprise Tier-0 SLA downtime valuation ($8,400/min) across 40 autonomous mitigations.
            </p>
          </div>

          <Link
            href="/history"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            <span>View Incident Audit Trail</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quota Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotas.map((q, idx) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {q.title}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {q.percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${q.color} transition-all duration-300`}
                  style={{ width: `${q.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 dark:text-slate-300 font-bold">
                  {q.current} / {q.limit} {q.unit}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {(100 - q.percent).toFixed(1)}% headroom
                </span>
              </div>

              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {q.detail}
              </p>
            </div>
          ))}
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
