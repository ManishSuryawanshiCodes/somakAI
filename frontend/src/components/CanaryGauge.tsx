'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface CanaryGaugeProps {
  percentage: number;
  label?: string;
  onChange?: (newPct: number) => void;
  interactive?: boolean;
  showPresets?: boolean;
  showDescription?: boolean;
}

export function getRiskLevel(pct: number) {
  if (pct <= 10) {
    return {
      level: 'Low Risk',
      color: '#10B981', // emerald
      bgClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      borderGlow: 'rgba(16, 185, 129, 0.25)',
      description: 'Isolated sandbox canary split (5%). Low blast exposure.',
      icon: ShieldCheck,
    };
  }
  if (pct <= 30) {
    return {
      level: 'Guarded',
      color: '#06B6D4', // cyan
      bgClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
      dotClass: 'bg-cyan-500',
      borderGlow: 'rgba(6, 182, 212, 0.25)',
      description: 'Controlled cohort expansion. Guardrails active.',
      icon: Zap,
    };
  }
  if (pct <= 60) {
    return {
      level: 'Moderate Risk',
      color: '#F59E0B', // amber
      bgClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      dotClass: 'bg-amber-500',
      borderGlow: 'rgba(245, 158, 11, 0.3)',
      description: '50% blast radius. Reversion latency ~800ms.',
      icon: AlertTriangle,
    };
  }
  if (pct <= 85) {
    return {
      level: 'Elevated Risk',
      color: '#F97316', // orange
      bgClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
      dotClass: 'bg-orange-500',
      borderGlow: 'rgba(249, 115, 22, 0.35)',
      description: 'Majority production traffic routed to hotfix.',
      icon: AlertTriangle,
    };
  }
  return {
    level: 'Critical Exposure (100%)',
    color: '#EF4444', // crimson
    bgClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    dotClass: 'bg-red-500',
    borderGlow: 'rgba(239, 68, 68, 0.4)',
    description: 'Full production traffic active. Baseline draining.',
    icon: ShieldAlert,
  };
}

export default function CanaryGauge({
  percentage,
  label = 'Canary Hotfix Traffic Split',
  onChange,
  interactive = true,
  showPresets = true,
  showDescription = true,
}: CanaryGaugeProps) {
  const baseline = Math.max(0, 100 - percentage);
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const canaryDash = (percentage / 100) * circumference;

  const risk = getRiskLevel(percentage);
  const RiskIcon = risk.icon;
  const presets = [5, 25, 50, 100];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[340px] mx-auto p-2 select-none">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Pulsing particles around the circle matching dynamic risk color */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.6, 0.25] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-40 h-40 rounded-full border"
            style={{ borderColor: risk.borderGlow }}
          />
          <motion.div
            animate={{ scale: [1, 1.16, 1], opacity: [0.1, 0.35, 0.1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
            className="w-44 h-44 rounded-full border"
            style={{ borderColor: risk.borderGlow }}
          />
        </div>

        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Baseline track (gray) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800"
          />
          {/* Canary fill with Dynamic Risk Color Shift */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={risk.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - canaryDash,
              stroke: risk.color,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Readout with dynamic risk badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={percentage}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            {percentage}%
          </motion.span>
          
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: risk.color }}
            />
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider transition-colors"
              style={{ color: risk.color }}
            >
              Canary Pods
            </span>
          </div>

          <div
            className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors ${risk.bgClass}`}
          >
            <RiskIcon className="w-2.5 h-2.5" />
            <span>{risk.level}</span>
          </div>
        </div>
      </div>

      {/* Breakdown Readout */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shadow-xs transition-colors"
            style={{ backgroundColor: risk.color }}
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Canary:</span>
          <span
            className="font-mono font-bold transition-colors"
            style={{ color: risk.color }}
          >
            {percentage}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Baseline:</span>
          <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{baseline}%</span>
        </div>
      </div>

      {/* Dynamic Risk Description */}
      {showDescription && (
        <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          {risk.description}
        </div>
      )}

      {/* Interactive Drag & Preset Controls */}
      {interactive && showPresets && onChange && (
        <div className="mt-3 w-full flex flex-col gap-2.5">
          {/* Native range slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={percentage}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: risk.color }}
            />
          </div>

          {/* Quick preset chips with risk feedback */}
          <div className="flex items-center justify-between gap-1.5">
            {presets.map((pct) => {
              const pRisk = getRiskLevel(pct);
              const isSelected = percentage === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onChange(pct)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                  }`}
                  style={{
                    backgroundColor: isSelected ? pRisk.color : undefined,
                    borderColor: isSelected ? pRisk.color : undefined,
                  }}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      {label && (
        <span className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
