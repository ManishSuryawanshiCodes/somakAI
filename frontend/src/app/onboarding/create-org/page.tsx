"use client";

import React, { useState, useEffect, useId, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  Users,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import { checkSlugAvailability } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { CustomSelect } from '@/components/CustomSelect';

function CreateOrgContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const { user } = useAuth();
  const { createOrg, updateOrgPlan } = useOrg();

  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [teamSize, setTeamSize] = useState('2-10');
  const [primaryUseCase, setPrimaryUseCase] = useState('Autonomous Incident Remediation');
  const [plan, setPlan] = useState<'free' | 'team' | 'enterprise'>(
    planParam === 'team' || planParam === 'enterprise' ? planParam : 'free'
  );

  const [slugChecking, setSlugChecking] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-slug generation from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrgName(val);
    if (!isSlugCustomized) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugCustomized(true);
    setSlug(generateSlug(e.target.value));
  };

  // Debounced check for slug uniqueness
  useEffect(() => {
    if (!slug) {
      setIsSlugAvailable(null);
      setSlugMessage('');
      return;
    }

    setSlugChecking(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(slug);
        if (res) {
          setIsSlugAvailable(res.available);
          if (res.available) {
            setSlugMessage('Domain slug is available');
          } else {
            setSlugMessage(res.suggestion ? `Already taken. Suggestion: ${res.suggestion}` : 'Slug is already in use');
          }
        } else {
          // Fallback if backend offline
          setIsSlugAvailable(true);
          setSlugMessage('Domain slug is available');
        }
      } catch {
        setIsSlugAvailable(true);
      } finally {
        setSlugChecking(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !slug.trim()) {
      setError('Please provide an organization name and slug.');
      return;
    }
    if (isSlugAvailable === false) {
      setError('Please choose an available organization slug.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createOrg({
        name: orgName.trim(),
        slug: slug.trim(),
        team_size: teamSize,
        primary_use_case: primaryUseCase,
      });

      if (plan !== 'free') {
        try {
          await updateOrgPlan(plan);
        } catch (planErr) {
          console.warn('Failed to persist plan:', planErr);
        }
      }

      analytics.track('org_created', {
        org_id: slug.trim(),
        slug: slug.trim(),
        team_size: teamSize,
      });

      analytics.track('plan_selected', {
        plan,
        org_id: slug.trim(),
        slug: slug.trim(),
        team_size: teamSize,
      });

      try {
        localStorage.setItem('somak_onboarding_completed', 'true');
        localStorage.setItem('sentryops_onboarding_completed', 'true');
      } catch {}

      // Route paid to Dodo checkout, enterprise to contact, or free directly to Dashboard
      setTimeout(() => {
        if (plan === 'team') {
          router.push(`/checkout?plan=team&org=${encodeURIComponent(slug.trim())}`);
        } else if (plan === 'enterprise') {
          router.push(`/contact?plan=enterprise&org=${encodeURIComponent(slug.trim())}`);
        } else {
          router.push('/');
        }
      }, 400);
    } catch (err: any) {
      setError(err?.message || 'Failed to create organization. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Back to Radar Navigation */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>
      </div>

      {/* Brand & Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-1 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-7 h-7 object-contain aspect-square" />
          </div>
          <span className="font-mono font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            SOMAK AI
          </span>
        </Link>
        <div className="flex justify-center mb-3">
          <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900">
            Step 1 of 2 • Workspace Setup
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create your organization
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Set up a dedicated multi-tenant workspace for your site reliability and incident response teams.
        </p>
      </motion.div>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="w-full max-w-lg bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organization Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={orgName}
                onChange={handleNameChange}
                placeholder="e.g. Acme Corp or Stark Industries"
                className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Organization Slug (Auto-generated with live validation) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Workspace URL Slug <span className="text-red-500">*</span>
              </label>
              {slugChecking ? (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  Checking...
                </span>
              ) : isSlugAvailable === true ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Available
                </span>
              ) : isSlugAvailable === false ? (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Unavailable
                </span>
              ) : null}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-slate-400 font-mono select-none">
                somak.ai/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="acme-corp"
                className={`w-full bg-slate-50 dark:bg-[#0E0E10] border rounded-xl py-2.5 pl-24 pr-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                  isSlugAvailable === false
                    ? 'border-rose-500/50 focus:ring-rose-500'
                    : isSlugAvailable === true
                    ? 'border-emerald-500/50 focus:ring-emerald-500'
                    : 'border-slate-200 dark:border-white/10 focus:ring-white/20'
                }`}
              />
            </div>
            {slugMessage && (
              <p
                className={`text-[11px] mt-1.5 ${
                  isSlugAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {slugMessage}
              </p>
            )}
          </div>

          {/* Team Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Team Size (optional)</span>
            </label>
            <CustomSelect
              value={teamSize}
              onChange={setTeamSize}
              options={[
                { value: 'Just me', label: 'Just me (Solo engineer / eval)' },
                { value: '2-10', label: '2 - 10 engineers' },
                { value: '11-50', label: '11 - 50 engineers' },
                { value: '50+', label: '50+ engineers (Enterprise SRE)' },
              ]}
            />
          </div>

          {/* Primary Use Case */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Primary Use Case (optional)</span>
            </label>
            <CustomSelect
              value={primaryUseCase}
              onChange={setPrimaryUseCase}
              options={[
                {
                  value: 'Autonomous Incident Remediation',
                  label: 'Autonomous Incident Remediation (NVIDIA Nemotron AST fix)',
                },
                {
                  value: 'Error Monitoring & Triage',
                  label: 'Error Monitoring & Telemetry Triage',
                },
                {
                  value: 'SLO & Error Budget Tracking',
                  label: 'SLO & Error Budget Tracking',
                },
                {
                  value: 'On-Call Escalation & Alerting',
                  label: 'On-Call Escalation & Paging',
                },
              ]}
            />
          </div>

          {/* Plan Selection Tier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Selected Plan</span>
              </span>
              <span className="text-[10px] text-slate-400">Can be upgraded anytime</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'free', label: 'Developer', price: '$0', desc: 'Free during eval' },
                { id: 'team', label: 'Team', price: '$79/mo', desc: 'Canary & Nemotron', popular: true },
                { id: 'enterprise', label: 'Enterprise', price: 'Custom', desc: 'Dedicated SLA' },
              ].map((p) => {
                const isSelected = plan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlan(p.id as any);
                      analytics.track('plan_selected', { plan: p.id, source: 'create_org_step' });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-xs'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-indigo-600 text-white uppercase">
                        Popular
                      </span>
                    )}
                    <div className="font-semibold text-xs text-white flex items-center justify-between">
                      <span>{p.label}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-indigo-400 mt-0.5">{p.price}</div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single primary button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isSlugAvailable === false}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <span>
                    {plan === 'team'
                      ? 'Continue to Checkout ($79)'
                      : plan === 'enterprise'
                      ? 'Contact Sales & Enterprise SLA'
                      : 'Create Organization'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>You will be assigned the <strong>Admin</strong> role</span>
          </span>
          <span className="font-mono text-[10px]">Isolated Tenancy</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function CreateOrgPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <CreateOrgContent />
    </Suspense>
  );
}
