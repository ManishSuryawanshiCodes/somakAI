'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import TopNav from '@/components/TopNav';

export default function PricingPage() {
  const router = useRouter();

  const handleCheckoutTeam = () => {
    router.push('/checkout?plan=team&redirect=true');
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-10 pb-24">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Radar</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400">
            Billing Powered by Dodo Payments
          </span>
        </div>

        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Autonomous 3 AM incident response. Upgrade to unlock full canary rollouts and multi-seat access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Developer / Free Tier */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Developer</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">$0</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Free during development with community support.</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1 team seat</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>500,000 monthly tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>25 MicroVM sandbox runs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Community Discord support</span>
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition-colors"
            >
              Start Free with SOMAK
            </Link>
          </div>

          {/* Team Tier (Dodo Payments $79) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111113] border-2 border-indigo-500 shadow-md flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Most Popular
            </span>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Team</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">$79</span>
                  <span className="text-xs text-slate-400">/ seat / month</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Autonomous canary rollouts and compliance for scaling SRE teams.</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to 25 team members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Autonomous canary gates (5% &rarr; 100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Nemotron-3 550B MoE synthesis engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Slack & PagerDuty live escalation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>SOC-2 Type II tamper-evident audit log</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckoutTeam}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Start Free Trial (Dodo Checkout)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Enterprise</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">Custom</span>
                  <span className="text-xs text-slate-400">/ annually</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Dedicated microVM clusters, custom SLA, and 24/7 on-call.</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited team seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Dedicated Firecracker private cluster</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>SAML 2.0 / Okta SSO & SCIM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>99.99% platform uptime SLA</span>
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
