"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  Send,
  RefreshCw,
  Cpu,
  Globe,
  Radio,
  X,
  Lock,
  Search,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { useToast } from '@/components/ToastProvider';

interface Integration {
  id: string;
  name: string;
  category: 'Incident Alerting' | 'On-Call' | 'Source Control' | 'AI Inference' | 'Search Grounding' | 'APM Telemetry';
  iconColor: string;
  status: 'connected' | 'needs_attention' | 'disconnected';
  lastSync: string;
  description: string;
  fields: { label: string; value: string; isSecret?: boolean }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'Incident Alerting',
    iconColor: 'bg-emerald-500',
    status: 'connected',
    lastSync: '2 minutes ago',
    description: 'Delivers real-time SEV-1 notifications and interactive canary deployment approval buttons to #incident-alerts.',
    fields: [
      { label: 'Webhook URL', value: '••••••••s3nt', isSecret: true },
      { label: 'Channel', value: '#incident-alerts' },
    ],
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'On-Call',
    iconColor: 'bg-green-600',
    status: 'connected',
    lastSync: '10 minutes ago',
    description: 'Triggers primary/secondary on-call escalation paging and automatically resolves alerts upon verified canary rollout.',
    fields: [
      { label: 'Integration Key', value: '••••••••c481', isSecret: true },
      { label: 'Escalation Policy', value: 'SRE Production Critical (5m)' },
    ],
  },
  {
    id: 'nebius',
    name: 'Nebius Token Factory',
    category: 'AI Inference',
    iconColor: 'bg-indigo-600',
    status: 'connected',
    lastSync: 'Just now',
    description: 'High-throughput OpenAI-compatible endpoints powering NVIDIA Nemotron-3-Ultra (550B) AST synthesis and Nemotron-3-Nano triage.',
    fields: [
      { label: 'Base URL', value: 'https://api.tokenfactory.us-central1.nebius.com/v1/' },
      { label: 'API Key', value: '••••••••b321', isSecret: true },
    ],
  },
  {
    id: 'tavily',
    name: 'Tavily Search API',
    category: 'Search Grounding',
    iconColor: 'bg-cyan-600',
    status: 'connected',
    lastSync: '14:02 UTC',
    description: 'Provides autonomous real-time diagnostic research grounding against official documentation and GitHub issues.',
    fields: [
      { label: 'API Key', value: '••••••••aa8', isSecret: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Cloud / Enterprise',
    category: 'Source Control',
    iconColor: 'bg-slate-900',
    status: 'connected',
    lastSync: '1 hour ago',
    description: 'Creates autonomous pull requests containing validated AST hotfixes with linked Jest sandbox execution results.',
    fields: [
      { label: 'App Installation ID', value: 'gh-app-784192' },
      { label: 'Target Repo', value: 'somak-ai/auth-service' },
    ],
  },
  {
    id: 'datadog',
    name: 'Datadog APM',
    category: 'APM Telemetry',
    iconColor: 'bg-purple-600',
    status: 'connected',
    lastSync: '4 minutes ago',
    description: 'Continuous ingestion of distributed traces, container memory profiles, and upstream Envoy 5xx error spikes.',
    fields: [
      { label: 'API Key', value: '••••••••a4e', isSecret: true },
      { label: 'Site', value: 'datadoghq.com' },
    ],
  },
];

export default function IntegrationsPage() {
  const { showToast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const handleTestConnection = (name: string) => {
    showToast(`Pinging ${name} endpoint... Connected successfully (24ms)`, 'success');
  };

  const filteredIntegrations = INTEGRATIONS.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Integrations
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {INTEGRATIONS.length} Connected
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Connected telemetry sources, alert channels, and cloud infrastructure.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations by name or category..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Incident Alerting">Incident Alerting</option>
              <option value="On-Call">On-Call</option>
              <option value="AI Inference">AI Inference</option>
              <option value="Search Grounding">Search Grounding</option>
              <option value="Source Control">Source Control</option>
              <option value="APM Telemetry">APM Telemetry</option>
            </select>
          </div>
        </div>

        {/* Integrations Grid */}
        {filteredIntegrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Integrations Found</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">No connectors match your current search.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((intg) => (
            <div
              key={intg.id}
              className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${intg.iconColor} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                      {intg.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {intg.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {intg.category}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Connected
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {intg.description}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Last Sync:</span>
                  <span>{intg.lastSync}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleTestConnection(intg.name)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors text-center"
                  >
                    Test Ping
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIntegration(intg);
                      setModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors text-center"
                  >
                    Configure
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>

      {/* Configure Modal */}
      <AnimatePresence>
        {modalOpen && selectedIntegration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Configure {selectedIntegration.name}</span>
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedIntegration.fields.map((f, idx) => (
                  <div key={idx}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {f.label}
                    </label>
                    <input
                      type={f.isSecret ? 'password' : 'text'}
                      defaultValue={f.value}
                      className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    showToast(`${selectedIntegration.name} settings updated`, 'success');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs"
                >
                  Save Integration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingDock />
    </div>
  );
}
