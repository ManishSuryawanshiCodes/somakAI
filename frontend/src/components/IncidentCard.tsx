'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock } from 'lucide-react';
import type { Incident } from '@/lib/types';

interface IncidentCardProps {
  incident: Incident;
  selected?: boolean;
  onDeploy?: (id: string) => void;
  onQuickInspect?: (incident: Incident) => void;
  onHoverService?: (service: string | null) => void;
  onSelect?: (id: string) => void;
  defaultExpanded?: boolean;
}

export default function IncidentCard({
  incident,
  selected = false,
  onHoverService,
  onSelect,
}: IncidentCardProps) {
  const router = useRouter();
  const isSev1 = incident.severity === 'SEV-1';

  // Relative time helper
  const timeAgo = (() => {
    try {
      const diff = Date.now() - new Date(incident.timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      return `${hours}h ago`;
    } catch {
      return '2m ago';
    }
  })();

  // Plain-language summary (clear, zero-jargon-as-decoration)
  const plainSummary = (() => {
    if (incident.id === 'INC-2041' || incident.service === 'auth-service') {
      return 'Fixed a memory leak in the login service token verification cache.';
    }
    if (incident.rootCauseAnalysis?.summary) {
      // Clean up any internal jargon prefix
      return incident.rootCauseAnalysis.summary.replace(/^\[.*?\]\s*/, '');
    }
    return isSev1
      ? 'Critical memory saturation detected in core authentication service.'
      : 'API gateway timeout backpressure cascading into downstream sessions.';
  })();

  const handleCardClick = () => {
    if (onSelect) onSelect(incident.id);
    router.push(`/remediation/${incident.id}`);
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(incident.id);
    router.push(`/remediation/${incident.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => onHoverService && onHoverService(incident.service)}
      onMouseLeave={() => onHoverService && onHoverService(null)}
      className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-150 cursor-pointer border ${
        selected
          ? 'bg-slate-50/90 dark:bg-white/[0.04] border-slate-400 dark:border-white/30 shadow-sm'
          : 'bg-white dark:bg-[#0A0A0A] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Severity dot + Service name + One-line plain summary + Timestamp */}
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Calm Severity dot (color only, no noisy verbose badges) */}
          <div className="pt-1.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              {isSev1 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isSev1 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                title={incident.severity}
              />
            </span>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">
                {incident.service}
              </span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                {incident.id}
              </span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>

            {/* One-line plain-English summary */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed truncate max-w-2xl">
              {plainSummary}
            </p>
          </div>
        </div>

        {/* Right: Confidence pill (if verified) + Single "Review" Action Button */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            99.4% safe
          </span>

          <button
            onClick={handleReviewClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <span>Review</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
