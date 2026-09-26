"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Shield,
  Layers,
  Terminal,
  Zap,
  Activity,
  Gauge,
  Lock,
  Radio,
  HelpCircle,
  Code2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Server,
  Cpu,
  X,
  Menu,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

type DocSectionId =
  | 'getting-started'
  | 'core-concepts'
  | 'integrations'
  | 'roles-permissions'
  | 'faq'
  | 'api-reference';

interface DocItem {
  id: DocSectionId;
  title: string;
  icon: React.ElementType;
  badge?: string;
  subsections: { id: string; title: string }[];
}

const DOCS_NAV: DocItem[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Sparkles,
    subsections: [
      { id: 'gs-org', title: '1. Create Your Organization' },
      { id: 'gs-sentry', title: '2. Connect Sentry Telemetry' },
      { id: 'gs-ai', title: '3. Connect AI Reasoning' },
      { id: 'gs-notifications', title: '4. Configure Notifications' },
      { id: 'gs-team', title: '5. Invite Your SRE Team' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: BookOpen,
    subsections: [
      { id: 'cc-triage', title: 'Triage & Fingerprinting' },
      { id: 'cc-ast', title: 'AST Patch Synthesis' },
      { id: 'cc-sandbox', title: 'Blast Radius & Sandboxing' },
      { id: 'cc-canary', title: 'Canary Rollout & Auto-Rollback' },
      { id: 'cc-slo', title: 'Error Budget & Burn Rate' },
      { id: 'cc-runbooks', title: 'Runbook Pattern Library' },
      { id: 'cc-mttr', title: 'MTTR Optimization' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Layers,
    subsections: [
      { id: 'int-sentry', title: 'Sentry Inbound Webhook' },
      { id: 'int-slack', title: 'Slack Incident Alerts' },
      { id: 'int-pagerduty', title: 'PagerDuty On-Call' },
      { id: 'int-nebius', title: 'Nebius AI Studio / Nemotron' },
      { id: 'int-tavily', title: 'Tavily Search Grounding' },
    ],
  },
  {
    id: 'roles-permissions',
    title: 'Roles & Permissions',
    icon: Lock,
    subsections: [
      { id: 'rp-matrix', title: 'RBAC Permission Matrix' },
      { id: 'rp-admin', title: 'Admin Capabilities' },
      { id: 'rp-operator', title: 'Operator Workflow' },
      { id: 'rp-viewer', title: 'Viewer Read-Only Access' },
    ],
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    subsections: [
      { id: 'faq-hallucinations', title: 'Hallucination Prevention' },
      { id: 'faq-rollback', title: 'Automated Rollback Triggers' },
      { id: 'faq-microvm', title: 'Firecracker MicroVM Isolation' },
      { id: 'faq-privacy', title: 'Source Code & Data Privacy' },
      { id: 'faq-override', title: 'Human SRE Overrides' },
      { id: 'faq-selfhost', title: 'Self-Hosted Sentry Support' },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: Code2,
    badge: 'Preview',
    subsections: [
      { id: 'api-overview', title: 'REST API Overview' },
      { id: 'api-incidents', title: 'Incidents Endpoints' },
      { id: 'api-invites', title: 'Invites & Members' },
    ],
  },
];

export default function DocsPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<DocSectionId>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Filtered navigation based on search input
  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_NAV;
    const q = searchQuery.toLowerCase();
    return DOCS_NAV.map((section) => {
      const matchSection = section.title.toLowerCase().includes(q);
      const matchedSubs = section.subsections.filter((sub) =>
        sub.title.toLowerCase().includes(q)
      );
      if (matchSection || matchedSubs.length > 0) {
        return {
          ...section,
          subsections: matchSection ? section.subsections : matchedSubs,
        };
      }
      return null;
    }).filter(Boolean) as DocItem[];
  }, [searchQuery]);

  const activeDocItem = DOCS_NAV.find((item) => item.id === activeSection) || DOCS_NAV[0];

  const currentSectionIndex = DOCS_NAV.findIndex((i) => i.id === activeSection);
  const prevSection = currentSectionIndex > 0 ? DOCS_NAV[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < DOCS_NAV.length - 1 ? DOCS_NAV[currentSectionIndex + 1] : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500/20">
      
      {/* 1. Docs Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0A0A0A]/90 border-b border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open documentation navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Somak AI
                </span>
                <span className="text-slate-400 font-normal">/</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Docs
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/status"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Status
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Auth CTA */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Documentation Body with Sticky Left Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        
        {/* Desktop Fixed Left Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 py-8 pr-6 border-r border-slate-200/80 dark:border-white/10 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs (e.g. AST, Canary)..."
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Nav Categories */}
          <nav className="space-y-5">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <div key={item.id} className="space-y-1.5">
                  <button
                    onClick={() => {
                      setActiveSection(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-indigo-500" />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Subsections if active */}
                  {isActive && (
                    <div className="pl-6 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-3.5">
                      {item.subsections.map((sub) => (
                        <a
                          key={sub.id}
                          href={`#${sub.id}`}
                          className="block py-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                        >
                          {sub.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Slide-in Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative z-10 w-72 max-w-[80vw] h-full bg-white dark:bg-[#0A0A0A] border-r border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Docs Navigation
                    </span>
                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-3">
                    {DOCS_NAV.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold ${
                          activeSection === item.id
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. Main Article Content Column (~720px max-width) */}
        <main className="flex-1 py-10 px-0 sm:px-6 lg:px-12 max-w-4xl mx-auto space-y-12">
          
          {/* Breadcrumb Strip */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Docs</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white">{activeDocItem.title}</span>
          </div>

          {/* Section 1: Getting Started */}
          {activeSection === 'getting-started' && (
            <article className="space-y-10 leading-relaxed text-sm">
              <header className="space-y-3 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Getting Started with SOMAK AI
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Quick start guide to configure autonomous incident remediation.
                </p>
              </header>

              {/* Step 1 */}
              <section id="gs-org" className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create Your Organization & Workspace
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Every workspace in Somak AI is strictly isolated with independent error budgets, runbook patterns, and role-based permissions. Sign up at <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">/signup</Link> or visit <Link href="/onboarding/create-org" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">/onboarding/create-org</Link>.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-500" />
                    <span>Workspace Slug Architecture</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Organization slugs are unique lowercase identifiers used in your dedicated inbound webhook endpoints (e.g. <code className="font-mono text-[11px] bg-slate-200 dark:bg-white/5 px-1 py-0.5 rounded">https://api.somak.ai/v1/webhook/ingest/your-slug</code>). The user creating the workspace is automatically provisioned the <strong>Admin</strong> role.
                  </p>
                </div>
              </section>

              {/* Step 2 */}
              <section id="gs-sentry" className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Connect Sentry Telemetry
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Somak AI ingests real-time crash reports via Sentry Webhooks. Navigate to <strong>Sentry &rarr; Settings &rarr; Integrations &rarr; Webhooks</strong> and paste your inbound URL:
                </p>

                {/* Code Block */}
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 text-slate-200">
                  <div className="px-4 py-2 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">Inbound Webhook Configuration</span>
                    <button
                      onClick={() => handleCopyCode('sentry-url', 'https://api.somak.ai/v1/webhook/ingest/<your-org-slug>')}
                      className="hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedCodeId === 'sentry-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCodeId === 'sentry-url' ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-400">
                    https://api.somak.ai/v1/webhook/ingest/&lt;your-org-slug&gt;
                  </pre>
                </div>
              </section>

              {/* Step 3 */}
              <section id="gs-ai" className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Connect AI Reasoning & Tavily Grounding
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Somak AI uses a two-tier model architecture: <strong>Nemotron-3 30B</strong> for sub-10ms fingerprint triage, and <strong>Nemotron-3 550B MoE</strong> for AST syntax patch generation. Provide your API key in <Link href="/settings" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Settings &rarr; AI Engine</Link> or the <Link href="/onboarding/setup" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Setup Wizard</Link>.
                </p>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    <strong>Zero-Hallucination Guarantee:</strong> Somak AI AST patches are verified in Firecracker sandboxes before canary promotion. LLM output that does not compile or pass tests is rejected immediately.
                  </span>
                </div>
              </section>

              {/* Step 4 */}
              <section id="gs-notifications" className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Configure Notification Channels
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Receive live alerts on Slack, Microsoft Teams, and PagerDuty when an incident begins auto-mitigating. You can trigger a live test notification directly in the setup checklist to verify your webhook connectivity.
                </p>
              </section>

              {/* Step 5 */}
              <section id="gs-team" className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    5
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Invite Your SRE Team
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Use the multi-email tag input to send team invitations with pre-configured roles (<strong>Admin</strong>, <strong>Operator</strong>, <strong>Viewer</strong>). Each invite generates a cryptographically secure 7-day token link.
                </p>
              </section>
            </article>
          )}

          {/* Section 2: Core Concepts */}
          {activeSection === 'core-concepts' && (
            <article className="space-y-10 leading-relaxed text-sm">
              <header className="space-y-3 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Core Concepts & Glossary
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  A plain-language guide to site reliability engineering concepts and the autonomous technologies powering Somak AI.
                </p>
              </header>

              <div className="space-y-8 divide-y divide-slate-200/80 dark:divide-slate-800">
                
                <section id="cc-triage" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <span>Triage & Fingerprinting</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    When hundreds of errors hit an application simultaneously during an outage, triage groups them by their structural root cause rather than raw volume. A <strong>fingerprint</strong> (such as <code className="font-mono text-xs bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">MEM_LEAK_AUTH_TOKEN_SVC</code>) identifies the precise call stack and code block responsible.
                  </p>
                </section>

                <section id="cc-ast" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-500" />
                    <span>AST (Abstract Syntax Tree) Patching</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Standard AI code assistants output raw conversational text, which often includes syntax errors or missing brackets. Somak AI manipulates the <strong>Abstract Syntax Tree</strong> of the source code directly. This guarantees that any generated patch represents valid grammar and adheres to language-specific semantics.
                  </p>
                </section>

                <section id="cc-sandbox" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span>Blast Radius & MicroVM Sandboxing</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    The <strong>blast radius</strong> is the maximum possible impact an error or deployment can have on your users. Somak AI limits blast radius to zero during code synthesis by booting an ephemeral <strong>Firecracker microVM</strong> in ~50ms, compiling the patched service, and running integration tests before any code touches production.
                  </p>
                </section>

                <section id="cc-canary" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-500" />
                    <span>Canary Rollout & Auto-Rollback</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Instead of deploying a fix to 100% of production traffic at once, a canary deployment routes 5% of real-world requests to the patched service. Somak AI monitors the 5-minute error rate. If error rates remain nominal, it automatically promotes to 25%, 50%, and 100%. If an anomaly occurs, it instantly rolls back to the previous stable release.
                  </p>
                </section>

                <section id="cc-slo" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span>Error Budget & Burn Rate</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    A Service Level Objective (SLO), such as 99.9% uptime, grants an <strong>error budget</strong> of allowable downtime (43.2 minutes over 30 days). The <strong>burn rate</strong> indicates how fast that budget is evaporating. If a service burns at 14.2x, the budget will be exhausted within hours, automatically triggering a deployment freeze.
                  </p>
                </section>

                <section id="cc-runbooks" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Runbook Pattern Library</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Whenever an incident is resolved with verified zero regressions, Somak AI extracts an anonymized AST pattern into the <strong>Runbook Library</strong>. The next time a similar incident occurs, Somak AI references this library first to synthesize an instant fix in milliseconds.
                  </p>
                </section>

                <section id="cc-mttr" className="pt-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Mean Time to Resolution (MTTR)</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    The average duration from the moment an outage occurs until traffic is restored to healthy parameters. Autonomous remediation reduces typical MTTR from 17 minutes down to 3 minutes and 42 seconds.
                  </p>
                </section>

              </div>
            </article>
          )}

          {/* Section 3: Integrations */}
          {activeSection === 'integrations' && (
            <article className="space-y-10 leading-relaxed text-sm">
              <header className="space-y-3 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Telemetry & Infrastructure Integrations
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Step-by-step connection guides for Sentry, notification channels, AI reasoning engines, and search grounding.
                </p>
              </header>

              <div className="space-y-8">
                
                <section id="int-sentry" className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      <span>Sentry Webhook Ingestion</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      Supported: Sentry SaaS & Self-Hosted
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Configure a webhook in Sentry pointing to your organization endpoint. Somak AI listens for <code className="font-mono text-xs bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">event.alert</code> and <code className="font-mono text-xs bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">issue.created</code> payloads.
                  </p>
                  <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                    {`POST /api/v1/webhook/ingest/{org_slug} HTTP/1.1\nHost: api.somak.ai\nSentry-Hook-Resource: issue\nContent-Type: application/json`}
                  </div>
                </section>

                <section id="int-slack" className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Radio className="w-5 h-5 text-indigo-500" />
                      <span>Slack Incident Alerts</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                      Interactive Buttons
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Add an Incoming Webhook URL in your Slack workspace. Somak AI posts rich cards containing live error rates, diff previews, and direct 1-click &quot;Approve Hotfix&quot; or &quot;Rollback&quot; buttons for Operators.
                  </p>
                </section>

                <section id="int-pagerduty" className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-500" />
                      <span>PagerDuty Integration Key</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20">
                      Sev-1 Escalation
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Provide your PagerDuty Events API v2 integration key. Somak AI triggers high-urgency pages if canary evaluation detects unexpected latency regression during a rollout.
                  </p>
                </section>

                <section id="int-nebius" className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-500" />
                      <span>Nebius AI Studio / Nemotron</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      550B MoE Reasoning
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Supports high-throughput NVIDIA Nemotron inference. Alternatively, plug in OpenAI (GPT-4o) or Anthropic (Claude 3.5 Sonnet) API keys in Settings.
                  </p>
                </section>

              </div>
            </article>
          )}

          {/* Section 4: Roles & Permissions */}
          {activeSection === 'roles-permissions' && (
            <article className="space-y-10 leading-relaxed text-sm">
              <header className="space-y-3 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Roles & Access Control (RBAC)
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Granular multi-tenant permission controls designed for enterprise security audits and SOC-2 compliance.
                </p>
              </header>

              {/* Comparison Table */}
              <div id="rp-matrix" className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0A0A0A] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200/80 dark:border-white/10">
                    <tr>
                      <th className="py-3 px-4">Action / Capability</th>
                      <th className="py-3 px-4">Admin</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">View Radar, SLOs & Runbooks</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">Approve AST Patch & Deploy</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">Trigger Emergency Canary Rollback</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">Manage AI Keys & Webhook Integrations</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">Invite & Revoke Team Members</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">Export SOC-2 Cryptographic Audit Logs</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 px-4 text-red-500 font-bold">✕ Restricted</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {/* Section 5: FAQ */}
          {activeSection === 'faq' && (
            <article className="space-y-10 leading-relaxed text-sm">
              <header className="space-y-3 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Answers to common questions regarding security, microVM sandboxes, and autonomous operations.
                </p>
              </header>

              <div className="space-y-6">
                {[
                  {
                    q: 'How does Somak AI guarantee the AI will not hallucinate broken code?',
                    a: 'Somak AI does not rely on open-loop code generation. All synthesized fixes are structured as Abstract Syntax Tree modifications and immediately built inside an ephemeral Firecracker microVM. If compilation fails or any regression tests break, the fix is instantly discarded.',
                  },
                  {
                    q: 'What triggers an automatic canary rollback?',
                    a: 'A canary rollback is triggered if the 5-minute rolling error rate exceeds your service threshold (e.g. > 0.5%), if p99 latency spikes by more than 25%, or if an Operator clicks "Rollback" in the UI or Slack.',
                  },
                  {
                    q: 'Are Firecracker microVM sandboxes completely isolated?',
                    a: 'Yes. Each microVM runs on dedicated hardware virtualization with zero network egress to internal production assets. The sandbox only executes the local test suite specified in your repo.',
                  },
                  {
                    q: 'Is our proprietary source code transmitted or stored by third parties?',
                    a: 'No. Somak AI only transmits the relevant context window (stack trace, local function AST, and dependencies) to your configured LLM endpoint. Code snippets are never retained or used for model training.',
                  },
                  {
                    q: 'Can human SREs override or pause autonomous promotions?',
                    a: 'Yes. At any stage of the canary rollout (5% → 25% → 50%), any Operator or Admin can click "Pause Promotion" or "Abort" from the web dashboard or Slack.',
                  },
                  {
                    q: 'Does Somak AI work with self-hosted Sentry and private Git servers?',
                    a: 'Yes. Somak AI provides standard HTTPS webhook ingestion compatible with self-hosted Sentry (Docker / Kubernetes) and self-hosted GitLab / GitHub Enterprise.',
                  },
                  {
                    q: 'What happens if multiple incidents strike different services at once?',
                    a: 'Somak AI triages and isolates each incident concurrently into its own sandboxed pipeline. Inbound rate limiters prevent cascade contention.',
                  },
                  {
                    q: 'How long do team invitation links remain valid?',
                    a: 'All invitation tokens expire exactly 7 days after creation. Admins can resend or revoke pending tokens at any time in Settings.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="glass-panel p-5 rounded-2xl space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{item.q}</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Section 6: API Reference */}
          {activeSection === 'api-reference' && (
            <article className="space-y-10 leading-relaxed text-sm">
              <header className="space-y-3 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    API Reference
                  </h1>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Developer Preview
                  </span>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Programmatically trigger incident triage, query error budget burn rates, and manage workspace members.
                </p>
              </header>

              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">POST</span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/incidents/simulate</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Triggers a high-fidelity synthetic Sev-1 telemetry spike to test automated triage, AST synthesis, and canary gate progression.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">GET</span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/system/health</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Retrieves per-service health metrics, SLO error budget burn status, and active incident queue for your organization.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">POST</span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/organizations/&#123;org_id&#125;/invites</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Generates secure 7-day token invites for SRE team members with designated RBAC permissions.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* Next / Previous Pagination Footer */}
          <div className="pt-8 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
            {prevSection ? (
              <button
                onClick={() => {
                  setActiveSection(prevSection.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
              >
                <span>&larr; {prevSection.title}</span>
              </button>
            ) : <div />}

            {nextSection ? (
              <button
                onClick={() => {
                  setActiveSection(nextSection.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold"
              >
                <span>{nextSection.title} &rarr;</span>
              </button>
            ) : <div />}
          </div>

        </main>
      </div>

    </div>
  );
}
