"use client";

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  ArrowRight,
  Shield,
  Layers,
  Key,
  Check,
  RefreshCw,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { useOrg } from '@/context/OrgContext';
import { getOrgUsage } from '@/lib/api';
import type { OrgUsageSummary, ProviderModelSummary } from '@/lib/types';

export default function UsagePage() {
  const { currentOrg } = useOrg();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';
  const [usageData, setUsageData] = useState<OrgUsageSummary | null>(null);
  const [loading, setLoading] = useState(false);

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
      provider: 'nebius',
      provider_name: 'NVIDIA / Nebius Token Factory',
      model: 'nvidia/nemotron-3-nano-30b-a3b',
      model_name: 'Nemotron-3-Nano (30B)',
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
      provider: 'nebius',
      provider_name: 'NVIDIA / Nebius Token Factory',
      model: 'nvidia/nemotron-3-ultra-550b',
      model_name: 'Nemotron-3-Ultra (550B MoE)',
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
      provider: 'anthropic',
      provider_name: 'Anthropic Claude',
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
      provider_name: 'OpenAI GPT',
      model: 'gpt-4o-mini',
      model_name: 'GPT-4o Mini',
      stage: 'Triage',
      calls: 68,
      tokens_in: 58000,
      tokens_out: 24000,
      total_tokens: 82000,
      billing_type: 'byok',
      cost_saved: 650.0,
      status: 'Active',
    },
    {
      provider: 'google',
      provider_name: 'Google Gemini',
      model: 'gemini-1.5-flash',
      model_name: 'Gemini 1.5 Flash',
      stage: 'Triage',
      calls: 24,
      tokens_in: 26000,
      tokens_out: 12000,
      total_tokens: 38000,
      billing_type: 'byok',
      cost_saved: 290.0,
      status: 'Active',
    },
  ];

  const breakdown = usageData?.breakdown && usageData.breakdown.length > 0
    ? usageData.breakdown
    : (isAcme ? fallbackBreakdown : []);

  const quotas = [
    {
      title: 'NVIDIA Nemotron-3 Token Consumption',
      current: usageData ? usageData.platform_tokens_used.toLocaleString() : (isAcme ? '1,428,500' : '0'),
      limit: '5,000,000',
      unit: 'Tokens',
      percent: usageData ? usageData.platform_tokens_percent : (isAcme ? 28.5 : 0),
      detail: isAcme ? 'Ultra-550B (AST Synthesis): 1.1M • Nano-30B (Triage): 328k' : 'Live metered consumption across active incident pipelines',
      color: 'bg-indigo-500',
    },
    {
      title: 'Isolated Nebius Container Sandbox Executions',
      current: isAcme ? '84' : '0',
      limit: '250',
      unit: 'Runs',
      percent: isAcme ? 33.6 : 0,
      detail: isAcme ? 'Average verification execution latency: 4.2s (Exit 0)' : 'No sandbox runs recorded yet',
      color: 'bg-emerald-500',
    },
    {
      title: 'Tavily Diagnostic Search Grounding Queries',
      current: isAcme ? '142' : '0',
      limit: '1,000',
      unit: 'Queries',
      percent: isAcme ? 14.2 : 0,
      detail: isAcme ? 'Zero rate-limit throttling observed' : 'No diagnostic queries executed yet',
      color: 'bg-cyan-500',
    },
    {
      title: 'Envoy High-Throughput Telemetry Ingestion',
      current: isAcme ? '112,000' : '0',
      limit: '500,000',
      unit: 'Req/min Peak',
      percent: isAcme ? 22.4 : 0,
      detail: isAcme ? 'Ingress bandwidth: 18.4 MB/s stream' : 'Nominal telemetry stream active',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Platform Usage &amp; Quota
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Billing Cycle: Sep 1 – Sep 30
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-provider AI token consumption, BYOK invocation metrics, and monthly organization quotas.
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
              Based on enterprise Tier-0 SLA downtime valuation ($8,400/min) across autonomous mitigations.
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

        {/* Platform Quotas Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotas.map((q, idx) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 space-y-3"
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
              <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
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

              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/10/80">
                {q.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Multi-Provider AI (BYOK) Breakdown Section */}
        <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Key className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-white">
                  Consumption Breakdown by AI Provider &amp; Model
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Detailed telemetry tracking calls and tokens across Platform Metered vs. customer BYOK models.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-bold border border-indigo-500/20">
                <span>Platform Metered:</span>
                <span>{usageData ? usageData.platform_metered_calls : (isAcme ? 426 : 0)} calls</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                <span>BYOK Direct:</span>
                <span>{usageData ? usageData.byok_calls : (isAcme ? 104 : 0)} calls</span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-bold">Provider &amp; Engine</th>
                  <th className="py-3 px-4 font-bold">Pipeline Stage</th>
                  <th className="py-3 px-4 font-bold">Billing Mode</th>
                  <th className="py-3 px-4 font-bold text-right">Invocations</th>
                  <th className="py-3 px-4 font-bold text-right">Tokens Consumed</th>
                  <th className="py-3 px-4 font-bold text-right">Estimated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-3">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">No AI Token Consumption Recorded</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Invocations through Platform Metered or BYOK inference models will appear here in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  breakdown.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${
                          item.provider === 'nebius'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : item.provider === 'anthropic'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : item.provider === 'openai'
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.provider_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {item.model}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        item.stage.toLowerCase() === 'triage'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {item.stage}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.billing_type === 'metered' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Platform Included
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <Key className="w-3 h-3" />
                          BYOK (Direct Billing)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-right">
                      {item.calls.toLocaleString()} calls
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 text-right">
                      <div className="font-bold">{item.total_tokens.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.tokens_in.toLocaleString()} in • {item.tokens_out.toLocaleString()} out
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      ${item.cost_saved.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          {/* BYOK Exemption Notice */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5/40 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Quota Exemption Guarantee:</strong> BYOK API calls route directly with your organization&apos;s provider credentials and do not decrement from your monthly 5,000,000 platform token quota.
              </span>
            </div>
            <Link
              href="/settings"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 ml-4"
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
