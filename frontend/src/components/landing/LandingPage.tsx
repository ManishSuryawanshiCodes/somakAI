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
  Pause,
  RotateCcw,
  Check,
  Server,
  Code2,
  Bot,
  Flame,
  ArrowUpRight,
  Sliders,
  Filter,
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

  // Interactive Live Demo Simulator State
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(true);
  const [canarySliderValue, setCanarySliderValue] = useState<number>(100);

  // Active Telemetry Chart Tab
  const [activeGraphTab, setActiveGraphTab] = useState<'errorRate' | 'latency' | 'mttr'>('errorRate');

  // How it works pipeline active step (0 to 5)
  const [pipelineStep, setPipelineStep] = useState(0);

  // 3D Parallax tilt coordinates for hero mockup
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });

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

  // Auto-play simulator loop
  useEffect(() => {
    if (!isSimPlaying || shouldReduceMotion) return;
    const timer = setInterval(() => {
      setSimStep((prev) => (prev + 1) % 4);
    }, 3600);
    return () => clearInterval(timer);
  }, [isSimPlaying, shouldReduceMotion]);

  // Adjust canary slider automatically when reaching step 3
  useEffect(() => {
    if (simStep === 3) {
      setCanarySliderValue(100);
    } else if (simStep === 2) {
      setCanarySliderValue(25);
    } else if (simStep === 1) {
      setCanarySliderValue(5);
    } else {
      setCanarySliderValue(0);
    }
  }, [simStep]);

  // Pipeline step loop
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  // Parallax handlers
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroTilt({ x: x * 6, y: -y * 6 });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0 });
  };

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Detect',
      short: 'Sentry Webhook Ingestion',
      desc: 'Stack traces and latency spikes captured instantly via Sentry webhooks.',
      icon: Activity,
      color: 'text-rose-500',
      borderColor: 'border-rose-500/30',
      bgGlow: 'bg-rose-500/10',
    },
    {
      step: '02',
      title: 'Triage',
      short: 'Nemotron-3 30B Fingerprinting',
      desc: 'Root cause classified and blast radius isolated in 8ms.',
      icon: Zap,
      color: 'text-amber-500',
      borderColor: 'border-amber-500/30',
      bgGlow: 'bg-amber-500/10',
    },
    {
      step: '03',
      title: 'Ground',
      short: 'Tavily Codebase Search',
      desc: 'AST correlated with CVE advisories and library docs.',
      icon: Code2,
      color: 'text-violet-500',
      borderColor: 'border-violet-500/30',
      bgGlow: 'bg-violet-500/10',
    },
    {
      step: '04',
      title: 'Synthesize',
      short: '550B MoE AST Syntax Patch',
      desc: 'Syntax-verified AST patches with zero hallucination.',
      icon: Terminal,
      color: 'text-indigo-500',
      borderColor: 'border-indigo-500/30',
      bgGlow: 'bg-indigo-500/10',
    },
    {
      step: '05',
      title: 'Verify',
      short: 'Firecracker MicroVM Sandbox',
      desc: 'Isolated microVM regression tests complete in ~3.8s.',
      icon: Shield,
      color: 'text-cyan-500',
      borderColor: 'border-cyan-500/30',
      bgGlow: 'bg-cyan-500/10',
    },
    {
      step: '06',
      title: 'Deploy',
      short: 'Canary Gate & Auto-Rollback',
      desc: 'Progressive traffic promotion with instant SLO-aware rollback.',
      icon: Gauge,
      color: 'text-emerald-500',
      borderColor: 'border-emerald-500/30',
      bgGlow: 'bg-emerald-500/10',
    },
  ];

  const FEATURES = [
    {
      title: 'AST-Level Auto-Remediation',
      desc: 'Direct AST modifications guarantee 100% valid grammar — no regex guessing.',
      icon: Terminal,
      badge: 'Core Engine',
      accent: 'emerald',
    },
    {
      title: 'Canary Rollouts with Auto-Rollback',
      desc: 'Stepped 5% → 25% → 100% traffic promotion with auto-rollback on error spikes.',
      icon: Gauge,
      badge: 'Zero Risk',
      accent: 'cyan',
    },
    {
      title: 'SOC-2 Ready Audit Trail',
      desc: 'Immutable, hashed audit trail of every reasoning step and operator action.',
      icon: Shield,
      badge: 'Compliance',
      accent: 'violet',
    },
    {
      title: 'Role-Based Access Control',
      desc: 'Admin, Operator, Viewer roles with dual-approval for production deploys.',
      icon: Lock,
      badge: 'Security',
      accent: 'amber',
    },
    {
      title: 'On-Call & Escalation Routing',
      desc: 'Multi-tier PagerDuty escalation with live paging and shift handoffs.',
      icon: Radio,
      badge: 'Operations',
      accent: 'rose',
    },
    {
      title: 'Error Budget & SLO Tracking',
      desc: 'Real-time burn rate with automated freezes when budgets drop below 10%.',
      icon: Activity,
      badge: 'Reliability',
      accent: 'indigo',
    },
    {
      title: 'Runbook Pattern Library',
      desc: 'Verified AST fix patterns cataloged from past incidents — zero regressions.',
      icon: BookOpen,
      badge: 'Knowledge',
      accent: 'cyan',
    },
    {
      title: 'Real-Time Public Status Page',
      desc: '90-day uptime history with real-time incident notifications.',
      icon: Server,
      badge: 'Transparency',
      accent: 'emerald',
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
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-[#181614] dark:text-white transition-colors duration-300 relative selection:bg-indigo-500/25 overflow-x-hidden">
      
      {/* Dynamic Floating Liquid Aurora Mesh Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      >
        {/* Pure Near-Black in Dark Mode, Cream in Light Mode */}
        <div className="absolute inset-0 bg-[#FAF8F5] dark:bg-[#0A0A0A] transition-colors duration-300" />
        
        {/* Neon Emerald Glowing Caustic */}
        <div className="absolute -top-40 left-1/4 w-[700px] sm:w-[850px] h-[700px] sm:h-[850px] rounded-full bg-gradient-to-tr from-emerald-500/25 to-teal-500/10 dark:from-emerald-500/15 dark:to-transparent blur-[140px] animate-aurora-1 opacity-90 dark:opacity-75" />
        
        {/* Neon Cyan Drifting Caustic */}
        <div className="absolute top-1/4 -right-32 w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] rounded-full bg-gradient-to-bl from-cyan-500/25 via-indigo-500/15 to-transparent dark:from-cyan-500/15 dark:via-indigo-600/10 dark:to-transparent blur-[150px] animate-aurora-2 opacity-85 dark:opacity-75" />
        
        {/* Neon Violet / Indigo Core */}
        <div className="absolute top-2/3 left-1/6 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full bg-gradient-to-tr from-violet-600/20 to-purple-600/10 dark:from-violet-600/15 dark:to-transparent blur-[150px] animate-aurora-3 opacity-80 dark:opacity-70" />
        
        {/* Micro-dot grid with liquid glass texture */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* 1. Public Top Navigation (Liquid Glass Header) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#FAF8F5]/90 dark:bg-[#0A0A0A]/90 border-b border-slate-200 dark:border-white/10 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo: Size-appropriate simplified icon + typography lockup */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 flex items-center justify-center p-1 shrink-0 transition-transform group-hover:scale-105 shadow-xs overflow-hidden">
              <img
                src="/somak-ai-icon-simplified-transparent.png"
                alt="SOMAK AI"
                className="w-6 h-6 object-contain aspect-square"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                SOMAK AI
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 leading-none">
                AUTONOMOUS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[
              { label: 'Live Demo', href: '#demo' },
              { label: 'Telemetry Graphs', href: '#telemetry' },
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
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 transition-all duration-200 group-hover:w-full rounded-full" />
              </a>
            ))}
            <Link
              href="/docs"
              className="relative py-1 hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1"
            >
              <span>Docs</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle (Hidden per directive) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-colors relative overflow-hidden"
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
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              Log in
            </Link>

            {/* Primary Sign up Button */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all btn-glow-primary"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-16 sm:pt-24 sm:pb-24 overflow-hidden">
        {/* Subtle Atmospheric Gradient Glow (Vercel/Render touch) */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[920px] h-[360px] sm:h-[480px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-cyan-500/10 dark:from-indigo-600/20 dark:via-purple-600/10 dark:to-cyan-600/15 blur-[130px] rounded-full pointer-events-none -z-10"
        />

        {/* Faint dot-grid overlay behind Hero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          {/* Eyebrow Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.75} />
            <span className="font-mono text-[11px] uppercase tracking-wider">SOMAK AI • Zero-Human-Latency Cloud SRE</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">95.2% Auto-Resolved</span>
          </motion.div>

          {/* Main Outcome Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.08] text-[#181614] dark:text-white"
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

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <div className="relative group w-full sm:w-auto">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600 opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              <Link
                href="/signup"
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all duration-200 active:scale-95"
              >
                <span>Start Free with SOMAK AI</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>

            <button
              onClick={handleLaunchDemo}
              disabled={isDemoLaunching}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[#E8E3D9] dark:border-white/10 font-bold text-sm shadow-xs hover:border-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all liquid-glass"
            >
              <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" strokeWidth={1.75} />
              <span>{isDemoLaunching ? 'Starting Demo Session...' : 'View Live Demo'}</span>
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xs text-slate-500 dark:text-slate-400 font-mono"
          >
            Free during public beta • No credit card required • 5-minute setup
          </motion.p>
        </div>
      </section>

      {/* 2B. Infrastructure Trust Strip (Vercel, Render, Supabase, Dodo Payments) */}
      <section className="py-6 sm:py-8 border-y border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-neutral-400 font-semibold">
            Built on Production-Grade Cloud Infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-600 dark:text-neutral-300">
            {/* Vercel */}
            <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 group">
              <svg className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 1155 1000">
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
              <span className="text-xs font-semibold tracking-tight">Vercel</span>
            </div>

            {/* Render */}
            <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 group">
              <svg className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path d="M4 4h7.5c3.59 0 6.5 2.91 6.5 6.5 0 2.45-1.36 4.58-3.37 5.67L19 20h-4l-3.5-3.5H8V20H4V4zm4 4v5h3.5c1.38 0 2.5-1.12 2.5-2.5S12.88 8 11.5 8H8z" />
              </svg>
              <span className="text-xs font-semibold tracking-tight">Render</span>
            </div>

            {/* Supabase */}
            <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 group">
              <svg className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.82 14.07a.792.792 0 0 0 .616 1.285H12v8.249a.396.396 0 0 0 .716.233l10.464-13.197a.792.792 0 0 0-.818-1.286z" />
              </svg>
              <span className="text-xs font-semibold tracking-tight">Supabase</span>
            </div>

            {/* Dodo Payments */}
            <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 group">
              <svg className="w-3.5 h-3.5 fill-none stroke-current opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span className="text-xs font-semibold tracking-tight">Dodo Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE REMEDIATION SIMULATOR (DEMO IN THE LANDING PAGE) */}
      <section id="demo" className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.6 }}
          className="liquid-glass rounded-3xl border border-[#E8E3D9] dark:border-white/10 overflow-hidden shadow-2xl relative"
        >
          {/* Window Chrome Header */}
          <div className="px-5 py-3.5 bg-slate-100/90 dark:bg-[#0A0A0A] border-b border-[#E8E3D9] dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/90 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/90 inline-block" />
              <div className="ml-2 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 shadow-2xs">
                <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-4 h-4 object-contain aspect-square" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  SOMAK AI Sandbox Simulator • Interactive Live Walkthrough
                </span>
              </div>
            </div>

            {/* Play/Pause & Step Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSimPlaying((prev) => !prev)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 flex items-center gap-1.5 transition-all"
              >
                {isSimPlaying ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />}
                <span>{isSimPlaying ? 'Pause Auto' : 'Auto Play'}</span>
              </button>

              <button
                onClick={() => setSimStep((prev) => (prev + 1) % 4)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-all"
              >
                <span>Step Forward</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => setSimStep(0)}
                title="Restart simulation"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stepper Navigation Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#E8E3D9] dark:border-white/10 bg-slate-50/50 dark:bg-black/30">
            {[
              { idx: 0, label: '1. Crash Detected', tag: 'Sentry Webhook', color: 'text-rose-500', activeBg: 'border-b-2 border-rose-500 bg-rose-500/10' },
              { idx: 1, label: '2. AST Synthesized', tag: 'Nemotron 550B', color: 'text-indigo-500', activeBg: 'border-b-2 border-indigo-500 bg-indigo-500/10' },
              { idx: 2, label: '3. Sandbox Verified', tag: 'MicroVM Jest', color: 'text-cyan-500', activeBg: 'border-b-2 border-cyan-500 bg-cyan-500/10' },
              { idx: 3, label: '4. Canary 100% Live', tag: 'Zero Regression', color: 'text-emerald-500', activeBg: 'border-b-2 border-emerald-500 bg-emerald-500/10' },
            ].map((step) => (
              <button
                key={step.idx}
                onClick={() => {
                  setSimStep(step.idx);
                  setIsSimPlaying(false);
                }}
                className={`p-3 text-left transition-all ${
                  simStep === step.idx ? step.activeBg : 'hover:bg-slate-100/50 dark:hover:bg-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${simStep === step.idx ? step.color : 'text-slate-700 dark:text-slate-300'}`}>
                    {step.label}
                  </span>
                  {simStep === step.idx && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                  {step.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Interactive Stage Content */}
          <div className="p-6 md:p-8 space-y-6">
            <AnimatePresence mode="wait">
              {/* STAGE 0: CRASH DETECTED */}
              {simStep === 0 && (
                <motion.div
                  key="sim-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500 text-white">
                            SEV-1 CRITICAL
                          </span>
                          <span className="font-bold text-[#181614] dark:text-white">
                            auth-service: Unhandled TypeError Exception
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Sentry webhook alert received • Latency spike to 890ms • Ingested by Somak AI in 14ms
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-rose-500 font-bold text-sm block">14.8% Error Rate</span>
                      <span className="text-[10px] text-slate-400">Pod memory: 94.2%</span>
                    </div>
                  </div>

                  {/* Terminal Crash Snippet */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0B0F19] text-slate-300 font-mono text-xs">
                    <div className="px-4 py-2 bg-black/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Stack Trace • src/services/tokenService.ts:68</span>
                      <span className="text-rose-400">Crash Code 137 (OOM / NullRef)</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[11px] text-rose-300 leading-relaxed">
{`TypeError: Cannot read properties of undefined (reading 'tenantId')
    at verifySessionToken (src/services/tokenService.ts:68:24)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async authMiddleware (src/middleware/auth.ts:31:12)
[Somak AI Ingestion] Fingerprint extracted: ERR_TENANT_NULL_REF (8.1ms)`}
                    </pre>
                  </div>
                </motion.div>
              )}

              {/* STAGE 1: AST SYNTHESIZED */}
              {simStep === 1 && (
                <motion.div
                  key="sim-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-600 text-white">
                            AST REASONING
                          </span>
                          <span className="font-bold text-[#181614] dark:text-white">
                            NVIDIA Nemotron-3 550B MoE • Syntactic AST Diff
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Extracted Abstract Syntax Tree • Validated syntax grammar • Grounded via Tavily API
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-indigo-500 font-bold text-sm block">99.4% Confidence</span>
                      <span className="text-[10px] text-slate-400">AST Nodes: +12, -4</span>
                    </div>
                  </div>

                  {/* Unified AST Diff View */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0B0F19] text-slate-300 font-mono text-xs">
                    <div className="px-4 py-2 bg-black/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Unified Diff • tokenService.ts</span>
                      <span className="text-indigo-400">Verified Grammar: PASS</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed">
<span className="text-slate-500">@@ -66,6 +66,11 @@ export async function verifySessionToken(token: string) &#123;</span>
<span className="text-slate-400">   const payload = decodeJwt(token);</span>
<span className="text-rose-400 bg-rose-500/10 block">-  const tenant = payload.organization.tenantId;</span>
<span className="text-emerald-400 bg-emerald-500/10 block">+  const tenant = payload?.organization?.tenantId || 'default-tenant';</span>
<span className="text-emerald-400 bg-emerald-500/10 block">+  if (!tenant) &#123;</span>
<span className="text-emerald-400 bg-emerald-500/10 block">+    logger.warn('Missing tenantId in token, falling back to isolation pool');</span>
<span className="text-emerald-400 bg-emerald-500/10 block">+  &#125;</span>
<span className="text-slate-400">   return sessionCache.get(tenant);</span>
                    </pre>
                  </div>
                </motion.div>
              )}

              {/* STAGE 2: SANDBOX VERIFIED */}
              {simStep === 2 && (
                <motion.div
                  key="sim-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-600 text-white">
                            MICROVM SANDBOX
                          </span>
                          <span className="font-bold text-[#181614] dark:text-white">
                            Firecracker VM #8841 • Isolated Regression Verification
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Ephemeral container booted in 48ms • Zero access to production DB • Test suite executed
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-cyan-500 font-bold text-sm block">18/18 Tests Passed</span>
                      <span className="text-[10px] text-slate-400">Time: 2.14s</span>
                    </div>
                  </div>

                  {/* Terminal Sandbox Execution */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0B0F19] text-slate-300 font-mono text-xs">
                    <div className="px-4 py-2 bg-black/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sandbox Terminal • yarn test:regression</span>
                      <span className="text-emerald-400">Exit Code: 0 (PASS)</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[11px] text-slate-300 leading-relaxed">
<span className="text-emerald-400 font-bold">PASS</span> src/services/__tests__/tokenService.test.ts (1.42s)
  ✓ resolves session when organization is present (12ms)
  ✓ gracefully handles malformed token payload without throwing (8ms)
  ✓ isolates undefined tenantId to default tenant pool (15ms)
  ✓ passes high-concurrency rate test (10k ops/sec) (410ms)
<span className="text-slate-400">Test Suites: 1 passed, 1 total</span>
<span className="text-slate-400">Tests:       18 passed, 18 total</span>
<span className="text-cyan-400 font-bold">Snapshots:   0 total</span>
<span className="text-emerald-400 font-bold">Safe-Deploy Gate: APPROVED FOR CANARY PROMOTION</span>
                    </pre>
                  </div>
                </motion.div>
              )}

              {/* STAGE 3: CANARY 100% LIVE */}
              {simStep === 3 && (
                <motion.div
                  key="sim-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600 text-white">
                            CANARY PROMOTION
                          </span>
                          <span className="font-bold text-[#181614] dark:text-white">
                            Traffic Promoted: {canarySliderValue}% • Zero Regressions Detected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Envoy dynamic weight split • Error rate collapsed from 14.8% → 0.00% • MTTR: 2m 07s
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-emerald-500 font-bold text-sm block">0.00% Error Rate</span>
                      <span className="text-[10px] text-slate-400">P99 Latency: 38ms</span>
                    </div>
                  </div>

                  {/* Interactive Traffic Split Slider */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Interactive Canary Traffic Promotion Slider</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {canarySliderValue}% Traffic to Hotfix
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={canarySliderValue}
                      onChange={(e) => setCanarySliderValue(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>0% (Standby)</span>
                      <span>5% (Initial Gate)</span>
                      <span>25% (Soak Test)</span>
                      <span>50% (High Load)</span>
                      <span className="text-emerald-500 font-bold">100% (Full GA)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4 Minimalist Colored Status Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-rose-500 font-mono">
                  <span>Detection</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Sub-second</div>
                <div className="text-[10px] font-mono text-slate-400">Sentry Webhook</div>
              </div>

              <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-indigo-500 font-mono">
                  <span>Nemotron AST</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">99.4% Syntactic</div>
                <div className="text-[10px] font-mono text-slate-400">550B MoE Engine</div>
              </div>

              <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-cyan-500 font-mono">
                  <span>MicroVM Sandbox</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Zero Blast Radius</div>
                <div className="text-[10px] font-mono text-slate-400">18 Tests Passed</div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-emerald-500 font-mono">
                  <span>Auto-Rollback</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Active Guardrail</div>
                <div className="text-[10px] font-mono text-slate-400">&lt;0.5% SLO Burn</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. LIVE ANIMATED SVG TELEMETRY GRAPHS */}
      <section id="telemetry" className="py-16 sm:py-24 bg-slate-50/70 dark:bg-black/40 border-y border-[#E8E3D9] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
              Autonomous Performance Metrics
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
              Watch production error rates collapse in real-time.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Recovery metrics from 14,000+ autonomous remediation runs.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center justify-center gap-2">
            {[
              { id: 'errorRate', label: 'Error Rate Collapse (%)', icon: Activity, color: 'text-rose-500' },
              { id: 'latency', label: 'P99 Latency Recovery (ms)', icon: Gauge, color: 'text-indigo-500' },
              { id: 'mttr', label: 'MTTR Benchmark (vs Human)', icon: Clock, color: 'text-emerald-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGraphTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeGraphTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-102'
                    : 'bg-white dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 border border-[#E8E3D9] dark:border-white/10 hover:border-indigo-500'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeGraphTab === tab.id ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Animated SVG Chart Card */}
          <div className="liquid-glass p-6 sm:p-8 rounded-3xl border border-[#E8E3D9] dark:border-white/10 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#181614] dark:text-white">
                  {activeGraphTab === 'errorRate' && '5-Minute Production Error Rate Drop (14.8% → 0.01%)'}
                  {activeGraphTab === 'latency' && 'P99 API Latency Curve (850ms → 42ms)'}
                  {activeGraphTab === 'mttr' && 'Mean Time to Resolution: Human SRE vs Somak AI Engine'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time telemetry sample rate: 100ms • Autonomous promotion timeline
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Alert Threshold
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Canary Verified
                </span>
              </div>
            </div>

            {/* SVG Visual Graph Container */}
            <div className="w-full h-64 sm:h-72 relative">
              {activeGraphTab === 'errorRate' && (
                <svg viewBox="0 0 800 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="errorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F43F5E" />
                      <stop offset="35%" stopColor="#F59E0B" />
                      <stop offset="65%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="40" x2="800" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" y1="160" x2="800" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" y1="220" x2="800" y2="220" stroke="currentColor" strokeOpacity="0.15" />

                  {/* Shaded Area under Curve */}
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    d="M 40 50 C 140 50, 200 60, 280 110 C 360 160, 480 210, 760 218 L 760 220 L 40 220 Z"
                    fill="url(#errorGrad)"
                  />

                  {/* Dynamic Glowing Curve */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    d="M 40 50 C 140 50, 200 60, 280 110 C 360 160, 480 210, 760 218"
                    fill="none"
                    stroke="url(#strokeGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Marker 1: Outage Peak */}
                  <circle cx="40" cy="50" r="5" className="fill-rose-500 animate-ping" />
                  <circle cx="40" cy="50" r="5" className="fill-rose-500" />
                  <text x="50" y="44" className="text-[10px] font-mono fill-rose-500 font-bold">14.8% Outage Triggered</text>

                  {/* Marker 2: AST Patch */}
                  <circle cx="280" cy="110" r="4.5" className="fill-indigo-500" />
                  <text x="290" y="105" className="text-[10px] font-mono fill-indigo-400 font-bold">Nemotron AST Deployed</text>

                  {/* Marker 3: Canary Promotion */}
                  <circle cx="480" cy="180" r="4.5" className="fill-cyan-500" />
                  <text x="490" y="175" className="text-[10px] font-mono fill-cyan-400 font-bold">Canary 50% Verified</text>

                  {/* Marker 4: Zero Error Recovery */}
                  <circle cx="760" cy="218" r="5" className="fill-emerald-400 animate-pulse" />
                  <text x="690" y="210" className="text-[10px] font-mono fill-emerald-400 font-bold">0.01% Nominal</text>
                </svg>
              )}

              {activeGraphTab === 'latency' && (
                <svg viewBox="0 0 800 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="latencyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="40" x2="800" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="800" y2="120" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" y1="200" x2="800" y2="200" stroke="currentColor" strokeOpacity="0.15" />

                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    d="M 40 45 C 160 55, 260 90, 420 180 C 560 205, 680 205, 760 205 L 760 205 L 40 205 Z"
                    fill="url(#latencyGrad)"
                  />

                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    d="M 40 45 C 160 55, 260 90, 420 180 C 560 205, 680 205, 760 205"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  <circle cx="40" cy="45" r="5" className="fill-rose-500" />
                  <text x="50" y="38" className="text-[10px] font-mono fill-rose-500 font-bold">850ms P99 Spike</text>

                  <circle cx="760" cy="205" r="5" className="fill-emerald-400 animate-pulse" />
                  <text x="690" y="195" className="text-[10px] font-mono fill-emerald-400 font-bold">42ms Restored</text>
                </svg>
              )}

              {activeGraphTab === 'mttr' && (
                <div className="h-full flex flex-col justify-center gap-6 px-4">
                  {/* Human Baseline Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-400">Industry Human SRE Baseline (PagerDuty On-Call)</span>
                      <span className="text-rose-500 font-bold">48m 12s</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[100%] h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" />
                    </div>
                  </div>

                  {/* Somak AI Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">SOMAK AI Autonomous Engine</span>
                      <span className="text-emerald-500 font-bold">2m 07s (95.3% reduction)</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '4.4%' }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full shadow-lg shadow-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Marker Labels */}
            <div className="flex justify-between text-[11px] font-mono text-slate-400 border-t border-[#E8E3D9] dark:border-white/10 pt-3">
              <span>T+0s (Crash Triggered)</span>
              <span>T+8ms (Nemotron Triage)</span>
              <span>T+3.8s (Sandbox AST Pass)</span>
              <span>T+45s (Canary Verification)</span>
              <span className="text-emerald-500 font-bold">T+127s (Full Resolution)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Stats Bar */}
      <section className="py-14 border-y border-[#E8E3D9] dark:border-white/10 bg-slate-50/60 dark:bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                <StatCounter target={95.2} decimals={1} suffix="%" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Autonomous Resolution
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Resolved with zero human intervention
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-cyan-600 dark:text-cyan-400">
                <span>3m 42s</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
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
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Downtime Saved
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Estimated average per engineering org
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-violet-600 dark:text-violet-400">
                <StatCounter target={0} suffix=" regr" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Zero Regressions
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Guaranteed by Firecracker test gates
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. How It Works Pipeline */}
      <section id="how-it-works" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-2xl mx-auto"
        >
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Autonomous Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
            From Sev-1 alert to verified canary fix in 6 steps.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Unverified LLM output never touches production — every step is gated.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {HOW_IT_WORKS.map((step, idx) => {
            const Icon = step.icon;
            const isStepActive = pipelineStep === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`liquid-glass p-6 rounded-2xl shadow-xs space-y-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl relative group border-2 ${
                  isStepActive
                    ? `${step.borderColor} ring-2 ring-emerald-500/20 shadow-lg`
                    : 'border-[#D8D2C6] dark:border-white/20 hover:border-indigo-500/50 dark:hover:border-indigo-400/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      isStepActive
                        ? `${step.bgGlow} ${step.color} shadow-md scale-105`
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span
                    className={`text-xs font-mono font-bold transition-colors ${
                      isStepActive
                        ? step.color
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    STEP {step.step}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#181614] dark:text-white flex items-center gap-2">
                    <span>{step.title}</span>
                    {isStepActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </h3>
                  <div className={`text-[11px] font-mono font-semibold mt-0.5 ${step.color}`}>
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
      </section>

      {/* 7. Feature Grid */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50/60 dark:bg-black/40 border-y border-[#E8E3D9] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Enterprise Resilience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
              Engineered for high-velocity site reliability.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Rigorous safety checks, cryptographic auditability, and instant human overrides at every tier.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="liquid-glass p-6 rounded-2xl shadow-xs space-y-3 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/5 border-2 border-[#E8E3D9] dark:border-white/15 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#181614] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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

      {/* 8. Showcase Tabs */}
      <section id="showcase" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-2xl mx-auto"
        >
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Interactive Product Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
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
                  : 'bg-white dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 border border-[#E8E3D9] dark:border-white/10 hover:border-indigo-500'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <motion.div
          key={activeShowcaseTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="liquid-glass rounded-3xl border border-[#E8E3D9] dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xl"
        >
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#181614] dark:text-white">
              {SHOWCASE_TABS.find((t) => t.id === activeShowcaseTab)?.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {SHOWCASE_TABS.find((t) => t.id === activeShowcaseTab)?.desc}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0F19] text-slate-300 font-mono text-xs border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
              <span>Cluster Endpoint: https://api.somak.ai/v1/{activeShowcaseTab}</span>
              <span className="text-emerald-400">SSE Stream: Active</span>
            </div>

            {activeShowcaseTab === 'radar' && (
              <div className="space-y-2 text-[11px]">
                <div className="text-emerald-400 font-bold">14/14 Services Nominal • 0 Unhandled Outages</div>
                <div className="text-slate-400">auth-service (14ms) • billing-api (28ms) • stream-ingest (11ms)</div>
                <div className="text-indigo-400">Autonomous Monitor: Active 24/7 with zero threshold regressions</div>
              </div>
            )}

            {activeShowcaseTab === 'studio' && (
              <div className="space-y-2 text-[11px]">
                <div className="text-indigo-400 font-bold">Nemotron-3 550B AST Synthesis Sandbox: PASS</div>
                <div className="text-emerald-400">+12 lines modified • 0 syntax defects • 18/18 Jest tests passed</div>
                <div className="text-slate-400">Firecracker microVM #8841 destroyed safely with zero leaked artifacts</div>
              </div>
            )}

            {activeShowcaseTab === 'canary' && (
              <div className="space-y-2 text-[11px]">
                <div className="text-cyan-400 font-bold">Canary Stepped Promotion: 5% → 25% → 50% → 100% (COMPLETE)</div>
                <div className="text-emerald-400">Error rate: 0.00% • P99 Latency: 38ms • Burn rate: 0.0x</div>
                <div className="text-slate-400">Auto-Rollback Trigger: Inactive (nominal error parameters)</div>
              </div>
            )}

            {activeShowcaseTab === 'postmortem' && (
              <div className="space-y-2 text-[11px]">
                <div className="text-violet-400 font-bold">SOC-2 Type II Audit Log Recorded (SHA-256 Verified)</div>
                <div className="text-slate-300">Executive Incident Summary synthesized in 1.4s with root-cause graph</div>
                <div className="text-emerald-400">Runbook Pattern #2041 cataloged to prevent recurrence</div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* 9. Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 bg-slate-50/60 dark:bg-black/40 border-y border-[#E8E3D9] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Predictable Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
              Start free. Scale with confidence.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Free during public beta with full autonomous capabilities. No credit card required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`liquid-glass p-8 rounded-3xl shadow-lg space-y-6 flex flex-col justify-between relative group transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 ${
                  plan.highlighted
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'border-[#E8E3D9] dark:border-white/10 hover:border-indigo-500/40 dark:hover:border-indigo-400/40'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white uppercase tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#181614] dark:text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#181614] dark:text-white">{plan.price}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{plan.desc}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={
                    plan.name === 'Team'
                      ? '/checkout?plan=team&redirect=true'
                      : plan.name === 'Enterprise'
                      ? '/contact'
                      : '/signup'
                  }
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

      {/* 9B. 3-Step Autonomous Engine Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Remediation Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
            The 3-Step Autonomous Remediation Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto">
            From raw exception telemetry to validated canary rollout in under 30 seconds — zero human intervention required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 ease-out shadow-xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-[#181614] dark:text-white mb-2">Ingestion & Telemetry Triage</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
              Real-time ingestion of Sentry webhooks, Datadog traces, and Kubernetes event streams. Fingerprinting clusters error storms and discovers root causes instantly.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-emerald-400">✓ Deduplicated 1,420 events/sec</div>
              <div>Root: heap_out_of_memory</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 ease-out shadow-xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-[#181614] dark:text-white mb-2">AST-Safe Patch Synthesis</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
              Dual-stage Nemotron LLM synthesis generates targeted diffs verified against abstract syntax tree rules in isolated sandboxes with zero host environment exposure.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-purple-400">✓ AST tree validated (0 syntax errs)</div>
              <div>Sandbox run: 14/14 tests pass</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 ease-out shadow-xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-[#181614] dark:text-white mb-2">Guarded Canary Rollout</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
              Traffic routes progressively: 5% → 25% → 50% → 100%. If latency spikes or error rate exceeds 0.5%, auto-rollback triggers instantaneously in &lt; 4 seconds.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-cyan-400">✓ Health: 99.8% (Target: &gt;99.5%)</div>
              <div>Rollout complete in 4m 12s</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 9C. Real Enterprise Architecture Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Multi-Tenant Security Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white leading-tight">
              Enterprise Data Isolation with BYOK Encryption
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              SOMAK AI is engineered for tier-1 regulated environments. Your code never leaves your defined tenancy, and integration keys are protected with envelope encryption.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181614] dark:text-white">Cryptographic Tenant Partitioning</h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400">Strict PostgreSQL multi-tenant isolation and server-side RBAC scoping on every query path.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181614] dark:text-white">Dual-Layer Envelope Encryption (BYOK)</h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400">Bring your own keys across AWS KMS, HashiCorp Vault, or Google Cloud KMS with per-tenant DEK wrapping.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181614] dark:text-white">Tamper-Proof Audit Logging</h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400">Append-only SHA-256 hash chains enforced by PostgreSQL triggers preventing history mutation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 dark:bg-[#0a0a0a] rounded-3xl border border-slate-800 dark:border-white/10 p-6 sm:p-8 font-mono text-xs shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] text-neutral-500 ml-2">security-boundary.audit.log</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">VERIFIED IMMUTABLE</span>
            </div>

            <div className="space-y-2 text-[11px] text-neutral-300">
              <div className="text-neutral-500"># Verifying tenant boundary isolation</div>
              <div className="text-indigo-400">&gt; GET /api/organizations/org_acme/incidents</div>
              <div className="text-emerald-400">&lt; 200 OK [Scope: org_acme, Count: 24]</div>
              <div className="text-indigo-400">&gt; GET /api/organizations/org_foreign/incidents</div>
              <div className="text-red-400">&lt; 404 Not Found [RBAC Policy Enforced]</div>
              <div className="text-neutral-500 pt-2"># Cryptographic Hash Chain Verification</div>
              <div className="text-neutral-400">Block 0492: prev=a8f9... curr=3b12... [MATCH]</div>
              <div className="text-neutral-400">Sandbox Isolation: network=none, env=cleared</div>
              <div className="text-emerald-400 font-bold pt-1">STATUS: ZERO LEAKAGE DETECTED</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 9D. Benchmark Comparison Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              <Gauge className="w-3.5 h-3.5" />
              <span>Benchmark Comparison</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181614] dark:text-white">
              Traditional On-Call vs SOMAK AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto">
              See the quantifiable difference between human-driven firefighting and deterministic autonomous remediation.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-white/[0.02]">
              <div className="col-span-5">Reliability Metric</div>
              <div className="col-span-3 text-center sm:text-left">Traditional SRE Team</div>
              <div className="col-span-4 text-emerald-600 dark:text-emerald-400 text-right sm:text-left">SOMAK AI Engine</div>
            </div>

            {[
              {
                metric: 'Mean Time to Remediation (MTTR)',
                traditional: '45 - 90 minutes',
                somak: '12 - 35 seconds',
                gain: '99.4% faster',
              },
              {
                metric: 'Human Alert Fatigue & Night Pages',
                traditional: '15 - 30 pages / week',
                somak: '0 pages (autonomous canary)',
                gain: '100% reduction',
              },
              {
                metric: 'AST Deterministic Verification',
                traditional: 'Manual review (unreliable)',
                somak: '100% AST formal validation',
                gain: 'Zero syntax regressions',
              },
              {
                metric: 'Canary Rollback Latency',
                traditional: '8 - 15 minutes (kubectl)',
                somak: '< 4 seconds automated',
                gain: 'Zero customer blast radius',
              },
              {
                metric: 'Monthly Downtime Cost Impact',
                traditional: '$48,000 - $180,000 / cluster',
                somak: '< $120 / month LLM tokens',
                gain: '99.7% cost savings',
              },
            ].map((row, i) => (
              <div
                key={row.metric}
                className={`grid grid-cols-12 p-4 sm:p-6 items-center text-xs ${
                  i % 2 === 1 ? 'bg-slate-50/50 dark:bg-white/[0.01]' : ''
                } border-b border-slate-100 dark:border-white/5 last:border-0`}
              >
                <div className="col-span-5 font-semibold text-slate-900 dark:text-white">
                  {row.metric}
                </div>
                <div className="col-span-3 text-slate-600 dark:text-neutral-400 font-mono text-center sm:text-left">
                  {row.traditional}
                </div>
                <div className="col-span-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right sm:text-left flex items-center justify-end sm:justify-between">
                  <span>{row.somak}</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] border border-emerald-500/20">
                    {row.gain}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 10. Final CTA Section */}
      <section className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
        {/* Soft atmospheric gradient glow behind final CTA */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[320px] sm:h-[440px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-emerald-500/10 dark:from-indigo-600/20 dark:via-purple-600/10 dark:to-emerald-600/15 blur-[140px] rounded-full pointer-events-none -z-10"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-[#0a0a0a] p-10 sm:p-16 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300"
        >
          {/* Faint internal dot-grid texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"
          />

          <div className="w-14 h-14 rounded-2xl bg-black border border-white/15 p-2.5 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 relative z-10">
            <img src="/somak-ai-icon-transparent.png" alt="SOMAK AI" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181614] dark:text-white max-w-2xl mx-auto relative z-10">
            Ready to eliminate 3 AM pages forever?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-xl mx-auto relative z-10 leading-relaxed">
            Connect SOMAK AI to your telemetry in 5 minutes and see your first production incident resolved autonomously.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 btn-glow-primary"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" strokeWidth={1.75} />
              <span>Read Documentation</span>
            </Link>
          </div>

          <p className="text-xs text-neutral-500 font-mono relative z-10">
            Free during public beta • No credit card required • 5-minute setup
          </p>
        </motion.div>
      </section>

      {/* 10B. Large Capitalized Wordmark Banner */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-t border-white/10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[11vw] sm:text-[13vw] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 via-white/10 to-transparent pointer-events-none">
            SOMAK AI
          </div>
          <p className="text-xs sm:text-sm uppercase tracking-widest text-neutral-400 mt-2 font-mono">
            Autonomous Site Reliability & Production Self-Healing Platform
          </p>
        </div>
      </section>

      {/* 11. Footer (Render-Style Clean Multi-Column Layout) */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-16 text-xs text-slate-500 dark:text-neutral-400 bg-[#FAF8F5] dark:bg-[#070709] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-12 pb-12 border-b border-slate-200 dark:border-white/10">
            {/* Col 1 & 2: Brand Lockup & Summary */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/15 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-5 h-5 object-contain aspect-square" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  SOMAK AI
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                Autonomous zero-human-latency cloud SRE. Ingests crash telemetry, synthesizes AST hotfixes in Firecracker microVMs, and executes canary rollouts with auto-rollback.
              </p>
              <div className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                © {new Date().getFullYear()} SOMAK AI Inc. All rights reserved.
              </div>
            </div>

            {/* Col 3: Product & Resources */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Platform
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    System Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Compliance */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Trust &amp; Security
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/soc-audit" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Security &amp; Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 5: Company & Contact */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Contact
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Pricing Plans
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Live Demo
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
            <div>
              Deterministic AST Verification · Zero Customer Blast Radius
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
