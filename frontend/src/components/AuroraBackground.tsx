"use client";

import React from 'react';

export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Base Layer Radial Depth */}
      <div className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300" />

      {/* Aurora Drifting Blob 1: Deep Indigo */}
      <div
        className="absolute -top-32 left-1/4 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-indigo-500/20 to-indigo-600/10 dark:from-indigo-600/15 dark:to-indigo-500/5 blur-[120px] animate-aurora-1 opacity-80 dark:opacity-70"
      />

      {/* Aurora Drifting Blob 2: Soft Violet */}
      <div
        className="absolute top-1/3 -right-24 w-[560px] h-[560px] rounded-full bg-gradient-to-bl from-purple-500/20 via-violet-500/15 to-transparent dark:from-violet-600/12 dark:via-purple-700/8 dark:to-transparent blur-[140px] animate-aurora-2 opacity-75 dark:opacity-60"
      />

      {/* Aurora Drifting Blob 3: Soft Cyan / Teal */}
      <div
        className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-cyan-500/18 to-teal-500/10 dark:from-teal-600/10 dark:to-cyan-600/5 blur-[130px] animate-aurora-3 opacity-70 dark:opacity-50"
      />

      {/* Fine-grain porcelain ambient radial mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(99,102,241,0.03),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(9,13,22,0))]" />
    </div>
  );
}
