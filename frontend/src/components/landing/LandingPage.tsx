"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import {
  Shield,
  Activity,
  Zap,
  ArrowRight,
  Terminal,
  Gauge,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Radio,
  FileText,
  Layers,
  Cpu,
  Lock,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Server,
  Code2,
  Bot,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/context/AuthContext';

// Animated Counter component that counts up when scrolled into view
function StatCounter({
  target,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1600,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * target);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, target, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className="tabular-nums font-mono">
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { loginAsDemo } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'radar' | 'studio' | 'canary' | 'postmortem'>('radar');
  const [isDemoLaunching, setIsDemoLaunching] = useState(false);

  // Hero interactive simulation loop stage (0 to 3)
  const [simStage, setSimStage] = useState(0);

  // How it works pipeline traveling active step (0 to 5)
  const [pipelineStep, setPipelineStep] = useState(0);

  // 3D Parallax tilt coordinates for hero mockup
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [showcaseTilt, setShowcaseTilt] = useState({ x: 0, y: 0 });

  // 1-click demo login
  const handleLaunchDemo = async () => {
    setIsDemoLaunching(true);
    try {
      await loginAsDemo();
      router.push('/');
    } catch {
      router.push('/login');
    }
  };

  // Hero incident simulation loop (4 stages, 4.5s cycle)
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setSimStage((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  // How it works sequential highlight loop (steps 0-5)
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % 6);
    }, 2400);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  // Handle subtle mouse parallax for hero
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroTilt({ x: x * 8, y: -y * 8 });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0 });
  };

  // Handle subtle mouse parallax for showcase
  const handleShowcaseMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setShowcaseTilt({ x: x * 6, y: -y * 6 });
  };

  const handleShowcaseMouseLeave = () => {
    setShowcaseTilt({ x: 0, y: 0 });
  };

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Detect',
      short: 'Sentry Webhook Ingestion',
      desc: 'Sentry webhook captures stack trace and latency spikes at sub-second speeds.',
      icon: Activity,
    },
    {
      step: '02',
      title: 'Triage',
      short: 'Nemotron-3 30B Fingerprinting',
      desc: 'Classifies root cause and isolates impacted microservice dependencies in 8ms.',
      icon: Zap,
    },
    {
      step: '03',
      title: 'Ground',
      short: 'Tavily Codebase & Docs Search',
      desc: 'Correlates local AST with external CVE advisories & library documentation.',
      icon: Code2,
    },
    {
      step: '04',
      title: 'Synthesize',
      short: '550B MoE AST Syntax Patch',
      desc: 'Generates zero-hallucination syntax tree patches with verified language grammar.',
      icon: Terminal,
    },
    {
      step: '05',
      title: 'Verify',
      short: 'Firecracker MicroVM Sandbox',
      desc: 'Spins up isolated microVM to execute full regression test suites in ~3.8s.',
      icon: Shield,
    },
    {
      step: '06',
      title: 'Deploy',
      short: 'Canary Gate & Auto-Rollback',
      desc: '5% → 25% → 100% autonomous promotion with instant rollback on SLO anomaly.',
      icon: Gauge,
    },
  ];

  const FEATURES = [
    {
      title: 'AST-Level Auto-Remediation',
      desc: 'Modifies abstract syntax trees directly rather than blind regex replacements, guaranteeing 100% valid grammar.',
      icon: Terminal,
      badge: 'Core Engine',
      gradient: 'from-indigo-500/10 to-violet-500/10',
    },
    {
      title: 'Canary Rollouts with Auto-Rollback',
      desc: 'Automated stepped traffic promotion (5% → 25% → 100%) that instantly rolls back if 5-minute error rates spike.',
      icon: Gauge,
      badge: 'Zero Risk',
      gradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      title: 'SOC-2 Ready Audit Trail',
      desc: 'Cryptographically hashed immutable timeline recording every LLM reasoning step, AST diff, and operator sign-off.',
      icon: Shield,
      badge: 'Compliance',
      gradient: 'from-blue-500/10 to-indigo-500/10',
    },
    {
      title: 'Role-Based Access Control',
      desc: 'Granular Admin, Operator, and Viewer permission tiers with dual-approval policies for production deployments.',
      icon: Lock,
      badge: 'Security',
      gradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      title: 'On-Call & Escalation Routing',
      desc: 'Automated multi-tier PagerDuty & SMS escalation ladders with live paging indicators and shift handoffs.',
      icon: Radio,
      badge: 'Operations',
      gradient: 'from-amber-500/10 to-orange-500/10',
    },
    {
      title: 'Error Budget & SLO Tracking',
      desc: 'Real-time burn-down rate telemetry with automated canary freezes when 30-day budgets drop below 10%.',
      icon: Activity,
      badge: 'Reliability',
      gradient: 'from-rose-500/10 to-red-500/10',
    },
    {
      title: 'Runbook Pattern Library',
      desc: 'Continuously synthesized catalog of verified AST remediation patterns applied with zero regression incidents.',
      icon: BookOpen,
      badge: 'Learned Knowledge',
      gradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      title: 'Real-Time Public Status Page',
      desc: 'Transparent 90-day component uptime history and real-time subscriber incident notifications for external users.',
      icon: Server,
      badge: 'Transparency',
      gradient: 'from-emerald-500/10 to-green-500/10',
    },
  ];

  const SHOWCASE_TABS = [
    {
      id: 'radar',
      name: 'Incident Radar',
      title: 'Live Topology & Crash Detection',
      desc: 'Real-time service health visualizer, active Sev-1 incident stream, and autonomous mitigation dispatches.',
    },
    {
      id: 'studio',
      name: 'Remediation Studio',
      title: 'AST Syntax Diff & MicroVM Sandbox',
      desc: 'Side-by-side code diff viewer, Firecracker microVM compile logs, and Nemotron reasoning confidence scores.',
    },
    {
      id: 'canary',
      name: 'Canary Gate',
      title: 'Stepped Traffic & Auto-Rollback',
      desc: 'Autonomous 5% → 25% → 50% → 100% traffic progression with real-time SLO error budget burn rate guardrails.',
    },
    {
      id: 'postmortem',
      name: 'AI Post-Mortem',
      title: 'Executive RCA & Timeline Audit',
      desc: 'Automated incident retrospective generation, timeline reconstruction, and regression prevention rules.',
    },
  ] as const;

  const PRICING_PLANS = [
    {
      name: 'Developer',
      price: '$0',
      period: 'free during public beta',
      desc: 'Full autonomous remediation for individual engineers and growing startups.',
      features: [
        'Up to 3 team members',
        'Unlimited incident triage & root-cause analysis',
        'Nemotron-3 30B fast triage engine',
        'Firecracker microVM sandbox validation',
        'Sentry webhook & GitHub integration',
        'Community Discord & documentation support',
      ],
      cta: 'Start Free with SOMAK',
      highlighted: false,
    },
    {
      name: 'Team',
      price: '$79',
      period: 'per seat / month',
      desc: 'Autonomous canary rollouts, multi-tier escalation, and compliance for scaling SRE teams.',
      features: [
        'Up to 25 team members',
        'Autonomous canary deployment gates & auto-rollback',
        'Nemotron-3 550B MoE synthesis engine',
        'Slack interactive approval & PagerDuty integration',
        'Runbook Pattern synthesis library',
        'SOC-2 Type II audit logging & export',
        'Priority email & Slack support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'billed annually',
      desc: 'Dedicated microVM clusters, custom fine-tuned models, and mission-critical SLAs.',
      features: [
        'Unlimited team members',
        'Dedicated Firecracker microVM private cluster',
        'Custom fine-tuned LLM reasoning weights',
        'SAML 2.0 / Okta SSO & SCIM provisioning',
        'Multi-region error budget governance',
        '99.99% platform uptime SLA guarantee',
        'Dedicated Solutions Architect & 24/7 on-call support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white transition-colors relative selection:bg-indigo-500/25 overflow-x-hidden">
      
      {/* Dynamic Floating Aurora Mesh Background for Landing Page */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300" />
        
        {/* Deep Indigo Drifting Blob */}
        <div className="absolute -top-40 left-1/4 w-[750px] sm:w-[900px] h-[750px] sm:h-[900px] rounded-full bg-gradient-to-tr from-indigo-500/30 to-indigo-600/15 dark:from-indigo-600/25 dark:to-indigo-500/10 blur-[130px] animate-aurora-1 opacity-90 dark:opacity-80" />
        
        {/* Soft Violet Drifting Blob */}
        <div className="absolute top-1/4 -right-32 w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] rounded-full bg-gradient-to-bl from-purple-500/25 via-violet-500/20 to-transparent dark:from-violet-600/20 dark:via-purple-700/12 dark:to-transparent blur-[150px] animate-aurora-2 opacity-85 dark:opacity-75" />
        
        {/* Soft Cyan/Teal Drifting Blob */}
        <div className="absolute top-2/3 left-1/5 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full bg-gradient-to-tr from-cyan-500/22 to-teal-500/15 dark:from-teal-600/15 dark:to-cyan-600/10 blur-[140px] animate-aurora-3 opacity-80 dark:opacity-65" />
        
        {/* Subtle dot-grid texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* 1. Public Top Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/75 dark:bg-slate-950/75 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                SOMAK AI
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                AUTONOMOUS SRE
              </span>
            </div>
          </Link>

          {/* Navigation Links with Animated Expanding Underlines */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'Showcase', href: '#showcase' },
              { label: 'Pricing', href: '#pricing' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative py-1 hover:text-slate-900 dark:hover:text-white transition-colors group"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200 group-hover:w-full rounded-full" />
              </a>
            ))}
            <Link
              href="/docs"
              className="relative py-1 hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1"
            >
              <span>Docs</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
            <Link
              href="/status"
              className="relative py-1 hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <span>Status</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Animated Sun/Moon Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ y: -12, opacity: 0, rotate: -40 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 12, opacity: 0, rotate: 40 }}
                  transition={{ duration: 0.18 }}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Log in Button */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Log in
            </Link>

            {/* Primary Sign up Button with Subtle Glow */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all btn-glow-primary"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Staggered Entrance & Interactive Live Mockup */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          {/* Eyebrow Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>SOMAK AI • Zero-Human-Latency Cloud SRE</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">95.2% Auto-Resolved</span>
          </motion.div>

          {/* Main Outcome Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.08] text-slate-900 dark:text-white"
          >
            Incidents fix themselves before your team wakes up.
          </motion.h1>

          {/* Subheadline in Plain Language */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            SOMAK AI ingests crash telemetry, synthesizes zero-hallucination AST hotfixes in Firecracker microVMs, and executes canary rollouts with automated rollbacks.
          </motion.p>

          {/* CTAs with Subtle Hover Lift & Pulsing Aura */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <div className="relative group w-full sm:w-auto">
              {/* Soft Pulsing Aura Glow Behind CTA */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              <Link
                href="/signup"
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all duration-200 active:scale-95"
              >
                <span>Start Free with SOMAK AI</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              onClick={handleLaunchDemo}
              disabled={isDemoLaunching}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-xs hover:border-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Play className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span>{isDemoLaunching ? 'Starting Demo Session...' : 'View Live Demo'}</span>
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            Free during public beta • No credit card required • 5-minute setup
          </motion.p>

          {/* HERO VISUAL: Live Animated Incident Simulation Loop with 3D Parallax Tilt */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
            className="pt-6 max-w-5xl mx-auto perspective-1000"
          >
            <div
              style={{
                transform: `rotateX(${heroTilt.y}deg) rotateY(${heroTilt.x}deg)`,
                transition: 'transform 180ms ease-out',
              }}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden text-left ring-1 ring-slate-900/5 dark:ring-white/10"
            >
              {/* Browser Window Header */}
              <div className="px-4 py-3 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                </div>
                <div className="px-3.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shadow-xs">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>https://app.somak.ai/radar</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  SOMAK AUTONOMOUS ENGINE: ACTIVE
                </div>
              </div>

              {/* Mockup Dashboard Content Area with Live Animated Loop */}
              <div className="p-6 space-y-5 bg-radial-gradient">
                
                {/* Looping Incident Simulation Card */}
                <div
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    simStage === 0
                      ? 'bg-red-500/10 border-red-500/30 shadow-md shadow-red-500/10'
                      : simStage === 1
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/10'
                      : simStage === 2
                      ? 'bg-indigo-500/10 border-indigo-500/30 shadow-md shadow-indigo-500/10'
                      : 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-bold transition-colors ${
                          simStage === 0
                            ? 'bg-red-500 animate-pulse'
                            : simStage === 1
                            ? 'bg-amber-500'
                            : simStage === 2
                            ? 'bg-indigo-600'
                            : 'bg-emerald-500'
                        }`}
                      >
                        {simStage === 0 && <AlertTriangle className="w-5 h-5" />}
                        {simStage === 1 && <Terminal className="w-5 h-5" />}
                        {simStage === 2 && <Shield className="w-5 h-5" />}
                        {simStage === 3 && <CheckCircle2 className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                              simStage === 0
                                ? 'bg-red-500 text-white'
                                : simStage === 1
                                ? 'bg-amber-500 text-white'
                                : simStage === 2
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {simStage === 0 && 'SEV-1 DETECTED'}
                            {simStage === 1 && 'AST SYNTHESIS'}
                            {simStage === 2 && 'SANDBOX VERIFYING'}
                            {simStage === 3 && 'FIX VERIFIED & DEPLOYED'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            auth-service: V8 Heap Limit OOM Spike
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {simStage === 0 && 'Sentry webhook fired • Unhandled exception in token-cache.ts:42'}
                          {simStage === 1 && 'Nemotron-3 550B synthesized TTL LRU Cache • Confidence 99.4%'}
                          {simStage === 2 && 'Booting Firecracker microVM #2819 • Running 14 integration test suites'}
                          {simStage === 3 && 'Canary 100% Promoted • Latency 14ms (healthy) • Total MTTR: 2m 14s'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {simStage === 0 && 'Progress: 15%'}
                        {simStage === 1 && 'Progress: 50%'}
                        {simStage === 2 && 'Progress: 80%'}
                        {simStage === 3 && 'Progress: 100%'}
                      </span>
                    </div>
                  </div>

                  {/* Animated Progress Filling Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-all duration-500 ${
                        simStage === 0
                          ? 'bg-red-500 w-[15%]'
                          : simStage === 1
                          ? 'bg-amber-500 w-[50%]'
                          : simStage === 2
                          ? 'bg-indigo-600 w-[80%]'
                          : 'bg-emerald-500 w-[100%]'
                      }`}
                    />
                  </div>
                </div>

                {/* 4 Multi-stage Diagnostic Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Root Cause Triage</span>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Nemotron 30B</div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">8.2ms elapsed</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>AST Syntax Patch</span>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">+7 / -3 lines</div>
                    <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">99.4% confidence</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>MicroVM Sandbox</span>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">14/14 Tests Passed</div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">0 regressions</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Canary Rollout</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">5% → 25% → 100%</div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">SLO Burn Nominal</div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Stats Bar with Animated Number Count-Up */}
      <section className="py-14 border-y border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-indigo-600 dark:text-indigo-400">
                <StatCounter target={95.2} decimals={1} suffix="%" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Autonomous Resolution
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Resolved with zero human intervention
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-indigo-600 dark:text-indigo-400">
                <span>3m 42s</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Avg MTTR (-78%)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Down from 17m manual on-call triage
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-indigo-600 dark:text-indigo-400">
                <StatCounter target={418} prefix="$" suffix="K" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Downtime Saved
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Estimated average per engineering org
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-indigo-600 dark:text-indigo-400">
                <StatCounter target={14} suffix="/14" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Sandbox Tests Passed
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                100% zero-regression track record
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. "How It Works" Animated Sequenced Flow */}
      <section id="how-it-works" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-2xl mx-auto"
        >
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Automated Pipeline Sequence
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            From crash to verified fix in under 4 minutes.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            A non-engineer friendly look at how SOMAK AI safeguards your production environment without awake humans.
          </p>
        </motion.div>

        {/* Sequenced Connecting Pipeline Flow */}
        <div className="relative">
          {/* Subtle connecting path bar for desktop */}
          <div className="hidden lg:block absolute top-10 left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, idx) => {
              const Icon = step.icon;
              const isStepActive = pipelineStep === idx;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className={`glass-panel p-6 rounded-2xl shadow-xs space-y-4 transition-all duration-300 relative group ${
                    isStepActive
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        isStepActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-mono font-bold transition-colors ${
                        isStepActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      STEP {step.step}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{step.title}</span>
                      {isStepActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      )}
                    </h3>
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      {step.short}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Feature Grid with Hover Gradient Border & Micro-Interactions */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Enterprise Resilience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Engineered for high-velocity site reliability.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Rigorous safety checks, cryptographic auditability, and instant human overrides at every tier.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="glass-panel p-5 rounded-2xl shadow-xs space-y-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/40 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Product Showcase with Smooth Crossfade & Desktop 3D Tilt */}
      <section id="showcase" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-2xl mx-auto"
        >
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Interactive Product Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Experience the SOMAK AI operator studio.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Click through real interfaces engineered for sub-minute incident response.
          </p>
        </motion.div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {SHOWCASE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveShowcaseTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeShowcaseTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-102'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Showcase Frame with Desktop Parallax */}
        <motion.div
          onMouseMove={handleShowcaseMouseMove}
          onMouseLeave={handleShowcaseMouseLeave}
          className="max-w-4xl mx-auto perspective-1000"
        >
          <div
            style={{
              transform: `rotateX(${showcaseTilt.y}deg) rotateY(${showcaseTilt.x}deg)`,
              transition: 'transform 180ms ease-out',
            }}
            className="glass-panel rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10"
          >
            {/* Mockup Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 ml-2">
                  {SHOWCASE_TABS.find((t) => t.id === activeShowcaseTab)?.title}
                </span>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                SOMAK SRE Engine v1.4
              </span>
            </div>

            {/* Tabbed Content Crossfade */}
            <div className="p-6 sm:p-8 min-h-[340px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeShowcaseTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeShowcaseTab === 'radar' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-500" />
                          <span>Real-Time Incident Radar & Topology</span>
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ● Cluster Nominal
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                          <div className="text-[11px] text-slate-400 font-mono">auth-service</div>
                          <div className="text-xs font-bold text-emerald-500">Autonomous Hotfix Deployed</div>
                          <div className="text-[10px] font-mono text-slate-400">MTTR: 2m 14s • 0 Regressions</div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                          <div className="text-[11px] text-slate-400 font-mono">payment-gateway</div>
                          <div className="text-xs font-bold text-emerald-500">Nominal</div>
                          <div className="text-[10px] font-mono text-slate-400">0.2% burn rate</div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                          <div className="text-[11px] text-slate-400 font-mono">user-service</div>
                          <div className="text-xs font-bold text-emerald-500">Nominal</div>
                          <div className="text-[10px] font-mono text-slate-400">0.4% burn rate</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === 'studio' && (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 font-sans">
                        <span className="font-bold text-slate-900 dark:text-white">AST Diff: auth-service.ts</span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs">Confidence 99.4%</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs leading-relaxed overflow-x-auto">
                        <div className="text-red-400">{'- const tokenCache = new Map<string, any>();'}</div>
                        <div className="text-red-400">{'- tokenCache.set(token, payload); // Unbounded heap leak'}</div>
                        <div className="text-emerald-400">{'+ const tokenCache = new LRUCache({ max: 5000, ttl: 1000 * 60 * 5 });'}</div>
                        <div className="text-emerald-400">{'+ tokenCache.set(token, payload); // Auto-evicted TTL'}</div>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === 'canary' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">Canary Deployment Gate Status</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">25% Traffic Evaluated</span>
                      </div>
                      <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 w-1/4 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span className="text-emerald-600 font-bold">Step 1: 5% (Healthy)</span>
                        <span className="text-indigo-600 font-bold">Step 2: 25% (Evaluating)</span>
                        <span>Step 3: 50%</span>
                        <span>Step 4: 100%</span>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === 'postmortem' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">Automated Incident Retrospective</span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-mono font-bold">SOC-2 Export Ready</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        <strong>Executive Summary:</strong> At 14:02 UTC, auth-service experienced a sudden heap spike following a cache leak in token validation. SOMAK AI detected the anomaly within 300ms, synthesized an LRU cache fix via Nemotron MoE, and verified the fix in Firecracker sandbox with zero regressions. Total MTTR: 3m 42s.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 7. Transparent Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Predictable pricing for resilient engineering.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Get started free during our beta. Scale smoothly as your service footprint expands.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative transition-all ${
                  plan.highlighted
                    ? 'border-indigo-500/80 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50 scale-102'
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold text-[10px] tracking-wider uppercase shadow-xs">
                    Recommended
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {plan.period}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    {plan.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/signup"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-center transition-all ${
                    plan.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 btn-glow-primary'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-10 sm:p-16 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-2xl mx-auto">
            Ready to eliminate 3 AM pages forever?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Connect SOMAK AI to your telemetry in 5 minutes and see your first production incident resolved autonomously.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 btn-glow-primary"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Read Documentation</span>
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Free during public beta • No credit card required • 5-minute setup
          </p>
        </motion.div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              SOMAK AI
            </span>
            <span className="text-slate-400">
              © {new Date().getFullYear()} SOMAK AI Inc.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="/status" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              System Status
            </Link>
            <Link href="/changelog" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Changelog
            </Link>
            <Link href="/audit" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              SOC-2 Audit
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
