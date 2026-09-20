"use client";

import React from 'react';
import AuroraBackground from '@/components/AuroraBackground';
import ForbiddenCard from '@/components/ForbiddenCard';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/25">
      <AuroraBackground />
      <ForbiddenCard
        requiredRole="Operator"
        actionName="access production deployment and hotfix capabilities"
      />
    </div>
  );
}
