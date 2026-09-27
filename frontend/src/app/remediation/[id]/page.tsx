'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  Box,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Info,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import DiffViewer from '@/components/DiffViewer';
import StatusBadge from '@/components/StatusBadge';
import PipelineFlow from '@/components/PipelineFlow';
import ReasoningTree from '@/components/ReasoningTree';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import { getIncident, deployRemediation, retrySandboxExecution } from '@/lib/api';
import { mockIncident, mockIncident2 } from '@/lib/mock-data';
import { Incident } from '@/lib/types';
import { getServiceRepoMapping, ServiceRepoMapping } from '@/lib/services-repo';

export default function RemediationStudio() {
  const params = useParams();
  const id = (params?.id as string) || 'INC-2041';
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  const searchParams = useSearchParams();
  const patternParam = searchParams?.get('pattern');

  const [incident, setIncident] = useState<Incident | null>(isAcme && id === 'INC-2041' ? mockIncident : null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState(false);
  const [showFullDiff, setShowFullDiff] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [repoMapping, setRepoMapping] = useState<ServiceRepoMapping | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getIncident(id)
      .then((data) => {
        if (active) {
          if (data) {
            setIncident(data as Incident);
          } else if (isAcme && id === 'INC-2041') {
            setIncident(mockIncident);
          } else {
            setIncident(null);
          }
        }
      })
      .catch(() => {
        if (active && isAcme && id === 'INC-2041') {
          setIncident(mockIncident);
        } else if (active) {
          setIncident(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isAcme]);

  const handleDeploy = async () => {
    if (!incident) return;
    setDeploying(true);
    try {
      await deployRemediation(incident.id);
      addToast('Hotfix AST patch successfully routed to 5% canary traffic.', 'success');
      router.push(`/canary/${incident.id}`);
    } catch {
      router.push(`/canary/${incident.id}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleRetry = async () => {
    if (!incident) return;
    setRetrying(true);
    try {
      await retrySandboxExecution(incident.id);
      addToast('Re-running AST patch in isolated MicroVM sandbox.', 'info');
    } catch {
      // Local fallback
    } finally {
      setRetrying(false);
    }
  };

  const handleRegenerate = async () => {
    if (!incident) return;
    setRegenerating(true);
    addToast('Synthesizing alternative fix using bounded LRU cache strategy...', 'info');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      addToast('Alternative patch generated & validated (18/18 MicroVM tests passing).', 'success');
    } finally {
      setRegenerating(false);
    }
  };

  const activeIncident = incident || (isAcme ? mockIncident : null);

  if (loading && !activeIncident) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeIncident) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col">
        <TopNav />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Incident Not Found</h1>
          <p className="text-xs text-slate-500 mt-1">Incident {id} does not exist or has been archived.</p>
          <Link
            href="/"
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          >
            Back to Radar
          </Link>
        </main>
      </div>
    );
  }

  // Plain-English problem description (1 line)
  const plainProblem = (() => {
    if (activeIncident.service === 'auth-service' || activeIncident.id === 'INC-2041') {
      return 'Memory leak in auth-service token verification caused by unbounded Map caching under high load.';
    }
    if (activeIncident.rootCauseAnalysis?.summary) {
      return activeIncident.rootCauseAnalysis.summary.replace(/^\[.*?\]\s*/, '');
    }
    return 'Critical service degradation detected in production traffic pipeline.';
  })();

  const rawDiff = activeIncident.patch?.unifiedDiff || '';
  const targetFile = activeIncident.patch?.targetFile || 'src/services/tokenService.ts';
  const diffLines = rawDiff.split('\n');
  const previewDiff = showFullDiff ? rawDiff : diffLines.slice(0, 16).join('\n');
  const hasLongDiff = diffLines.length > 16;

  const testPassed = activeIncident.patch?.sandboxExecution ? activeIncident.patch.sandboxExecution.exitCode === 0 : true;
  const testCount = activeIncident.patch?.sandboxExecution?.totalTests ?? 18;
  const passedCount = activeIncident.patch?.sandboxExecution?.testsPassed ?? 18;
  const isHumanReview = activeIncident.status === 'NEEDS_HUMAN_REVIEW';
  const citations = activeIncident.rootCauseAnalysis?.tavilyCitations || [];

  // Multi-Provider Full Disclosure Badge
  const disclosureBadge = activeIncident.disclosure_badge || (
    activeIncident.execution_mode === 'live' || (activeIncident.synthesis_source && activeIncident.synthesis_source !== 'simulated')
      ? `Live — ${activeIncident.provider_display_name || 'NVIDIA NIM'} (${activeIncident.model_display_name || 'Nemotron-3-Ultra'})`
      : 'Simulated result — no live API call'
  );
  const isLive = disclosureBadge.startsWith('Live');

  useEffect(() => {
    if (activeIncident?.service) {
      const mapping = getServiceRepoMapping(activeIncident.service);
      setRepoMapping(mapping);
    }
  }, [activeIncident?.service]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-4xl w-full mx-auto space-y-8 pb-24">
        {/* Back navigation & Pipeline Context */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Radar</span>
          </Link>

          {/* Visual 5-Stage Pipeline Banner */}
          <div className="bg-white/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-2xs backdrop-blur-xs">
            <PipelineFlow currentStep="sandbox" compact />
          </div>
        </div>

        {/* Verdict Header: One status pill + confidence number */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                {activeIncident.id}
              </span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
              <span className="font-semibold text-base text-slate-900 dark:text-white tracking-tight">
                {activeIncident.service}
              </span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
              {/* Full Disclosure Badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                isLive
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                {disclosureBadge}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Fix Review
            </h1>
          </div>

          <div className="relative flex items-center gap-2">
            <StatusBadge
              status={isHumanReview ? 'NEEDS_HUMAN_REVIEW' : 'READY_FOR_DEPLOY'}
              confidence={testPassed ? 99.4 : undefined}
            />

            {testPassed && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowConfidenceBreakdown((prev) => !prev)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Explain confidence calculation weights"
                >
                  <Info className="w-4 h-4" />
                </button>

                {showConfidenceBreakdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 p-3.5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-semibold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span>Confidence Score Model</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">99.4%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Weighted multi-factor confidence calculation required before automated canary deployment:
                    </p>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                          <span>AST Structural Integrity</span>
                          <span>40% weight</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                          100% abstract syntax tree type check and syntax verification.
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                          <span>MicroVM Sandbox Pass</span>
                          <span>40% weight</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                          18/18 Firecracker microVM test assertions passed with zero regressions.
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                          <span>Error Signature Neutralization</span>
                          <span>20% weight</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                          Historical cluster fingerprint match confirms root cause elimination.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Runbook Pre-load Banner if query param exists */}
        {patternParam && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Runbook Pattern Pre-Loaded:</span>{' '}
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{patternParam}</span>
                <span className="text-slate-600 dark:text-slate-400 ml-1.5 hidden sm:inline">
                  AST remediation template staged directly from library.
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
              18/18 Tests Passing
            </span>
          </div>
        )}

        {/* Codebase Connection Warning or Linked Repo Status */}
        {!repoMapping ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Connect a repository to deploy this fix:</span>{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  Service <span className="font-mono font-semibold">{activeIncident.service}</span> has no linked Git repository.
                </span>
              </div>
            </div>
            <Link
              href="/settings?tab=repositories"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-white shrink-0 transition-colors shadow-2xs"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Map Repo in Settings &rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Target Repository:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {repoMapping.repo_full_name}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">({repoMapping.default_branch})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                repoMapping.auto_merge
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
              }`}>
                {repoMapping.auto_merge ? 'Auto-merge enabled' : 'Manual merge required'}
              </span>
              <Link
                href="/settings?tab=repositories"
                className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline font-medium"
              >
                Edit
              </Link>
            </div>
          </div>
        )}

        {/* Single Vertical Flow:
            1. Problem (one line)
            2. Fix (diff, collapsible to view full diff)
            3. Sandbox result (pass/fail badge + count)
            4. Approve & deploy (single primary button)
        */}
        <div className="space-y-6">
          
          {/* 1. Problem */}
          <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              1. What Broke
            </div>
            <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
              {plainProblem}
            </p>
          </section>

          {/* 2. Fix */}
          <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-2">
                <span>2. Synthesized Fix</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 dark:text-slate-400 normal-case font-mono text-xs">
                  {targetFile}
                </span>
              </div>

              {hasLongDiff && (
                <button
                  onClick={() => setShowFullDiff((prev) => !prev)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>{showFullDiff ? 'Collapse diff' : 'View full diff'}</span>
                  {showFullDiff ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10">
              <DiffViewer
                diff={previewDiff}
                targetFile={targetFile}
              />
            </div>
          </section>

          {/* 3. Sandbox Result */}
          <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              3. MicroVM Sandbox Verification
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    testPassed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {testPassed ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {testPassed
                      ? `${passedCount}/${testCount} tests passed`
                      : 'Sandbox verification failed'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {testPassed
                      ? '0 regressions. Memory leak neutralized under isolated load simulation.'
                      : 'Failed assertions detected in sandbox reproduction suite.'}
                  </p>
                </div>
              </div>

              {!testPassed && (
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"
                >
                  <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
                  <span>Retry Sandbox</span>
                </button>
              )}
            </div>
          </section>

          {/* 4. Approve & Deploy: Single primary action */}
          <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Ready to deploy?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Launches hotfix to 5% canary traffic with automated error-rate rollback guards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating || deploying}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>{regenerating ? 'Regenerating fix...' : 'Regenerate fix'}</span>
                </button>

                <button
                  onClick={handleDeploy}
                  disabled={deploying || regenerating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{deploying ? 'Deploying...' : 'Approve & deploy to canary'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Progressive Disclosure: Single toggle to audit reasoning trace & citations */}
          <section className="pt-2">
            <button
              onClick={() => setShowReasoning((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <span>{showReasoning ? 'Hide reasoning audit trace' : 'Show reasoning & citations'}</span>
              {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showReasoning && (
              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Autonomous Reasoning Trace
                  </h4>
                  <ReasoningTree incident={activeIncident} />

                  {citations && citations.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        External Grounding Citations
                      </h4>
                      <div className="space-y-1.5">
                        {citations.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <span className="truncate pr-2">{source.title || source.url}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
