'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  CreditCard,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Suspense } from 'react';
import TopNav from '@/components/TopNav';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/components/ToastProvider';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams?.get('plan') || 'team';
  const sessionId = searchParams?.get('session_id') || `dodo_${Date.now()}`;
  const { currentOrg, updateOrgPlan } = useOrg();
  const { addToast } = useToast();
  const [upgraded, setUpgraded] = useState(false);

  useEffect(() => {
    if (plan === 'team' || plan === 'business') {
      updateOrgPlan('team').then(() => {
        setUpgraded(true);
        addToast('Organization upgraded to Team Plan. 25 seats and autonomous canary gates active.', 'success');
      });
    }
  }, [plan, updateOrgPlan, addToast]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg w-full bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Success Badge */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              Payment Successful
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome to SOMAK AI Team
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your subscription via Dodo Payments is active. Autonomous canary rollouts and 25 seats are unlocked.
            </p>
          </div>

          {/* Plan Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-left space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-white/5">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {plan.toUpperCase()} Plan Subscription
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ref: {sessionId.substring(0, 20)}...
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  $79 / seat
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Monthly recurring
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>25 Team Seats</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Canary Gates</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audit Log</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
                <span>Dodo Portal Sync</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>Go to Incident Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/settings?tab=billing"
              className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Billing & Customer Portal in Settings</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A]" />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
