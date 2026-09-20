'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  LineChart,
  Network,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ArrowDown,
} from 'lucide-react';

interface RadarSubNavProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  readyDeployCount?: number;
  atRiskSloCount?: number;
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'telemetry', label: 'Telemetry Ingestion', icon: LineChart },
  { id: 'topology', label: 'Microservice Topology', icon: Network },
  { id: 'queue', label: 'Incident Queue', icon: AlertTriangle, badge: '2' },
];

export default function RadarSubNav({
  activeSection,
  onNavigate,
  readyDeployCount = 2,
  atRiskSloCount = 1,
}: RadarSubNavProps) {
  return (
    <nav
      aria-label="Section Navigation"
      className="sticky top-14 z-20 w-full bg-slate-50 dark:bg-[#090D16] md:bg-slate-50/90 md:dark:bg-[#090D16]/90 backdrop-blur-none md:backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors"
    >
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Section Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none snap-x py-0.5 max-w-full">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => onNavigate(sec.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all snap-start ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRadarSection"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{sec.label}</span>
                  {sec.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                          : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: "Needs Your Attention" Sticky Action Strip */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="font-semibold text-[11px] hidden sm:inline">Needs Attention:</span>
            <span className="font-medium text-[11px]">
              <strong className="font-bold">{readyDeployCount}</strong> ready for deploy · <strong className="font-bold">{atRiskSloCount}</strong> SLO at risk
            </span>
            <button
              onClick={() => onNavigate('queue')}
              className="ml-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-0.5"
            >
              <span>Queue</span>
              <ArrowDown className="w-3 h-3" />
            </button>
            <span className="text-rose-300 dark:text-rose-700">|</span>
            <Link
              href="/slo"
              className="text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-0.5"
            >
              <span>SLO</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
