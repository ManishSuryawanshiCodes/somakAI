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
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';

interface Release {
  version: string;
  date: string;
  title: string;
  badge: string;
  highlights: string[];
}

const RELEASES: Release[] = [
  {
    version: 'v2.0.0',
    date: 'September 24, 2026',
    title: 'Multi-Provider BYOK, Live PostgreSQL Persistence & Sandbox Self-Correction',
    badge: 'Latest Release',
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
      'Introduced SOC-2 / ISO 27001 multi-step post-mortem workflow state machine (Draft -> Under Review -> Published).',
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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Changelog
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Recent platform updates and release notes.
            </p>
          </div>
        </div>

        {/* Releases Timeline */}
        <div className="space-y-6">
          {RELEASES.map((rel, idx) => (
            <div
              key={rel.version}
              className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                    {rel.version}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    idx === 0
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {rel.badge}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {rel.date}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {rel.title}
              </h2>

              <ul className="space-y-2 pt-1">
                {rel.highlights.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
