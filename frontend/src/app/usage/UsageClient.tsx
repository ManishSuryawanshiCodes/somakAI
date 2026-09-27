"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Zap,
  Terminal,
  Search,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Key,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import MiniSparkline from '@/components/MiniSparkline';
import { useOrg } from '@/context/OrgContext';
import { useNotifications } from '@/context/NotificationContext';
import { getOrgUsage } from '@/lib/api';
import type { OrgUsageSummary, ProviderModelSummary } from '@/lib/types';

interface MeteredResource {
  id: string;
  title: string;
  shortLabel: string;
  current: string;
  currentNum: number;
  limit: string;
  limitNum: number;
  unit: string;
  percent: number;
  trend: number[];
  detail: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export default function UsageClient() {
  const { currentOrg } = useOrg();
  const { addNotification } = useNotifications();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';
  const [usageData, setUsageData] = useState<OrgUsageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [quotaWarningFired, setQuotaWarningFired] = useState(false);

  useEffect(() => {
    setLoading(true);
    getOrgUsage(currentOrg?.id || 'org_acme')
      .then((data) => {
        if (data) setUsageData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentOrg?.id]);

  const fallbackBreakdown: ProviderModelSummary[] = [
    {
      provider: 'nvidia_nim',
      provider_name: 'NVIDIA NIM',
      model: 'nvidia/nemotron-3-super-120b-a12b',
      model_name: 'Nemotron-3-Super',
      stage: 'Triage',
      calls: 342,
      tokens_in: 240000,
      tokens_out: 88000,
      total_tokens: 328000,
      billing_type: 'metered',
      cost_saved: 1240.0,
      status: 'Active',
    },
    {
      provider: 'nvidia_nim',
      provider_name: 'NVIDIA NIM',
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      model_name: 'Nemotron-3-Ultra',
      stage: 'Synthesis',
      calls: 84,
      tokens_in: 820000,
      tokens_out: 280500,
      total_tokens: 1100500,
      billing_type: 'metered',
      cost_saved: 8900.0,
      status: 'Active',
    },
    {
      provider: 'gemini',
      provider_name: 'Google Gemini',
      model: 'gemini-flash-latest',
      model_name: 'Gemini 2.5 Flash',
      stage: 'Triage',
      calls: 56,
      tokens_in: 58000,
      tokens_out: 24000,
      total_tokens: 82000,
      billing_type: 'byok',
      cost_saved: 520.0,
      status: 'Active',
    },
    {
      provider: 'anthropic',
      provider_name: 'Anthropic',
      model: 'claude-3-5-sonnet-20241022',
      model_name: 'Claude 3.5 Sonnet',
      stage: 'Synthesis',
      calls: 12,
      tokens_in: 160000,
      tokens_out: 85000,
      total_tokens: 245000,
      billing_type: 'byok',
      cost_saved: 3400.0,
      status: 'Active',
    },
    {
      provider: 'openai',
      provider_name: 'OpenAI',
      model: 'gpt-4o',
      model_name: 'GPT-4o',
      stage: 'Synthesis',
      calls: 38,
      tokens_in: 120000,
      tokens_out: 48000,
      total_tokens: 168000,
      billing_type: 'byok',
      cost_saved: 1850.0,
      status: 'Active',
    },
  ];

  const breakdown = usageData?.breakdown && usageData.breakdown.length > 0
    ? usageData.breakdown
    : (isAcme ? fallbackBreakdown : []);

  const currentPlan = ((currentOrg?.plan || 'team').toLowerCase()) as 'free' | 'team' | 'business' | 'enterprise';

  const planConfig = {
    free: {
      label: 'Developer Tier · 1 Seat Active',
      avoidedDowntime: '$12,500',
      sla: 'Community SLA (Standard)',
      tokensLimit: 500000,
      tokensLimitStr: '500,000',
      sandboxLimit: 25,
      sandboxLimitStr: '25',
      tavilyLimit: 100,
      tavilyLimitStr: '100',
      envoyLimit: 50000,
      envoyLimitStr: '50,000',
    },
    team: {
      label: 'Team Plan · 25 Seats Active',
      avoidedDowntime: '$418,200',
      sla: 'Tier-1 SLA ($3,200/min)',
      tokensLimit: 5000000,
      tokensLimitStr: '5,000,000',
      sandboxLimit: 250,
      sandboxLimitStr: '250',
      tavilyLimit: 1000,
      tavilyLimitStr: '1,000',
      envoyLimit: 500000,
      envoyLimitStr: '500,000',
    },
    business: {
      label: 'Business Plan · Unlimited Seats',
      avoidedDowntime: '$890,000',
      sla: 'Tier-1 SLA ($4,800/min)',
      tokensLimit: 20000000,
      tokensLimitStr: '20,000,000',
      sandboxLimit: 1500,
      sandboxLimitStr: '1,500',
      tavilyLimit: 5000,
      tavilyLimitStr: '5,000',
      envoyLimit: 2000000,
      envoyLimitStr: '2,000,000',
    },
    enterprise: {
      label: 'Enterprise Dedicated Tier · Unlimited Seats',
      avoidedDowntime: '$1,850,000',
      sla: 'Tier-0 SLA ($8,400/min)',
      tokensLimit: 50000000,
      tokensLimitStr: '50,000,000',
      sandboxLimit: 5000,
      sandboxLimitStr: '5,000',
      tavilyLimit: 10000,
      tavilyLimitStr: '10,000',
      envoyLimit: 5000000,
      envoyLimitStr: '5,000,000',
    },
  }[currentPlan] || {
    label: 'Team Plan · 25 Seats Active',
    avoidedDowntime: '$418,200',
    sla: 'Tier-1 SLA ($3,200/min)',
    tokensLimit: 5000000,
    tokensLimitStr: '5,000,000',
    sandboxLimit: 250,
    sandboxLimitStr: '250',
    tavilyLimit: 1000,
    tavilyLimitStr: '1,000',
    envoyLimit: 500000,
    envoyLimitStr: '500,000',
  };

  const nemotronUsed = usageData ? usageData.platform_tokens_used : (isAcme ? (currentPlan === 'free' ? 142500 : 1428500) : 0);
  const nemotronPercent = Math.min(100, Math.round((nemotronUsed / planConfig.tokensLimit) * 1000) / 10);

  const sandboxUsed = isAcme ? (currentPlan === 'free' ? 14 : 84) : 0;
  const sandboxPercent = Math.min(100, Math.round((sandboxUsed / planConfig.sandboxLimit) * 1000) / 10);

  const tavilyUsed = isAcme ? (currentPlan === 'free' ? 32 : 142) : 0;
  const tavilyPercent = Math.min(100, Math.round((tavilyUsed / planConfig.tavilyLimit) * 1000) / 10);

  const envoyUsed = isAcme ? (currentPlan === 'free' ? 18000 : 112000) : 0;
  const envoyPercent = Math.min(100, Math.round((envoyUsed / planConfig.envoyLimit) * 1000) / 10);

  const resources: MeteredResource[] = [
    {
      id: 'nemotron',
      title: 'NVIDIA Nemotron-3 Tokens',
      shortLabel: 'Nemotron Tokens',
      current: nemotronUsed.toLocaleString(),
      currentNum: nemotronUsed,
      limit: planConfig.tokensLimitStr,
      limitNum: planConfig.tokensLimit,
      unit: 'Tokens',
      percent: nemotronPercent,
      trend: [120, 180, 240, 310, 420, 580, 720, 890, 1100, 1280, 1428],
      detail: isAcme ? 'Ultra-550B (AST Synthesis): 1.1M · Nano-30B (Triage): 328k' : 'Live metered consumption across active incident pipelines',
      color: 'indigo',
    },
    {
      id: 'sandbox',
      title: 'Nebius Firecracker MicroVM Runs',
      shortLabel: 'Sandbox Runs',
      current: sandboxUsed.toLocaleString(),
      currentNum: sandboxUsed,
      limit: planConfig.sandboxLimitStr,
      limitNum: planConfig.sandboxLimit,
      unit: 'Runs',
      percent: sandboxPercent,
      trend: [5, 12, 18, 26, 35, 48, 59, 68, 74, 80, 84],
      detail: isAcme ? 'Average verification latency: 4.2s (Exit 0) · 100% clean teardown' : 'No sandbox runs recorded yet',
      color: 'emerald',
    },
    {
      id: 'tavily',
      title: 'Tavily Diagnostic Search Grounding',
      shortLabel: 'Search Queries',
      current: tavilyUsed.toLocaleString(),
      currentNum: tavilyUsed,
      limit: planConfig.tavilyLimitStr,
      limitNum: planConfig.tavilyLimit,
      unit: 'Queries',
      percent: tavilyPercent,
      trend: [10, 22, 35, 48, 62, 75, 90, 108, 120, 134, 142],
      detail: isAcme ? 'Zero rate-limit throttling observed · Official docs & CVE index' : 'No diagnostic queries executed yet',
      color: 'indigo',
    },
    {
      id: 'envoy',
      title: 'Envoy Telemetry Ingestion Peak',
      shortLabel: 'Telemetry Ingestion',
      current: envoyUsed.toLocaleString(),
      currentNum: envoyUsed,
      limit: planConfig.envoyLimitStr,
      limitNum: planConfig.envoyLimit,
      unit: 'Req/min Peak',
      percent: envoyPercent,
      trend: [45, 60, 80, 75, 95, 110, 105, 98, 115, 120, 112],
      detail: isAcme ? 'Ingress stream throughput: 18.4 MB/s · TLS 1.3 encrypted' : 'Nominal telemetry stream active',
      color: 'slate',
    },
  ];

  // Check for any resource >= 80% to fire an alert/notification
  const highQuotaResources = resources.filter((r) => r.percent >= 80);

  useEffect(() => {
    if (highQuotaResources.length > 0 && !quotaWarningFired) {
      setQuotaWarningFired(true);
      const res = highQuotaResources[0];
      addNotification({
        title: `Quota Alert: ${res.shortLabel} at ${res.percent}%`,
        description: `${res.title} has reached ${res.percent}% of monthly organization threshold (${res.current} / ${res.limit} ${res.unit}).`,
        severity: 'warning',
        link: '/usage',
      });
    }
  }, [highQuotaResources, quotaWarningFired, addNotification]);

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070709] text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Top: Single Headline Stat & Small Inline Context */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
              {planConfig.avoidedDowntime}
              <span className="text-base font-normal font-sans text-slate-500 dark:text-slate-400 ml-2">
                saved in avoided downtime
              </span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono flex items-center flex-wrap gap-1.5">
              <span>Billing Cycle: Current Month · {planConfig.label} · {planConfig.sla}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <Link
                href="/settings?tab=billing"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-sans font-semibold"
              >
                Manage Billing &amp; Invoices →
              </Link>
            </div>
          </div>

          <Link
            href="/audit"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors shrink-0"
          >
            <span>View Incident Audit Trail</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* High Quota Alert Banner (If >= 80%) */}
        {highQuotaResources.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Warning:</strong> {highQuotaResources.map((r) => r.shortLabel).join(', ')} has exceeded 80% quota threshold. Consider expanding plan headroom.
              </span>
            </div>
            <Link
              href="/settings"
              className="text-xs font-bold underline shrink-0 hover:text-amber-800 dark:hover:text-white"
            >
              Upgrade Headroom →
            </Link>
          </div>
        )}

