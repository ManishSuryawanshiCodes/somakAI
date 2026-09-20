"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Flame,
  Filter,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useOrg } from '@/context/OrgContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';

interface ServiceSLO {
  id: string;
  service: string;
  target: number;
  currentUptime: number;
  budgetRemainingPercent: number;
  burnRate: number;
  burnState: 'healthy' | 'at_risk' | 'exhausted';
  windowDays: number;
  projectedExhaustion: string;
  activeIncidentId?: string;
  description: string;
  history: { day: string; budget: number; burnRate: number }[];
}

const MOCK_SLOS: ServiceSLO[] = [
  {
    id: 'slo-auth',
    service: 'auth-service',
    target: 99.90,
    currentUptime: 99.82,
    budgetRemainingPercent: 18.4,
    burnRate: 14.2,
    burnState: 'at_risk',
    windowDays: 30,
    projectedExhaustion: '14 hours (Mitigation Active)',
    activeIncidentId: 'INC-2041',
    description: 'User JWT verification & session credential issuance latency < 150ms',
    history: [
      { day: 'Day 1', budget: 100, burnRate: 0.6 },
      { day: 'Day 5', budget: 96, burnRate: 0.8 },
      { day: 'Day 10', budget: 91, burnRate: 0.9 },
      { day: 'Day 15', budget: 85, burnRate: 1.1 },
      { day: 'Day 20', budget: 78, burnRate: 1.0 },
      { day: 'Day 25', budget: 64, burnRate: 2.4 },
      { day: 'Day 28', budget: 48, burnRate: 4.8 },
      { day: 'Today', budget: 18.4, burnRate: 14.2 },
    ],
  },
  {
    id: 'slo-ingress',
    service: 'ingress-nginx',
    target: 99.99,
    currentUptime: 99.994,
    budgetRemainingPercent: 94.2,
    burnRate: 0.8,
    burnState: 'healthy',
    windowDays: 30,
    projectedExhaustion: 'No exhaustion projected',
    description: 'Envoy edge routing & TLS termination availability',
    history: [
      { day: 'Day 1', budget: 100, burnRate: 0.5 },
      { day: 'Day 10', budget: 98, burnRate: 0.7 },
      { day: 'Day 20', budget: 96, burnRate: 0.8 },
      { day: 'Today', budget: 94.2, burnRate: 0.8 },
    ],
  },
  {
    id: 'slo-payment',
    service: 'payment-gateway',
    target: 99.95,
    currentUptime: 99.948,
    budgetRemainingPercent: 82.0,
    burnRate: 1.1,
    burnState: 'healthy',
    windowDays: 30,
    projectedExhaustion: '28 days at current burn',
    description: 'Stripe webhook ingestion & idempotent ledger commits',
    history: [
      { day: 'Day 1', budget: 100, burnRate: 0.9 },
      { day: 'Day 10', budget: 94, burnRate: 1.0 },
      { day: 'Day 20', budget: 89, burnRate: 1.2 },
      { day: 'Today', budget: 82.0, burnRate: 1.1 },
    ],
  },
  {
    id: 'slo-redis',
    service: 'redis-cluster',
    target: 99.90,
    currentUptime: 99.98,
    budgetRemainingPercent: 96.5,
    burnRate: 0.3,
    burnState: 'healthy',
    windowDays: 30,
    projectedExhaustion: 'No exhaustion projected',
    description: 'Distributed session cache reads latency < 5ms',
    history: [
      { day: 'Day 1', budget: 100, burnRate: 0.2 },
      { day: 'Day 15', budget: 98, burnRate: 0.3 },
      { day: 'Today', budget: 96.5, burnRate: 0.3 },
    ],
  },
  {
    id: 'slo-user',
    service: 'user-service',
    target: 99.90,
    currentUptime: 99.95,
    budgetRemainingPercent: 88.7,
    burnRate: 0.5,
    burnState: 'healthy',
    windowDays: 30,
    projectedExhaustion: '42 days',
    description: 'Account profile retrieval & organization membership lookups',
    history: [
      { day: 'Day 1', budget: 100, burnRate: 0.4 },
      { day: 'Day 15', budget: 94, burnRate: 0.5 },
      { day: 'Today', budget: 88.7, burnRate: 0.5 },
    ],
  },
  {
    id: 'slo-billing',
    service: 'billing-api',
    target: 99.95,
    currentUptime: 99.88,
    budgetRemainingPercent: 8.2,
    burnRate: 8.9,
    burnState: 'at_risk',
    windowDays: 30,
    projectedExhaustion: '18 hours',
    description: 'Subscription invoicing & prorated metered billing calculation',
    history: [
      { day: 'Day 1', budget: 100, burnRate: 1.2 },
      { day: 'Day 10', budget: 72, burnRate: 3.1 },
      { day: 'Day 20', budget: 41, burnRate: 5.4 },
      { day: 'Today', budget: 8.2, burnRate: 8.9 },
    ],
  },
];

