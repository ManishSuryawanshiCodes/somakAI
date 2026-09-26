"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  EyeOff,
  Server,
  Database,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
  Sun,
  Moon,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function PrivacyPolicyPage() {
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
              href="/terms"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
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

      {/* Main Article Content Container (~720px readable width) */}
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header Badge & Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 pb-8 border-b border-slate-200 dark:border-white/10"
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-4">
            <Lock className="w-3 h-3" />
            Security & Privacy Commitment
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Effective Date: September 1, 2026 • Last updated: September 20, 2026
          </p>
        </motion.div>

        {/* Legal Review Draft Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-6 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Operational Draft for Human / Legal Review:</span> This Privacy Policy is an engineering and architectural transparency draft reflecting actual data flows and sub-processor integrations. It must undergo formal human legal review prior to commercial execution or reliance.
          </div>
        </div>

        {/* Executive Summary Callout */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 mb-10 text-xs sm:text-sm leading-relaxed text-indigo-950 dark:text-indigo-200 space-y-2">
          <div className="font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
            <Shield className="w-4 h-4 shrink-0" />
            Developer Trust Guarantee
          </div>
          <p>
            <strong>We do not sell your data. We do not use your source code, stack traces, or AST patches to train public machine learning models.</strong> All telemetry is customer-isolated, encrypted at rest via AES-256, and processed in ephemeral, zero-persistence sandboxes.
          </p>
        </div>

        {/* Article Body */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">1.</span>
              Information We Collect
            </h2>
            <p>
              When you interact with SOMAK AI (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;), we collect only the telemetry and configuration data necessary to provide autonomous incident triage and remediation:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, professional email address, organization slug, encrypted credentials, and SSO tokens provided through Google or GitHub OAuth.
              </li>
              <li>
                <strong>Incident Telemetry:</strong> Error fingerprints, stack traces, exception types, environment labels (e.g. staging, production), and HTTP response status codes ingested via Sentry webhooks, Datadog, or OpenTelemetry endpoints.
              </li>
              <li>
                <strong>Code Snippets & AST Fragments:</strong> Only the specific source code lines referenced in crash call stacks, fetched via scoped repository integrations (GitHub App / GitLab Deploy Key) for AST patching.
              </li>
              <li>
                <strong>Usage & Device Metrics:</strong> Anonymized interaction logs, browser user-agent, session timestamps, and system performance metrics used to improve platform stability.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">2.</span>
              How We Use Your Information
            </h2>
            <p>We process collected data strictly for the following operational purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Autonomous log signature clustering and deduping using NVIDIA Nemotron reasoning models.</li>
              <li>Synthesizing zero-regression AST code fixes within ephemeral sandbox containers.</li>
              <li>Executing canary rollouts and monitoring SLO error budget burn rates.</li>
              <li>Delivering automated post-mortem incident reports to your configured Slack or PagerDuty channels.</li>
              <li>Enforcing team role-based access control (RBAC) and audit log tracking.</li>
            </ul>
          </section>

          {/* Section 3 - AI Model Guarantee */}
          <section className="space-y-3 p-5 rounded-2xl bg-slate-100/80 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              3. Strict AI Non-Training Commitment
            </h2>
            <p className="text-xs sm:text-sm">
              SOMAK AI upholds strict enterprise isolation agreements with our LLM inference providers (NVIDIA NIM, DeepSeek, Anthropic, OpenAI). Under these binding enterprise agreements:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10/60">
                <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Zero Retention Prompting
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Prompts sent to inference endpoints are processed strictly in RAM and discarded immediately upon completion.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10/60">
                <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  No Customer Code Training
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Your proprietary algorithms, stack traces, and patches are never used to train or refine base models.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">4.</span>
              Data Protection & Cryptography
            </h2>
            <p>
              All customer data is handled in alignment with SOC-2 Type II controls. We employ defense-in-depth safeguards across all layers:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Data in Transit:</strong> Enforced TLS 1.3 encryption across all public API routes, webhook listeners, and WebSocket streaming channels.
              </li>
              <li>
                <strong>Data at Rest:</strong> AES-256 GCM envelope encryption for all database records, telemetry stores, and organization configuration tokens.
              </li>
              <li>
                <strong>Ephemeral Sandboxing:</strong> Code verification runs inside isolated container sandboxes (Nebius / OCI) with no persistent disks and outbound network egress restricted to authorized registries.
              </li>
              <li>
                <strong>Secret Sanitization:</strong> Automatic redaction of API keys, bearer tokens, passwords, and private certificates before telemetry touches reasoning pipelines.
              </li>
            </ul>
          </section>

          {/* Section 5 - Third-Party Sub-Processors */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">5.</span>
              Third-Party Sub-Processors & Data Handling
            </h2>
            <p>
              SOMAK AI engages select enterprise sub-processors to deliver core platform functionalities. All partners are bound by strict Data Processing Agreements (DPAs):
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Dodo Payments Ltd. (Merchant of Record)</div>
                <p className="text-slate-500 dark:text-slate-400">Processes billing and subscriptions as Merchant of Record. Handles global sales tax/VAT compliance. Card details never touch SOMAK AI servers.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Nebius AI Studio (Inference & Sandboxes)</div>
                <p className="text-slate-500 dark:text-slate-400">Executes ephemeral code test suites and model inference with RAM-only processing and zero telemetry persistence.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Tavily Search API (Context Grounding)</div>
                <p className="text-slate-500 dark:text-slate-400">Queries official public diagnostic documentation for error resolution patterns without transmitting proprietary customer code.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Functional Software Inc. / Sentry</div>
                <p className="text-slate-500 dark:text-slate-400">Provides incoming application exception webhooks verified via HMAC-SHA256 signatures.</p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">6.</span>
              Cookies & Local Storage
            </h2>
            <p>
              We use strictly necessary browser storage mechanisms to maintain session authentication, your active organization selection, and visual theme preferences (light/dark mode). We do not load invasive third-party cross-site advertising trackers.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">7.</span>
              Data Subject Rights (GDPR & CCPA)
            </h2>
            <p>
              Regardless of your geographic location, SOMAK AI extends comprehensive privacy rights to all registered users:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Right to access and export your incident history and remediation audit logs.</li>
              <li>Right to request immediate and irreversible deletion of your personal and organization data.</li>
              <li>Right to restrict or revoke repository and telemetry access permissions at any time.</li>
            </ul>
            <p className="pt-2">
              To exercise these rights, workspace owners can dispatch a request to{' '}
              <a href="mailto:privacy@somak.ai" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                privacy@somak.ai
              </a>{' '}
              or execute immediate self-service data purging in Organization Settings.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">7.</span>
              Contact Information
            </h2>
            <p>
              For legal inquiries, Data Protection Officer requests, or security vulnerability disclosures, contact our team at:
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 text-xs font-mono space-y-1">
              <div>SOMAK AI Inc. — Security & Compliance Office</div>
              <div>548 Market Street, Suite 40221</div>
              <div>San Francisco, CA 94104</div>
              <div>Email: legal@somak.ai</div>
            </div>
          </section>
        </div>

        {/* Bottom Cross Navigation */}
        <div className="mt-14 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 SOMAK AI Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
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