        {/* Section 1: Metered Resources Compact List (Vercel Usage Pattern) */}
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <span>Metered Resource</span>
            <div className="flex items-center gap-8">
              <span className="hidden sm:inline">30-Day Trend</span>
              <span>Used / Limit</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {resources.map((res) => {
              const isOver80 = res.percent >= 80;
              const isExpanded = expandedRow === res.id;

              return (
                <div key={res.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                  {/* Compact Row */}
                  <div
                    onClick={() => toggleRow(res.id)}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    {/* Left: Label + Details Chevron */}
                    <div className="flex items-center gap-2.5 min-w-0 sm:w-1/3">
                      <button
                        type="button"
                        aria-label="Toggle details"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {res.title}
                      </span>
                    </div>

                    {/* Middle: Slim Progress Bar + Sparkline */}
                    <div className="flex-1 flex items-center gap-3 sm:px-4">
                      {/* Slim Single-Line Progress Bar */}
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver80
                              ? 'bg-rose-500'
                              : res.color === 'emerald'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-600 dark:bg-indigo-400'
                          }`}
                          style={{ width: `${Math.min(100, res.percent)}%` }}
                        />
                      </div>

                      {/* Mini Inline Trend Sparkline */}
                      <div className="hidden sm:flex items-center shrink-0 w-16 justify-end" title="Usage trend across billing cycle">
                        <MiniSparkline
                          data={res.trend}
                          color={isOver80 ? 'rose' : res.color === 'emerald' ? 'emerald' : 'indigo'}
                          width={54}
                          height={14}
                        />
                      </div>
                    </div>

                    {/* Right: Used / Limit Number */}
                    <div className="sm:w-1/4 flex items-center justify-end gap-2 shrink-0 font-mono text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {res.current}
                      </span>
                      <span className="text-slate-400">/ {res.limit} {res.unit}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isOver80
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                      }`}>
                        {res.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Collapsed Details Subtext */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-3 pt-0 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{res.detail}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Multi-Provider AI (BYOK) Telemetry Breakdown */}
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                <span>AI Provider &amp; Model Breakdown</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time token telemetry tracking Platform Metered vs. customer BYOK keys
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Platform Metered: {usageData ? usageData.platform_metered_calls : (isAcme ? 426 : 0)} calls
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                BYOK: {usageData ? usageData.byok_calls : (isAcme ? 104 : 0)} calls
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-2.5 px-3.5 font-bold">Provider &amp; Model</th>
                  <th className="py-2.5 px-3.5 font-bold">Pipeline Stage</th>
                  <th className="py-2.5 px-3.5 font-bold">Billing Mode</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Invocations</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Tokens</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Estimated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                {breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No AI token consumption recorded yet.
                    </td>
                  </tr>
                ) : (
                  breakdown.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white font-sans text-xs">
                              {item.model_name || item.model}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.provider_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.stage.toLowerCase() === 'triage'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                        }`}>
                          {item.stage}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5">
                        {item.billing_type === 'metered' ? (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            Platform Included
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            BYOK (Direct)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {item.calls.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3.5 text-right text-slate-600 dark:text-slate-300">
                        {item.total_tokens.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        ${item.cost_saved.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* BYOK Exemption Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                BYOK API calls route directly with your provider keys and do not decrement from your monthly {planConfig.tokensLimitStr} platform token quota.
              </span>
            </div>
            <Link
              href="/settings"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline shrink-0 ml-3"
            >
              Manage Keys →
            </Link>
          </div>
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
