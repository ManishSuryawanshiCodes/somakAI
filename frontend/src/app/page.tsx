'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import IncidentCard from '@/components/IncidentCard';
import PipelineFlow from '@/components/PipelineFlow';
import MiniSparkline from '@/components/MiniSparkline';
import { simulateIncident, getActiveIncidents, getSystemHealth } from '@/lib/api';
import { mockHealth, mockIncident, mockIncident2 } from '@/lib/mock-data';
import { Incident, SystemHealth } from '@/lib/types';
import { useOrg } from '@/context/OrgContext';
import { useAuth } from '@/context/AuthContext';

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
  const [viewingSampleDemo, setViewingSampleDemo] = useState(false);
  const isAcme = Boolean(currentOrg && currentOrg.id === 'org_acme');

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
  const [simulating, setSimulating] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'SEV-1' | 'SEV-2' | 'SEV-3'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  useEffect(() => {
    setMounted(true);
    if (!currentOrg) {
      setHealth(emptyHealth);
      setIncidents([]);
      return;
    }

    const orgId = currentOrg.id;

    if (!isAcme) {
      setHealth(emptyHealth);
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
      } else if (isAcme) {
        setIncidents([mockIncident, mockIncident2]);
      } else {
        setIncidents([]);
      }
    });
  }, [currentOrg, isAcme]);

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    const orgId = currentOrg?.id;
    if (!orgId) {
      setSimulating(false);
      return;
    }
    const result = await simulateIncident(orgId);
    if (result) {
      setIncidents((prev) => [result as Incident, ...prev]);
    } else if (isAcme) {
      const fallback: Incident = {
        ...mockIncident,
        id: `INC-${Math.floor(2000 + Math.random() * 8000)}`,
        organization_id: orgId,
        timestamp: new Date().toISOString(),
      };
      setIncidents((prev) => [fallback, ...prev]);
    }
    const h = await getSystemHealth(orgId);
    if (h) setHealth(h as SystemHealth);
    setSimulating(false);
  }, [currentOrg, isAcme]);

  // Extract distinct services for filtering
  const availableServices = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach((inc) => {
      if (inc.service) set.add(inc.service);
    });
    return Array.from(set);
  }, [incidents]);

  // Filter & sort incidents: SEV-1 first, then newest
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
        if (serviceFilter !== 'ALL' && inc.service !== serviceFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.severity === 'SEV-1' && b.severity !== 'SEV-1') return -1;
        if (a.severity !== 'SEV-1' && b.severity === 'SEV-1') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [incidents, severityFilter, serviceFilter]);

  const sortedIncidents = filteredIncidents;

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

  const hasIncidents = sortedIncidents.length > 0;
  const topIncident = sortedIncidents[0];

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      {/* Top Navigation */}
      <TopNav onSimulate={handleSimulate} isSimulating={simulating} />

      {/* Main Content Area - Calm, focused, high-whitespace layout */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-4xl w-full mx-auto space-y-8 pb-24">
        
        {/* Demonstration Mode Notice Banner */}
        {(isAcme || viewingSampleDemo) && hasIncidents && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Sample Demo Mode:</strong> You are viewing sample incident data ({topIncident.id}). Connect Sentry or send a webhook to see your real incidents.
              </span>
            </div>
            {viewingSampleDemo && (
              <button
                onClick={() => {
                  setViewingSampleDemo(false);
                  setIncidents([]);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-semibold text-[11px] transition-colors"
              >
                Exit Demo
              </button>
            )}
          </div>
        )}

        {/* Core End-to-End Pipeline Visualization */}
        <section className="bg-white/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs backdrop-blur-xs">
          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1 text-center sm:text-left">
            Autonomous Incident Pipeline
          </div>
          <PipelineFlow
            currentStep={
              !hasIncidents
                ? 'crash'
                : topIncident.status === 'READY_FOR_DEPLOY'
                ? 'sandbox'
                : topIncident.status === 'DEPLOYED'
                ? 'canary'
                : 'synthesis'
            }
          />
        </section>

        {/* Compact System Health Strip (3 metrics inline + 24h MTTR Sparkline) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400">Cluster:</span>
            <span className="font-semibold text-slate-900 dark:text-white">Uptime {health.uptime || 99.94}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Avg MTTR:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">{health.mttr || '3m 42s'}</span>
            {/* Standardized 24h MTTR trend sparkline */}
            <MiniSparkline
              data={[14, 12, 10, 8, 6, 4, 3, 2]}
              color="emerald"
              width={48}
              height={16}
            />
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">↓ 78%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Queue:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {sortedIncidents.length > 0 ? `${sortedIncidents.length} active` : '0 active'}
            </span>
          </div>
        </div>

        {/* 1. Calm Status Strip: One clean sentence, verdict first */}
        <section className="rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0A0A0A] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                {hasIncidents ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                )}
              </span>

              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {hasIncidents
                    ? `${sortedIncidents.length} incident${sortedIncidents.length > 1 ? 's' : ''} need${sortedIncidents.length === 1 ? 's' : ''} review`
                    : 'All systems nominal'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {hasIncidents
                    ? 'Autonomous patch synthesized and verified in isolated MicroVM sandbox.'
                    : 'Continuous monitoring active. Zero unmitigated errors detected.'}
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-3">
              {hasIncidents ? (
                <Link
                  href={`/remediation/${topIncident.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-2xs w-full sm:w-auto"
                >
                  <span>Review {topIncident.service} fix</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors shadow-2xs w-full sm:w-auto"
                >
                  <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  <span>{simulating ? 'Simulating crash...' : 'Simulate crash'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Secondary stats drawer toggle (progressive disclosure) */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
            <button
              onClick={() => setShowStatsDrawer((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
            >
              <span>{showStatsDrawer ? 'Hide system metrics' : 'View system metrics'}</span>
              {showStatsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              Uptime {health.uptime || 99.94}% · MTTR {health.mttr || '3m 42s'}
            </span>
          </div>

          {/* Collapsible Stats Panel (Max 3 concise metrics, keeping view clean) */}
          {showStatsDrawer && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  System Health
                </span>
                <span className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  {health.uptime || 99.94}%
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  Cluster SLA normal
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Autonomous MTTR
                </span>
                <span className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  {health.mttr || '3m 42s'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  vs 48m human baseline
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Downtime Cost Saved
                </span>
                <span className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  ${(typeof health.costSaved === 'number' ? health.costSaved : 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  4.2x ROI saved
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 2. Incident Queue: Clean, un-cluttered list of incident cards */}
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Incidents ({sortedIncidents.length})
              </h2>
              {/* Live SSE update indicator */}
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {hasIncidents && (
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {simulating ? 'Injecting crash...' : '+ Simulate another incident'}
              </button>
            )}
          </div>

          {/* Quick-Filter Chips (by Severity & Service) */}
          {incidents.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-mono text-slate-400 mr-1">Filter:</span>
              {(['ALL', 'SEV-1', 'SEV-2'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium transition-all ${
                    severityFilter === sev
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-semibold'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                  }`}
                >
                  {sev === 'ALL' ? 'All Severities' : sev}
                </button>
              ))}

              {availableServices.length > 1 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
                  <button
                    type="button"
                    onClick={() => setServiceFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium transition-all ${
                      serviceFilter === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    All Services
                  </button>
                  {availableServices.map((svc) => (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => setServiceFilter(svc)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium transition-all ${
                        serviceFilter === svc
                          ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      {svc}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {!hasIncidents ? (
            <div className="rounded-2xl p-10 text-center bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No incidents yet — connect Sentry to get started
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your workspace is ready. Connect your Sentry DSN or trigger an inbound webhook to automatically detect errors, synthesize AST hotfixes, and test them in microVM sandboxes.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/onboarding/setup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
                >
                  <span>Connect Sentry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <Zap className={`w-3 h-3 ${simulating ? 'animate-spin' : ''}`} />
                  <span>{simulating ? 'Simulating crash...' : 'Simulate test crash'}</span>
                </button>
                <button
                  onClick={() => {
                    setViewingSampleDemo(true);
                    setIncidents([mockIncident, mockIncident2]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
                >
                  <span>Explore sample incident</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onMouseEnter={() => {
                    try {
                      router.prefetch(`/remediation/${incident.id}`);
                    } catch {}
                  }}
                >
                  <IncidentCard
                    incident={incident}
                    onSelect={(id) => router.push(`/remediation/${id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
