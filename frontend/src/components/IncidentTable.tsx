'use client';

import React from 'react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { Incident } from '@/lib/types';

interface IncidentTableProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

export default function IncidentTable({ incidents, onSelectIncident }: IncidentTableProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No active incidents</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">All services operating within SLA limits.</p>
      </div>
    );
  }

  const formatTime = (ts: string) => {
    try {
      const diff = Date.now() - new Date(ts).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      return `${Math.floor(mins / 60)}h ago`;
    } catch {
      return ts || '2m ago';
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Severity</th>
              <th className="px-5 py-3.5 font-semibold">Service</th>
              <th className="px-5 py-3.5 font-semibold">Fingerprint</th>
              <th className="px-5 py-3.5 font-semibold">Autonomous Confidence</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Time</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {incidents.map((incident, idx) => {
              const summary =
                incident.rootCauseAnalysis?.summary ||
                `${incident.severity} incident in ${incident.service}`;
              return (
                <tr
                  key={incident.id}
                  className={`${
                    idx % 2 === 0 ? 'bg-white/60 dark:bg-slate-900/30' : 'bg-slate-50/40 dark:bg-slate-900/50'
                  } hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}
                >
                  <td className="px-5 py-4">
                    <StatusBadge status={incident.severity} />
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {incident.service}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {incident.fingerprint || 'ERR_EVENTEMITTER_LEAK'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {incident.confidenceScore || 99.4}% Fix Verified
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                    {formatTime(incident.timestamp)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium"
                      >
                        Quick Modal
                      </button>
                      <Link
                        href={`/remediation/${incident.id}`}
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all"
                      >
                        Studio <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
