'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Search, GitBranch, Play, ChevronDown, ChevronUp, Check, Cpu, RefreshCw } from 'lucide-react';

interface ReasoningTreeProps {
  currentStep?: number;
  incidentId?: string;
}

export default function ReasoningTree({ currentStep = 4, incidentId }: ReasoningTreeProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(currentStep);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const steps = [
    {
      icon: Zap,
      title: 'Triage & Log Fingerprinting',
      desc: 'NVIDIA Nemotron-3-Nano extracted stack signature ERR_EVENTEMITTER_LEAK and flagged src/services/tokenService.ts as SEV-1 root.',
      duration: '0.4s',
      model: 'Nemotron-3-Nano (30B)',
      statusText: 'Classified SEV-1',
    },
    {
      icon: Search,
      title: 'Context Grounding via Tavily',
      desc: 'Tavily Search queried 3 official Node.js diagnostic docs for unbounded Map memory exhaustion patterns & TTL cache remedies.',
      duration: '1.2s',
      model: 'Tavily API v2',
      statusText: '3 Citations Grounded',
    },
    {
      icon: GitBranch,
      title: 'AST Hotfix Synthesis',
      desc: 'NVIDIA Nemotron-3-Ultra synthesized surgical AST patch replacing Map with bounded LRU/TTL Cache and generated Jest test spec.',
      duration: '3.8s',
      model: 'Nemotron-3-Ultra (550B)',
      statusText: 'AST Verified',
    },
    {
      icon: Play,
      title: 'Nebius Sandbox & Self-Correction',
      desc: 'Container sandbox sbx-8841 executed full reproduction test suite. Self-correction loop auto-disposed listeners: 14/14 passed.',
      duration: '4.2s',
      model: 'Nebius Token Sandbox',
      statusText: 'Exit Code 0',
    },
  ];

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
            {isStreaming ? `Step ${Math.min(activeStep + 1, 4)} / 4` : 'Self-Corrected (Exit 0)'}
          </span>
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
                          isCompleted
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
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`text-[11px] font-semibold ${
                              isCompleted
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
