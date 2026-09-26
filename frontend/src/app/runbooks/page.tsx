"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getRunbooks } from '@/lib/api';
import {
  BookOpen,
  Search,
  Code2,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Tag,
  ChevronDown,
  ChevronUp,
  Layers,
  Table as TableIcon,
  X,
  History,
  Check,
  AlertTriangle,
  Server,
  ArrowUpDown,
  FolderTree,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { useOrg } from '@/context/OrgContext';

interface RunbookPattern {
  id: string;
  title: string;
  fingerprint: string;
  language: string;
  targetService: string;
  category: string;
  description: string;
  beforeSnippet: string;
  afterSnippet: string;
  timesApplied: number;
  confidenceScore: number;
  linkedIncidentId: string;
  originIncidents: string[];
}

const RUNBOOKS: RunbookPattern[] = [
  {
    id: 'AST-PAT-01',
    title: 'Unbounded Map to TTL-Bounded LRU Cache',
    fingerprint: 'MEM_LEAK_AUTH_TOKEN_SVC',
    language: 'TypeScript',
    targetService: 'auth-service',
    category: 'Memory Management',
    description: 'Replaces unbounded JavaScript Map memory collections with size-limited, TTL-evicted LRU cache to prevent V8 heap exhaustion under heavy traffic spikes.',
    beforeSnippet: 'const tokenCache = new Map<string, any>();\ntokenCache.set(token, payload); // Unbounded leak',
    afterSnippet: 'const tokenCache = new LRUCache({ max: 5000, ttl: 1000 * 60 * 5 });\ntokenCache.set(token, payload); // Auto-evicted',
    timesApplied: 14,
    confidenceScore: 99.4,
    linkedIncidentId: 'INC-2041',
    originIncidents: ['INC-2041', 'INC-1892', 'INC-1420', 'INC-0914'],
  },
  {
    id: 'AST-PAT-02',
    title: 'EventEmitter Listener Leak Prevention & setMaxListeners',
    fingerprint: 'ERR_EVENTEMITTER_LEAK',
    language: 'TypeScript / Node.js',
    targetService: 'auth-service',
    category: 'Resource Leaks',
    description: 'Ensures EventEmitters dispose of one-off session listeners in finally blocks and adjusts maxListeners to match concurrency limits.',
    beforeSnippet: 'emitter.on("token-verified", cb); // Never deregistered',
    afterSnippet: 'emitter.setMaxListeners(50);\nemitter.once("token-verified", cb); // Disposed',
    timesApplied: 9,
    confidenceScore: 98.8,
    linkedIncidentId: 'INC-2041',
    originIncidents: ['INC-2041', 'INC-1640', 'INC-1215'],
  },
  {
    id: 'AST-PAT-03',
    title: 'PostgreSQL Pool Timeout with Exponential Jitter Backoff',
    fingerprint: 'PG_CONN_POOL_EXHAUSTED',
    language: 'Go / Node.js',
    targetService: 'user-service',
    category: 'Database Connection',
    description: 'Implements connection retry loops with randomized exponential jitter when PostgreSQL connection pools reach 100% capacity during failover.',
    beforeSnippet: 'const client = await pool.connect(); // Throws immediately on timeout',
    afterSnippet: 'const client = await retryWithBackoff(() => pool.connect(), { maxRetries: 3 });',
    timesApplied: 22,
    confidenceScore: 99.1,
    linkedIncidentId: 'INC-0782',
    originIncidents: ['INC-0782', 'INC-0651'],
  },
  {
    id: 'AST-PAT-04',
    title: 'Payment Gateway Webhook Idempotency Lock Contention Resolution',
    fingerprint: 'TIMEOUT_PAYMENT_WEBHOOK_IDEM',
    language: 'TypeScript',
    targetService: 'payment-gateway',
    category: 'Distributed Concurrency',
    description: 'Replaces blocking database row locks with Redis distributed redlock leasing (2.5s TTL) for high-throughput webhook idempotency checks.',
    beforeSnippet: 'await db.query("SELECT * FROM events WHERE id = $1 FOR UPDATE");',
    afterSnippet: 'const lock = await redlock.acquire([`lock:${eventId}`], 2500);',
    timesApplied: 11,
    confidenceScore: 98.5,
    linkedIncidentId: 'INC-1892',
    originIncidents: ['INC-1892', 'INC-1310'],
  },
  {
    id: 'AST-PAT-05',
    title: 'NGINX Upstream Keep-Alive Connection Recycling',
    fingerprint: 'ERR_UPSTREAM_CONN_RESET',
    language: 'NGINX / Lua',
    targetService: 'ingress-nginx',
    category: 'Network Edge',
    description: 'Tunes proxy_connect_timeout and keepalive_requests to prevent upstream connection reset storm spikes when microservice containers scale.',
    beforeSnippet: 'proxy_connect_timeout 5s; keepalive 16;',
    afterSnippet: 'proxy_connect_timeout 15s; keepalive 64; keepalive_requests 1000;',
    timesApplied: 18,
    confidenceScore: 99.0,
    linkedIncidentId: 'INC-1420',
    originIncidents: ['INC-1420', 'INC-1108', 'INC-0842'],
  },
];

export default function RunbooksPage() {
  const { currentOrg } = useOrg();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  const [runbooks, setRunbooks] = useState<RunbookPattern[]>(isAcme ? RUNBOOKS : []);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [groupBy, setGroupBy] = useState<'none' | 'service' | 'category'>('none');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sortBy, setSortBy] = useState<'confidence' | 'runs' | 'id'>('confidence');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getRunbooks().then((data) => {
      if (mounted) {
        if (data && data.length > 0) {
          setRunbooks(data);
        } else if (isAcme) {
          setRunbooks(RUNBOOKS);
        } else {
          setRunbooks([]);
        }
      }
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [currentOrg, isAcme]);

  // Toggle single card expand/collapse
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Expand or collapse all cards
  const toggleExpandAll = () => {
    const anyExpanded = Object.values(expandedCards).some(Boolean);
    if (anyExpanded) {
      setExpandedCards({});
    } else {
      const all: Record<string, boolean> = {};
      runbooks.forEach((r) => {
        all[r.id] = true;
      });
      setExpandedCards(all);
    }
  };

  // Handle Apply Pattern with RBAC check
  const handleApplyPattern = (pattern: RunbookPattern) => {
    let role = 'Operator';
    try {
      const stored = localStorage.getItem('sentryops_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        role = parsed.role || 'Operator';
      }
    } catch (e) {}

    if (role === 'Viewer') {
      setToastMessage({
        message: 'Action restricted: Requires Operator or Admin role to apply AST pattern hotfixes.',
        type: 'warning',
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setToastMessage({
      message: `AST Pattern ${pattern.id} staged for autonomous deployment to ${pattern.targetService}.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter and sort patterns
  const filteredPatterns = useMemo(() => {
    return runbooks.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.fingerprint.toLowerCase().includes(q) ||
          r.targetService.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.originIncidents.some((inc) => inc.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'confidence') return b.confidenceScore - a.confidenceScore;
      if (sortBy === 'runs') return b.timesApplied - a.timesApplied;
      return a.id.localeCompare(b.id);
    });
  }, [searchQuery, selectedCategory, sortBy]);

  // Group patterns if grouping enabled
  const groupedPatterns = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupName: '', patterns: filteredPatterns }];
    }

    const map: Record<string, RunbookPattern[]> = {};
    filteredPatterns.forEach((p) => {
      const key = groupBy === 'service' ? p.targetService : p.category;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    return Object.keys(map).sort().map((groupName) => ({
      groupName,
      patterns: map[groupName],
    }));
  }, [filteredPatterns, groupBy]);

  const allExpanded = Object.values(expandedCards).some(Boolean);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      {/* Floating Action Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-18 right-6 z-50 p-4 rounded-2xl shadow-xl backdrop-blur-md border text-xs max-w-md flex items-center justify-between gap-3 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="font-semibold leading-relaxed">{toastMessage.message}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>
        
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                Runbooks
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {runbooks.length} Verified Patterns
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Learned AST patterns from past incident resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              0 Regressions
            </span>
          </div>
        </div>

        {!loading && runbooks.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                No AST runbooks synthesized yet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Runbooks will be automatically cataloged as incidents are remediated.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
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
        {/* Rule 6: Compact Unified Toolbar (Search + Filter + Group + Sort + View Toggle) */}
        <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pattern, fingerprint (MEM_LEAK...), or service..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

          {/* Filters & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Categories ({RUNBOOKS.length})</option>
                <option value="Memory Management">Memory Management</option>
                <option value="Resource Leaks">Resource Leaks</option>
                <option value="Database Connection">Database Connection</option>
                <option value="Distributed Concurrency">Distributed Concurrency</option>
                <option value="Network Edge">Network Edge</option>
              </select>
            </div>

            {/* Rule 2: Group By Selector */}
            <div className="flex items-center gap-1.5">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                title="Group patterns by service or category"
              >
                <option value="none">Grouping: None</option>
                <option value="service">Group by Service</option>
                <option value="category">Group by Category</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="confidence">Sort: Highest Confidence</option>
                <option value="runs">Sort: Most Applied</option>
                <option value="id">Sort: Pattern ID</option>
              </select>
            </div>

            {/* Expand / Collapse All Toggle (Cards only) */}
            {viewMode === 'card' && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                title={allExpanded ? 'Collapse all code diffs' : 'Expand all code diffs'}
              >
                {allExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
              </button>
            )}

            {/* Rule 5: Card vs Table View Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-[#0A0A0A] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Card View (Collapsible)"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#0A0A0A] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View (Dense)"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Rule 7: Empty State when no results found */}
        {filteredPatterns.length === 0 ? (
          <div className="p-12 text-center bg-white/70 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No AST patterns match &quot;{searchQuery}&quot;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching with a different error fingerprint, keyword, or clear your category filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'card' ? (
          
          /* VIEW MODE 1: COLLAPSED-BY-DEFAULT CARDS (Rule 1 & Rule 2) */
          <div className="space-y-6">
            {groupedPatterns.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                {/* Group Section Header */}
                {group.groupName && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {groupBy === 'service' ? <Server className="w-3.5 h-3.5" /> : <FolderTree className="w-3.5 h-3.5" />}
                    </span>
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {group.groupName} ({group.patterns.length} {group.patterns.length === 1 ? 'Pattern' : 'Patterns'})
                    </h2>
                    <div className="h-px bg-slate-200 dark:bg-white/5 flex-1 ml-2" />
                  </div>
                )}

                {/* Pattern Cards */}
                <div className="space-y-3">
                  {group.patterns.map((rb) => {
                    const isExpanded = !!expandedCards[rb.id];
                    return (
                      <div
                        key={rb.id}
                        className="glass-card rounded-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Summary Header Row (Always Visible) */}
                        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          {/* Left: ID, Title, Badges, Description */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {rb.id}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {rb.title}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                                {rb.targetService}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                {rb.category}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 leading-relaxed">
                              {rb.description}
                            </p>

                            {/* Rule 8: Link Back to Origin Incidents */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                              <History className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Learned from:</span>
                              <div className="flex flex-wrap items-center gap-1">
                                {rb.originIncidents.slice(0, 3).map((inc) => (
                                  <Link
                                    key={inc}
                                    href={`/remediation/${inc}`}
                                    className="font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-1 py-0.2 rounded bg-indigo-50/50 dark:bg-indigo-950/40"
                                  >
                                    {inc}
                                  </Link>
                                ))}
                                {rb.originIncidents.length > 3 && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    (+{rb.originIncidents.length - 3} more)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Rule 3 Visual Stats + Rule 4 Consistent Card Actions */}
                          <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/10">
                            
                            {/* Visual Stats Block */}
                            <div className="flex items-center gap-3 text-right">
                              {/* Confidence with visual bar */}
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                                  <span>{rb.confidenceScore}%</span>
                                </div>
                                <div className="w-14 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                                    style={{ width: `${rb.confidenceScore}%` }}
                                  />
                                </div>
                              </div>

                              {/* Runs & 0 Regressions Badge */}
                              <div className="flex flex-col items-end">
                                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                  {rb.timesApplied} Runs
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 mt-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> 0 Regressions
                                </span>
                              </div>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-2">
                              {/* Rule 4: Compact Apply Pattern Button */}
                              <button
                                type="button"
                                onClick={() => handleApplyPattern(rb)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                                title="Stage AST pattern for remediation"
                              >
                                <span>Apply Pattern</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Rule 1: View Code Diff Expand Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleCard(rb.id)}
                                className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                title={isExpanded ? 'Collapse code diff' : 'View code diff'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                          </div>
                        </div>

                        {/* Rule 1 & Rule 9: Expandable Code Diff Preview (Stacked on mobile) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#0A0A0A]/40 p-4 sm:p-5"
                            >
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-white/10/60 text-[11px] font-mono text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Fingerprint: <strong className="text-slate-800 dark:text-slate-200">{rb.fingerprint}</strong></span>
                                </div>
                                <span>Language: {rb.language}</span>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Defect Snippet */}
                                <div className="p-3.5 rounded-xl bg-red-500/[0.04] border border-red-500/20 font-mono text-[11px] text-red-700 dark:text-red-400 overflow-x-auto">
                                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-red-600 dark:text-red-400 mb-1.5">
                                    <span>Defect Pattern (Before)</span>
                                    <span className="text-slate-400 text-[9px] font-normal">Regression Vector</span>
                                  </div>
                                  <pre className="whitespace-pre-wrap leading-relaxed">{rb.beforeSnippet}</pre>
                                </div>

                                {/* AST Transformation Snippet */}
                                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 overflow-x-auto">
                                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                                    <span>AST Transformation (Verified Hotfix)</span>
                                    <span className="text-emerald-600 text-[9px] font-semibold">Zero Regressions</span>
                                  </div>
                                  <pre className="whitespace-pre-wrap leading-relaxed">{rb.afterSnippet}</pre>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          
          /* VIEW MODE 2: HIGH-DENSITY DATA TABLE (Rule 5) */
          <div className="rounded-2xl bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-sm border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-3 px-4">Pattern ID</th>
                    <th className="py-3 px-4">Title & Fingerprint</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Reliability</th>
                    <th className="py-3 px-4">Origin Incidents</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPatterns.map((rb) => (
                    <tr
                      key={rb.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {rb.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{rb.title}</div>
                        <div className="font-mono text-[10px] text-slate-400">{rb.fingerprint}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {rb.targetService}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {rb.category}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                          <span>{rb.confidenceScore}%</span>
                        </div>
                        <div className="w-12 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                            style={{ width: `${rb.confidenceScore}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{rb.timesApplied} Runs</div>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-2.5 h-2.5" /> 0 Regressions
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                          {rb.originIncidents.slice(0, 2).map((inc) => (
                            <Link
                              key={inc}
                              href={`/remediation/${inc}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline px-1 py-0.2 rounded bg-indigo-50/50 dark:bg-indigo-950/40"
                            >
                              {inc}
                            </Link>
                          ))}
                          {rb.originIncidents.length > 2 && (
                            <span className="text-slate-400">+{rb.originIncidents.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleApplyPattern(rb)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 inline-flex items-center gap-1"
                        >
                          <span>Apply</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

      </main>

      <FloatingDock />
    </div>
  );
}