export default function SLOPage() {
  const { currentOrg } = useOrg();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  const [selectedService, setSelectedService] = useState<string>('auth-service');
  const [statusFilter, setStatusFilter] = useState<'all' | 'at_risk' | 'healthy'>('all');

  const activeSLO = MOCK_SLOS.find((s) => s.service === selectedService) || MOCK_SLOS[0];

  const filteredSLOs = MOCK_SLOS.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.burnState === statusFilter;
  });

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Target className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                SLO Budgets
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {isAcme ? '30-Day Window' : 'Active'}
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Service error budgets and real-time burn rates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Incident Radar</span>
            </Link>
          </div>
        </div>

        {!isAcme ? (
          <div className="glass-panel p-12 rounded-2xl shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                No SLO error budgets defined yet for {currentOrg?.name || 'this organization'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Connect your telemetry sources and configure service availability targets in the setup checklist to track real-time error budget burn rates.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/onboarding/setup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Connect Telemetry Sources</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>

        {/* Sticky Section Jump Navigation Bar */}
        <div className="sticky top-14 z-20 p-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'sec-overview', label: 'Overview' },
            { id: 'sec-visualizer', label: 'Burn Visualizer' },
            { id: 'sec-services', label: 'Service SLOs' },
            { id: 'sec-gates', label: 'Gate Policy' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                const el = document.getElementById(tab.id);
                if (el) {
                  const y = el.getBoundingClientRect().top + window.pageYOffset - 110;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Summary Metric Cards */}
        <div id="sec-overview" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Service SLOs
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              6 Monitored
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              4 Operating Healthy
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Budgets At Risk
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              2 Services
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Burn rate &gt; 5.0x detected
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Aggregate 30d SLA
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              99.93%
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Contractual Target: 99.90%
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Canary Gate Policy
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              Active
            </div>
            <div className="text-[11px] text-slate-500">
              Freezes non-fix deploys at &lt; 10%
            </div>
          </div>
        </div>

        {/* Featured Service Burn-Down Telemetry Card */}
        <div id="sec-visualizer" className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{activeSLO.service}</span>
                  <span>Budget Burn-Down Telemetry</span>
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  activeSLO.burnState === 'at_risk'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {activeSLO.burnState === 'at_risk' ? 'Budget At Risk' : 'Healthy'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeSLO.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <div className="text-slate-400 text-[10px]">Remaining Budget</div>
                <div className={`text-lg font-black ${
                  activeSLO.budgetRemainingPercent < 20 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {activeSLO.budgetRemainingPercent}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[10px]">Burn Rate</div>
                <div className={`text-lg font-black ${activeSLO.burnRate > 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {activeSLO.burnRate}x
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSLO.history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Warning Gate (20%)', fill: '#F59E0B', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="budget"
                  name="Budget Remaining %"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#budgetGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Banner if linked to active incident */}
          {activeSLO.activeIncidentId && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-red-700 dark:text-red-300">
                  Active Sev-1 incident <strong>{activeSLO.activeIncidentId}</strong> is consuming error budget at {activeSLO.burnRate}x normal rate.
                </span>
              </div>
              <Link
                href={`/remediation/${activeSLO.activeIncidentId}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline shrink-0"
              >
                <span>Jump to AST Remediation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Per-Service SLO Grid */}
        <div id="sec-services" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Service Level Objectives
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({MOCK_SLOS.length})
              </button>
              <button
                onClick={() => setStatusFilter('at_risk')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'at_risk'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                At Risk (2)
              </button>
              <button
                onClick={() => setStatusFilter('healthy')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'healthy'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Healthy (4)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSLOs.map((slo) => {
              const isSelected = selectedService === slo.service;
              return (
                <div
                  key={slo.id}
                  onClick={() => setSelectedService(slo.service)}
                  className={`glass-card p-5 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {slo.service}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        slo.burnState === 'at_risk'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {slo.burnState === 'at_risk' ? 'At Risk' : 'Healthy'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {slo.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Target: {slo.target}%</span>
                      <span className="font-bold text-slate-900 dark:text-white">Current: {slo.currentUptime}%</span>
                    </div>

                    {/* Mini Budget Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          slo.budgetRemainingPercent < 20
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${slo.budgetRemainingPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{slo.budgetRemainingPercent}% budget left</span>
                      <span className="font-mono">{slo.burnRate}x burn</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Automated Canary Gate Policy Card */}
        <div id="sec-gates" className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Canary Deployment Gate Policy
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              Enforcement: Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">Budget &gt; 20% (Nominal)</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Standard autonomous canary pipelines proceed with automated 5% &rarr; 25% &rarr; 50% &rarr; 100% rollout.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300">Budget 10% – 20% (Warning)</span>
              <p className="text-amber-700/80 dark:text-amber-300/80 text-[11px] leading-relaxed">
                Canary promotions require explicit human confirmation. Autonomous promotion countdown is paused.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
              <span className="font-bold text-red-800 dark:text-red-300">Budget &lt; 10% (Freeze)</span>
              <p className="text-red-700/80 dark:text-red-300/80 text-[11px] leading-relaxed">
                Non-remediation deployments frozen. Only verified AST incident hotfixes permitted to route traffic.
              </p>
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      <FloatingDock />
    </div>
  );
}
