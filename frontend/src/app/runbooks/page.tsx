'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  Code2,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import { useToast } from '@/components/ToastProvider';

interface PatternVersion {
  version: string;
  date: string;
  note: string;
  isCurrent?: boolean;
}

interface RunbookPattern {
  id: string;
  title: string;
  targetService: string;
  category: string;
  description: string;
  confidenceScore: number;
  timesApplied: number;
  activeIncidentMatch?: string;
  versions: PatternVersion[];
}

const RUNBOOKS: RunbookPattern[] = [
  {
    id: 'AST-PAT-01',
    title: 'Unbounded Map to TTL-Bounded LRU Cache',
    targetService: 'auth-service',
    category: 'Memory',
    description: 'Replaces unbounded JavaScript Map memory collections with size-limited, TTL-evicted LRU cache to prevent V8 heap exhaustion.',
    confidenceScore: 99.4,
    timesApplied: 14,
    activeIncidentMatch: 'INC-2041',
    versions: [
      { version: 'v1.3', date: 'Today', note: 'Added 5,000-key capacity clamp and 5-min TTL default', isCurrent: true },
      { version: 'v1.2', date: '3 weeks ago', note: 'Added Firecracker MicroVM regression test assertions' },
      { version: 'v1.0', date: '2 months ago', note: 'Initial AST synthesis template for Node.js memory leaks' },
    ],
  },
  {
    id: 'AST-PAT-02',
    title: 'EventEmitter Listener Leak Disposer',
    targetService: 'auth-service',
    category: 'Resource Leaks',
    description: 'Ensures one-off session listeners are cleanly deregistered in finally blocks and adjusts listener limits for traffic bursts.',
    confidenceScore: 98.8,
    timesApplied: 9,
    activeIncidentMatch: 'INC-2041',
    versions: [
      { version: 'v1.1', date: '1 week ago', note: 'Auto-bind AbortSignal cleanup to listener lifecycle', isCurrent: true },
      { version: 'v1.0', date: '1 month ago', note: 'Initial event listener disposal template' },
    ],
  },
  {
    id: 'AST-PAT-03',
    title: 'PostgreSQL Pool Timeout with Jitter Backoff',
    targetService: 'user-service',
    category: 'Database',
    description: 'Implements connection retry loops with randomized exponential jitter when PostgreSQL pools hit max capacity.',
    confidenceScore: 99.1,
    timesApplied: 22,
    versions: [
      { version: 'v2.0', date: '5 days ago', note: 'Added full decorrelated jitter formula for pool burst protection', isCurrent: true },
      { version: 'v1.5', date: '2 months ago', note: 'Standard exponential backoff with 30s timeout cap' },
    ],
  },
  {
    id: 'AST-PAT-04',
    title: 'Payment Gateway Webhook Idempotency Lock',
    targetService: 'payment-gateway',
    category: 'Concurrency',
    description: 'Adds atomic Redis distributed locks to webhook ingress handlers to prevent duplicate charge executions under network retries.',
    confidenceScore: 99.7,
    timesApplied: 31,
    versions: [
      { version: 'v2.1', date: '2 weeks ago', note: 'Extended lock renewal lease to 15 seconds during stripe spikes', isCurrent: true },
      { version: 'v1.8', date: '3 months ago', note: 'Added SETNX atomic script with SHA256 payload checksum' },
    ],
  },
  {
    id: 'AST-PAT-05',
    title: 'Async Context Lost in Promise.all Catch Handler',
    targetService: 'order-service',
    category: 'Async/Concurrency',
    description: 'Binds trace parent propagation across parallel worker threads to prevent telemetry disconnects in Sentry traces.',
    confidenceScore: 97.9,
    timesApplied: 6,
    versions: [
      { version: 'v1.0', date: '1 month ago', note: 'AsyncLocalStorage binding within Promise.all settlement', isCurrent: true },
    ],
  },
];

function RunbooksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incidentQuery = searchParams.get('incident');

  // If incident param is provided, use it; otherwise default to no incident context unless requested
  const [activeIncident, setActiveIncident] = useState<string | null>(incidentQuery);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [stagingId, setStagingId] = useState<string | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const { addToast } = useToast();

  const categories = ['all', 'Memory', 'Resource Leaks', 'Database', 'Concurrency', 'Async/Concurrency'];

  const filtered = useMemo(() => {
    return RUNBOOKS.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.targetService.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory]);

  // Find the single highest-confidence match for the active incident
  const topMatchId = useMemo(() => {
    if (!activeIncident) return null;
    const matches = filtered
      .filter((r) => r.activeIncidentMatch === activeIncident)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
    return matches[0]?.id || null;
  }, [activeIncident, filtered]);

  const handleApply = (pattern: RunbookPattern) => {
    setStagingId(pattern.id);
    addToast(`Staging ${pattern.id} to hotfix pipeline for ${pattern.targetService}...`, 'info');
    setTimeout(() => {
      setStagingId(null);
      setAppliedId(pattern.id);
      addToast(`Pattern ${pattern.id} staged to hotfix pipeline for ${pattern.targetService}.`, 'success');
      setTimeout(() => setAppliedId(null), 2000);
    }, 1200);
  };

  const handleApplyToActiveIncident = (pattern: RunbookPattern) => {
    if (!activeIncident) return;
    addToast(`Staging ${pattern.id} AST fix directly to active incident ${activeIncident}...`, 'info');
    router.push(`/remediation/${activeIncident}?pattern=${pattern.id}`);
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-4xl w-full mx-auto space-y-8 pb-24">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Radar</span>
        </Link>

        {/* Clean Header: Title + Active Incident Indicator + Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Runbook Patterns
              </h1>
              {activeIncident && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Target: {activeIncident}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeIncident ? (
                <span className="flex items-center gap-2">
                  <span>Filtered recommendations for {activeIncident}.</span>
                  <button
                    onClick={() => setActiveIncident(null)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    Browse all patterns
                  </button>
                </span>
              ) : (
                'Verified Abstract Syntax Tree remediation templates for recurring failure modes.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Single Search Box */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patterns..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-white"
              />
            </div>

            {/* Single Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedCategory === 'all' ? 'Filter' : selectedCategory}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-lg py-1 z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* List of Runbook Pattern Cards */}
        <div className="space-y-3.5">
          {filtered.map((item) => {
            const isTopMatch = activeIncident && item.id === topMatchId;
            const isApplied = appliedId === item.id;
            const isStaging = stagingId === item.id;
            const isVersionExpanded = expandedVersionId === item.id;
            const currentVersion = item.versions.find((v) => v.isCurrent) || item.versions[0];

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#0A0A0A] border rounded-2xl p-5 sm:p-6 shadow-xs transition-all space-y-3.5 ${
                  isTopMatch
                    ? 'border-emerald-500/50 dark:border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{item.id}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {item.targetService}
                      </span>
                      {activeIncident && isTopMatch && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Best Match for {activeIncident}</span>
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {item.confidenceScore}% confidence
                    </span>

                    {/* Prominent Apply button ONLY on the single top match */}
                    {isTopMatch ? (
                      <button
                        onClick={() => handleApplyToActiveIncident(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Apply to {activeIncident}</span>
                      </button>
                    ) : (
                      /* Clean neutral Stage Fix button on all secondary/unmatched cards */
                      <button
                        onClick={() => handleApply(item)}
                        disabled={isApplied || isStaging}
                        title={isStaging ? 'Staging fix to pipeline…' : isApplied ? 'Fix staged' : 'Stage fix to hotfix pipeline'}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-600 text-white'
                            : isStaging
                            ? 'bg-slate-400 text-white cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-2xs'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Staged</span>
                          </>
                        ) : isStaging ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Staging…</span>
                          </>
                        ) : (
                          <>
                            <span>Stage Fix</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                {/* Version History Accordion / Toggle */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedVersionId(isVersionExpanded ? null : item.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {currentVersion.version}
                      </span>
                      <span className="text-[11px] text-slate-400">({item.versions.length} revisions)</span>
                      {isVersionExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                    </button>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Applied {item.timesApplied} times in production
                    </span>
                  </div>

                  {isVersionExpanded && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2 animate-in fade-in duration-100">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        Version History & Release Notes
                      </div>
                      <div className="space-y-1.5">
                        {item.versions.map((ver) => (
                          <div
                            key={ver.version}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 py-1 border-b border-slate-100 dark:border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                                {ver.version}
                              </span>
                              {ver.isCurrent && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Current
                                </span>
                              )}
                              <span className="text-slate-600 dark:text-slate-300 text-[11px]">{ver.note}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">{ver.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function RunbooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A]" />}>
      <RunbooksContent />
    </Suspense>
  );
}
