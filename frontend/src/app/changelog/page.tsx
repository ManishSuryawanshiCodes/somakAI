"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Tag,
  ArrowRight,
  ArrowLeft,
  Shield,
  Layers,
  Zap,
  Terminal,
} from 'lucide-react';

interface Release {
  version: string;
  date: string;
  title: string;
  badge: string;
  highlights: string[];
}

const RELEASES: Release[] = [
  {
    version: 'v2.1.0',
    date: 'September 27, 2026',
    title: 'Supabase SSR Auth, Dodo Payments Billing & Vercel/Render Minimalist System',
    badge: 'Latest Release',
    highlights: [
      'Supabase SSR Authentication: Full server-side session exchange with OAuth providers (Google & GitHub SSO), encrypted cookie management, and protected route middleware.',
      'Hardened Demo Accounts: Zero visible credential exposure using dedicated server-side demo roles (Admin, Operator, Viewer) with instant 1-click sandbox access.',
      'Dodo Payments Integration: Hosted customer checkout sessions, self-service subscription management portal, and cryptographically verified webhook event listeners.',
      'Vercel & Render Marketing Polish: Dot-grid canvas textures, high-density inline sparkline cards, refined typography hierarchy, and subtle border highlights.',
      'Security Sanitization: Purged all legacy fallback API tokens, enforced strict environment variable boundaries, and verified secret leakage across git commits.',
    ],
  },
  {
    version: 'v2.0.0',
    date: 'September 24, 2026',
    title: 'Multi-Provider BYOK, Live PostgreSQL Persistence & Sandbox Self-Correction',
    badge: 'Major',
    highlights: [
      'Multi-Provider BYOK Architecture: Integrated Nebius (Nemotron-3), Anthropic (Claude 3.5 Sonnet), OpenAI (GPT-4o), and Google (Gemini 1.5 Pro) with independent triage and synthesis model selection.',
      'Live Supabase PostgreSQL Persistence: Real production relational schema backing users (Argon2id hashing), organizations, incidents, audit logs, and provider usage quotas.',
      'Sandbox Pipeline Hardening: Automated self-correction feedback loop parsing test errors/stack traces with capped retries and strict network isolation verification.',
      'Enterprise RBAC & Security: Multi-tenant data segregation, session cookie encryption with HttpOnly enforcement, credential masking, and brute-force lockout.',
      'Navigation & Ergonomics: Added unified Back to Radar controls across all child screens, mobile-responsive settings drawers, and real-time live usage counters.',
    ],
  },
  {
    version: 'v1.4.0',
    date: 'September 19, 2026',
    title: 'Enterprise Collapsible Sidebar, Glassmorphism System & Error Budget Tracking',
    badge: 'Major',
    highlights: [
      'Introduced fixed collapsible left sidebar (240px expanded / 72px collapsed) with persistence and mobile slide-in drawer.',
      'Refined visual shell with GPU-accelerated mesh aurora background, glassmorphism panels, and 1px edge inner-highlights.',
      'Launched Error Budget & SLO Tracker (/slo) with real-time burn-down rate telemetry and topology links.',
      'Created On-Call Rotations (/oncall) with live incident paging indicators and multi-tier escalation policies.',
      'Added Runbook Library (/runbooks) with learned AST remediation patterns and auto-suggestions on Studio.',
      'Delivered Admin Audit Log (/audit) with cryptographically verified SOC-2 immutable action logs.',
      'Launched Integrations Marketplace (/integrations) and Usage & Quota (/usage) management surfaces.',
    ],
  },
  {
    version: 'v1.3.0',
    date: 'September 18, 2026',
    title: 'Hold-to-Confirm Canary Rollbacks & Post-Mortem Audit Review Workflow',
    badge: 'Major',
    highlights: [
      'Added safety hold-to-confirm gate on 1-click canary rollbacks to prevent accidental production disruptions.',
      'Implemented real-time live telemetry event stream ticker on Canary monitor.',
      'Introduced Tamper-Evident Security multi-step post-mortem workflow state machine (Draft -> Under Review -> Published).',
      'Added inline section review notes and comments on post-mortem reports.',
    ],
  },
  {
    version: 'v1.2.0',
    date: 'September 17, 2026',
    title: 'Live Telemetry Spike Annotations & Guided Onboarding Tour',
    badge: 'Feature',
    highlights: [
      'Added SVG spike annotation directly on the 14:02 UTC anomaly marker explaining auto-triage start.',
      'Added interactive 4-step spotlight onboarding tour for new SRE team members.',
      'Introduced confidence breakdown tooltip explaining sandbox pass rate and AST verification criteria.',
    ],
  },
  {
    version: 'v1.1.0',
    date: 'September 16, 2026',
    title: 'Porcelain Light & Obsidian Dark Dual-Engine Theme System',
    badge: 'Visual',
    highlights: [
      'Global persistent light and dark themes using CSS variables with accessible zinc border contrast.',
      'Nebius isolated container runner sandbox integration with self-correction feedback loop.',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'September 15, 2026',
    title: 'Somak AI Autonomous Reliability Platform Launch',
    badge: 'Initial GA',
    highlights: [
      'Autonomous telemetry ingestion from Envoy, Prometheus, and Sentry exception webhooks.',
      'NVIDIA Nemotron-3-Ultra (550B) AST synthesis pipeline with unified diff generation.',
      'Canary blast-radius traffic split verification and automatic promotion gates.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-900/15 via-purple-900/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-1 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-6 h-6 object-contain aspect-square" />
          </div>
          <span className="text-base font-black tracking-tight text-white leading-none">SOMAK AI</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Changelog
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Recent platform updates and release notes.
            </p>
          </div>
        </div>

        {/* Releases Timeline */}
        <div className="space-y-6">
          {RELEASES.map((rel, idx) => (
            <div
              key={rel.version}
              className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-4 shadow-xs bg-white/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                    {rel.version}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    idx === 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-neutral-400'
                  }`}>
                    {rel.badge}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {rel.date}
                </span>
              </div>

              <h2 className="text-base font-bold text-white">
                {rel.title}
              </h2>

              <ul className="space-y-2 pt-1">
                {rel.highlights.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 px-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} SOMAK AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
