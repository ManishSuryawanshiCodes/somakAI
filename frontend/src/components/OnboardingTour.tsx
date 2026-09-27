"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  Terminal,
  Gauge,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  GitBranch,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface OnboardingTourProps {
  isOpen?: boolean;
  onClose?: () => void;
  incidentId?: string;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  route: string;
  badge: string;
  badgeColor: string;
}

export default function OnboardingTour({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  incidentId = 'INC-2041',
}: OnboardingTourProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (!isControlled) {
      try {
        const completed = localStorage.getItem('sentryops_tour_completed');
        if (!completed) {
          const timer = setTimeout(() => setInternalIsOpen(true), 1200);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [isControlled]);

  const handleClose = () => {
    try {
      localStorage.setItem('sentryops_tour_completed', 'true');
    } catch {}
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const steps: TourStep[] = [
    {
      title: 'Executive Incident Radar',
      subtitle: 'Continuous Cloud Telemetry & Blast Radius Map',
      description:
        'Your 24/7 command center. Live ingestion monitors V8 heap thresholds, P99 latencies, and service topology to instantly detect critical Sev-1/Sev-2 incidents.',
      features: [
        'Interactive SVG microservice topology with real-time health rings',
        'Dual-axis latency & memory telemetry charts with spike markers',
        'One-click Sev-1 simulation engine for chaos testing',
      ],
      icon: Radar,
      route: '/',
      badge: 'Screen 1',
      badgeColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Autonomous Remediation Studio',
      subtitle: 'NVIDIA Nemotron-3 + Tavily AST Synthesis',
      description:
        'When an incident triggers, Somak AI diagnoses the root cause using web intelligence and synthesizes verified AST patches inside isolated sandboxes.',
      features: [
        'Dual-model reasoning trace (Ultra 550B & Nano 30B)',
        'Unified AST code diff viewer with syntax highlighting',
        '100% verified sandbox test runner with zero hallucination guarantee',
      ],
      icon: Terminal,
      route: `/remediation/${incidentId}`,
      badge: 'Screen 2',
      badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Live Canary Traffic Verification',
      subtitle: 'Zero-Downtime Safe Deployment with Hold-to-Confirm',
      description:
        'Safely roll out hotfixes to a fractional canary slice. Monitor live error rates against baseline traffic with an automated auto-promote timer and hold-to-rollback protection.',
      features: [
        'Dynamic risk color-shifting gauge (5% → 25% → 100%)',
        'Auto-promote countdown timer with live telemetry log ticker',
        '1.5-second hold-to-confirm emergency rollback safety switch',
      ],
      icon: Gauge,
      route: `/canary/${incidentId}`,
      badge: 'Screen 3',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'SOC-2 Post-Mortem & Audit Trail',
      subtitle: 'Audit-Ready Executive Reports & Scrubbable Timeline',
      description:
        'Every incident automatically compiles into a full compliance-ready post-mortem with root cause citations, interactive scrubbable timeline, and one-click PDF export.',
      features: [
        'SOC-2 / ISO 27001 review and sign-off state machine',
        'Interactive scrubbable sequence timeline with audio scrubber feel',
        'Historical MTTR reduction comparison (95.3% autonomous speedup)',
      ],
      icon: FileText,
      route: `/postmortem/${incidentId}`,
      badge: 'Screen 4',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Automated GitHub PR & Progressive Deploy',
      subtitle: 'One-click Commit → PR → Merge → Deployed to Production',
      description:
        'After canary verification passes at 100%, Somak AI commits the verified AST patch to a branch, opens a GitHub PR with diff and test results, and optionally auto-merges — all visible in real-time from the Canary Gate.',
      features: [
        'Branch commit: somak-ai/fix-<id> with full unified diff',
        'GitHub PR auto-opened with 18/18 MicroVM test evidence',
        'Live deploy status: PR Opened → Merged → Deployed with commit SHA',
      ],
      icon: GitBranch,
      route: `/canary/${incidentId}`,
      badge: 'Screen 5',
      badgeColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const jumpToScreen = (route: string) => {
    handleClose();
    router.push(route);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-xl"
      zIndex="z-[999]"
      showCloseOnBackdrop={true}
    >
      {/* Top Bar: Progress and Close */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Interactive Tour
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close tour"
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Progress Bar (Render Dashboard Style) */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Jump to step ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-indigo-600 dark:bg-indigo-400 shadow-xs'
                  : idx < currentStep
                  ? 'bg-indigo-600/40 dark:bg-indigo-400/40'
                  : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-7 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <StepIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border mb-1.5 ${step.badgeColor}`}>
              {step.badge}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {step.title}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {step.subtitle}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {step.description}
        </p>

        {/* Key Capabilities Pills */}
        <div className="space-y-2 pt-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Verified Engine Capabilities
          </div>
          <div className="space-y-1.5">
            {step.features.map((feat, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-4 bg-slate-50/80 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
        <button
          onClick={() => jumpToScreen(step.route)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
        >
          <span>Navigate to screen</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={nextStep}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
