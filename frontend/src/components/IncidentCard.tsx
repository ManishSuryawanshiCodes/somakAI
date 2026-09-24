'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Search,
  GitBranch,
  Play,
  Terminal,
  FileCode,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';
import type { Incident } from '@/lib/types';

interface IncidentCardProps {
  incident: Incident;
  selected?: boolean;
  onDeploy?: (id: string) => void;
  onQuickInspect?: (incident: Incident) => void;
  onHoverService?: (service: string | null) => void;
  onSelect?: (id: string) => void;
  defaultExpanded?: boolean;
}

export default function IncidentCard({
  incident,
  selected = false,
  onDeploy,
  onQuickInspect,
  onHoverService,
  onSelect,
  defaultExpanded = false,
}: IncidentCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showDiff, setShowDiff] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  const isSev1 = incident.severity === 'SEV-1';

  const handleDeployClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeploy) {
      onDeploy(incident.id);
    } else {
      router.push(`/canary/${incident.id}`);
    }
  };

  const handleStudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/remediation/${incident.id}`);
  };

  const handleQuickInspectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickInspect) {
      onQuickInspect(incident);
    } else {
      setExpanded((prev) => !prev);
    }
  };

  // Relative time helper
  const timeAgo = (() => {
    try {
      const diff = Date.now() - new Date(incident.timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      return `${hours}h ago`;
    } catch {
      return '2m ago';
    }
  })();

  const summary =
    incident.rootCauseAnalysis?.summary ||
    (isSev1
      ? 'V8 heap exhaustion in auth-service caused by unbounded Map caching in TokenService.verify().'
      : 'API Gateway connection timeout backpressure cascading into downstream session validation.');

  // 4-step reasoning trace steps
  const reasoningSteps = [
    {
      step: 1,
      title: 'Triage & Log Fingerprint',
      model: 'Nemotron-3-Nano',
      desc: 'Extracted stack trace signature ERR_EVENTEMITTER_LEAK and isolated root cause in TokenService.',
      status: 'SEV-1 Isolated',
      icon: Search,
    },
    {
      step: 2,
      title: 'Diagnostic Grounding',
      model: 'Tavily Search API',
      desc: 'Queried Node.js diagnostics for unbounded Map leaks; retrieved EventEmitter TTL pattern.',
      status: '3 Sources Grounded',
      icon: Terminal,
    },
    {
      step: 3,
      title: 'AST Patch Synthesis',
      model: 'Nemotron-3-Ultra',
      desc: 'Synthesized zero-leak LRUCache with 5-minute TTL eviction and explicit teardown.',
      status: 'AST Verified',
      icon: Cpu,
    },
    {
      step: 4,
      title: 'Sandbox Verification',
      model: 'Nebius Token Sandbox',
      desc: 'Ran isolated container reproduction test suite; verified 0 byte memory leak over 10k verify calls.',
      status: 'Exit Code 0',
      icon: Play,
    },
  ];

  return (
    <div
      id={`incident-${incident.id}`}
      onClick={() => onSelect?.(incident.id)}
      onMouseEnter={() => onHoverService?.(incident.service)}
      onMouseLeave={() => onHoverService?.(null)}
      className={`rounded-2xl p-4 sm:p-5 border border-l-4 bg-white/90 dark:bg-slate-900/90 transition-all duration-200 ${
        isSev1
          ? 'border-l-rose-500 border-slate-200/90 dark:border-slate-800'
          : 'border-l-amber-500 border-slate-200/90 dark:border-slate-800'
      } ${
        selected
          ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md shadow-indigo-500/10'
          : 'shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Card Header: Service name + Max 2 Badges (Severity, Status) + Expandable +2 More Chip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Microservice Identifier */}
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
            {incident.service}
          </span>

          {/* Badge 1: Severity */}
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isSev1
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/50 dark:text-rose-400'
                : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:border-amber-900/50 dark:text-amber-400'
            }`}
          >
            {incident.severity}
          </span>

          {/* Badge 2: Status */}
          {incident.status === 'NEEDS_HUMAN_REVIEW' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Human Review Required
            </span>
          ) : incident.status === 'DEPLOYED' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-400">
              <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Canary Deployed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Ready for Deploy
            </span>
          )}

          {/* Self-correction loop badge */}
          {incident.patch?.sandboxExecution?.loops && incident.patch.sandboxExecution.loops > 1 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/50 dark:border-purple-900/50 dark:text-purple-400 font-bold">
              Self-corrected ({incident.patch.sandboxExecution.loops} loops)
            </span>
          )}

          {/* +2 More Metadata Chip */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMeta((prev) => !prev);
            }}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {showMeta ? 'Hide details' : '+ details'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Human Escalation Warning Alert if Retries Exhausted */}
      {incident.status === 'NEEDS_HUMAN_REVIEW' && (
        <div className="my-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold block">Autonomous Fix Failed (Max Retries Reached)</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight block mt-0.5">
              Sandbox test suite failed across 3 self-correction iterations. Manual engineer review required before deployment.
            </span>
          </div>
        </div>
      )}

      {/* Expanded Metadata (Revealed via + details) */}
      <AnimatePresence>
        {showMeta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden py-2 px-2.5 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1 font-mono text-[11px]"
          >
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Fingerprint:</span>
              <span className="text-slate-900 dark:text-white font-bold">{incident.fingerprint}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Verification:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{incident.confidenceScore || 99.4}% AST Verified</span>
            </div>
            {incident.patch?.sandboxExecution?.failureHistory && incident.patch.sandboxExecution.failureHistory.length > 0 && (
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span>Failed Attempts:</span>
                <span className="font-bold">{incident.patch.sandboxExecution.failureHistory.length} recorded</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Root Cause Summary */}
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed my-2.5 line-clamp-2">
        {summary}
      </p>

      {/* Progressive Disclosure: AST Unified Code Diff Preview (Collapsed by default) */}
      <div className="my-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDiff((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-500" />
            <span>{showDiff ? 'Hide Code Diff' : 'Preview Code Diff'}</span>
            <span className="text-[10px] text-slate-400 font-mono">({incident.patch?.targetFile || 'tokenService.ts'})</span>
            {showDiff ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {showDiff && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] shadow-2xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                <span className="text-slate-300">{incident.patch?.targetFile || 'src/services/tokenService.ts'}</span>
                <span className="text-indigo-400 font-bold">Nemotron-3-Ultra AST Synthesized</span>
              </div>

              <div className="p-2.5 space-y-1">
                {/* Line 1: Deletion */}
                <div className="flex items-center bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded">
                  <span className="w-6 text-slate-500 text-right pr-2 select-none">43</span>
                  <span className="text-rose-400 font-bold select-none pr-1.5">-</span>
                  <span className="truncate">const tokenCache = new Map&lt;string, &#123; result: any; timestamp: number &#125;&gt;();</span>
                </div>
                {/* Line 2: Addition */}
                <div className="flex items-center bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded">
                  <span className="w-6 text-slate-500 text-right pr-2 select-none">50</span>
                  <span className="text-emerald-400 font-bold select-none pr-1.5">+</span>
                  <span className="truncate">private cache: LRUCache&lt;string, &#123; result: any; timestamp: number &#125;&gt;;</span>
                </div>
                {/* Line 3: Addition */}
                <div className="flex items-center bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded">
                  <span className="w-6 text-slate-500 text-right pr-2 select-none">55</span>
                  <span className="text-emerald-400 font-bold select-none pr-1.5">+</span>
                  <span className="truncate">this.cache = new LRUCache(&#123; max: 5000, ttl: 1000 * 60 * 5 &#125;);</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bar: Prominent Canary Launch CTA */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {incident.status === 'READY_FOR_DEPLOY' ? (
            <>
              {/* High-Contrast, Prominent Primary Canary CTA */}
              <button
                type="button"
                onClick={handleDeployClick}
                title="Deploy Canary 5% Hotfix (⌘ + Enter)"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/25 transition-all active:scale-95 btn-glow-primary"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-100" />
                <span>Approve Canary 5%</span>
              </button>

              {/* Secondary Studio Link */}
              <button
                type="button"
                onClick={handleStudioClick}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Remediation Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </>
          ) : incident.status === 'NEEDS_HUMAN_REVIEW' ? (
            <>
              <button
                type="button"
                onClick={handleStudioClick}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-600/25 transition-all active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Review Failure Traces & Fix</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDeployClick}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <span>View Canary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleStudioClick}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Studio
              </button>
            </>
          )}
        </div>

        {/* Inline Drawer Expansion Trigger */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>{expanded ? 'Hide Trace' : 'Reasoning Trace'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Smooth Inline Expansion Drawer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden pt-3 space-y-3"
          >
            {/* 1. The 4-step reasoning trace */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200 pb-1.5 border-b border-slate-200/70 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  Reasoning Trace
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                  Verified (Exit 0)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {reasoningSteps.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.step}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-900/50 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {s.step}. {s.title}
                          </span>
                          <span className="text-[9px] font-mono text-indigo-500 font-semibold truncate">
                            {s.model}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {s.desc}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-900/40">
                          {s.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Jest Sandbox Output */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sandbox Test Runner (Jest v29.7.0)</span>
                </div>
                <span className="text-emerald-400 font-bold">14 passed, 0 failed (420ms)</span>
              </div>

              <div className="text-emerald-400">
                PASS src/services/__tests__/tokenService.spec.ts
              </div>
              <div className="pl-4 space-y-0.5 text-slate-400 text-[10px]">
                <div>✓ should evict stale tokens when cache limit exceeded (42 ms)</div>
                <div>✓ should enforce 5-minute TTL on cached verification tokens (18 ms)</div>
                <div>✓ should not leak heap under 10,000 rapid concurrent calls (114 ms)</div>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
                <span>Reproduction suite validated inside isolated gVisor container</span>
                <span className="text-slate-400">Exit Code: 0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
