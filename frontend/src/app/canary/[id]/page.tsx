'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  RefreshCw,
  Activity,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  FileText,
  TrendingDown,
  Gauge,
  Radio,
  Timer,
  Pause,
  Play,
  Flame,
  ShieldAlert,
  Terminal,
  Clock,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Info,
  Sliders,
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
import CanaryGauge, { getRiskLevel } from '@/components/CanaryGauge';
import StatusBadge from '@/components/StatusBadge';
import FloatingDock from '@/components/FloatingDock';
import { useAuth } from '@/context/AuthContext';
import { getCanaryStatus, promoteCanary, rollbackCanary } from '@/lib/api';
import { mockCanary, mockCanaryTimeSeries } from '@/lib/mock-data';
import { CanaryStatus } from '@/lib/types';

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

interface TelemetryEvent {
  id: string;
  time: string;
  source: 'Envoy' | 'Prometheus' | 'Guardrail' | 'Kubernetes' | 'V8 Profiler';
  type: 'success' | 'info' | 'warning';
  message: string;
}

const initialTelemetryEvents: TelemetryEvent[] = [
  {
    id: 'evt-1',
    time: '14:32:04 UTC',
    source: 'Envoy',
    type: 'success',
    message: 'Canary error rate dropped to 0.00% (Target threshold: <0.10%)',
  },
  {
    id: 'evt-2',
    time: '14:32:28 UTC',
    source: 'Prometheus',
    type: 'success',
    message: 'P99 latency stable at 28ms for 5min window (Baseline: 148ms, Δ -81%)',
  },
  {
    id: 'evt-3',
    time: '14:32:51 UTC',
    source: 'Kubernetes',
    type: 'info',
    message: '8/8 hotfix pods running in us-east-1a/b with 0 restarts',
  },
  {
    id: 'evt-4',
    time: '14:33:15 UTC',
    source: 'Guardrail',
    type: 'success',
    message: 'Zero HTTP 5xx errors recorded across 18,400 active user sessions',
  },
  {
    id: 'evt-5',
    time: '14:33:40 UTC',
    source: 'V8 Profiler',
    type: 'info',
    message: 'Heap memory stabilized at 124MB / 2048MB container ceiling (Leak neutralized)',
  },
];

