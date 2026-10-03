"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sun,
  Moon,
  Scale,
  Cpu,
  GitBranch,
  Activity
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function TermsOfServicePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/5" />
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                SOMAK AI
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/docs"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/status"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Status
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Article Content Container */}
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header Badge & Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 pb-8 border-b border-slate-200 dark:border-white/10"
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-4">
            <Scale className="w-3 h-3" />
            Terms of Service & Usage Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Effective Date: September 1, 2026 • Last updated: September 20, 2026
          </p>
        </motion.div>

        {/* Legal Review Draft Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-6 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Operational Draft for Human / Legal Review:</span> This document represents a standard operational draft reflecting SOMAK AI platform architecture, data flow, and third-party processors. It must undergo formal human legal review prior to commercial execution or reliance.
          </div>
        </div>

        {/* Quick Highlights Callout */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 mb-10 text-xs sm:text-sm leading-relaxed text-indigo-950 dark:text-indigo-200 space-y-2">
          <div className="font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Summary for Engineering Teams
          </div>
          <p>
            You retain 100% intellectual property ownership of any code patches generated by the system. SOMAK AI operates with strict canary stage gates and automated rollbacks to preserve production stability. You decide whether fixes auto-deploy or require human review.
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* 1. Acceptance */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">1.</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, integrating, or utilizing the SOMAK AI autonomous site reliability engineering platform (&quot;Service&quot;, &quot;Platform&quot;), provided by SOMAK AI Inc. (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you or the organization you represent (&quot;Customer&quot;, &quot;you&quot;) agree to be legally bound by these Terms of Service.
            </p>
          </section>

          {/* 2. Service Description & Autonomous Safeguards */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">2.</span>
              Autonomous Remediation & Safety Gates
            </h2>
            <p>
              SOMAK AI ingests telemetry triggers (such as Sentry exception webhooks or Datadog alerts), isolates root causes via language reasoning models, generates Abstract Syntax Tree (AST) patches, tests them in ephemeral sandboxes, and orchestrates canary promotions.
            </p>
            <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500" />
                Built-in Circuit Breakers
              </div>
              <p>
                Every deployment is governed by canary stages (5% &rarr; 25% &rarr; 100%). If your error budget burn rate exceeds 1.5x or latency regresses by &gt;10% during an active rollout, the Platform automatically triggers an immediate zero-latency rollback to the previous stable release.
              </p>
            </div>
            <p>
              Organizations can configure operational autonomy to &quot;Approval Required&quot; (human-in-the-loop review) or &quot;Autonomous Promotion&quot; (for verified test suites).
            </p>
          </section>

          {/* 3. Intellectual Property Ownership */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">3.</span>
              Intellectual Property & Code Ownership
            </h2>
            <p>
              <strong>You own your code.</strong> All rights, title, and interest in your proprietary source code, configuration files, and repositories remain exclusively with you.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Remediation Patches:</strong> Any bug fixes, diffs, AST transformations, or post-mortem summaries generated by SOMAK AI for your incidents are assigned to and owned exclusively by Customer.
              </li>
              <li>
                <strong>No Public Model Training:</strong> Telemetry, proprietary source code fragments, and AST outputs are never ingested into foundation model training corpora.
              </li>
            </ul>
          </section>

          {/* 4. Service Availability & SLA */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">4.</span>
              Availability & Service Level Agreement
            </h2>
            <p>
              SOMAK AI commits to a <strong>99.9% monthly uptime SLA</strong> for core webhook ingestion, radar telemetry dashboards, and canary orchestrator services, excluding scheduled maintenance windows announced at least 48 hours in advance on our{' '}
              <Link href="/status" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Status Page
              </Link>.
            </p>
          </section>

          {/* 5. Acceptable Use & Rate Limiting */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">5.</span>
              Acceptable Use & API Rate Limiting
            </h2>
            <p>
              To maintain system stability and fair resource allocation for all tenants, Customer agrees not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Exceed documented API rate limits (e.g., auth attempts, synthetic webhook floods). Requests violating thresholds will receive HTTP 429 responses.</li>
              <li>Use the Platform to scan, probe, or test vulnerabilities of third-party systems without authorization.</li>
              <li>Reverse engineer, decompile, or extract the underlying reasoning models or AST generation algorithms.</li>
            </ul>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="space-y-3 p-5 rounded-2xl bg-slate-100/80 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              6. Limitation of Liability
            </h2>
            <p className="text-xs sm:text-sm">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SOMAK AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, PRODUCTION INTERRUPTIONS, OR DOWNTIME RESULTING FROM AUTOMATED CANARY PROMOTIONS OR CODE AST EXECUTION.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In no event shall Company&apos;s aggregate liability arising out of or related to these Terms exceed the total amount paid by Customer to SOMAK AI in the twelve (12) months preceding the incident.
            </p>
          </section>

          {/* 7. Termination & Data Return */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">7.</span>
              Termination & Data Purging
            </h2>
            <p>
              You may terminate your workspace at any time directly through Organization Settings. Upon termination:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Repository access tokens and webhook secrets are instantly revoked and scrubbed.</li>
              <li>All historical incident logs, stack traces, and test sandbox records are permanently destroyed within 30 days.</li>
              <li>Customer may export all incident post-mortems and remediation histories prior to deletion.</li>
            </ul>
          </section>

          {/* 8. Third-Party Sub-Processors & Payment Services */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">8.</span>
              Third-Party Processors & Payment Services
            </h2>
            <p>
              To deliver autonomous site reliability and subscription services, SOMAK AI integrates with specialized enterprise infrastructure partners:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Dodo Payments Ltd. (Merchant of Record)</div>
                <p className="text-slate-500 dark:text-slate-400">Processes subscription payments as Merchant of Record with full global sales tax/VAT compliance. Cardholder data never touches SOMAK AI servers.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Nebius AI Studio (Inference & Sandboxes)</div>
                <p className="text-slate-500 dark:text-slate-400">Executes ephemeral isolated sandbox test runs and model inference under zero-retention RAM-only contracts.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Tavily Search API (Grounding)</div>
                <p className="text-slate-500 dark:text-slate-400">Queries public technical documentation and error signatures for context grounding without transmitting customer code.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Functional Software Inc. / Sentry</div>
                <p className="text-slate-500 dark:text-slate-400">Provides inbound crash alerts and stack trace telemetry secured by cryptographic HMAC-SHA256 signatures.</p>
              </div>
            </div>
          </section>

          {/* 9. Governing Law */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">9.</span>
              Governing Law & Disputes
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles. Any dispute arising under these Terms shall be resolved in the state or federal courts located in San Francisco, California.
            </p>
          </section>
        </div>

        {/* Bottom Cross Navigation */}
        <div className="mt-14 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 SOMAK AI Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="/status" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              System Status
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
