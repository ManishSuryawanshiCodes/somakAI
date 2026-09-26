'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  Zap,
  Cpu,
  CheckCircle2,
  TrendingDown,
  ArrowUp,
  ArrowRight,
  Layers,
  LineChart,
  Keyboard,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Network,
  Server,
  ShieldAlert,
  ArrowDown,
  HelpCircle,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import TopNav from '@/components/TopNav';
import IncidentCard from '@/components/IncidentCard';
import FloatingDock from '@/components/FloatingDock';
import { simulateIncident, getActiveIncidents, getSystemHealth, getSandboxQueueStatus, SandboxQueueStatus } from '@/lib/api';
import { mockHealth, mockIncident, mockIncident2 } from '@/lib/mock-data';
import { Incident, SystemHealth } from '@/lib/types';
import { useOrg } from '@/context/OrgContext';
import { useAuth } from '@/context/AuthContext';
import { analytics } from '@/lib/analytics';

const ServiceTopology = dynamic(() => import('@/components/ServiceTopology'), {
  loading: () => <div className="p-8 text-center text-xs text-slate-400">Loading Topology Map...</div>,
});
const RemediationModal = dynamic(() => import('@/components/RemediationModal'), { ssr: false });
const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ExecutiveIncidentRadar() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  const emptyHealth: SystemHealth = {
    uptime: 100.0,
    activeIncidents: 0,
    mttr: '0m 00s',
    costSaved: 0,
    healthHistory: Array(24).fill(100.0),
    memoryUsage: Array.from({ length: 24 }, (_, i) => ({ timestamp: `${String(i).padStart(2, '0')}:00`, value: 28 })),
    latencyData: Array.from({ length: 24 }, (_, i) => ({ timestamp: `${String(i).padStart(2, '0')}:00`, value: 15 })),
  };

  const [health, setHealth] = useState<SystemHealth>(isAcme ? mockHealth : emptyHealth);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');
  const [mainTab, setMainTab] = useState<'incidents' | 'telemetry' | 'topology'>('incidents');
  const [sandboxQueue, setSandboxQueue] = useState<SandboxQueueStatus | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(isAcme ? 'auth-service' : null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const orgId = currentOrg?.id || 'org_acme';

    if (!isAcme) {
      setHealth(emptyHealth);
      setSelectedService(null);
    } else {
      setSelectedService('auth-service');
    }

    getSystemHealth(orgId).then((data) => {
      if (data) {
        setHealth(data as SystemHealth);
      } else if (!isAcme) {
        setHealth(emptyHealth);
      }
    });

    getActiveIncidents(orgId).then((data) => {
      if (data && (data as Incident[]).length > 0) {
        setIncidents(data as Incident[]);
        setSelectedIncidentId((data as Incident[])[0].id);
        setSelectedService((data as Incident[])[0].service);
      } else if (isAcme) {
        setIncidents([mockIncident, mockIncident2]);
        setSelectedIncidentId('INC-2041');
        setSelectedService('auth-service');
      } else {
        setIncidents([]);
        setSelectedIncidentId(null);
        setSelectedService(null);
      }
    });

    getSandboxQueueStatus().then((data) => {
      if (data) setSandboxQueue(data);
    });
  }, [currentOrg, isAcme]);

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    const orgId = currentOrg?.id || 'org_acme';
    const result = await simulateIncident(orgId);
    if (result) {
      setIncidents((prev) => [result as Incident, ...prev]);
      setSelectedIncident(result as Incident);
      setSelectedIncidentId((result as Incident).id);
      setSelectedService((result as Incident).service);
    } else if (isAcme) {
      // Local fallback simulation scoped to demo workspace only
      const fallback: Incident = {
        ...mockIncident,
        id: `INC-${Math.floor(2000 + Math.random() * 8000)}`,
        organization_id: orgId,
        timestamp: new Date().toISOString(),
      };
      setIncidents((prev) => [fallback, ...prev]);
      setSelectedIncident(fallback);
      setSelectedIncidentId(fallback.id);
    }
    const h = await getSystemHealth(orgId);
    if (h) setHealth(h as SystemHealth);
    setSimulating(false);
  }, [currentOrg, isAcme]);

  const handleDeploy = (id: string) => {
    setModalOpen(false);
    analytics.track('deploy_approved', {
      incident_id: id,
      target_stage: 'canary_5',
    });
    router.push(`/canary/${id}`);
  };

  // Topology node clicked -> Switch to incidents tab and focus incident
  const handleSelectServiceFromTopology = (serviceName: string) => {
    setSelectedService(serviceName);
    const matching = incidents.find((i) => i.service === serviceName);
    if (matching) {
      setSelectedIncidentId(matching.id);
    }
    setMainTab('incidents');
  };

  // Global Keyboard Shortcut: ⌘ + Enter (or Ctrl + Enter) -> Deploy Hotfix immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const activeId = incidents[0]?.id || 'INC-2041';
        router.push(`/canary/${activeId}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incidents, router]);

  // Sort incidents: SEV-1 first, then newest
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      if (a.severity === 'SEV-1' && b.severity !== 'SEV-1') return -1;
      if (a.severity !== 'SEV-1' && b.severity === 'SEV-1') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [incidents]);

  // Combine memory + latency data for dual-axis chart
  const chartData = useMemo(() => {
    return (health.memoryUsage || []).map((m, i) => ({
      time: m.timestamp,
      memory: m.value,
      latency: health.latencyData?.[i]?.value || 0,
    }));
  }, [health.memoryUsage, health.latencyData]);

  const activeIncidentId = incidents[0]?.id || 'INC-2041';

  if (!mounted) {
    let hasStoredUser = false;
    try {
      if (typeof window !== 'undefined' && (localStorage.getItem('somak_user') || localStorage.getItem('sentryops_user'))) {
        hasStoredUser = true;
      }
    } catch {}

    if (hasStoredUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return <LandingPage />;
  }

  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen text-[#181614] dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      {/* Top Navigation */}
      <TopNav onSimulate={handleSimulate} isSimulating={simulating} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 max-w-[1720px] w-full mx-auto gap-6 pb-36 md:pb-16">
        
        {/* ======================================================== */}
        {/* TOP INCIDENT ACTION HERO & PROMINENT CANARY APPROVAL */}
        {/* ======================================================== */}
        {sortedIncidents.length > 0 ? (
          sortedIncidents[0].status === 'NEEDS_HUMAN_REVIEW' ? (
            <div className="rounded-2xl p-5 sm:p-6 border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-950/50 dark:via-amber-900/20 dark:to-slate-900/40 shadow-lg relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                        Autonomous Fix Failed — Manual Review Required
                      </h1>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                        MAX RETRIES EXHAUSTED (3/3)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                      Sandbox test suite failed across 3 self-correction iterations for <span className="font-mono font-bold text-slate-900 dark:text-white">{sortedIncidents[0].service}</span>. Human engineer inspection required before deployment.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/remediation/${sortedIncidents[0].id}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-black bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-600/30 hover:scale-[1.02] active:scale-95 transition-all text-center"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Review Failure Traces & Fix</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 sm:p-6 border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10 shadow-lg relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/20">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Hotfix Verified &amp; Ready for Canary Launch
                      </h1>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                        {sortedIncidents[0].service} • {sortedIncidents[0].severity}
                      </span>
                      {sortedIncidents[0].patch?.sandboxExecution?.loops && sortedIncidents[0].patch.sandboxExecution.loops > 1 && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                          Self-corrected ({sortedIncidents[0].patch.sandboxExecution.loops} loops)
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                      AST patch passed isolated container reproduction suite with 0-byte memory leak. Zero network access verified.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* UNMISSABLE, PROMINENT CANARY APPROVAL BUTTON */}
                  <button
                    onClick={() => handleDeploy(sortedIncidents[0].id)}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/35 hover:scale-[1.03] active:scale-95 transition-all text-center cursor-pointer ring-2 ring-emerald-400/50 btn-glow-primary"
                    title="Launch hotfix to 5% canary traffic immediately (⌘+Enter)"
                  >
                    <Play className="w-4 h-4 fill-current text-white" />
                    <span>Approve Canary Launch (5% Traffic)</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-700 text-[10px] font-mono text-emerald-100 font-normal ml-1">⌘↵</kbd>
                  </button>

                  <Link
                    href={`/remediation/${sortedIncidents[0].id}`}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/20 bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-100 transition-all text-center shadow-sm"
                  >
                    <span>Studio Diff</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                  </Link>
                </div>
              </div>
            </div>
          )
        ) : !isAcme ? (
          <div className="rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-sm backdrop-blur-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      No incidents yet.
                    </h1>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      {currentOrg?.name || 'Workspace'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                    <Link href="/onboarding/setup" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold">
                      Connect Sentry →
                    </Link>{' '}
                    or simulate a crash to preview.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all active:scale-95 btn-glow-primary"
                >
                  <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  <span>{simulating ? 'Simulating...' : 'Simulate Crash'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-5 sm:p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-slate-900/40 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                      All Systems Healthy
                    </h1>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                      NOMINAL
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                    All services nominal. Zero active alerts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  <span>Simulate Crash</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EXECUTIVE KPIS (Clean, Sleek 4-Card Row) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Active Incidents */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/50 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/50 relative">
                <AlertTriangle className="w-5 h-5" />
                {incidents.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse glow-critical" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Active Incidents
                </span>
                <span className="text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400 leading-none">
                  {incidents.length > 0 ? `${incidents.length} Critical` : '0 Active'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                {incidents.length > 0 ? 'Action Needed' : 'Nominal'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px] mt-1">
                {incidents[0]?.service || 'All Good'}
              </span>
            </div>
          </div>

          {/* KPI 2: Autonomous MTTR */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-900/50">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Autonomous MTTR
                </span>
                <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-white leading-none">
                  {health.mttr || '3m 42s'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> -78%
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">vs 48m human baseline</span>
            </div>
          </div>

          {/* KPI 3: System Health */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-900/50">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  System Health
                </span>
                <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-white leading-none">
                  {health.uptime || 99.94}%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUp className="w-3.5 h-3.5" /> +0.12%
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">24h Cluster SLA</span>
            </div>
          </div>

          {/* KPI 4: Downtime Cost Saved */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200/60 dark:border-cyan-900/50">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Downtime Cost Saved
                </span>
                <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-white leading-none">
                  ${(typeof health.costSaved === 'number' ? health.costSaved : 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                +4.2x ROI
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">@ $8.4k/min tier</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MINIMALIST WORKSPACE TABS */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMainTab('incidents')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                mainTab === 'incidents'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Incident Queue</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  mainTab === 'incidents'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                {sortedIncidents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('telemetry')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                mainTab === 'telemetry'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Live Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('topology')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                mainTab === 'topology'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Service Topology</span>
            </button>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs text-[11px] font-mono text-slate-600 dark:text-slate-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sandbox Pool:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {(() => {
                  if (!sandboxQueue) return '4/4 Idle';
                  const max = sandboxQueue.max_parallel ?? sandboxQueue.maxConcurrency ?? 4;
                  const active = sandboxQueue.active_count ?? sandboxQueue.activeSandboxes ?? 0;
                  const available = sandboxQueue.available_slots ?? Math.max(0, max - active);
                  if (typeof available !== 'number' || typeof max !== 'number' || isNaN(available) || isNaN(max)) {
                    return '4/4 Idle';
                  }
                  return `${available}/${max} Idle`;
                })()}
              </span>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              title="Inject mock telemetry crash"
            >
              <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Simulating...' : 'Simulate Crash'}</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: INCIDENT QUEUE (Immediately Visible Above Fold) */}
        {/* ======================================================== */}
        {mainTab === 'incidents' && (
          <div className="space-y-4">
            {sortedIncidents.length === 0 ? (
              <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No active incidents for {currentOrg?.name || 'Workspace'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    <Link href="/onboarding/setup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                      Connect Sentry to start monitoring →
                    </Link>
                  </p>
                </div>
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/5 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all inline-flex items-center gap-1.5"
                >
                  <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  <span>Simulate Crash</span>
                </button>
              </div>
            ) : (
              sortedIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  selected={selectedIncidentId === incident.id}
                  onDeploy={handleDeploy}
                  onHoverService={setHoveredService}
                  onSelect={(id) => {
                    setSelectedIncidentId(id);
                    setSelectedService(incident.service);
                  }}
                  onQuickInspect={(inc) => {
                    setSelectedIncident(inc);
                    setModalOpen(true);
                    analytics.track('incident_viewed', {
                      incident_id: inc.id,
                      service: inc.service,
                      severity: inc.severity,
                    });
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LIVE TELEMETRY (Dual-Axis Scrub Area Chart) */}
        {/* ======================================================== */}
        {mainTab === 'telemetry' && (
          <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/50">
                  <LineChart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Live Telemetry Ingestion
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/10">
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Memory Heap (%)
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> P99 Latency (ms)
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-bold">
                  {(['1h', '6h', '24h'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        timeRange === t
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Telemetry Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Current Memory Heap
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-mono font-extrabold text-rose-600 dark:text-rose-400">94.2%</span>
                  <span className="text-[11px] font-mono text-slate-500">1.85 / 2.0 GB</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-rose-500 w-[94.2%]" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  P99 Ingress Latency
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-mono font-extrabold text-cyan-600 dark:text-cyan-400">2,840ms</span>
                  <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold">+810%</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Baseline: 68ms nominal</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Time Since Spike
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">3m 12s</span>
                  <span className="text-[11px] font-mono text-slate-500">14:02 UTC</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                  Auto-Triage Completed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Anomaly Engine Isolation
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-mono font-extrabold text-indigo-600 dark:text-indigo-400">99.4%</span>
                  <span className="text-[11px] font-mono text-slate-500">Confidence</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate block mt-1">
                  ERR_EVENTEMITTER_LEAK
                </span>
              </div>
            </div>

            {/* Dual-Axis Scrub Area Chart */}
            <div className="w-full h-[320px] sm:h-[360px] pt-2">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="latGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      cursor={{ stroke: '#6366F1', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <ReferenceLine
                      x="14:00"
                      yAxisId="left"
                      stroke="#F43F5E"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: 'Spike Detected → Auto-Triage Started',
                        position: 'insideTopLeft',
                        fill: '#E11D48',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="memory"
                      name="Memory Heap (%)"
                      stroke="#6366F1"
                      fill="url(#memGradient)"
                      strokeWidth={2.5}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="latency"
                      name="P99 Latency (ms)"
                      stroke="#06B6D4"
                      fill="url(#latGradient)"
                      strokeWidth={2.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SERVICE TOPOLOGY & BLAST RADIUS */}
        {/* ======================================================== */}
        {mainTab === 'topology' && (
          <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/50">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Service Topology &amp; Blast Radius</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-900/50 dark:text-emerald-400 font-bold">
                      Live Graph
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click a node to inspect service and jump to its incident hotfix.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/slo"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 hover:underline"
                >
                  <span>Inspect All Error Budgets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="w-full">
              <ServiceTopology
                selectedService={selectedService}
                onSelectService={handleSelectServiceFromTopology}
                hoveredService={hoveredService}
              />
            </div>
          </section>
        )}

      </main>

      {/* Floating Tactical Navigation Dock (Mobile Only, cleared by pb-36) */}
      <FloatingDock incidentId={activeIncidentId} />

      {/* Quick Focused Modal */}
      <RemediationModal
        incident={selectedIncident}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onDeploy={handleDeploy}
      />
    </div>
  );
}
