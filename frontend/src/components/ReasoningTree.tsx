'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Search, GitBranch, Play, ChevronDown, ChevronUp, Check, Cpu, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Incident } from '@/lib/types';

interface ReasoningTreeProps {
  currentStep?: number;
  incidentId?: string;
  incident?: Incident;
}

export default function ReasoningTree({ currentStep = 4, incidentId, incident }: ReasoningTreeProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(currentStep);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Derive steps dynamically from incident if available, or use defaults
  const triageModelName = incident?.model_display_name || incident?.triage_model?.split('/')?.pop()?.replace(/-/g, ' ') || 'Nemotron-3-Super (120B)';
  const synthModelName = incident?.model_display_name || incident?.synthesis_model?.split('/')?.pop()?.replace(/-/g, ' ') || 'Nemotron-3-Ultra (550B)';

  const defaultSteps = [
    {
      icon: Zap,
      title: 'Triage & Log Fingerprinting',
      desc: incident?.triage_model 
        ? `${incident.triage_model.split('/').pop()} extracted stack signature and classified root cause as ${incident.severity} on ${incident.service}.`
        : 'NVIDIA Nemotron-3-Super extracted stack signature ERR_EVENTEMITTER_LEAK and flagged src/services/tokenService.ts as SEV-1 root.',
      duration: '0.4s',
      model: triageModelName,
      statusText: `Classified ${incident?.severity || 'SEV-1'}`,
      fallback: incident?.fallback_occurred && (incident?.triage_source === 'server_fallback' || incident?.triage_source === 'simulated'),
      fallbackMessage: incident?.fallback_message,
    },
    {
      icon: Search,
      title: 'Context Grounding via Tavily',
      desc: incident?.rootCauseAnalysis?.tavilyCitations
        ? `Tavily Search queried ${incident.rootCauseAnalysis.tavilyCitations.length} official diagnostic references for memory exhaustion patterns & TTL cache remedies.`
        : 'Tavily Search queried 3 official Node.js diagnostic docs for unbounded Map memory exhaustion patterns & TTL cache remedies.',
      duration: '1.2s',
      model: 'Tavily API v2',
      statusText: `${incident?.rootCauseAnalysis?.tavilyCitations?.length || 3} Citations Grounded`,
      fallback: false,
      fallbackMessage: undefined,
    },
    {
      icon: GitBranch,
      title: 'AST Hotfix Synthesis',
      desc: incident?.synthesis_model
        ? `${incident.synthesis_model.split('/').pop()} synthesized surgical AST patch replacing Map with bounded LRU/TTL Cache and generated Jest test spec.`
        : 'NVIDIA Nemotron-3-Ultra synthesized surgical AST patch replacing Map with bounded LRU/TTL Cache and generated Jest test spec.',
      duration: '3.8s',
      model: synthModelName,
      statusText: 'AST Verified',
      fallback: incident?.fallback_occurred && (incident?.synthesis_source === 'server_fallback' || incident?.synthesis_source === 'simulated'),
      fallbackMessage: incident?.fallback_message,
    },
    {
      icon: Play,
      title: 'Nebius Sandbox & Self-Correction',
      desc: `Container sandbox ${incident?.patch?.sandboxExecution?.sandboxId || 'sbx-8841'} executed full reproduction test suite. Self-correction loop: ${incident?.patch?.sandboxExecution?.testsPassed || 14}/${incident?.patch?.sandboxExecution?.totalTests || 14} passed.`,
      duration: '4.2s',
      model: 'Nebius Token Sandbox',
      statusText: 'Exit Code 0',
      fallback: false,
      fallbackMessage: undefined,
    },
  ];

  const stepIcons = [Zap, Search, GitBranch, Play];

  // If incident contains populated reasoning_steps, use them
  const steps = (incident?.reasoning_steps && incident.reasoning_steps.length > 0)
    ? incident.reasoning_steps.map((s, idx) => ({
        icon: stepIcons[idx % stepIcons.length],
        title: s.title,
        desc: s.desc,
        duration: s.duration,
        model: s.model,
        statusText: s.statusText,
        fallback: s.fallback,
        fallbackMessage: s.fallbackMessage,
      }))
    : defaultSteps;

  // Streaming replay function
  const triggerStreamingReplay = () => {
    setIsStreaming(true);
    setActiveStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step <= steps.length) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 900);
  };

  // Trigger streaming animation whenever active incident changes
  useEffect(() => {
    triggerStreamingReplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 select-none"
      >
        <div
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Autonomous Pipeline Reasoning Trace
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
            {isStreaming ? `Step ${Math.min(activeStep + 1, steps.length)} / ${steps.length}` : 'Self-Corrected (Exit 0)'}
          </span>
          {incident?.fallback_occurred && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Fallback Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Replay Streaming Button */}
          <button
            onClick={triggerStreamingReplay}
            disabled={isStreaming}
            title="Replay autonomous reasoning stream"
            aria-label="Replay reasoning trace"
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isStreaming ? 'animate-spin text-indigo-500' : ''}`} />
            <span className="hidden sm:inline">{isStreaming ? 'Streaming...' : 'Replay Trace'}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle reasoning accordion"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5"
          >
            {/* Fallback Graceful Degradation Notice */}
            {incident?.fallback_occurred && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    Resilient Provider Degradation Engaged
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      Zero Downtime
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {incident.fallback_message || 'Configured BYOK model was unreachable or exhausted quota. Somak AI seamlessly degraded to Platform Nebius Nemotron without interrupting incident remediation.'}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="relative">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = activeStep > idx;
                const isActive = activeStep === idx && isStreaming;
                const isPending = activeStep < idx;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isPending ? 0.45 : 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-4 mb-5 last:mb-0 relative z-10"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center relative shadow-xs transition-colors ${
                          step.fallback
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                            : isCompleted
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isActive
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isActive ? (
                          <div className="relative flex items-center justify-center">
                            <span className="absolute w-6 h-6 rounded-xl bg-indigo-500/30 animate-ping pointer-events-none" />
                            <span className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : isCompleted ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                          >
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                          </motion.div>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>

                      {idx < steps.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1.5 transition-colors duration-300 ${
                            isCompleted
                              ? 'bg-emerald-500/40'
                              : isActive
                              ? 'bg-indigo-500/40 animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      )}
                    </div>

                    <div className={`flex-1 ${isPending ? 'opacity-45' : 'opacity-100'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {step.title}
                            {isActive && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 animate-pulse">
                                Executing...
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {step.model}
                          </span>
                          {step.fallback && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Platform Fallback
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`text-[11px] font-semibold ${
                              step.fallback
                                ? 'text-amber-600 dark:text-amber-400'
                                : isCompleted
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isActive
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isActive ? 'Processing...' : step.statusText}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {step.duration}
                          </span>
                        </div>
                      </div>

                      <motion.p
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans"
                      >
                        {step.desc}
                      </motion.p>
                      {step.fallback && step.fallbackMessage && (
                        <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-400/90 font-mono italic">
                          ↳ {step.fallbackMessage}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
