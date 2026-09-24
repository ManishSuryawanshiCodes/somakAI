"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Users,
  Clock,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Calendar,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Search,
  Eye,
  EyeOff,
  Info,
  CalendarDays,
  Grid,
  BellRing,
  X,
  Sparkles,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { useOrg } from '@/context/OrgContext';

interface ScheduleDay {
  day: string;
  date: string;
  responder: string;
  avatar: string;
  color: string;
  isToday?: boolean;
}

interface OnCallShift {
  id: string;
  service: string;
  primary: { name: string; email: string; avatar: string; phone: string };
  secondary: { name: string; email: string; avatar: string; phone: string };
  escalationLead: { name: string; email: string; avatar: string };
  status: 'paging' | 'nominal';
  activeIncidentId?: string;
  nextHandoff: string;
  timezone: string;
  schedule: ScheduleDay[];
}

const SHIFTS: OnCallShift[] = [
  {
    id: 'shift-auth',
    service: 'auth-service',
    primary: { name: 'Elena Rostova', email: 'elena.rostova@somak.internal', avatar: 'ER', phone: '+1 (555) 234-5678' },
    secondary: { name: 'Marcus Vance', email: 'marcus.vance@somak.internal', avatar: 'MV', phone: '+1 (555) 876-5432' },
    escalationLead: { name: 'Sarah Chen', email: 'sarah.chen@somak.internal', avatar: 'SC' },
    status: 'paging',
    activeIncidentId: 'INC-2041',
    nextHandoff: 'Tomorrow at 09:00 UTC',
    timezone: 'UTC',
    schedule: [
      { day: 'Sun', date: 'Sep 20', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500', isToday: true },
      { day: 'Mon', date: 'Sep 21', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Tue', date: 'Sep 22', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Wed', date: 'Sep 23', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Thu', date: 'Sep 24', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Fri', date: 'Sep 25', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Sat', date: 'Sep 26', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Sun', date: 'Sep 27', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Mon', date: 'Sep 28', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Tue', date: 'Sep 29', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Wed', date: 'Sep 30', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Thu', date: 'Oct 01', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Fri', date: 'Oct 02', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Sat', date: 'Oct 03', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
    ],
  },
  {
    id: 'shift-gateway',
    service: 'ingress-nginx',
    primary: { name: 'Devin Zhao', email: 'devin.zhao@somak.internal', avatar: 'DZ', phone: '+1 (555) 345-6789' },
    secondary: { name: 'Elena Rostova', email: 'elena.rostova@somak.internal', avatar: 'ER', phone: '+1 (555) 234-5678' },
    escalationLead: { name: 'Sarah Chen', email: 'sarah.chen@somak.internal', avatar: 'SC' },
    status: 'nominal',
    nextHandoff: 'In 3 days (Monday 09:00 UTC)',
    timezone: 'UTC',
    schedule: [
      { day: 'Sun', date: 'Sep 20', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500', isToday: true },
      { day: 'Mon', date: 'Sep 21', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Tue', date: 'Sep 22', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Wed', date: 'Sep 23', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Thu', date: 'Sep 24', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Fri', date: 'Sep 25', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Sat', date: 'Sep 26', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Sun', date: 'Sep 27', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Mon', date: 'Sep 28', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Tue', date: 'Sep 29', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Wed', date: 'Sep 30', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Thu', date: 'Oct 01', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Fri', date: 'Oct 02', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Sat', date: 'Oct 03', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
    ],
  },
  {
    id: 'shift-payment',
    service: 'payment-gateway',
    primary: { name: 'Marcus Vance', email: 'marcus.vance@somak.internal', avatar: 'MV', phone: '+1 (555) 876-5432' },
    secondary: { name: 'Devin Zhao', email: 'devin.zhao@somak.internal', avatar: 'DZ', phone: '+1 (555) 345-6789' },
    escalationLead: { name: 'Sarah Chen', email: 'sarah.chen@somak.internal', avatar: 'SC' },
    status: 'nominal',
    nextHandoff: 'In 4 days (Tuesday 09:00 UTC)',
    timezone: 'UTC',
    schedule: [
      { day: 'Sun', date: 'Sep 20', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500', isToday: true },
      { day: 'Mon', date: 'Sep 21', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Tue', date: 'Sep 22', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Wed', date: 'Sep 23', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Thu', date: 'Sep 24', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Fri', date: 'Sep 25', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Sat', date: 'Sep 26', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Sun', date: 'Sep 27', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Mon', date: 'Sep 28', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Tue', date: 'Sep 29', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Wed', date: 'Sep 30', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Thu', date: 'Oct 01', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Fri', date: 'Oct 02', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Sat', date: 'Oct 03', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
    ],
  },
  {
    id: 'shift-redis',
    service: 'redis-cluster',
    primary: { name: 'Sarah Chen', email: 'sarah.chen@somak.internal', avatar: 'SC', phone: '+1 (555) 987-6543' },
    secondary: { name: 'Devin Zhao', email: 'devin.zhao@somak.internal', avatar: 'DZ', phone: '+1 (555) 345-6789' },
    escalationLead: { name: 'Marcus Vance', email: 'marcus.vance@somak.internal', avatar: 'MV' },
    status: 'nominal',
    nextHandoff: 'In 5 days (Wednesday 09:00 UTC)',
    timezone: 'UTC',
    schedule: [
      { day: 'Sun', date: 'Sep 20', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500', isToday: true },
      { day: 'Mon', date: 'Sep 21', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Tue', date: 'Sep 22', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Wed', date: 'Sep 23', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Thu', date: 'Sep 24', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Fri', date: 'Sep 25', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Sat', date: 'Sep 26', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
      { day: 'Sun', date: 'Sep 27', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Mon', date: 'Sep 28', responder: 'Elena Rostova', avatar: 'ER', color: 'bg-indigo-500' },
      { day: 'Tue', date: 'Sep 29', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Wed', date: 'Sep 30', responder: 'Marcus Vance', avatar: 'MV', color: 'bg-violet-500' },
      { day: 'Thu', date: 'Oct 01', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Fri', date: 'Oct 02', responder: 'Sarah Chen', avatar: 'SC', color: 'bg-emerald-500' },
      { day: 'Sat', date: 'Oct 03', responder: 'Devin Zhao', avatar: 'DZ', color: 'bg-cyan-500' },
    ],
  },
];

export default function OnCallPage() {
  const { currentOrg } = useOrg();
  const isAcme = !currentOrg || currentOrg.id === 'org_acme';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paging' | 'nominal'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});
  const [pageToast, setPageToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Toggle contact info reveal
  const toggleContactReveal = (key: string) => {
    setRevealedContacts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maskPhone = (phone: string, isRevealed: boolean) => {
    if (isRevealed) return phone;
    return phone.replace(/(\+1\s*\(\d{3}\)\s*)\d{3}(-\d{4})/, '$1•••$2');
  };

  const maskEmail = (email: string, isRevealed: boolean) => {
    if (isRevealed) return email;
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    return `${user.slice(0, 2)}••••@${domain}`;
  };

  // Trigger quick page escalation
  const handlePageResponder = (shift: OnCallShift) => {
    let role = 'Operator';
    try {
      const stored = localStorage.getItem('sentryops_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        role = parsed.role || 'Operator';
      }
    } catch (e) {}

    if (role === 'Viewer') {
      setPageToast({
        message: 'Action restricted: Requires Operator or Admin role to trigger page escalations.',
        type: 'warning',
      });
      setTimeout(() => setPageToast(null), 4000);
      return;
    }

    setPageToast({
      message: `Emergency page dispatched to ${shift.primary.name} (${shift.service}) via PagerDuty & SMS.`,
      type: 'success',
    });
    setTimeout(() => setPageToast(null), 4000);
  };

  // Filter and sort shifts: Paging services surfaced first, then alphabetical
  const processedShifts = useMemo(() => {
    return SHIFTS.filter((shift) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paging' && shift.status === 'paging') ||
        (statusFilter === 'nominal' && shift.status === 'nominal');

      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        shift.service.toLowerCase().includes(query) ||
        shift.primary.name.toLowerCase().includes(query) ||
        shift.secondary.name.toLowerCase().includes(query) ||
        shift.escalationLead.name.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    }).sort((a, b) => {
      // Rule 3: Group by status first (paging first)
      if (a.status === 'paging' && b.status !== 'paging') return -1;
      if (a.status !== 'paging' && b.status === 'paging') return 1;
      return a.service.localeCompare(b.service);
    });
  }, [searchQuery, statusFilter]);

  const pagingCount = SHIFTS.filter((s) => s.status === 'paging').length;
  const nominalCount = SHIFTS.filter((s) => s.status === 'nominal').length;

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      {/* Floating Action Toast */}
      <AnimatePresence>
        {pageToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-18 right-6 z-50 p-4 rounded-2xl shadow-xl backdrop-blur-md border text-xs max-w-md flex items-center justify-between gap-3 ${
              pageToast.type === 'warning'
                ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {pageToast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="font-semibold leading-relaxed">{pageToast.message}</span>
            </div>
            <button
              onClick={() => setPageToast(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>
        
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Radio className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                On-Call Rotations
                {pagingCount > 0 ? (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    {pagingCount} Paging
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Nominal
                  </span>
                )}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Responder coverage and escalation schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Current Time: {new Date().toISOString().slice(11, 16)} UTC
            </span>
          </div>
        </div>

        {!isAcme ? (
          <div className="glass-panel p-12 rounded-2xl shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                No on-call rotations configured yet for {currentOrg?.name || 'this organization'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Configure responder coverage schedules and multi-tiered notification escalation rules in Settings.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Configure in Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* Rule 8: Clarify "Lead" Role & Escalation Hierarchy Guide */}
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">Escalation Hierarchy Guide:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-[9px] border border-indigo-500/20">
                Tier 1 (Primary)
              </span>
              <span>First responder alerted via PagerDuty/SMS (0m)</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-[9px] border border-slate-300 dark:border-slate-700">
                Tier 2 (Secondary)
              </span>
              <span>Automatic fallback if unacknowledged in 5m</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold font-mono text-[9px] border border-amber-500/20">
                Escalation Lead
              </span>
              <span>Rotation owner & Incident Commander for complex outages</span>
            </div>
          </div>
        </div>

        {/* Rule 9: Sticky Active Incident Paging Banner */}
        <div className="sticky top-14 z-20 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-red-500/40 shadow-lg shadow-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Active Page Triggered
                </span>
                <span className="text-xs text-slate-400">• Incident INC-2041</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Elena Rostova paged for auth-service V8 Heap OOM Outage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Autonomous AST patch synthesized and verified in sandbox. PagerDuty auto-notified with 5-minute escalation fallback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/remediation/INC-2041"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all"
            >
              <span>Respond in Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Rule 7: Search & Status Filter Toolbar + View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          
          {/* Search Input & Status Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services or responders..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({SHIFTS.length})
              </button>
              <button
                onClick={() => setStatusFilter('paging')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'paging'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>Paging ({pagingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('nominal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'nominal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Nominal ({nominalCount})</span>
              </button>
            </div>
          </div>

          {/* Rule 1: View Mode Switcher (Grid vs Rotation Timeline) */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 self-end sm:self-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Rotation Timeline</span>
            </button>
          </div>

        </div>

        {/* VIEW MODE 1: GRID VIEW (With in-card 7-day mini-strip, privacy masking, quick actions) */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {processedShifts.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 text-sm bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                No on-call rotations match your search filter.
              </div>
            ) : (
              processedShifts.map((shift) => {
                const isPaging = shift.status === 'paging';
                const isPrimaryContactRevealed = !!revealedContacts[`${shift.id}-primary`];
                const isSecondaryContactRevealed = !!revealedContacts[`${shift.id}-secondary`];

                return (
                  <div
                    key={shift.id}
                    className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4.5 ${
                      isPaging
                        ? 'border-red-500/50 ring-2 ring-red-500/20 shadow-lg shadow-red-500/5 bg-gradient-to-b from-red-500/[0.04] to-transparent'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    {/* Card Header Row */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                          {shift.service}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1.5 ${
                            isPaging
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaging ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                            }`}
                          />
                          {isPaging ? 'Active Incident Paging' : 'Nominal Coverage'}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {shift.timezone} Rotation
                      </span>
                    </div>

                    {/* Responders Tiers */}
                    <div className="space-y-3 text-xs">
                      
                      {/* Primary Responder Row */}
                      <div
                        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl transition-colors ${
                          isPaging
                            ? 'bg-red-500/[0.08] dark:bg-red-500/[0.12] border border-red-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${
                              isPaging
                                ? 'bg-red-600 ring-2 ring-red-400/50 animate-pulse'
                                : 'bg-gradient-to-tr from-indigo-500 to-violet-500'
                            }`}
                          >
                            {shift.primary.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {shift.primary.name}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isPaging
                                    ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                }`}
                              >
                                Primary Tier 1
                              </span>
                            </div>
                            
                            {/* Rule 5: Privacy-conscious masked contact info */}
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              <span>{maskEmail(shift.primary.email, isPrimaryContactRevealed)}</span>
                              <span>•</span>
                              <span>{maskPhone(shift.primary.phone, isPrimaryContactRevealed)}</span>
                              <button
                                type="button"
                                onClick={() => toggleContactReveal(`${shift.id}-primary`)}
                                className="p-0.5 text-slate-400 hover:text-indigo-500 transition-colors ml-0.5"
                                title={isPrimaryContactRevealed ? 'Mask contact details' : 'Reveal contact details'}
                              >
                                {isPrimaryContactRevealed ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Rule 4: Quick Action on Each Card */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isPaging ? (
                            <Link
                              href={`/remediation/${shift.activeIncidentId || 'INC-2041'}`}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>View Incident</span>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePageResponder(shift)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700/80 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition-all flex items-center gap-1.5 group"
                              title="Page this responder directly via PagerDuty"
                            >
                              <BellRing className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" />
                              <span>Page Responder</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Secondary Responder Row */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {shift.secondary.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {shift.secondary.name}
                              </span>
                              <span className="text-[9px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                                Secondary Tier 2
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span>{maskEmail(shift.secondary.email, isSecondaryContactRevealed)}</span>
                              <span>•</span>
                              <span>{maskPhone(shift.secondary.phone, isSecondaryContactRevealed)}</span>
                              <button
                                type="button"
                                onClick={() => toggleContactReveal(`${shift.id}-secondary`)}
                                className="p-0.5 text-slate-400 hover:text-indigo-500 transition-colors"
                                title={isSecondaryContactRevealed ? 'Mask contact details' : 'Reveal contact details'}
                              >
                                {isSecondaryContactRevealed ? (
                                  <EyeOff className="w-2.5 h-2.5" />
                                ) : (
                                  <Eye className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          Auto-fallback in 5m
                        </span>
                      </div>
                    </div>

                    {/* Rule 1: In-Card 7-Day Rotation Schedule Mini-Strip */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        <span className="uppercase tracking-wider">7-Day Rotation Schedule</span>
                        <span className="font-mono text-slate-400">09:00 UTC Shift Handoff</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {shift.schedule.slice(0, 7).map((slot, idx) => (
                          <div
                            key={idx}
                            className={`p-1.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                              slot.isToday
                                ? 'bg-indigo-500/15 border border-indigo-500/30'
                                : 'bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60'
                            }`}
                            title={`${slot.date}: ${slot.responder}`}
                          >
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              {slot.day}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full ${slot.color} text-white font-bold text-[9px] flex items-center justify-center shadow-2xs`}
                            >
                              {slot.avatar}
                            </div>
                            <span className="text-[8px] font-mono text-slate-400 truncate w-full">
                              {slot.date.split(' ')[1]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rule 6: Standardized Consistent Card Metadata Footer Row */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={`Handoff: ${shift.nextHandoff}`}>
                          {shift.nextHandoff.split(' (')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 justify-center truncate">
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>5m Delay</span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 justify-end truncate cursor-pointer group"
                        title={`Escalation Lead: ${shift.escalationLead.name} (Rotation manager & incident commander)`}
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors truncate">
                          Lead: {shift.escalationLead.name.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* VIEW MODE 2: FULL 14-DAY ROTATION TIMELINE CALENDAR */
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  14-Day Cross-Service On-Call Timeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visual rotation forecast across all production services. Daily shifts transition at 09:00 UTC.
                </p>
              </div>

              {/* Responder Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-300">Elena Rostova</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-violet-500" />
                  <span className="text-slate-600 dark:text-slate-300">Marcus Vance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-slate-600 dark:text-slate-300">Devin Zhao</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300">Sarah Chen</span>
                </div>
              </div>
            </div>

            {/* Gantt Timeline Grid */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[900px] space-y-3">
                {/* Timeline Header Row (Dates) */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="col-span-3 text-slate-600 dark:text-slate-300">Service</div>
                  <div className="col-span-9 grid grid-cols-14 gap-1 text-center font-mono">
                    {SHIFTS[0].schedule.map((slot, i) => (
                      <div
                        key={i}
                        className={`p-1 rounded ${
                          slot.isToday
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold'
                            : ''
                        }`}
                      >
                        <div className="text-[9px]">{slot.day}</div>
                        <div className="text-[10px]">{slot.date.split(' ')[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Timeline Rows */}
                {processedShifts.map((shift) => {
                  const isPaging = shift.status === 'paging';
                  return (
                    <div
                      key={shift.id}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60"
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                          {shift.service}
                        </span>
                        {isPaging && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                        )}
                      </div>

                      <div className="col-span-9 grid grid-cols-14 gap-1">
                        {shift.schedule.map((slot, idx) => (
                          <div
                            key={idx}
                            className={`h-8 rounded-lg ${slot.color} text-white font-bold text-[10px] flex items-center justify-center shadow-2xs hover:opacity-90 transition-opacity cursor-pointer ${
                              slot.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                            }`}
                            title={`${shift.service} • ${slot.date}: ${slot.responder} (Primary on-call)`}
                          >
                            {slot.avatar}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </>
        )}

      </main>

      <FloatingDock />
    </div>
  );
}
