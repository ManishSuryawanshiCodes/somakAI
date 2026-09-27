'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  severity?: string;
  confidence?: number | string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({
  status,
  severity,
  confidence,
  size = 'sm',
  className = '',
}: StatusBadgeProps) {
  let dotColor = 'bg-slate-400';
  let badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10';
  let pulse = false;
  let label = status;

  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  switch (normalized) {
    case 'SEV-1':
    case 'SEV_1':
    case 'CRITICAL':
      dotColor = 'bg-rose-500';
      badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
      pulse = true;
      label = 'SEV-1 Critical';
      break;
    case 'SEV-2':
    case 'SEV_2':
    case 'WARNING':
      dotColor = 'bg-amber-500';
      badgeStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
      label = 'SEV-2 Warning';
      break;
    case 'TRIAGING':
      dotColor = 'bg-slate-400';
      badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10';
      pulse = true;
      label = 'Triaging';
      break;
    case 'INVESTIGATING':
      dotColor = 'bg-slate-400';
      badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10';
      pulse = true;
      label = 'Investigating';
      break;
    case 'SANDBOX_VERIFYING':
      dotColor = 'bg-slate-400';
      badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10';
      pulse = true;
      label = 'Verifying in Sandbox';
      break;
    case 'READY_FOR_DEPLOY':
      dotColor = 'bg-emerald-500';
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      label = 'Ready to deploy';
      break;
    case 'DEPLOYED':
      dotColor = 'bg-emerald-500';
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
      label = 'Deployed';
      break;
    case 'CONFIDENCE':
      dotColor = 'bg-emerald-500';
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      label = 'Verified';
      break;
    case 'AST_VALIDATED':
      dotColor = 'bg-emerald-500';
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      label = 'AST Validated';
      break;
    case 'NEEDS_HUMAN_REVIEW':
    case 'ACTION_NEEDED':
      dotColor = 'bg-rose-500';
      badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
      pulse = true;
      label = 'Needs review';
      break;
    case 'FAILED':
      dotColor = 'bg-rose-500';
      badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
      label = 'Failed';
      break;
    case 'NOMINAL':
    case 'HEALTHY':
      dotColor = 'bg-emerald-500';
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      label = 'Nominal';
      break;
    case 'CANCELLED':
      dotColor = 'bg-slate-400';
      badgeStyle = 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10';
      label = 'Cancelled';
      break;
    default:
      label = status.replace(/_/g, ' ');
      break;
  }

  // Combine severity if provided
  let fullLabel = label;
  if (severity && !fullLabel.toLowerCase().includes(severity.toLowerCase())) {
    fullLabel = `${severity} · ${fullLabel}`;
  }
  if (confidence !== undefined && confidence !== null) {
    const formattedConf = typeof confidence === 'number' ? `${confidence}%` : confidence;
    fullLabel = `${fullLabel} · ${formattedConf}`;
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${badgeStyle} ${className} transition-colors select-none`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
      </span>
      <span>{fullLabel}</span>
    </span>
  );
}
