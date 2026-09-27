"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  X,
  Search,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Shield,
  Activity,
  GitBranch,
  Terminal,
  Cloud,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import MiniSparkline from '@/components/MiniSparkline';
import { useToast } from '@/components/ToastProvider';
import { useOrg } from '@/context/OrgContext';

type CategoryFilter = 'All' | 'Monitoring' | 'Communication' | 'Cloud' | 'Version Control';

interface MarketplaceIntegration {
  id: string;
  name: string;
  category: 'Monitoring' | 'Communication' | 'Cloud' | 'Version Control';
  icon: any;
  iconBg: string;
  status: 'connected' | 'not_connected';
  description: string;
  eventsTrend: number[];
  recentEventsCount: string;
  webhookUrl?: string;
  configFields: { label: string; value: string; isSecret?: boolean }[];
}

const MARKETPLACE_INTEGRATIONS: MarketplaceIntegration[] = [
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Monitoring',
    icon: AlertTriangle,
    iconBg: 'bg-rose-500/10 text-rose-500',
    status: 'connected',
    description: 'Sub-10ms unhandled exception ingestion and stack trace fingerprinting.',
    eventsTrend: [14, 18, 12, 22, 28, 19, 14, 8, 4, 2],
    recentEventsCount: '1.2k events/hr',
    webhookUrl: 'https://api.somak.ai/v1/webhooks/sentry/wh_sec_89f029b4',
    configFields: [
      { label: 'Project DSN', value: 'https://8f01a@sentry.io/49219' },
      { label: 'Ingest Secret', value: 'whsec_••••••••••••••••8a92', isSecret: true },
      { label: 'Ingestion Mode', value: 'Real-time SSE Stream' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Version Control',
    icon: GitBranch,
    iconBg: 'bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white',
    status: 'connected',
    description: 'Autonomous pull request synthesis with syntax-verified AST diffs and Jest test reports.',
    eventsTrend: [2, 3, 1, 4, 2, 5, 3, 2, 4, 3],
    recentEventsCount: '24 PRs staged',
    webhookUrl: 'https://api.somak.ai/v1/webhooks/github/wh_sec_78411a',
    configFields: [
      { label: 'GitHub App ID', value: 'gh-app-784192' },
      { label: 'Target Repositories', value: 'auth-service, billing-api, user-service' },
      { label: 'PR Auto-Merge Gate', value: 'Enforce MicroVM exit-code 0' },
    ],
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'Communication',
    icon: Radio,
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    status: 'connected',
    description: 'Multi-tier on-call escalation paging and automatic resolution upon verified canary rollout.',
    eventsTrend: [5, 4, 8, 3, 2, 1, 0, 0, 1, 0],
    recentEventsCount: '0 active pages',
    webhookUrl: 'https://api.somak.ai/v1/webhooks/pagerduty/wh_sec_pd012',
    configFields: [
      { label: 'Integration Key', value: 'pd_live_••••••••••••••••c481', isSecret: true },
      { label: 'Escalation Policy', value: 'SRE Production Critical (5m Escalation)' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    icon: MessageSquare,
    iconBg: 'bg-indigo-500/10 text-indigo-500',
    status: 'connected',
    description: 'Real-time SEV-1 notification broadcasts and interactive canary promotion actions.',
    eventsTrend: [8, 12, 14, 18, 11, 7, 9, 6, 8, 5],
    recentEventsCount: '12 alerts / 24h',
    webhookUrl: 'https://api.somak.ai/v1/webhooks/slack/wh_sec_slk99',
    configFields: [
      { label: 'Alerts Channel', value: '#incident-alerts' },
      { label: 'Canary Notification Scope', value: '5% → 25% → 100% Rollouts' },
    ],
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Monitoring',
    icon: Activity,
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    status: 'connected',
    description: 'Distributed APM trace ingestion, latency threshold alarms, and container memory profiles.',
    eventsTrend: [40, 48, 55, 62, 51, 44, 38, 32, 28, 25],
    recentEventsCount: '4.8k spans/min',
    webhookUrl: 'https://api.somak.ai/v1/webhooks/datadog/wh_sec_dd48',
    configFields: [
      { label: 'Datadog Site', value: 'datadoghq.com' },
      { label: 'API Key', value: 'dd_api_••••••••••••••••a4e', isSecret: true },
      { label: 'APM Anomaly Monitor ID', value: 'mon_881920_latency_p99' },
    ],
  },
  {
    id: 'aws-kms',
    name: 'AWS KMS',
    category: 'Cloud',
    icon: Shield,
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    status: 'connected',
    description: 'Hardware Security Module (HSM) BYOK envelope encryption for tenancy data isolation.',
    eventsTrend: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    recentEventsCount: '100% encrypted',
    configFields: [
      { label: 'KMS Key ARN', value: 'arn:aws:kms:us-east-1:4921902:key/8a2b-9f1c' },
      { label: 'Region', value: 'us-east-1' },
      { label: 'Algorithm', value: 'AES_256_GCM (Envelope Wrapped)' },
    ],
  },
  {
    id: 'vault',
    name: 'HashiCorp Vault',
    category: 'Cloud',
    icon: Shield,
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    status: 'connected',
    description: 'Dynamic database credentials and ephemeral MicroVM sandbox tokens.',
    eventsTrend: [12, 14, 16, 18, 15, 12, 10, 8, 9, 8],
    recentEventsCount: '48 tokens leased',
    configFields: [
      { label: 'Vault Cluster Address', value: 'https://vault.internal.somak.ai:8200' },
      { label: 'Mount Path', value: 'secret/data/sre-production' },
    ],
  },
  {
    id: 'gcp-kms',
    name: 'Google Cloud KMS',
    category: 'Cloud',
    icon: Cloud,
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    status: 'connected',
    description: 'Cloud HSM multi-region cryptokeys with automatic 90-day rotation policies.',
    eventsTrend: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    recentEventsCount: 'Nominal HSM',
    configFields: [
      { label: 'Key Ring', value: 'projects/acme-prod/locations/global/keyRings/sre' },
      { label: 'Protection Level', value: 'HSM FIPS 140-2 Level 3' },
    ],
  },
];

export default function IntegrationsPage() {
  const { showToast } = useToast();
  const { currentOrg } = useOrg();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>(MARKETPLACE_INTEGRATIONS);
  const [activeSlideOver, setActiveSlideOver] = useState<MarketplaceIntegration | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const categories: CategoryFilter[] = ['All', 'Monitoring', 'Communication', 'Cloud', 'Version Control'];

  const filtered = integrations.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
    showToast('Webhook URL copied to clipboard', 'info');
  };

  const handleTestConnection = (name: string) => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      showToast(`Pinging ${name} endpoint... 200 OK (22ms roundtrip)`, 'success');
    }, 800);
  };

  const handleDisconnect = (id: string, name: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'not_connected' } : item))
    );
    setActiveSlideOver(null);
    showToast(`${name} disconnected from workspace`, 'info');
  };

  const handleConnect = (id: string, name: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'connected' } : item))
    );
    showToast(`${name} connected successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col pb-32 transition-colors selection:bg-indigo-500/20">
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
              Integration Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Connect observability, alerting, cloud BYOK encryption, and version control hooks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium border border-emerald-500/20">
              {integrations.filter((i) => i.status === 'connected').length} Connected
            </span>
          </div>
        </div>

        {/* Filter Chips + Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Simple Pill Row Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations..."
              className="w-full bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Marketplace Grid (One card per integration) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const Icon = item.icon;
            const isConnected = item.status === 'connected';

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-white/20 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200/60 dark:border-white/10'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                  {/* Mini Sparkline showing event trend */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{item.recentEventsCount}</span>
                    <MiniSparkline
                      data={item.eventsTrend}
                      color={isConnected ? 'emerald' : 'slate'}
                      width={44}
                      height={14}
                    />
                  </div>

                  {/* Single Action Button */}
                  {isConnected ? (
                    <button
                      type="button"
                      onClick={() => setActiveSlideOver(item)}
                      className="w-full py-2 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
                    >
                      Configure
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnect(item.id, item.name)}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs shadow-2xs transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Slide-over Configuration Panel */}
      <AnimatePresence>
        {activeSlideOver && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSlideOver(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-2xs transition-opacity"
            />

            {/* Sliding Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="w-screen max-w-md bg-white dark:bg-[#0A0A0A] border-l border-slate-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-7 flex flex-col justify-between overflow-y-auto"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeSlideOver.iconBg}`}>
                        {React.createElement(activeSlideOver.icon, { className: 'w-4 h-4' })}
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-slate-900 dark:text-white">
                          {activeSlideOver.name}
                        </h2>
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                          Connected & Active
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSlideOver(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Webhook URL Block if available */}
                  {activeSlideOver.webhookUrl && (
                    <div className="space-y-1.5 text-xs">
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Webhook Receiver URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={activeSlideOver.webhookUrl}
                          className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyWebhook(activeSlideOver.webhookUrl!)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Copy URL"
                        >
                          {copiedWebhook ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Configuration Fields */}
                  <div className="space-y-3 text-xs">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Configuration Parameters
                    </span>

                    <div className="space-y-3">
                      {activeSlideOver.configFields.map((field, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-1">
                          <span className="text-[11px] text-slate-400 block font-medium">
                            {field.label}
                          </span>
                          <span className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                            {field.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GitHub Specific Actions */}
                  {activeSlideOver.id === 'github' && (
                    <div className="pt-2 space-y-2">
                      <Link
                        href="/settings?tab=repositories"
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Configure Repository Mappings &rarr;</span>
                      </Link>
                    </div>
                  )}

                  {/* Test Connection Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestConnection(activeSlideOver.name)}
                      className="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isTesting ? 'Testing Handshake...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>

                {/* Disconnect Action at Bottom */}
                <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => handleDisconnect(activeSlideOver.id, activeSlideOver.name)}
                    className="w-full py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs transition-colors"
                  >
                    Disconnect Integration
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <FloatingDock />
    </div>
  );
}
