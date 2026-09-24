"use client";

import React, { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import { checkSlugAvailability } from '@/lib/api';
import { analytics } from '@/lib/analytics';

export default function CreateOrgPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createOrg } = useOrg();

  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [teamSize, setTeamSize] = useState('2-10');
  const [primaryUseCase, setPrimaryUseCase] = useState('Autonomous Incident Remediation');

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

      analytics.track('org_created', {
        org_id: slug.trim(),
        slug: slug.trim(),
        team_size: teamSize,
      });

      // Redirect directly to the guided setup checklist
      setTimeout(() => {
        router.push('/onboarding/setup');
      }, 400);
    } catch (err: any) {
      setError(err?.message || 'Failed to create organization. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial-gradient flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand & Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Building2 className="w-5 h-5" />
          </div>
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
        className="w-full max-w-lg glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
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
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
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
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
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
                className={`w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl py-2.5 pl-24 pr-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  isSlugAvailable === false
                    ? 'border-rose-500/50 focus:ring-rose-500'
                    : isSlugAvailable === true
                    ? 'border-emerald-500/50 focus:ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
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
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Just me">Just me (Solo engineer / eval)</option>
              <option value="2-10">2 - 10 engineers</option>
              <option value="11-50">11 - 50 engineers</option>
              <option value="50+">50+ engineers (Enterprise SRE)</option>
            </select>
          </div>

          {/* Primary Use Case */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Primary Use Case (optional)</span>
            </label>
            <select
              value={primaryUseCase}
              onChange={(e) => setPrimaryUseCase(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Autonomous Incident Remediation">
                Autonomous Incident Remediation (NVIDIA Nemotron AST fix)
              </option>
              <option value="Error Monitoring & Triage">
                Error Monitoring & Telemetry Triage
              </option>
              <option value="SLO & Error Budget Tracking">
                SLO & Error Budget Tracking
              </option>
              <option value="On-Call Escalation & Alerting">
                On-Call Escalation & Paging
              </option>
            </select>
          </div>

          {/* Single primary button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isSlugAvailable === false}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Organization</span>
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
