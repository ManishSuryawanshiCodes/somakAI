'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  FileText,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Activity,
  Radio,
  ShieldCheck,
  GitPullRequest,
  GitMerge,
  Loader2,
  Rocket,
  ExternalLink,
  Check,
  GitBranch,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import TopNav from '@/components/TopNav';
import PipelineFlow from '@/components/PipelineFlow';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { getCanaryStatus, promoteCanary, rollbackCanary } from '@/lib/api';
import { mockCanary, mockCanaryTimeSeries } from '@/lib/mock-data';
import { CanaryStatus } from '@/lib/types';
import {
  getServiceRepoMapping,
  approveAndDeployIncident,
  getIncidentDeployRecord,
  mergeAndDeployPR,
  IncidentDeployRecord,
} from '@/lib/services-repo';

interface TelemetryEvent {
  id: string;
  time: string;
  source: string;
  message: string;
}

const initialTelemetryEvents: TelemetryEvent[] = [
  {
    id: 'evt-1',
    time: '14:32:04 UTC',
    source: 'Envoy',
    message: 'Canary error rate stable at 0.00% (Baseline 14.8%)',
  },
  {
    id: 'evt-2',
    time: '14:32:28 UTC',
    source: 'Prometheus',
    message: 'P99 latency stable at 28ms (Δ -81% reduction)',
  },
  {
    id: 'evt-3',
    time: '14:32:51 UTC',
    source: 'Kubernetes',
    message: '8/8 hotfix pods healthy with 0 restarts',
  },
  {
    id: 'evt-4',
    time: '14:33:15 UTC',
    source: 'Guardrail',
    message: 'Zero 5xx errors recorded across active user sessions',
  },
];

const trafficStages = [5, 25, 50, 100];

