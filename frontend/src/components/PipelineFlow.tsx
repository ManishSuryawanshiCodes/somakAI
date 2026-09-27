'use client';

import React from 'react';
import { AlertCircle, Webhook, BrainCircuit, Box, Gauge, Check, Rocket, ExternalLink, GitPullRequest } from 'lucide-react';

export type PipelineStep = 'crash' | 'webhook' | 'synthesis' | 'sandbox' | 'canary' | 'deployed';

export interface DeployedMetadata {
  commitSha?: string;
  prUrl?: string;
  prNumber?: number;
  deploymentUrl?: string;
  status?: string;
}

interface PipelineFlowProps {
  currentStep?: PipelineStep;
  className?: string;
  compact?: boolean;
  deployedData?: DeployedMetadata;
}

const steps: { id: PipelineStep; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: 'crash', label: 'Production Crash', shortLabel: 'Crash', icon: AlertCircle },
  { id: 'webhook', label: 'Sentry Webhook', shortLabel: 'Webhook', icon: Webhook },
  { id: 'synthesis', label: 'AI Synthesis', shortLabel: 'Synthesis', icon: BrainCircuit },
  { id: 'sandbox', label: 'MicroVM Sandbox', shortLabel: 'Sandbox', icon: Box },
  { id: 'canary', label: 'Canary (5% → 100%)', shortLabel: 'Canary', icon: Gauge },
  { id: 'deployed', label: 'Production Deployed', shortLabel: 'Deployed', icon: Rocket },
];

export default function PipelineFlow({
  currentStep = 'synthesis',
  className = '',
  compact = false,
  deployedData,
}: PipelineFlowProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-2 ${className}`}>
      <div className="flex items-center justify-between min-w-[620px] max-w-5xl mx-auto px-1">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/5'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-medium tracking-tight ${
                        isCurrent
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : isCompleted
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {compact ? step.shortLabel : step.label}
                    </span>

                    {/* Show commit SHA or PR tag on Deployed stage if available */}
                    {step.id === 'deployed' && deployedData?.commitSha && (
                      <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        #{deployedData.commitSha}
                      </span>
                    )}
                  </div>

                  {isCurrent && (
                    <div className="flex items-center gap-1.5 -mt-0.5">
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        Active
                      </span>
                      {step.id === 'deployed' && deployedData?.prUrl && (
                        <a
                          href={deployedData.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline inline-flex items-center gap-0.5"
                        >
                          <GitPullRequest className="w-2.5 h-2.5" />
                          <span>PR #{deployedData.prNumber || 142}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {!isCurrent && isCompleted && step.id === 'deployed' && deployedData?.deploymentUrl && (
                    <a
                      href={deployedData.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 -mt-0.5"
                    >
                      <span>Live</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[1.5px] mx-2 transition-colors ${
                    idx < currentIndex
                      ? 'bg-emerald-500/40'
                      : idx === currentIndex
                      ? 'bg-indigo-500/40'
                      : 'bg-slate-200 dark:bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
