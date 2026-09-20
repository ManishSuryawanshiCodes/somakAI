'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import RadarSubNav from '@/components/RadarSubNav';
import IncidentCard from '@/components/IncidentCard';
import ServiceTopology from '@/components/ServiceTopology';
import RemediationModal from '@/components/RemediationModal';
import FloatingDock from '@/components/FloatingDock';
import { simulateIncident, getActiveIncidents, getSystemHealth } from '@/lib/api';
import { mockHealth, mockIncident, mockIncident2 } from '@/lib/mock-data';
import { Incident, SystemHealth } from '@/lib/types';
import { useOrg } from '@/context/OrgContext';
import { useAuth } from '@/context/AuthContext';
import LandingPage from '@/components/landing/LandingPage';
import { analytics } from '@/lib/analytics';

export default function ExecutiveIncidentRadar() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [health, setHealth] = useState<SystemHealth>(mockHealth);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedService, setSelectedService] = useState<string | null>('auth-service');
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  useEffect(() => {
    setMounted(true);
    const orgId = currentOrg?.id || 'org_acme';

    getSystemHealth(orgId).then((data) => {
      if (data) {
        setHealth(data as SystemHealth);
      } else if (!isAcme) {
        setHealth({
          ...mockHealth,
          uptime: 100.0,
          activeIncidents: 0,
          mttr: '0m 00s',
          costSaved: 0,
        });
      }
    });

    getActiveIncidents(orgId).then((data) => {
      if (data && (data as Incident[]).length > 0) {
        setIncidents(data as Incident[]);
        setSelectedIncidentId((data as Incident[])[0].id);
      } else if (isAcme) {
        setIncidents([mockIncident, mockIncident2]);
        setSelectedIncidentId('INC-2041');
      } else {
        setIncidents([]);
        setSelectedIncidentId(null);
      }
    });
  }, [currentOrg, isAcme]);

  // Scroll-spy with IntersectionObserver
  useEffect(() => {
    const sections = ['overview', 'telemetry', 'topology', 'queue'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [mounted]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -90; // offset for sticky TopNav + SubNav
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    const orgId = currentOrg?.id || 'org_acme';
    const result = await simulateIncident(orgId);
    if (result) {
      setIncidents((prev) => [result as Incident, ...prev]);
      setSelectedIncident(result as Incident);
      setSelectedIncidentId((result as Incident).id);
    } else {
      // Local fallback simulation scoped to current org
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
  }, [currentOrg]);

  const handleDeploy = (id: string) => {
    setModalOpen(false);
    analytics.track('deploy_approved', {
      incident_id: id,
      target_stage: 'canary_5',
    });
    router.push(`/canary/${id}`);
  };

  // Topology node clicked -> Auto-scroll to matching incident in Queue
  const handleSelectServiceFromTopology = (serviceName: string) => {
    setSelectedService(serviceName);
    const matching = incidents.find((i) => i.service === serviceName);
    if (matching) {
      setSelectedIncidentId(matching.id);
      const incEl = document.getElementById(`incident-${matching.id}`);
      if (incEl) {
        const yOffset = -100;
        const y = incEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        scrollToSection('queue');
      }
    } else {
      scrollToSection('queue');
    }
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
  const sortedIncidents = [...incidents].sort((a, b) => {
    if (a.severity === 'SEV-1' && b.severity !== 'SEV-1') return -1;
    if (a.severity !== 'SEV-1' && b.severity === 'SEV-1') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Combine memory + latency data for dual-axis chart
  const chartData = (health.memoryUsage || []).map((m, i) => ({
    time: m.timestamp,
    memory: m.value,
    latency: health.latencyData?.[i]?.value || 0,
  }));

  const activeIncidentId = incidents[0]?.id || 'INC-2041';

  if (!mounted) {
    let hasStoredUser = false;
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('sentryops_user')) {
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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#F8FAFC] dark:bg-[#090D16]">
      {/* Top Navigation */}
      <TopNav onSimulate={handleSimulate} isSimulating={simulating} />

      {/* Sticky Section Sub-Navigation Bar with Scroll-Spy & Needs Attention Strip */}
      <RadarSubNav
        activeSection={activeSection}
        onNavigate={scrollToSection}
        readyDeployCount={incidents.length}
        atRiskSloCount={1}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 max-w-[1720px] w-full mx-auto gap-6 pb-36 md:pb-16">
        
        {/* ======================================================== */}
        {/* THE ANSWER TO: "IS SOMETHING BROKEN?" (First visible viewport) */}
        {/* ======================================================== */}
        {sortedIncidents.length > 0 ? (
          <div className="rounded-2xl p-5 sm:p-6 border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-rose-900/20 dark:to-slate-900/40 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                      {sortedIncidents.length} Critical Incident{sortedIncidents.length > 1 ? 's' : ''} — Action Needed
                    </h1>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800">
                      SEV-1 ACTIVE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                    {sortedIncidents[0].service} ({sortedIncidents[0].severity}) has an automated AST patch verified & ready for production canary deployment.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Single Primary Button: Review Fix in Studio */}
                <Link
                  href={`/remediation/${sortedIncidents[0].id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 hover:scale-[1.02] active:scale-95 transition-all text-center"
                >
                  <span>Review Fix in Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  title="Ingest mock telemetry spike"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  <span>{simulating ? 'Ingesting...' : 'Test Spike'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : !isAcme ? (
          <div className="rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur-sm relative overflow-hidden">
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
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      {currentOrg?.name || 'Workspace'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                    <Link href="/onboarding/setup" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold">
                      Connect Sentry to start monitoring →
                    </Link>{' '}
                    or simulate a crash below to preview autonomous AST patch synthesis.
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
                  <span>{simulating ? 'Synthesizing...' : 'Simulate Sev-1 Crash (Demo Action)'}</span>
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
                    All 4 production services nominal across us-east-1 and us-west-2. Zero active alerts or SLO burn.
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
                  <span>Simulate Sev-1 Crash (Demo Action)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODULE 1: Overview & Executive KPIs */}
        {/* ======================================================== */}
        <section
          id="overview"
          className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-sm"
        >
          {/* Section Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/50">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Cluster Health & Business Impact KPIs
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Continuous multi-cluster availability, autonomous MTTR reduction, and outage downtime cost mitigation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/slo"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                <span>Full SLO Metrics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 Priority Micro-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* KPI 1: Active Incidents */}
            <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/50 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/50 relative">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse glow-critical" />
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
                  {incidents.length > 0 ? 'SEV-1 Beacon' : 'Nominal'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px] mt-1">
                  {incidents[0]?.service || 'None'}
                </span>
              </div>
            </div>

            {/* KPI 2: Autonomous MTTR */}
            <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
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
            <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
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
            <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200/60 dark:border-cyan-900/50">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                    Downtime Cost Saved
                  </span>
                  <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-white leading-none">
                    ${(health.costSaved || 42800).toLocaleString()}
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
        </section>

        {/* ======================================================== */}
        {/* MODULE 2: Telemetry Ingestion & Spike Correlation */}
        {/* ======================================================== */}
        <section
          id="telemetry"
          className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-sm"
        >
          {/* Section Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/50">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Telemetry Ingestion & Spike Correlation
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/50 dark:text-rose-400 font-bold">
                    Spike Detected at 14:02 UTC
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Correlating V8 heap exhaustion against P99 ingress authentication latency in real-time.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Memory Heap (%)
                </span>
                <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> P99 Latency (ms)
                </span>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
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

          {/* Compact Telemetry Stats Row (Tightened Gap & Reclaimed Vertical Whitespace) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-4">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Current Memory Heap
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-mono font-extrabold text-rose-600 dark:text-rose-400">
                  94.2%
                </span>
                <span className="text-[11px] font-mono text-slate-500">1.85 / 2.0 GB Peak</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-rose-500 w-[94.2%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                P99 Ingress Latency
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                  2,840ms
                </span>
                <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold">+810%</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Baseline: 68ms nominal</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Time Since Spike
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                  3m 12s
                </span>
                <span className="text-[11px] font-mono text-slate-500">14:02 UTC</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                Auto-Triage Completed
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Anomaly Engine Isolation
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                  99.4%
                </span>
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

        {/* ======================================================== */}
        {/* MODULE 3: Microservice Topology & Blast Radius */}
        {/* ======================================================== */}
        <section
          id="topology"
          className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-sm"
        >
          {/* Section Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/50">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Service Topology & Blast Radius</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-900/50 dark:text-emerald-400 font-bold">
                    Live Graph
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a node to inspect health or jump to its matching incident below.
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

          {/* Interactive Topology Graph & Blast Radius Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-12">
              <ServiceTopology
                selectedService={selectedService}
                onSelectService={handleSelectServiceFromTopology}
                hoveredService={hoveredService}
              />
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* MODULE 4: Active Incident Remediation Queue */}
        {/* ======================================================== */}
        <section
          id="queue"
          className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-sm"
        >
          {/* Section Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-900/50">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Active Incident Remediation Queue
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/50">
                    {sortedIncidents.length} Ready for Operator Review
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prioritized by severity and arrival time. Hover a card to highlight its node in the topology above.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
                <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-bold">⌘↵</kbd> to Deploy Canary</span>
              </span>
            </div>
          </div>

          {/* Incident Cards Queue */}
          {sortedIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No active incidents for {currentOrg?.name || 'Workspace'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  <Link href="/onboarding/setup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                    Connect Sentry to start monitoring →
                  </Link>
                </p>
              </div>
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center gap-1.5"
              >
                <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                <span>Simulate Sev-1 Crash (Demo Action)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedIncidents.map((incident) => (
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
              ))}
            </div>
          )}
        </section>

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
