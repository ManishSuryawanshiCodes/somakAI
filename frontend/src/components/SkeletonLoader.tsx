"use client";

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card';
  count?: number;
}

export default function SkeletonLoader({
  className = '',
  variant = 'rect',
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 w-3/4 rounded-md';
      case 'circle':
        return 'w-10 h-10 rounded-full';
      case 'card':
        return 'h-36 w-full rounded-2xl';
      default:
        return 'h-6 w-full rounded-lg';
    }
  };

  return (
    <>
      {items.map((key) => (
        <div
          key={key}
          className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${getVariantClasses()} ${className}`}
        />
      ))}
    </>
  );
}

export function RadarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 p-4 space-y-3">
            <div className="h-3 w-1/2 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-8 w-3/4 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="h-2 w-full bg-slate-300/60 dark:bg-slate-700/60 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid: Telemetry & Topology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-96 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60 p-6 space-y-4">
          <div className="h-4 w-1/3 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="h-72 w-full bg-slate-300/50 dark:bg-slate-700/40 rounded-xl" />
        </div>
        <div className="lg:col-span-5 h-96 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60 p-6 space-y-4">
          <div className="h-4 w-1/3 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="h-72 w-full bg-slate-300/50 dark:bg-slate-700/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StudioSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-5 space-y-4">
        <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        <div className="h-72 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
      </div>
      <div className="lg:col-span-7 space-y-4">
        <div className="h-96 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        <div className="h-40 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}
