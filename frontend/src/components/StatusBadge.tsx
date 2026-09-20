'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  let bgColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let pulse = false;
  let label = status;

  switch (status.toUpperCase()) {
    case 'SEV-1':
      bgColor = 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25';
      pulse = true;
      label = 'SEV-1 Critical';
      break;
    case 'SEV-2':
      bgColor = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
      label = 'SEV-2 Warning';
      break;
    case 'TRIAGING':
      bgColor = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25';
      pulse = true;
      label = 'Triaging (Nano 30B)';
      break;
    case 'INVESTIGATING':
      bgColor = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25';
      pulse = true;
      label = 'Investigating (Tavily)';
      break;
    case 'SANDBOX_VERIFYING':
      bgColor = 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25';
      pulse = true;
      label = 'Sandbox Verifying';
      break;
    case 'READY_FOR_DEPLOY':
      bgColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      label = 'Ready for Deploy';
      break;
    case 'DEPLOYED':
      bgColor = 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/30';
      label = 'Canary Deployed';
      break;
    case 'CONFIDENCE':
      bgColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      label = '99.4% Fix Verified';
      break;
    case 'AST_VALIDATED':
      bgColor = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25';
      label = 'AST Validated';
      break;
    default:
      break;
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${padding} ${bgColor} transition-colors select-none`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {label}
    </span>
  );
}
