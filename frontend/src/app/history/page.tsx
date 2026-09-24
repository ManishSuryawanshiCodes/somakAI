"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Terminal,
  TrendingDown,
  DollarSign,
  Cpu,
  Layers,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { useOrg } from '@/context/OrgContext';

interface HistoricalIncident {
  id: string;
  severity: 'SEV-1' | 'SEV-2';
  service: string;
  title: string;
  fingerprint: string;
  status: 'READY_FOR_DEPLOY' | 'RESOLVED' | 'CANARY_VERIFYING';
  mttr: string;
  timestamp: string;
  costSaved: string;
  confidence: number;
}

const HISTORICAL_INCIDENTS: HistoricalIncident[] = [
  {
    id: 'INC-2041',
    severity: 'SEV-1',
    service: 'auth-service',
    title: 'V8 Heap Memory Exhaustion in TokenService.verify()',
    fingerprint: 'MEM_LEAK_AUTH_TOKEN_SVC',
    status: 'READY_FOR_DEPLOY',
    mttr: '4m 12s',
    timestamp: '2m ago',
    costSaved: '$42,500',
    confidence: 99.4,
  },
  {
    id: 'INC-1892',
    severity: 'SEV-2',
    service: 'payment-gateway',
    title: 'Stripe Webhook Event Idempotency Timeout Under Load',
    fingerprint: 'TIMEOUT_PAYMENT_WEBHOOK_IDEM',
    status: 'RESOLVED',
    mttr: '3m 50s',
    timestamp: 'Yesterday, 18:22 UTC',
    costSaved: '$18,900',
    confidence: 98.8,
  },
  {
    id: 'INC-1420',
    severity: 'SEV-1',
    service: 'ingress-nginx',
    title: '502 Bad Gateway Spike via Upstream Connection Reset',
    fingerprint: 'ERR_UPSTREAM_CONN_RESET',
    status: 'RESOLVED',
    mttr: '3m 45s',
    timestamp: '3 days ago',
    costSaved: '$85,000',
    confidence: 99.1,
  },
  {
    id: 'INC-0914',
    severity: 'SEV-2',
    service: 'redis-cluster',
    title: 'Sentinel Split-Brain Failover Quorum Desynchronization',
    fingerprint: 'REDIS_SENTINEL_SPLIT_BRAIN',
    status: 'RESOLVED',
    mttr: '2m 58s',
    timestamp: 'Last week',
    costSaved: '$34,000',
    confidence: 97.5,
  },
  {
    id: 'INC-0782',
    severity: 'SEV-2',
    service: 'user-service',
    title: 'PostgreSQL Connection Pool Exhaustion on High Read Spike',
    fingerprint: 'PG_CONN_POOL_EXHAUSTED',
    status: 'RESOLVED',
    mttr: '4m 05s',
    timestamp: '2 weeks ago',
    costSaved: '$26,400',
    confidence: 99.0,
  },
  {
    id: 'INC-0641',
    severity: 'SEV-1',
    service: 'billing-api',
    title: 'Deadlock on Transaction Ledger Under Batch Invoice Run',
    fingerprint: 'DB_DEADLOCK_LEDGER_TX',
    status: 'RESOLVED',
    mttr: '5m 12s',
    timestamp: '3 weeks ago',
    costSaved: '$62,000',
    confidence: 96.9,
  },
];

export default function HistoryPage() {
  const { currentOrg } = useOrg();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filtered = HISTORICAL_INCIDENTS.filter((inc) => {
    if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) return false;
    if (selectedService !== 'ALL' && inc.service !== selectedService) return false;
    if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.fingerprint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-radial-gradient text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <History className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Incident History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Resolved incidents and autonomous MTTR benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
              {isAcme ? '95.2% Resolution Rate' : 'Clean Audit Trail'}
            </span>
          </div>
        </div>

        {!isAcme ? (
          <div className="glass-panel p-12 rounded-2xl shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                No past incidents recorded yet for {currentOrg?.name || 'this organization'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Resolved incidents and performance benchmarks will be recorded here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Go to Incident Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>

        {/* Analytics KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Incidents Triaged
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              42
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              40 Remediated Autonomously
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Avg Autonomous MTTR
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              3m 42s
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              94.8% reduction vs manual (45m)
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cumulative Cost Saved
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              $418,200
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Based on $8,400/min tier</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sandbox Test Pass Rate
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              100%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>0 production regressions</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (INC-...), service, fingerprint, or error title..."
              className="w-full bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="SEV-1">SEV-1 Critical</option>
              <option value="SEV-2">SEV-2 Degraded</option>
            </select>

            {/* Service Filter */}
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Services</option>
              <option value="auth-service">auth-service</option>
              <option value="payment-gateway">payment-gateway</option>
              <option value="ingress-nginx">ingress-nginx</option>
              <option value="redis-cluster">redis-cluster</option>
              <option value="user-service">user-service</option>
              <option value="billing-api">billing-api</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY_FOR_DEPLOY">Ready For Deploy</option>
              <option value="RESOLVED">Resolved & Audited</option>
              <option value="CANARY_VERIFYING">Canary Verifying</option>
            </select>
          </div>
        </div>

        {/* Incident List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Incidents Found</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">No archive records match your search or active filters.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('ALL');
                  setSelectedService('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filtered.map((inc) => (
              <motion.div
                key={inc.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {inc.id}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        • {inc.service}
                      </span>
                      {/* Badge 1: Severity */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          inc.severity === 'SEV-1'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      {/* Badge 2: Status */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inc.status === 'READY_FOR_DEPLOY'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {inc.timestamp}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {inc.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {inc.fingerprint}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      MTTR: {inc.mttr}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      Saved: {inc.costSaved}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Confidence: {inc.confidence}%
                    </span>
                  </div>
                </div>

                {/* Quick Action Drill-down Links */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/remediation/${inc.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 text-xs font-semibold transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Studio</span>
                  </Link>

                  <Link
                    href={`/canary/${inc.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 text-xs font-semibold transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Canary</span>
                  </Link>

                  <Link
                    href={`/postmortem/${inc.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Post-Mortem</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
        </>
        )}
      </main>

      <FloatingDock incidentId="INC-2041" />
    </div>
  );
}