export default function CanaryRolloutMonitor() {
  const params = useParams();
  const id = (params?.id as string) || 'INC-2041';
  const isDemo = id === 'INC-2041';
  const { user, canRollback, canDeploy } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [canaryStatus, setCanaryStatus] = useState<CanaryStatus>(
    isDemo ? mockCanary : {
      incidentId: id,
      trafficPercent: 0,
      baselineErrorRate: 0,
      canaryErrorRate: 0,
      baselineP99: 0,
      canaryP99: 0,
      status: 'NOT_STARTED',
    }
  );
  const [promoted, setPromoted] = useState(false);
  const [rolledBack, setRolledBack] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Traffic Control Mode: Automatic vs Manual Override
  const [controlMode, setControlMode] = useState<'auto' | 'manual'>('auto');
  const [showTooltip, setShowTooltip] = useState(false);

  // Live Auto-Promote Countdown Timer (Starts at 252s = 4m 12s)
  const [autoPromoteSeconds, setAutoPromoteSeconds] = useState(252);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Hold-to-Confirm Emergency Rollback State
  const [rollbackProgress, setRollbackProgress] = useState(0);
  const [isHoldingRollback, setIsHoldingRollback] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time Telemetry Event Log Ticker
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryEvent[]>(isDemo ? initialTelemetryEvents : []);
  const [isTickerLive, setIsTickerLive] = useState(true);

  useEffect(() => {
    setMounted(true);
    getCanaryStatus(id)
      .then((data) => {
        if (data) setCanaryStatus(data as CanaryStatus);
      })
      .catch((err) => {
        console.error(err);
        if (!isDemo) {
          setCanaryStatus({
            incidentId: id,
            trafficPercent: 0,
            baselineErrorRate: 0,
            canaryErrorRate: 0,
            baselineP99: 0,
            canaryP99: 0,
            status: 'NOT_STARTED',
          });
        }
      });
  }, [id, isDemo]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!isTimerActive || controlMode === 'manual' || promoted || rolledBack) return;

    const timer = setInterval(() => {
      setAutoPromoteSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanaryStatus((current) => ({ ...current, trafficPercent: 25 }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, controlMode, promoted, rolledBack]);

  // Streaming Telemetry Event Generator
  useEffect(() => {
    if (!isTickerLive || rolledBack) return;

    const streamPool: Array<Omit<TelemetryEvent, 'id' | 'time'>> = [
      { source: 'Envoy', type: 'success', message: 'HTTP 200 success rate at 100.00% across 4,800 req/sec' },
      { source: 'Prometheus', type: 'success', message: 'GC pause duration reduced from 340ms to 4.2ms' },
      { source: 'Guardrail', type: 'info', message: 'Automated circuit breaker armed: threshold set at 1.0% error rate' },
      { source: 'Kubernetes', type: 'info', message: 'Readiness probes 100% passing across all 8 hotfix replicas' },
      { source: 'V8 Profiler', type: 'success', message: 'LRUCache eviction verified: 42 stale JWTs evicted cleanly' },
      { source: 'Envoy', type: 'info', message: 'Canary traffic split telemetry verified with Envoy proxy EnvoyMesh' },
    ];

    let poolIdx = 0;
    const tickerInterval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC`;
      const template = streamPool[poolIdx % streamPool.length];
      poolIdx++;

      const newLog: TelemetryEvent = {
        id: `evt-${Date.now()}`,
        time: timeStr,
        source: template.source,
        type: template.type,
        message: template.message,
      };

      setTelemetryLogs((prev) => [newLog, ...prev.slice(0, 14)]);
    }, 4500);

    return () => clearInterval(tickerInterval);
  }, [isTickerLive, rolledBack]);

  const handlePromote = async () => {
    try {
      setActionError(null);
      await promoteCanary(id);
      setPromoted(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 100, status: 'PROMOTED' }));
    } catch (err: any) {
      console.error('Canary promotion failed:', err);
      setActionError(err.message || 'Canary promotion failed. Operator or Admin privileges required.');
    }
  };

  const executeRollback = async () => {
    try {
      setActionError(null);
      await rollbackCanary(id);
      setRolledBack(true);
      setCanaryStatus((prev) => ({ ...prev, trafficPercent: 0, status: 'ROLLED_BACK' }));
    } catch (err: any) {
      console.error('Canary rollback failed:', err);
      setActionError(err.message || 'Canary rollback failed. Operator or Admin privileges required.');
    }
  };

  // Hold-to-Confirm Handlers (1.5 seconds)
  const startRollbackHold = () => {
    if (actionsDisabled) return;
    setIsHoldingRollback(true);
    setRollbackProgress(0);

    const startTime = Date.now();
    const duration = 1500;

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setRollbackProgress(progress);

      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHoldingRollback(false);
        executeRollback();
      }
    }, 20);
  };

  const cancelRollbackHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHoldingRollback(false);
    setRollbackProgress(0);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const actionsDisabled = promoted || rolledBack || !canRollback;
  const currentTraffic = promoted ? 100 : rolledBack ? 0 : canaryStatus.trafficPercent || 5;
  const risk = getRiskLevel(currentTraffic);

  // Manual preset handler: pauses automatic timer and sets split
  const handleManualPreset = (pct: number) => {
    setCanaryStatus((prev) => ({ ...prev, trafficPercent: pct }));
    setIsTimerActive(false);
  };

  return (
    <div className="min-h-screen text-text-primary pb-36 md:pb-16 relative z-10">
      <TopNav />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>
        
        {/* Header Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Canary Verification
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Envoy Ingress us-east-1a/b</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Gauge className="w-5 h-5 text-indigo-500" />
              Canary Rollout & Blast Radius Verification
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live traffic split to isolated hotfix pods with dynamic risk assessment and hold-to-confirm safety gates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/postmortem/${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Post-Mortem</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <StatusBadge status={promoted ? 'DEPLOYED' : rolledBack ? 'SEV-1' : 'READY_FOR_DEPLOY'} />
          </div>
        </motion.div>

        {/* Compact Top Event Ticker Strip (Directive 5) */}
        <div className="w-full rounded-xl px-3.5 py-2 bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 truncate">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Latest Event:
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">
              {telemetryLogs[0]?.time}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              [{telemetryLogs[0]?.source}]
            </span>
            <span className="text-slate-700 dark:text-slate-300 truncate font-sans text-xs">
              {telemetryLogs[0]?.message}
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Live Envoy Stream
          </span>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-400 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-semibold">{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-700 underline shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Promotion Banner */}
        {promoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 text-emerald-800 dark:text-emerald-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Canary Promoted to 100% Production</h3>
                <p className="text-xs opacity-85">
                  Hotfix AST diff has taken over 100% of auth traffic. Baseline pods successfully drained.
                </p>
              </div>
            </div>
            <Link
              href={`/postmortem/${id}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Generate Executive Audit Trail &rarr;
            </Link>
          </motion.div>
        )}

        {/* Rollback Banner */}
        {rolledBack && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-800 dark:text-red-300"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Emergency Rollback Complete</h3>
              <p className="text-xs opacity-85">
                Canary traffic drained to 0%. 100% of traffic reverted to baseline image. Incident escalated to on-call pager.
              </p>
            </div>
          </motion.div>
        )}

        {/* Main 2-Column Responsive Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ======================================================== */}
          {/* COLUMN 1: Traffic Control & Manual Actions (lg:col-span-4)*/}
          {/* ======================================================== */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4 flex flex-col gap-5"
          >
            {/* SECTION 1: Unified Traffic Control (Directives 1, 2, 7) */}
            <div
              className={`rounded-2xl p-5 border transition-all ${
                rolledBack
                  ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                  : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-sm'
              }`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Traffic Control
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5 animate-pulse glow-healthy" /> Envoy Mesh
                </span>
              </div>

              {/* Clean Sub-header with Info Tooltip (Removing Duplicate Explanatory Sentence) */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 my-2.5">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Ingress routing with automated rollback protection
                </span>
                <div className="relative ml-2">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Traffic Split Architecture Details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  {showTooltip && (
                    <div className="absolute right-0 top-full mt-1 w-60 p-2.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 shadow-xl z-50 text-[10px] space-y-1">
                      <p className="font-bold text-white">Dynamic Envoy Routing:</p>
                      <p className="leading-snug text-slate-400">
                        Evaluates P99 latency and 5xx error spikes continuously. Automated circuit breaker triggers instant rollback if error rate exceeds 1.0%.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Traffic Routing Gauge (Without duplicate presets underneath) */}
              <div className="py-2 flex justify-center">
                <CanaryGauge
                  percentage={currentTraffic}
                  interactive={false}
                  showPresets={false}
                  showDescription={false}
                />
              </div>

              {/* Mode Toggle: Automatic Policy vs Manual Override (Directive 1) */}
              <div className="mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setControlMode('auto')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    controlMode === 'auto'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Automatic</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </button>

                <button
                  type="button"
                  onClick={() => setControlMode('manual')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    controlMode === 'manual'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                  <span>Manual Override</span>
                </button>
              </div>

              {/* Mode Content: Auto vs Manual */}
              <div className="mt-3">
                {controlMode === 'auto' ? (
                  /* Mode A: Automatic Policy Countdown */
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Next Stage Target:
                        </span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        25% Cohort
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Auto-promotes in:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                          {formatTimer(autoPromoteSeconds)}
                        </span>
                        <button
                          onClick={() => setIsTimerActive(!isTimerActive)}
                          disabled={actionsDisabled}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title={isTimerActive ? 'Pause timer' : 'Resume timer'}
                        >
                          {isTimerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-500" />}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-500"
                        style={{ width: `${Math.min(100, ((300 - autoPromoteSeconds) / 300) * 100)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Gate: Error rate &lt; 0.10%</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Current: 0.00% (PASS)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setCanaryStatus((prev) => ({ ...prev, trafficPercent: 25 }));
                        setAutoPromoteSeconds(300);
                      }}
                      disabled={actionsDisabled || currentTraffic >= 25}
                      className="w-full text-center text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 disabled:opacity-40"
                    >
                      Skip timer & promote to 25% now &rarr;
                    </button>
                  </div>
                ) : (
                  /* Mode B: Manual Override Split Buttons */
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Manual override active. Auto-promote timer is paused.</span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentTraffic}
                      disabled={actionsDisabled}
                      onChange={(e) => handleManualPreset(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: risk.color }}
                    />

                    {/* 4 Preset Chips */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5, 25, 50, 100].map((pct) => {
                        const isSelected = currentTraffic === pct;
                        const pRisk = getRiskLevel(pct);
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleManualPreset(pct)}
                            disabled={actionsDisabled}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                              isSelected
                                ? 'text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                            style={{
                              backgroundColor: isSelected ? pRisk.color : undefined,
                              borderColor: isSelected ? pRisk.color : undefined,
                            }}
                          >
                            {pct}%
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setControlMode('auto');
                        setIsTimerActive(true);
                      }}
                      className="w-full text-center text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline pt-0.5"
                    >
                      Resume Automated Policy &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Manual Actions (Directives 3 & 8) */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs backdrop-blur-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Manual Actions
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Operator Overrides</span>
              </div>

              {!canRollback && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Release actions locked for Viewer role. Requires Operator role.</span>
                </div>
              )}

              {/* Action 1: Safe Forward Promotion */}
              <button
                onClick={handlePromote}
                disabled={actionsDisabled}
                title={!canRollback ? 'Requires Operator or Admin role' : undefined}
                className="w-full rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-3 text-left disabled:opacity-40"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                    Promote to 100% Production
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deprecate baseline image and route all client ingress.
                  </div>
                </div>
              </button>

              {/* Action 2: Destructive Emergency Rollback with Hold-To-Confirm */}
              <div className="relative select-none">
                <button
                  type="button"
                  onMouseDown={startRollbackHold}
                  onMouseUp={cancelRollbackHold}
                  onMouseLeave={cancelRollbackHold}
                  onTouchStart={startRollbackHold}
                  onTouchEnd={cancelRollbackHold}
                  disabled={actionsDisabled}
                  className={`relative w-full rounded-xl p-3.5 flex items-center gap-3 transition-all text-left overflow-hidden border disabled:opacity-40 ${
                    isHoldingRollback
                      ? 'bg-red-500/25 border-red-500 ring-2 ring-red-500/50 shadow-lg'
                      : 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:bg-red-100/60 dark:hover:bg-red-950/40'
                  }`}
                >
                  {/* Visual Progress Fill */}
                  <motion.div
                    className="absolute inset-0 bg-red-600/30 pointer-events-none"
                    style={{ width: `${rollbackProgress}%` }}
                    transition={{ ease: 'linear' }}
                  />

                  <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                    isHoldingRollback ? 'scale-110 bg-red-600 text-white animate-pulse' : 'bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {isHoldingRollback ? <Flame className="w-5 h-5 text-white" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>

                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-red-700 dark:text-red-400 truncate">
                        {isHoldingRollback ? `HOLDING... ${Math.round(rollbackProgress)}%` : 'Emergency Rollback'}
                      </span>
                      <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold shrink-0">
                        1.5s Hold
                      </span>
                    </div>
                    <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5 truncate">
                      {isHoldingRollback ? 'Keep holding to abort canary...' : 'Press and hold 1.5s to restore baseline image.'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* ======================================================== */}
          {/* COLUMN 2: Telemetry Comparison & Event Stream (lg:col-span-8) */}
          {/* ======================================================== */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.08 }}
            className="lg:col-span-8 flex flex-col gap-5"
          >
            {/* SECTION 3: Live Telemetry Comparison (Side-by-Side 2-Column Grid, Directive 4) */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs backdrop-blur-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Live Telemetry Comparison
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Baseline Pods
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Canary Hotfix
                  </span>
                </div>
              </div>

              {/* Side-by-Side Charts (Reclaiming Vertical Space) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chart 1: Error Rate */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Error Rate Comparison
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      12.4% &rarr; 0.00%
                    </span>
                  </div>

                  <div className="h-[180px] w-full">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockCanaryTimeSeries} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} />
                          <YAxis tick={{ fontSize: 9, fill: '#64748B' }} unit="%" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: '10px',
                              fontSize: '11px',
                            }}
                          />
                          <Line type="monotone" dataKey="baselineError" name="Baseline %" stroke="#EF4444" strokeWidth={1.8} dot={false} />
                          <Line type="monotone" dataKey="canaryError" name="Canary %" stroke="#10B981" strokeWidth={2.2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: P99 Latency */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      P99 Latency Normalization
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                      148ms &rarr; 28ms
                    </span>
                  </div>

                  <div className="h-[180px] w-full">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockCanaryTimeSeries} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} />
                          <YAxis tick={{ fontSize: 9, fill: '#64748B' }} unit="ms" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: '10px',
                              fontSize: '11px',
                            }}
                          />
                          <Line type="monotone" dataKey="baselineP99" name="Baseline (ms)" stroke="#F59E0B" strokeWidth={1.8} dot={false} />
                          <Line type="monotone" dataKey="canaryP99" name="Canary (ms)" stroke="#06B6D4" strokeWidth={2.2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Real-Time Event Stream (Directive 6) */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs backdrop-blur-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Real-Time Telemetry Event Stream
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTickerLive(!isTickerLive)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 transition-colors"
                  >
                    {isTickerLive ? 'Pause Stream' : 'Resume Stream'}
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    {telemetryLogs.length} events
                  </span>
                </div>
              </div>

              {/* Event Reel */}
              <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {telemetryLogs.map((log) => {
                    const isSuccess = log.type === 'success';
                    const isWarning = log.type === 'warning';
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {log.time}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                            log.source === 'Envoy'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              : log.source === 'Prometheus'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : log.source === 'Kubernetes'
                              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            [{log.source}]
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 truncate">
                            {log.message}
                          </span>
                        </div>

                        <span className={`shrink-0 w-2 h-2 rounded-full ${
                          isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
                        }`} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

          </motion.div>

        </div>
      </main>

      {/* Floating Tactical Navigation Dock */}
      <FloatingDock incidentId={id} />
    </div>
  );
}
