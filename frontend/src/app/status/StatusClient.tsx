"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getPublicStatus } from '@/lib/api';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Radio,
  Bell,
  Webhook,
  Mail,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface ServiceComponent {
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'outage';
  uptimePercent: string;
  days: boolean[]; // 90 days: true = operational, false = incident
}

export default function PublicStatusPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeMode, setSubscribeMode] = useState<'email' | 'webhook'>('email');
  const [inputValue, setInputValue] = useState('');
  const [hoveredDayInfo, setHoveredDayInfo] = useState<{ serviceName: string; dayIndex: number; isUp: boolean } | null>(null);

  // Helper to generate 90 days history
  const generate90Days = (incidentDays: number[] = []) => {
    return Array.from({ length: 90 }, (_, i) => !incidentDays.includes(89 - i));
  };

  const defaultComponents: ServiceComponent[] = [
    {
      name: 'API Gateway & Edge Ingress',
      description: 'Global SSL edge proxies, load balancers, and SSL termination',
      status: 'operational',
      uptimePercent: '99.99%',
      days: generate90Days([]),
    },
    {
      name: 'Nebius Token Factory & Nemotron-3 Pipeline',
      description: 'NVIDIA Nemotron Ultra 550B & Nano 30B reasoning inference',
      status: 'operational',
      uptimePercent: '99.98%',
      days: generate90Days([14]),
    },
    {
      name: 'Autonomous AST Verification Sandboxes',
      description: 'Isolated MicroVMs executing unit tests and fuzzing',
      status: 'operational',
      uptimePercent: '100.00%',
      days: generate90Days([]),
    },
    {
      name: 'Telemetry Ingestion & Anomaly Detector',
      description: 'High-throughput streaming & heap threshold monitors',
      status: 'operational',
      uptimePercent: '100.00%',
      days: generate90Days([]),
    },
    {
      name: 'PostgreSQL Multi-Tenant Persistence & Audit Store',
      description: 'Primary relational database and cryptographic audit ledger',
      status: 'operational',
      uptimePercent: '99.99%',
      days: generate90Days([62]),
    },
  ];

  const [components, setComponents] = useState<ServiceComponent[]>(defaultComponents);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded'>('operational');
  const [statusDescription, setStatusDescription] = useState('All Systems Operational');
  const [overallUptime, setOverallUptime] = useState('99.99%');
  const [lastUpdated, setLastUpdated] = useState<string>('Live');

  useEffect(() => {
    let mounted = true;

    const fetchStatus = () => {
      getPublicStatus().then((data) => {
        if (!mounted || !data) return;
        if (data.components && data.components.length > 0) {
          setComponents(data.components);
        }
        if (data.status) {
          setSystemStatus(data.status === 'degraded' ? 'degraded' : 'operational');
        }
        if (data.description) {
          setStatusDescription(data.description);
        }
        if (data.uptimePercent) {
          setOverallUptime(data.uptimePercent);
        }
        setLastUpdated(new Date().toLocaleTimeString());
      });
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 8000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-16 selection:bg-indigo-500/20">
      {/* Public Header */}
      <header className="bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 flex items-center justify-center p-1 shadow-xs overflow-hidden">
              <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-5 h-5 object-contain aspect-square" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white font-mono">
                SOMAK AI
              </span>
              <span className="text-xs text-slate-400">
                Status
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs shadow-2xs transition-colors"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6 flex-1">
        {/* Overall Status Banner */}
        <div
          className={`p-6 sm:p-7 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            systemStatus === 'degraded'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-white dark:bg-[#0A0A0A] border-slate-200/80 dark:border-white/10 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              systemStatus === 'degraded'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}>
              {systemStatus === 'degraded' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {statusDescription}
                </h1>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Synced {lastUpdated}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All production services and autonomous remediation pipelines are nominal.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {overallUptime}
            </div>
            <div className="text-[10px] text-slate-400">
              Aggregate Uptime (Last 90 Days)
            </div>
          </div>
        </div>

        {/* Subscribe to Updates Strip (Email & Webhook support) */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="flex items-center gap-2">
              <span>Subscribe to updates:</span>
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => setSubscribeMode('email')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    subscribeMode === 'email'
                      ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setSubscribeMode('webhook')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    subscribeMode === 'webhook'
                      ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Webhook
                </button>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue) {
                setSubscribed(true);
                setTimeout(() => setSubscribed(false), 4000);
                setInputValue('');
              }
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              type={subscribeMode === 'email' ? 'email' : 'url'}
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={subscribeMode === 'email' ? 'you@company.com' : 'https://hooks.slack.com/...'}
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 flex-1 sm:w-56"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs shrink-0 transition-colors shadow-xs"
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </form>
        </div>

        {/* Active Incident Advisory - ONLY rendered if platform is degraded */}
        {systemStatus === 'degraded' && (
          <div className="bg-white dark:bg-[#0A0A0A] border border-amber-500/30 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Platform Telemetry Anomaly Detected
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Investigation Active
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Elevated latency detected on ingress edge nodes. Automated AST self-correction loops and canary sandboxes are actively engaged. Core remediation APIs remain operational.
            </p>
          </div>
        )}

        {/* Service Components & 90-Day Uptime Strips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              System Components Uptime
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                Operational
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-amber-500" />
                Degraded
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          comp.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        {comp.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {comp.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        comp.status === 'operational'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comp.uptimePercent}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        comp.status === 'operational'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>
                </div>

                {/* 90-Day Bar Strip with interactive hover */}
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5 w-full h-6 py-1">
                    {comp.days.map((isUp, dayIdx) => (
                      <div
                        key={dayIdx}
                        onClick={() => router.push('/history')}
                        title={`Day ${89 - dayIdx === 0 ? 'Today' : `${89 - dayIdx}d ago`}: ${isUp ? 'Operational' : 'Incident'} — Click to view incident history`}
                        onMouseEnter={() =>
                          setHoveredDayInfo({
                            serviceName: comp.name,
                            dayIndex: 89 - dayIdx,
                            isUp,
                          })
                        }
                        onMouseLeave={() => setHoveredDayInfo(null)}
                        className={`flex-1 h-full rounded-xs transition-all hover:scale-y-125 cursor-pointer ${
                          isUp ? 'bg-emerald-500/80 dark:bg-emerald-500/70 hover:bg-emerald-400' : 'bg-amber-500 hover:bg-amber-400'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>90 days ago</span>
                    <span>
                      {hoveredDayInfo?.serviceName === comp.name
                        ? `${hoveredDayInfo.dayIndex === 0 ? 'Today' : `${hoveredDayInfo.dayIndex}d ago`}: ${
                            hoveredDayInfo.isUp ? '100% Uptime' : 'Incident Resolved'
                          }`
                        : '45 days ago'}
                    </span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Incidents Archive */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Past Incidents (Last 30 Days)
          </h2>

          <div className="space-y-2.5">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  INC-1892: payment-gateway Webhook Idempotency Timeout
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Resolved in 3m 50s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resolved on Sep 17, 2026. Automated patch deployed via canary; full traffic restored.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  INC-1420: ingress-nginx Upstream Reset Spike
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Resolved in 3m 45s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resolved on Sep 14, 2026. Keep-alive connection timeouts tuned in NGINX configuration.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 text-center text-xs text-slate-400 space-y-2 pt-6">
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            SOMAK AI
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
        <p className="text-[11px] text-slate-400">
          Powered by SOMAK AI Autonomous Reliability Engine · Continuous 24/7 Verification
        </p>
      </footer>
    </div>
  );
}
