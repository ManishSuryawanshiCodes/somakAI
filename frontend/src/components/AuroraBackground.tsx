"use client";

import React from 'react';

export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Base Layer Radial Depth */}
      <div className="absolute inset-0 bg-[#FAF8F5] dark:bg-[#0A0A0A] transition-colors duration-300" />

      {/* Aurora Drifting Blob 1: Deep Indigo & Cyan */}
      <div
        className="absolute -top-32 left-1/4 w-[640px] h-[640px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-cyan-500/10 to-transparent dark:from-indigo-600/15 dark:via-cyan-500/10 dark:to-transparent blur-[130px] animate-aurora-1 opacity-80 dark:opacity-75"
      />

      {/* Aurora Drifting Blob 2: Soft Violet & Rose */}
      <div
        className="absolute top-1/3 -right-24 w-[580px] h-[580px] rounded-full bg-gradient-to-bl from-purple-500/15 via-violet-500/12 to-transparent dark:from-violet-600/15 dark:via-purple-800/10 dark:to-transparent blur-[140px] animate-aurora-2 opacity-75 dark:opacity-75"
      />

      {/* Aurora Drifting Blob 3: Soft Emerald / Teal Caustic */}
      <div
        className="absolute -bottom-32 left-1/3 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-emerald-500/12 to-teal-500/10 dark:from-emerald-500/12 dark:to-teal-600/10 blur-[130px] animate-aurora-3 opacity-70 dark:opacity-70"
      />

      {/* Ambient radial mesh highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(235,225,205,0.4),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(10,10,10,0))]" />
    </div>
  );
}
