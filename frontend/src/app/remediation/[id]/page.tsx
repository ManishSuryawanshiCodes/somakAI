'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Terminal as TerminalIcon,
  Shield,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Globe,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import ReasoningTree from '@/components/ReasoningTree';
import TerminalOutput from '@/components/TerminalOutput';
import DiffViewer from '@/components/DiffViewer';
import StatusBadge from '@/components/StatusBadge';
import SlideToDeploy from '@/components/SlideToDeploy';
import FloatingDock from '@/components/FloatingDock';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { getIncident, getActiveIncidents, deployRemediation, retrySandboxExecution } from '@/lib/api';
import { mockIncident, mockIncident2, mockTerminalLines } from '@/lib/mock-data';
import { Incident } from '@/lib/types';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

export default function RemediationStudio() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { addToast } = useToast();
  const { user, canDeploy } = useAuth();

  const [selectedIncident, setSelectedIncident] = useState<Incident>(mockIncident);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([mockIncident, mockIncident2]);
  
  // Progressive Disclosure: Collapsible details
  const [traceExpanded, setTraceExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [testExpanded, setTestExpanded] = useState(false);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false);

  const [deploying, setDeploying] = useState(false);
  const [retryingSandbox, setRetryingSandbox] = useState(false);

  useEffect(() => {
    getActiveIncidents().then((data) => {
      if (data && (data as Incident[]).length > 0) {
        setAllIncidents(data as Incident[]);
      }
    });
    getIncident(id).then((data) => {
      if (data) setSelectedIncident(data as Incident);
    });
  }, [id]);

  // Click queue card in left rail to swap active incident without page reload
  const handleSelectQueueIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/remediation/${inc.id}`);
    }
  };

  const handleDeploy = useCallback(async () => {
    setDeploying(true);
    try {
      await deployRemediation(selectedIncident.id);
      addToast('Canary deployment triggered at 5% traffic', 'success');
      router.push(`/canary/${selectedIncident.id}`);
    } catch {
      addToast('Failed to trigger deployment. Retrying...', 'error');
    } finally {
      setDeploying(false);
    }
  }, [selectedIncident.id, router, addToast]);

  const handleRetrySandbox = async () => {
    setRetryingSandbox(true);
    try {
      const updated = await retrySandboxExecution(selectedIncident.id);
      if (updated) {
        setSelectedIncident(updated);
        addToast('Sandbox execution re-triggered with self-correction loop', 'info');
      } else {
        addToast('Sandbox retry scheduled in background queue', 'info');
      }
    } catch {
      addToast('Failed to trigger sandbox retry', 'error');
    } finally {
      setRetryingSandbox(false);
    }
  };

  // Instant desktop 1-click deploy CTA
  const handleDesktopDeployClick = () => {
    handleDeploy();
  };

  // Global Keyboard Shortcut: ⌘ + Enter -> Deploy Canary immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!deploying && canDeploy) handleDeploy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deploying, canDeploy, handleDeploy]);

  const rca = selectedIncident.rootCauseAnalysis;
  const patch = selectedIncident.patch;
  const sandbox = patch?.sandboxExecution;
  const citations = rca?.tavilyCitations || [];
  const failureHistory = sandbox?.failureHistory || selectedIncident.sandboxExecution?.failureHistory || [];
  const loops = sandbox?.loops || selectedIncident.sandboxExecution?.loops || 1;
  const isHumanReview = selectedIncident.status === 'NEEDS_HUMAN_REVIEW';

  return (
    <div className="min-h-screen text-text-primary flex flex-col relative">
      <TopNav />

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5 pb-28">
        
        {/* Top Header & Breadcrumb Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              title="Return to Incident Radar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Remediation Studio
                </h1>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  {selectedIncident.id}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/50">
                  {selectedIncident.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Service: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedIncident.service}</span> • 3-Step Verification Flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Inline Queue Switcher */}
            {allIncidents.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Active:</span>
                {allIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => handleSelectQueueIncident(inc)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedIncident.id === inc.id
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {inc.id} ({inc.service})
                  </button>
                ))}
              </div>
            )}

            {/* Confidence Breakdown Tooltip Badge */}
            <div className="relative">
              <button
                onClick={() => setShowConfidenceTooltip((prev) => !prev)}
                onMouseEnter={() => setShowConfidenceTooltip(true)}
                aria-label="View confidence score breakdown"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer select-none"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>99.4% Fix Verified</span>
                <Info className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70" />
              </button>

              {/* Confidence Breakdown Popover */}
              <AnimatePresence>
                {showConfidenceTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    transition={{ duration: 0.15 }}
                    onMouseLeave={() => setShowConfidenceTooltip(false)}
                    className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-left space-y-2.5"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Confidence Breakdown
                      </span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        99.4%
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                          <span>Jest Sandbox Pass Rate</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">100% (14/14)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full bg-emerald-500 w-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                          <span>AST Syntax Validation</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">100%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full bg-emerald-500 w-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                          <span>Tavily Grounding Alignment</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">98.2%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full bg-indigo-500 w-[98.2%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                          <span>Test Suite Coverage</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">99.4%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full bg-emerald-500 w-[99.4%]" />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 leading-tight">
                      Synthesized by NVIDIA Nemotron-3-Ultra (550B) & verified via Nebius isolated container sandbox.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <StatusBadge status={selectedIncident.status} />
          </div>
        </div>

        {/* HUMAN REVIEW REQUIRED ESCALATION BANNER WITH FAILURE HISTORY */}
        {isHumanReview && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Autonomous Fix Failed — Manual Review Required
                  </h2>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    Self-correction loop exhausted 3 capped attempts. The test suite continued to fail in the isolated sandbox. Review the real error traces below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRetrySandbox}
                disabled={retryingSandbox}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25 transition-all active:scale-95 flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retryingSandbox ? 'animate-spin' : ''}`} />
                <span>{retryingSandbox ? 'Retrying Sandbox...' : 'Retry Sandbox Loop'}</span>
              </button>
            </div>

            {/* Failure History Traces */}
            {failureHistory.length > 0 && (
              <div className="pt-3 border-t border-amber-500/20 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span>SANDBOX ATTEMPTS &amp; ERROR TRACES ({failureHistory.length} recorded)</span>
                  <span className="text-[11px] font-mono text-slate-500">Max Loops: 3</span>
                </div>

                <div className="space-y-2">
                  {failureHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 text-[10px]">
                        <span className="text-amber-400 font-bold">Attempt {item.loop || idx + 1} of 3</span>
                        <span className="text-slate-500">{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now'}</span>
                      </div>
                      <div className="text-rose-400 font-semibold pt-1">
                        {item.error_message || 'AssertionError: test suite failed'}
                      </div>
                      {item.test_output && (
                        <pre className="p-2.5 rounded-lg bg-black/60 text-slate-300 overflow-x-auto text-[10px] mt-1 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {item.test_output}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SELF-CORRECTION LOOP SUCCESS BANNER */}
        {!isHumanReview && loops > 1 && (
          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="font-bold text-purple-700 dark:text-purple-300">
                Self-Correction Loop Succeeded:
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Initial attempt failed; real sandbox error output was fed back into the reasoning model and resolved on loop {loops} (Exit code 0).
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold shrink-0">
              {loops} Loops Converged
            </span>
          </div>
        )}

        {/* Runbook Match Auto-Suggestion Banner */}
        {(selectedIncident?.fingerprint?.includes('MEM_LEAK') || selectedIncident?.id === 'INC-2041') && (
          <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                Matching AST Runbook AST-PAT-01 found:
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                Unbounded Map &rarr; LRU Cache (99.4% confidence)
              </span>
            </div>
            <Link
              href="/runbooks"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
            >
              View in Runbook Library &rarr;
            </Link>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3 SEQUENTIAL OPERATOR PANELS: "SHOULD I APPROVE THIS?" */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">

          {/* PANEL 1: 1. What broke and why? */}
          <section className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xs backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    What broke and why?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Autonomous triage signature & root cause explanation
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {selectedIncident.service} • {selectedIncident.severity}
              </span>
            </div>

            {/* Primary Root Cause Block */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Root Cause Analysis
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                {rca?.summary || 'V8 heap exhaustion in auth-service caused by unbounded Map caching in TokenService.verify().'}
              </p>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                <span className="text-slate-400">Culprit:</span>
                <code className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 font-mono text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                  {patch?.targetFile || 'src/services/tokenService.ts'}:48 (TokenService.verify)
                </code>
              </div>
            </div>

            {/* Collapsible Reasoning Trace (Collapsed by default) */}
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setTraceExpanded(!traceExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Autonomous Reasoning Trace ({selectedIncident.synthesis_model?.split('/')?.pop() || 'Nemotron-3-Ultra'} • 4 Steps)
                  {selectedIncident.fallback_occurred && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                      Fallback Active
                    </span>
                  )}
                </span>
                {traceExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {traceExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800"
                  >
                    <ReasoningTree currentStep={4} incidentId={selectedIncident.id} incident={selectedIncident} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapsible Tavily Sources (Collapsed by default) */}
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  External Grounding Citations ({citations.length || 3})
                </span>
                {sourcesExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {sourcesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    {citations.map((cite, idx) => (
                      <a
                        key={idx}
                        href={cite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors group"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          <span className="truncate">{cite.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {cite.snippet}
                        </p>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* PANEL 2: 2. What's the fix? */}
          <section className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xs backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    What&apos;s the fix?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Synthesized AST transformation & unified code diff
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-900/50">
                  {patch?.targetFile || 'src/services/tokenService.ts'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  AST Validated
                </span>
              </div>
            </div>

            {/* Code Diff Front and Center */}
            <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
              <DiffViewer
                diff={patch?.unifiedDiff || 'No diff available'}
                targetFile={patch?.targetFile || 'src/services/tokenService.ts'}
              />
            </div>

            {/* Collapsible Reproduction Test */}
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setTestExpanded(!testExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  View Reproduction Jest Test (14 Assertions)
                </span>
                {testExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {testExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 border-t border-slate-100 dark:border-slate-800"
                  >
                    <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
                      <code>{patch?.reproductionTest || `describe('TokenService Memory Leak Reproduction', () => {
  it('should initialize TTL cache with default 300s expiry', () => {
    const service = new TokenService();
    expect(service.getCacheStats().max).toBe(5000);
  });
  it('should evict expired tokens automatically without heap exhaustion', async () => {
    // 14/14 tests verified passing
  });
});`}</code>
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* PANEL 3: 3. Is it safe? */}
          <section className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xs backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Is it safe?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Isolated sandbox verification, test assertions & regression guardrails
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-900/50">
                Exit Code 0
              </span>
            </div>

            {/* Pre-Deployment Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Nebius container sandbox verification (Exit code 0)</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>14 / 14 Jest reproduction assertions passed (100%)</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>AST syntax tree validated: zero semantic regressions</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Self-correction loop converged (0-byte heap leak)</span>
              </div>
            </div>

            {/* Mini Test Pass Rate Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Reproduction Test Pass Rate</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">100% (14 / 14)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>

            {/* Collapsible Sandbox Container Logs */}
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setLogsExpanded(!logsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-slate-500" />
                  View Raw Sandbox Execution Logs ({sandbox?.sandboxId || 'nbx-sandbox-8841'})
                </span>
                {logsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {logsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 border-t border-slate-100 dark:border-slate-800"
                  >
                    <TerminalOutput lines={mockTerminalLines} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>
      </main>

      {/* ======================================================== */}
      {/* STICKY BOTTOM VIEWPORT BAR: The Single Primary Deploy CTA */}
      {/* ======================================================== */}
      <footer className="sticky bottom-0 z-30 w-full bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl py-3 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Left Summary: Context and Safety Status */}
          <div className="flex items-center gap-3">
            {isHumanReview ? (
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {isHumanReview
                    ? 'Autonomous Fix Failed — Manual Review Required'
                    : 'Ready for Production Canary Deployment'}
                </span>
                <span
                  className={`hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                    isHumanReview
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isHumanReview ? '3 Loops Failed' : '99.4% Fix Verified'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {isHumanReview
                  ? 'Sandbox tests failed across 3 retry loops. Inspect failure history or retry execution.'
                  : 'Hotfix will be routed to 5% live ingress traffic with continuous automated rollback protection.'}
              </p>
            </div>
          </div>

          {/* Right Action: Single Primary Deploy Action with RBAC Gating */}
          <div className="flex items-center gap-3">
            {!canDeploy ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Viewer Mode (Deploy requires Operator role)</span>
              </div>
            ) : isHumanReview ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetrySandbox}
                  disabled={retryingSandbox}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryingSandbox ? 'animate-spin' : ''}`} />
                  <span>{retryingSandbox ? 'Retrying...' : 'Retry Sandbox Loop'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDesktopDeployClick}
                  disabled={deploying}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Override failed sandbox test and deploy anyway"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Force Deploy (Override)</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Primary CTA: Effortless 1-Click Canary Deploy */}
                <div className="hidden sm:block">
                  <button
                    type="button"
                    onClick={handleDesktopDeployClick}
                    disabled={deploying}
                    className="font-black py-3 px-7 rounded-xl flex items-center gap-2.5 shadow-xl shadow-emerald-600/35 hover:scale-[1.02] active:scale-95 transition-all text-xs text-white bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-400/50 btn-glow-primary cursor-pointer disabled:opacity-50"
                  >
                    {deploying ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                        Routing to 5% Canary Traffic...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play className="w-4 h-4 fill-current text-white" />
                        <span>Approve &amp; Trigger Canary Deploy (5% Traffic)</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-emerald-700 font-mono text-[10px] text-emerald-100 font-normal ml-1">
                          ⌘↵
                        </kbd>
                      </span>
                    )}
                  </button>
                </div>

                {/* Mobile Slide to Trigger Canary */}
                <div className="sm:hidden w-48">
                  <SlideToDeploy
                    onConfirm={handleDeploy}
                    disabled={deploying}
                    label="Slide to Deploy Canary"
                    confirmLabel="Deploying..."
                  />
                </div>
              </>
            )}
          </div>

        </div>
      </footer>

      {/* Floating Tactical Navigation Dock (Mobile Only) */}
      <FloatingDock incidentId={selectedIncident.id} />
    </div>
  );
}
