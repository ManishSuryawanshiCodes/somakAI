"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSLOs } from '@/lib/api';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Activity,
  Flame,
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
    description: 'Payment gateway webhook ingestion & idempotent ledger commits',
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

  const [slos, setSlos] = useState<ServiceSLO[]>(isAcme ? MOCK_SLOS : []);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>(isAcme ? 'auth-service' : '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'at_risk' | 'healthy'>('all');
  const [frozenServices, setFrozenServices] = useState<Record<string, boolean>>({
    'auth-service': true,
    'billing-api': true,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getSLOs()
      .then((data) => {
        if (mounted) {
          if (data && data.length > 0) {
            setSlos(data);
            setSelectedService(data[0].service);
          } else if (isAcme) {
            setSlos(MOCK_SLOS);
            setSelectedService('auth-service');
          } else {
            setSlos([]);
            setSelectedService('');
          }
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [currentOrg, isAcme]);

  const activeSLO = slos.find((s) => s.service === selectedService) || slos[0] || null;

  const filteredSLOs = slos.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.burnState === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 transition-colors selection:bg-indigo-500/20">
      <TopNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              SLO Budgets & Burn Rates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Service error budgets, automated freeze gates, and burn rate telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
              30-Day Window · {slos.length} Services
            </span>
          </div>
        </div>

        {!loading && slos.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 text-center space-y-3">
            <Target className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              No SLO error budgets defined yet
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Connect your telemetry sources and configure service availability targets to track real-time error budget burn rates.
            </p>
          </div>
        ) : (
          <>
            {/* Top Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Monitored Services
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {slos.length}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{slos.filter((s) => s.burnState === 'healthy').length} Healthy</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Budgets At Risk
                </span>
                <div className="text-xl font-bold text-amber-500 font-mono">
                  {slos.filter((s) => s.burnState !== 'healthy').length}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>{slos.some((s) => s.burnRate > 5.0) ? 'High burn rate active' : 'Nominal burn'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Aggregate SLA
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {slos.length > 0
                    ? (slos.reduce((acc, s) => acc + s.currentUptime, 0) / slos.length).toFixed(2) + '%'
                    : '100.0%'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Target: 99.90%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Freeze Gate Policy
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  Active
                </div>
                <div className="text-[11px] text-slate-400">
                  Freezes non-fixes &lt; 10%
                </div>
              </div>
            </div>

            {/* Featured Service Burn-Down Area Chart */}
            {activeSLO && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {activeSLO.service}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                          activeSLO.burnState === 'at_risk'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
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
                      <div
                        className={`text-base font-bold ${
                          activeSLO.budgetRemainingPercent < 10
                            ? 'text-rose-500'
                            : activeSLO.budgetRemainingPercent < 20
                            ? 'text-amber-500'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {activeSLO.budgetRemainingPercent}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">Burn Rate</div>
                      <div
                        className={`text-base font-bold ${
                          activeSLO.burnRate > 5 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {activeSLO.burnRate}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recharts Area Chart */}
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeSLO.history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis unit="%" tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0A0A',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                      <ReferenceLine
                        y={10}
                        stroke="#F43F5E"
                        strokeDasharray="3 3"
                        label={{ value: 'Freeze (10%)', fill: '#F43F5E', fontSize: 9 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="budget"
                        name="Budget %"
                        stroke="#6366F1"
                        strokeWidth={2}
                        fill="url(#budgetGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Banner if linked to active incident */}
                {activeSLO.activeIncidentId && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-rose-700 dark:text-rose-300">
                        Active Sev-1 incident <strong>{activeSLO.activeIncidentId}</strong> is burning budget at{' '}
                        {activeSLO.burnRate}x.
                      </span>
                    </div>
                    <Link
                      href={`/remediation/${activeSLO.activeIncidentId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
                    >
                      <span>Review Hotfix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Stacked Cards per Service with horizontal burn progress & minimal sparklines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Service Level Objectives ({filteredSLOs.length})
                </h3>
                <div className="flex items-center gap-1.5">
                  {(['all', 'at_risk', 'healthy'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        statusFilter === filter
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {filter === 'all'
                        ? `All (${slos.length})`
                        : filter === 'at_risk'
                        ? `At Risk (${slos.filter((s) => s.burnState === 'at_risk').length})`
                        : `Healthy (${slos.filter((s) => s.burnState === 'healthy').length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stacked Card List */}
              <div className="space-y-3">
                {filteredSLOs.map((slo) => {
                  const isSelected = selectedService === slo.service;
                  const isCritical = slo.budgetRemainingPercent < 10;
                  const isWarning = slo.budgetRemainingPercent < 20;

                  return (
                    <div
                      key={slo.id}
                      onClick={() => setSelectedService(slo.service)}
                      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'border-slate-400 dark:border-white/30 shadow-xs'
                          : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {slo.service}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {slo.description}
                            </span>
                          </div>
                        </div>

                        {/* Minimal Sparkline per SLO card */}
                        <div className="flex items-center gap-3 shrink-0">
                          <svg className="w-16 h-5 overflow-visible" viewBox="0 0 64 20">
                            <path
                              d={slo.history.reduce((acc, pt, i) => {
                                const x = (i / (slo.history.length - 1)) * 64;
                                const y = 20 - (pt.budget / 100) * 18;
                                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                              }, '')}
                              fill="none"
                              stroke={isCritical ? '#F43F5E' : isWarning ? '#F59E0B' : '#10B981'}
                              strokeWidth="1.75"
                              strokeLinecap="round"
                            />
                          </svg>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              isCritical
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : isWarning
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isCritical ? 'Frozen' : isWarning ? 'Warning' : 'Healthy'}
                          </span>
                        </div>
                      </div>

                      {/* Horizontal Burn-rate Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(slo.budgetRemainingPercent, 2)}%` }}
                        />
                      </div>

                      {/* Raw numbers as inline text */}
                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span>Target: {slo.target}%</span>
                          <span>•</span>
                          <span>Current: {slo.currentUptime}%</span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              isCritical
                                ? 'text-rose-500'
                                : isWarning
                                ? 'text-amber-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            Remaining: {slo.budgetRemainingPercent}%
                          </span>
                        </div>

                        <div className="font-mono text-[11px]">
                          Burn Rate: <span className="font-bold text-slate-700 dark:text-slate-300">{slo.burnRate}x</span>
                        </div>
                      </div>

                      {/* Safety Freeze Toggle */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Deploy Safety:</span>
                          {frozenServices[slo.service] ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              Deploys Frozen (Hotfixes Only)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Deploys Active
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFrozenServices((prev) => ({ ...prev, [slo.service]: !prev[slo.service] }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                            frozenServices[slo.service]
                              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                          }`}
                        >
                          {frozenServices[slo.service] ? 'Unfreeze' : 'Freeze Deploys'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canary Deployment Gate Policy Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                    Canary Gate Policy
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  Enforcement: Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white">Budget &gt; 20% (Nominal)</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Standard autonomous canary pipelines proceed with automated 5% → 25% → 100% rollout.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Budget 10% – 20% (Warning)</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Canary promotions require explicit human confirmation. Autonomous promotion countdown is paused.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Budget &lt; 10% (Freeze)</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
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