export default function CanaryRolloutMonitor() {
  const params = useParams();
  const id = (params?.id as string) || 'INC-2041';
  const isDemo = id === 'INC-2041';
  const router = useRouter();
  const { user } = useAuth();

  const [canaryStatus, setCanaryStatus] = useState<CanaryStatus>(
    isDemo
      ? mockCanary
      : {
          incidentId: id,
          trafficPercent: 5,
          baselineErrorRate: 14.8,
          canaryErrorRate: 0.0,
          baselineP99: 148,
          canaryP99: 28,
          status: 'IN_PROGRESS',
        }
  );

  const [promoted, setPromoted] = useState(false);
  const [rolledBack, setRolledBack] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Post-approval deployment state
  const [deployRecord, setDeployRecord] = useState<IncidentDeployRecord | null>(null);
  const [mergingPR, setMergingPR] = useState(false);

  const serviceName = id.includes('2041') ? 'auth-service' : 'auth-service';
  const serviceMapping = getServiceRepoMapping(serviceName);

  useEffect(() => {
    // Check if incident was already deployed/promoted
    const existingDeploy = getIncidentDeployRecord(id);
    if (existingDeploy) {
      setDeployRecord(existingDeploy);
      setPromoted(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 100, status: 'PROMOTED' }));
      return;
    }

    let active = true;
    getCanaryStatus(id)
      .then((data) => {
        if (active && data) {
          setCanaryStatus(data as CanaryStatus);
          if ((data as CanaryStatus).trafficPercent === 100 || (data as CanaryStatus).status === 'PROMOTED') {
            setPromoted(true);
          } else if ((data as CanaryStatus).trafficPercent === 0 || (data as CanaryStatus).status === 'ROLLED_BACK') {
            setRolledBack(true);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const currentTraffic = promoted ? 100 : rolledBack ? 0 : canaryStatus.trafficPercent || 5;

  const handleSetTrafficStep = (pct: number) => {
    if (pct === 100) {
      handlePromote();
    } else {
      setPromoted(false);
      setRolledBack(false);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: pct, status: 'IN_PROGRESS' }));
    }
  };

  const handlePromote = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await promoteCanary(id);
      const record = await approveAndDeployIncident(id, serviceName, '18/18 passed', 99.4);
      setDeployRecord(record);
      setPromoted(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 100, status: 'PROMOTED' }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Canary promotion failed.');
      setPromoted(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 100, status: 'PROMOTED' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMergePR = async () => {
    setMergingPR(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const updated = mergeAndDeployPR(id);
      if (updated) {
        setDeployRecord(updated);
      }
    } finally {
      setMergingPR(false);
    }
  };

  const handleRollback = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await rollbackCanary(id);
      setRolledBack(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 0, status: 'ROLLED_BACK' }));
    } catch {
      setRolledBack(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 0, status: 'ROLLED_BACK' }));
    } finally {
      setActionLoading(false);
      setShowRollbackConfirm(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-4xl w-full mx-auto space-y-8 pb-24">
        {/* Navigation & Pipeline Context */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Radar</span>
          </Link>

          <div className="bg-white/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-2xs backdrop-blur-xs">
            <PipelineFlow
              currentStep={promoted ? 'deployed' : 'canary'}
              compact
              deployedData={
                deployRecord
                  ? {
                      commitSha: deployRecord.commit_sha,
                      prUrl: deployRecord.pr_url,
                      prNumber: deployRecord.pr_number,
                      deploymentUrl: deployRecord.deployment_url,
                      status: deployRecord.status,
                    }
                  : undefined
              }
            />
          </div>
        </div>

        {/* Verdict Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{id}</span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
              <span className="font-semibold text-base text-slate-900 dark:text-white tracking-tight">
                Canary Verification
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Traffic Rollout
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <StatusBadge
              status={promoted ? 'DEPLOYED' : rolledBack ? 'FAILED' : 'READY_FOR_DEPLOY'}
              confidence={99.4}
            />

            <Link
              href={`/postmortem/${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Post-Mortem</span>
            </Link>
          </div>
        </div>

        {/* Codebase Connection Warning Banner (if no repo mapped) */}
        {!serviceMapping && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Connect a repository to deploy this fix
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Service <strong>{serviceName}</strong> has no repository mapped yet. Connect a GitHub repository in Settings to commit the verified patch.
                </p>
              </div>
            </div>
            <Link
              href="/settings?tab=repositories"
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shrink-0 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Map Repository</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Post-Approval Live Deployment Status Banner */}
        {deployRecord && deployRecord.status === 'pr_opened' && (
          <div className="p-4.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center shrink-0">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pull Request #{deployRecord.pr_number} Opened
                  </h4>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                    {deployRecord.branch}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Hotfix patch committed to <strong>{deployRecord.repo_full_name}</strong> with verified 18/18 MicroVM test results. Merge to trigger automatic production deployment.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={deployRecord.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleMergePR}
                disabled={mergingPR}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                {mergingPR ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                <span>{mergingPR ? 'Merging...' : 'Merge & Deploy'}</span>
              </button>
            </div>
          </div>
        )}

        {deployRecord && (deployRecord.status === 'merged' || deployRecord.status === 'building') && (
          <div className="p-4.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Merged into {deployRecord.repo_full_name} &rarr; Deploying on Vercel...
                  </h4>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                    #{deployRecord.commit_sha}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Push to main triggered build pipeline. Building container image and propagating edge routes.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const updated = mergeAndDeployPR(id);
                if (updated) setDeployRecord(updated);
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Check Status</span>
            </button>
          </div>
        )}

        {deployRecord && deployRecord.status === 'deployed' && (
          <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Deployed to Production
                  </h4>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                    #{deployRecord.commit_sha}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Hotfix active on 100% production traffic. Zero regressions detected.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={deployRecord.deployment_url || 'https://auth-service-live.somakai.dev'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>View Live Service</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                href={`/postmortem/${id}`}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>View Post-Mortem &rarr;</span>
              </Link>
            </div>
          </div>
        )}

        {/* Notifications / Banners */}
        {promoted && !deployRecord && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Canary Promoted to 100% Production
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  100% of production traffic successfully routed to the verified AST patch.
                </p>
              </div>
            </div>
            <Link
              href={`/postmortem/${id}`}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              View Post-Mortem &rarr;
            </Link>
          </div>
        )}

        {rolledBack && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Rollback Complete
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Traffic reverted to baseline image (0% canary). Incident escalated to on-call.
              </p>
            </div>
          </div>
        )}

        {/* PRIMARY VISUALIZATION: Clean horizontal progress bar (5% → 25% → 50% → 100%) */}
        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Canary Traffic Split
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {currentTraffic}% Traffic
              </div>
            </div>

            <div className="flex items-center gap-4 sm:text-right">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Current Error Rate
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {canaryStatus.canaryErrorRate ?? 0.0}%
                </div>
              </div>
            </div>
          </div>

          {/* Simple Horizontal Progress Bar with 5% → 25% → 50% → 100% indicators */}
          <div className="space-y-3">
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${currentTraffic}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 dark:text-slate-500 px-0.5">
              {trafficStages.map((pct) => (
                <div
                  key={pct}
                  className={`flex flex-col items-center ${
                    currentTraffic >= pct
                      ? 'text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <span className="text-[11px]">{pct}%</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      currentTraffic >= pct ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Stepped Traffic Override Selector */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Manual Traffic Override:</span>
              <div className="flex items-center gap-1.5">
                {trafficStages.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => handleSetTrafficStep(stage)}
                    disabled={actionLoading}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
                      currentTraffic === stage
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {stage}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Before / After comparison strip */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Baseline Error
              </span>
              <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 block mt-0.5">
                {canaryStatus.baselineErrorRate || 14.8}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Canary Error
              </span>
              <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {canaryStatus.canaryErrorRate || 0.0}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Baseline P99
              </span>
              <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                {canaryStatus.baselineP99 || 148}ms
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Canary P99
              </span>
              <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {canaryStatus.canaryP99 || 28}ms
              </span>
            </div>
          </div>
        </section>

        {/* PRIMARY ACTIONS: One Approve / Pause / Rollback control */}
        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Promotion & Deployment Controls
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {promoted
                  ? 'Fix approved & pushed to codebase. View the automated PR and deployment status above.'
                  : 'Promote verified patch to 100% production or pause rollout to collect more telemetry.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!promoted && !rolledBack && (
                <>
                  <button
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors inline-flex items-center gap-1.5"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Resume rollout' : 'Pause rollout'}</span>
                  </button>

                  <button
                    onClick={handlePromote}
                    disabled={actionLoading || isPaused}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deploying patch...</span>
                      </>
                    ) : (
                      <>
                        <span>Approve 100% promotion</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRollbackConfirm(true)}
                    disabled={actionLoading}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 transition-colors inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Emergency Rollback</span>
                  </button>
                </>
              )}

              {(promoted || rolledBack) && (
                <div className="flex items-center gap-2.5">
                  {deployRecord?.pr_url && (
                    <a
                      href={deployRecord.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5"
                    >
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>PR #{deployRecord.pr_number}</span>
                    </a>
                  )}

                  <Link
                    href={`/postmortem/${id}`}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition-colors inline-flex items-center gap-2"
                  >
                    <span>Open Post-Mortem Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PROGRESSIVE DISCLOSURE: View live telemetry toggle */}
        <section className="pt-2">
          <button
            onClick={() => setShowTelemetryDrawer((prev) => !prev)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <span>{showTelemetryDrawer ? 'Hide telemetry details' : 'View live telemetry & event logs'}</span>
            {showTelemetryDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTelemetryDrawer && (
            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-6">
              {/* Telemetry Chart */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Live Telemetry (Baseline vs Canary)
                  </h4>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Baseline Error
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Canary Error
                    </span>
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockCanaryTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="baselineError"
                        stroke="#F43F5E"
                        strokeWidth={2}
                        dot={false}
                        name="Baseline Error"
                      />
                      <Line
                        type="monotone"
                        dataKey="canaryError"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        name="Canary Error"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Event Log Stream */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Live Event Stream
                </h4>
                <div className="space-y-2">
                  {initialTelemetryEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-mono text-[10px] text-slate-400">{evt.time}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {evt.source}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">{evt.message}</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Rollback Confirmation Modal */}
        {showRollbackConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Emergency Rollback</h3>
                  <p className="text-xs text-slate-500">Immediate traffic diversion</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to rollback <strong>{id}</strong>? This will immediately drop canary routing to <strong>0%</strong>, revert all live incoming traffic to the baseline container image, and alert on-call responders.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRollbackConfirm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Rolling back...' : 'Confirm Rollback'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
