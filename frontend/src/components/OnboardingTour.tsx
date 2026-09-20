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
} from 'lucide-react';

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
        'When an incident triggers, SentryOps diagnoses the root cause using web intelligence and synthesizes verified AST patches inside isolated sandboxes.',
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Step indicators & Close */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Product Tour
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${step.badgeColor}`}>
                  {step.badge}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      aria-label={`Jump to step ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentStep
                          ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                          : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleClose}
                  aria-label="Close tour"
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                  <StepIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {step.description}
              </p>

              {/* Feature Highlights */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Capabilities
                </div>
                {step.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => jumpToScreen(step.route)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <span>Navigate to this screen</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}

                <button
                  onClick={nextStep}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
