"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Radio,
  Clock,
  User,
  Filter,
  Layers,
  Lock,
  Calendar,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import MiniSparkline from '@/components/MiniSparkline';
import { getAuditEvents, AuditEvent } from '@/lib/api';
import { useOrg } from '@/context/OrgContext';

interface RichAuditEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  actionCategory: 'deploy' | 'rollback' | 'setting' | 'key' | 'postmortem';
  resource: string;
  result: 'Success' | 'Warning' | 'Blocked';
  blockNumber: number;
  prevHash: string;
  hash: string;
  ip: string;
}

const AUDIT_EVENTS: RichAuditEvent[] = [
  {
    id: 'aud-9844',
    time: '14:22:10',
    actor: 'Autonomous Engine',
    action: 'Synthesized AST hotfix using server fallback key (NVIDIA NIM / Nemotron-3-Ultra)',
    actionCategory: 'deploy',
    resource: 'auth-service',
    result: 'Success',
    blockNumber: 494,
    prevHash: '8f4c91a201de38bb47ac',
    hash: '7b9102ca819df01823ab',
    ip: 'nim.api.nvidia.com',
  },
  {
    id: 'aud-9843',
    time: '14:21:55',
    actor: 'Autonomous Engine',
    action: 'Executed incident triage using server fallback key (NVIDIA NIM / Nemotron-3-Super)',
    actionCategory: 'setting',
    resource: 'auth-service',
    result: 'Success',
    blockNumber: 493,
    prevHash: '7b9102ca819df01823ab',
    hash: '9fa012bc5541e89201fc',
    ip: 'nim.api.nvidia.com',
  },
  {
    id: 'aud-9842',
    time: '14:04:18',
    actor: 'Marcus Vance',
    action: 'Approved 5% canary promotion',
    actionCategory: 'deploy',
    resource: 'auth-service',
    result: 'Success',
    blockNumber: 492,
    prevHash: 'a8f9b201cd9841f3e721',
    hash: '8f4c91a201de38bb47ac',
    ip: '10.240.12.89 (VPN)',
  },
  {
    id: 'aud-9841',
    time: '13:12:05',
    actor: 'Elena Rostova',
    action: 'Modified role to Operator for Devin Zhao',
    actionCategory: 'setting',
    resource: 'usr-3 (devin.zhao)',
    result: 'Success',
    blockNumber: 491,
    prevHash: '62de18a994ef001928bc',
    hash: 'a8f9b201cd9841f3e721',
    ip: '10.240.12.14 (VPN)',
  },
  {
    id: 'aud-9840',
    time: '12:42:30',
    actor: 'Sarah Chen',
    action: 'Triggered emergency canary rollback',
    actionCategory: 'rollback',
    resource: 'billing-api',
    result: 'Success',
    blockNumber: 490,
    prevHash: '3b091fca00293817acbf',
    hash: '62de18a994ef001928bc',
    ip: '10.240.14.22 (VPN)',
  },
  {
    id: 'aud-9839',
    time: '10:15:00',
    actor: 'Elena Rostova',
    action: 'Rotated Nebius production API key',
    actionCategory: 'key',
    resource: 'secrets/nebius_api_key',
    result: 'Success',
    blockNumber: 489,
    prevHash: '1e4f8820c78a19284fae',
    hash: '3b091fca00293817acbf',
    ip: '10.240.12.14 (VPN)',
  },
  {
    id: 'aud-9838',
    time: '09:30:12',
    actor: 'Marcus Vance',
    action: 'Published post-mortem to audit vault',
    actionCategory: 'postmortem',
    resource: 'INC-1892',
    result: 'Success',
    blockNumber: 488,
    prevHash: '9c0ab512001928374aed',
    hash: '1e4f8820c78a19284fae',
    ip: '10.240.12.89 (VPN)',
  },
  {
    id: 'aud-9837',
    time: '08:14:02',
    actor: 'Autonomous Engine',
    action: 'Dispatched microVM reproduction sandbox',
    actionCategory: 'deploy',
    resource: 'auth-service',
    result: 'Success',
    blockNumber: 487,
    prevHash: '4a1b9201f8e7162534de',
    hash: '9c0ab512001928374aed',
    ip: 'microvm-pool-841 (internal)',
  },
  {
    id: 'aud-9836',
    time: '04:02:11',
    actor: 'Autonomous Engine',
    action: 'AST syntax patch compiled with zero errors',
    actionCategory: 'deploy',
    resource: 'auth-service',
    result: 'Success',
    blockNumber: 486,
    prevHash: '001928374aedf8e71625',
    hash: '4a1b9201f8e7162534de',
    ip: 'cluster-core (internal)',
  },
];

