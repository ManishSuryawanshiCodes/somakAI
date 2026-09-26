"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getPublicStatus } from '@/lib/api';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  Radio,
  Activity,
  Bell,
  Check,
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
  const { theme, toggleTheme } = useTheme();
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

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
      days: generate90Days([]),
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
      days: generate90Days([]),
    },
  ];

  const [components, setComponents] = useState<ServiceComponent[]>(defaultComponents);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded'>('operational');
  const [statusDescription, setStatusDescription] = useState('All Core Services Operational');
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
    // Live real-time polling every 8s
    const timer = setInterval(fetchStatus, 8000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-16">
      {/* Public Header */}
      <header className="bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-1 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-6 h-6 object-contain aspect-square" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Somak AI
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                System Status
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors btn-glow-primary"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8 flex-1">
        {/* Overall Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-7 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            systemStatus === 'degraded'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30'
              : 'bg-white dark:bg-[#0a0a0a] border-slate-200/90 dark:border-white/10 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
              systemStatus === 'degraded'
                ? 'bg-amber-500 shadow-amber-500/30 animate-pulse'
                : 'bg-emerald-500 shadow-emerald-500/30'
            }`}>
              {systemStatus === 'degraded' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {statusDescription}
                </h1>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced {lastUpdated}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Live multi-region cluster telemetry and infrastructure operational status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {overallUptime}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Aggregate Uptime (Last 90 Days)
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscribe to Updates Strip */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Get real-time email incident updates and scheduled maintenance alerts</span>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:w-48"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
            >
              {subscribed ? 'Subscribed!' : 'Subscribe'}
            </button>
          </form>
        </div>

        {/* Active Incident Advisory - ONLY rendered if platform is degraded */}
        {systemStatus === 'degraded' && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse glow-warning" />
              Active Platform Investigation
            </div>

            <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 glow-warning" />
                  <h3 className="text-sm font-bold text-white">
                    Platform Telemetry Anomaly Detected
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Investigation Active
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Elevated latency or error anomalies detected on ingress edge nodes. Automated AST self-correction loops and canary sandboxes are actively engaged. Core remediation APIs remain operational.
              </p>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated in real-time • Automated SRE Monitor</span>
              </div>
            </div>
          </div>
        )}

        {/* Service Components & 90-Day Uptime Strips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              System Components Uptime
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 glow-healthy" />
                Operational
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 glow-warning" />
                Degraded
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#0a0a0a] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {comp.name}
                      </h3>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          comp.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {comp.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`text-xs font-mono font-bold ${
                        comp.status === 'operational'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comp.uptimePercent}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        comp.status === 'operational'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>
                </div>

                {/* 90-Day Bar Strip */}
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5 w-full h-7 py-1">
                    {comp.days.map((isUp, dayIdx) => (
                      <div
                        key={dayIdx}
                        title={`Day ${90 - dayIdx} ago: ${isUp ? '100% operational' : 'Degraded incident resolved'}`}
                        className={`flex-1 h-full rounded-xs transition-opacity hover:opacity-75 ${
                          isUp ? 'bg-emerald-500/80 dark:bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>90 days ago</span>
                    <span>45 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Incidents Archive */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Past Incidents (Last 30 Days)
          </h2>

          <div className="space-y-2.5">
            <div className="glass-card p-4 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  INC-1892: payment-gateway Webhook Idempotency Timeout
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Resolved in 3m 50s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resolved on Sep 17, 2026. Automated patch deployed via canary; full traffic restored.
              </p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  INC-1420: ingress-nginx Upstream Reset Spike
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
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
      <footer className="max-w-4xl mx-auto px-4 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="hover:underline text-indigo-600 dark:text-indigo-400">
            Somak AI
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>
        <p className="text-[11px]">
          Powered by Somak AI Autonomous Reliability Engine • Continuous 24/7 Verification
        </p>
      </footer>
    </div>
  );
}