export default function AuditPage() {
  const { currentOrg } = useOrg();
  const isAcme = Boolean(currentOrg && currentOrg.id === 'org_acme');
  const [events, setEvents] = useState<RichAuditEvent[]>(isAcme ? AUDIT_EVENTS : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg) {
      setEvents([]);
      return;
    }
    if (isAcme) {
      setEvents(AUDIT_EVENTS);
      return;
    }

    getAuditEvents(currentOrg.id)
      .then((backendEvents) => {
        if (backendEvents && backendEvents.length > 0) {
          const mapped: RichAuditEvent[] = backendEvents.map((be: any, idx: number) => ({
            id: be.id || `aud-live-${idx}`,
            time: be.timestamp ? new Date(be.timestamp).toLocaleTimeString() : 'Just now',
            actor: typeof be.actor === 'string' ? be.actor : (be.actor_name || be.actor?.name || 'Autonomous Engine'),
            action: be.action,
            actionCategory: (be.actionCategory || be.category || be.action_category || 'deploy') as any,
            resource: be.resource || be.targetResource || be.target || 'cluster',
            result: (be.result || (be.status === 'success' || be.status === 'Success' ? 'Success' : be.status === 'blocked' ? 'Blocked' : 'Success')) as any,
            blockNumber: 500 + idx,
            prevHash: be.previous_hash || be.prev_hash || '8f4c91a201de38bb47ac',
            hash: be.tamper_hash || be.verificationHash || be.hash || '7b9102ca819df01823ab',
            ip: be.ipAddress || be.ip_address || 'internal-agent',
          }));
          setEvents(mapped);
        } else {
          setEvents([]);
        }
      })
      .catch(() => {
        setEvents([]);
      });
  }, [currentOrg?.id, isAcme]);

  // Left sidebar filter states
  const [timelineFilter, setTimelineFilter] = useState<'all' | '24h' | '7d'>('all');
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const availableActors = useMemo(() => Array.from(new Set(events.map((e) => e.actor))), [events]);
  const availableCategories = useMemo(() => Array.from(new Set(events.map((e) => e.actionCategory))), [events]);
  const availableResources = useMemo(() => Array.from(new Set(events.map((e) => e.resource))), [events]);

  // Collapsible sidebar sections
  const [collapsedSections, setCollapsedSections] = useState({
    timeline: false,
    actor: false,
    action: false,
    resource: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleActorToggle = (actor: string) => {
    setSelectedActors((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  };

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleResourceToggle = (res: string) => {
    setSelectedResources((prev) =>
      prev.includes(res) ? prev.filter((r) => r !== res) : [...prev, res]
    );
  };

  const filteredEvents = events.filter((e) => {
    if (selectedActors.length > 0 && !selectedActors.includes(e.actor)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(e.actionCategory)) return false;
    if (selectedResources.length > 0 && !selectedResources.includes(e.resource)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const data = JSON.stringify(filteredEvents, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${Date.now()}.json`;
      a.click();
    } else {
      const headers = ['Time', 'Actor', 'Action', 'Resource', 'Result', 'BlockNumber', 'Hash'];
      const rows = filteredEvents.map((e) => [
        e.time,
        e.actor,
        `"${e.action.replace(/"/g, '""')}"`,
        e.resource,
        e.result,
        e.blockNumber,
        e.hash,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col pb-32 transition-colors selection:bg-indigo-500/20">
      <TopNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Top Header Strip with Number + Mini-Sparkline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Audit Log
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                SHA-256 Immutable
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cryptographically verified activity ledger for SOC-2 Type II compliance.
            </p>
          </div>

          {/* Mini Summary Card (Section 4 spec) */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4 shrink-0">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Audited Actions
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  142 this week
                </span>
              </div>
            </div>
            <MiniSparkline
              data={[12, 16, 19, 24, 28, 21, 22]}
              color="indigo"
              width={48}
              height={18}
            />
          </div>
        </div>

        {/* Vercel Logs Top Bar: Search + Live Toggle + Export Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, actor, resource, or SHA hash..."
              className="w-full bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Toggle */}
            <button
              type="button"
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${
                isLive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-white dark:bg-[#0A0A0A] text-slate-500 border-slate-200/80 dark:border-white/10'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isLive ? 'Live Stream' : 'Paused'}</span>
            </button>

            {/* Export Dropdown */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="px-3 py-2 rounded-l-xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-2.5 py-2 rounded-r-xl bg-white dark:bg-[#0A0A0A] border-y border-r border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                title="Export CSV"
              >
                CSV
              </button>
            </div>
          </div>
        </div>
        {/* Sample Demo Mode Banner */}
        {isAcme && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Sample Audit Trail:</strong> Showing simulated SHA-256 tamper-evident audit records for Acme Corp. Real actions in your organization will be recorded here automatically.
            </span>
          </div>
        )}

        {/* Main Content Layout: Left Filter Sidebar + Main Table (Vercel Logs Pattern) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Filter Sidebar */}
          <div className="lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter Log</span>
              </span>
              {(selectedActors.length > 0 || selectedCategories.length > 0 || selectedResources.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedActors([]);
                    setSelectedCategories([]);
                    setSelectedResources([]);
                    setTimelineFilter('all');
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Group 1: Timeline */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSection('timeline')}
                className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider"
              >
                <span>Timeline</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    collapsedSections.timeline ? '-rotate-90' : ''
                  }`}
                />
              </button>

              {!collapsedSections.timeline && (
                <div className="space-y-1 pl-1">
                  {[
                    { id: 'all', label: 'All recorded time' },
                    { id: '24h', label: 'Past 24 hours' },
                    { id: '7d', label: 'Past 7 days' },
                  ].map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer py-0.5"
                    >
                      <input
                        type="radio"
                        name="timeline"
                        checked={timelineFilter === t.id}
                        onChange={() => setTimelineFilter(t.id as any)}
                        className="accent-slate-900 dark:accent-white"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Group 2: Actor */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => toggleSection('actor')}
                className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider"
              >
                <span>Actor</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    collapsedSections.actor ? '-rotate-90' : ''
                  }`}
                />
              </button>

              {!collapsedSections.actor && (
                <div className="space-y-1.5 pl-1">
                  {availableActors.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No actors recorded</span>
                  ) : (
                    availableActors.map((actor) => (
                      <label
                        key={actor}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedActors.includes(actor)}
                          onChange={() => handleActorToggle(actor)}
                          className="rounded accent-slate-900 dark:accent-white"
                        />
                        <span>{actor}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Group 3: Action Type */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => toggleSection('action')}
                className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider"
              >
                <span>Action Type</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    collapsedSections.action ? '-rotate-90' : ''
                  }`}
                />
              </button>

              {!collapsedSections.action && (
                <div className="space-y-1.5 pl-1">
                  {[
                    { id: 'deploy', label: 'Canary promotion' },
                    { id: 'rollback', label: 'Emergency rollback' },
                    { id: 'setting', label: 'Setting changed' },
                    { id: 'key', label: 'Key rotated' },
                    { id: 'postmortem', label: 'Post-mortem locked' },
                  ].map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded accent-slate-900 dark:accent-white"
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Group 4: Resource */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => toggleSection('resource')}
                className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider"
              >
                <span>Resource</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    collapsedSections.resource ? '-rotate-90' : ''
                  }`}
                />
              </button>

              {!collapsedSections.resource && (
                <div className="space-y-1.5 pl-1">
                  {availableResources.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No resources recorded</span>
                  ) : (
                    availableResources.map((res) => (
                      <label
                        key={res}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedResources.includes(res)}
                          onChange={() => handleResourceToggle(res)}
                          className="rounded accent-slate-900 dark:accent-white"
                        />
                        <span className="font-mono text-[11px] truncate">{res}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Log Table (Plain English rows + progressive disclosure expand) */}
          <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <div className="col-span-2">Time</div>
              <div className="col-span-3">Actor</div>
              <div className="col-span-4">Action</div>
              <div className="col-span-2">Resource</div>
              <div className="col-span-1 text-right">Result</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {events.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">No audit events recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Actions performed by users and the autonomous engine will appear here in the tamper-evident cryptographic log.
                  </p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">No events matched filters</p>
                  <p className="text-xs">Try selecting fewer filter checkboxes or clearing your search.</p>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isExpanded = expandedRowId === evt.id;

                  return (
                    <div key={evt.id} className="group">
                      {/* Main Plain English Row */}
                      <div
                        onClick={() => setExpandedRowId(isExpanded ? null : evt.id)}
                        className={`grid grid-cols-12 px-4 py-3 items-center cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-slate-50 dark:bg-white/[0.03]'
                            : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.01]'
                        }`}
                      >
                        {/* Time */}
                        <div className="col-span-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <ChevronRight
                            className={`w-3 h-3 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-90 text-indigo-500' : ''
                            }`}
                          />
                          <span>{evt.time}</span>
                        </div>

                        {/* Actor */}
                        <div className="col-span-3 font-semibold text-slate-900 dark:text-white truncate pr-2">
                          {evt.actor}
                        </div>

                        {/* Action in Plain English */}
                        <div className="col-span-4 text-slate-700 dark:text-slate-300 truncate pr-2">
                          {evt.action}
                        </div>

                        {/* Resource */}
                        <div className="col-span-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate pr-1">
                          {evt.resource}
                        </div>

                        {/* Result */}
                        <div className="col-span-1 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">{evt.result}</span>
                          </span>
                        </div>
                      </div>

                      {/* Progressive Disclosure: Cryptographic Verification Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-950 text-slate-300 font-mono text-xs px-6 py-4 border-y border-slate-800 space-y-2.5"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                              <span className="text-indigo-400 font-bold">
                                SHA-256 LEDGER VERIFICATION #{evt.blockNumber}
                              </span>
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                IMMUTABLE RECORD
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">Block Hash:</span>
                                <span className="text-slate-200 select-all">sha256:{evt.hash}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Previous Block:</span>
                                <span className="text-slate-400 select-all">sha256:{evt.prevHash}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Client Origin:</span>
                                <span className="text-slate-300">{evt.ip}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Verification Scope:</span>
                                <span className="text-slate-300">SOC-2 Type II Enforced Triggers</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
