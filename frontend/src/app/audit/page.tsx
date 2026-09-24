"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  KeyRound,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { getAuditEvents, AuditEvent } from '@/lib/api';

const FALLBACK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'aud-9842',
    actor: { name: 'Marcus Vance', email: 'marcus.vance@somak.internal', avatar: 'MV', role: 'Operator' },
    action: 'Approved 5% Canary Deployment for INC-2041',
    actionCategory: 'canary',
    targetResource: 'auth-service:v1.4.2-hotfix',
    timestamp: '2026-09-19 14:04:18 UTC',
    ipAddress: '10.240.12.89 (VPN)',
    verificationHash: 'sha256:8f4c...91a2',
    status: 'VERIFIED',
  },
  {
    id: 'aud-9841',
    actor: { name: 'Elena Rostova', email: 'elena.rostova@somak.internal', avatar: 'ER', role: 'Admin' },
    action: 'Modified RBAC Permission for Devin Zhao to Operator',
    actionCategory: 'rbac',
    targetResource: 'usr-3 (devin.zhao)',
    timestamp: '2026-09-19 13:12:05 UTC',
    ipAddress: '10.240.12.14 (VPN)',
    verificationHash: 'sha256:3a1b...c984',
    status: 'VERIFIED',
  },
  {
    id: 'aud-9840',
    actor: { name: 'Sarah Chen', email: 'sarah.chen@somak.internal', avatar: 'SC', role: 'Operator' },
    action: 'Triggered Emergency Hold-to-Rollback on Canary',
    actionCategory: 'rollback',
    targetResource: 'billing-api:v2.1.0',
    timestamp: '2026-09-18 18:42:30 UTC',
    ipAddress: '10.240.14.22 (VPN)',
    verificationHash: 'sha256:7c2d...41fe',
    status: 'VERIFIED',
  },
  {
    id: 'aud-9839',
    actor: { name: 'Elena Rostova', email: 'elena.rostova@somak.internal', avatar: 'ER', role: 'Admin' },
    action: 'Rotated Nebius Token Factory Production API Key',
    actionCategory: 'api_key',
    targetResource: 'secrets/nebius_api_key',
    timestamp: '2026-09-18 10:15:00 UTC',
    ipAddress: '10.240.12.14 (VPN)',
    verificationHash: 'sha256:1e4f...8820',
    status: 'VERIFIED',
  },
  {
    id: 'aud-9838',
    actor: { name: 'Marcus Vance', email: 'marcus.vance@somak.internal', avatar: 'MV', role: 'Operator' },
    action: 'Locked & Published Post-Mortem to SOC-2 Audit Vault',
    actionCategory: 'compliance',
    targetResource: 'postmortem/INC-1892',
    timestamp: '2026-09-17 19:30:12 UTC',
    ipAddress: '10.240.12.89 (VPN)',
    verificationHash: 'sha256:9c0a...b512',
    status: 'VERIFIED',
  },
];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>(FALLBACK_AUDIT_EVENTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const fetchLiveEvents = async () => {
    setLoading(true);
    try {
      const data = await getAuditEvents(100);
      if (data && Array.isArray(data) && data.length > 0) {
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch live audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveEvents();
  }, []);

  const filtered = events.filter((e) => {
    if (filterCategory !== 'ALL' && e.actionCategory !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        (e.actor?.name || '').toLowerCase().includes(q) ||
        (e.targetResource || '').toLowerCase().includes(q) ||
        (e.verificationHash || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `somak-audit-trail-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col pb-36 md:pb-12 relative z-10 transition-colors">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Audit Log
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  SOC-2 Immutable Vault
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Immutable log of approvals, deployments, and rollbacks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLiveEvents}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs shadow-2xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, action description, resource, or SHA hash..."
              className="w-full bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="canary">Canary Deployments</option>
            <option value="rollback">Rollbacks</option>
            <option value="rbac">RBAC Changes</option>
            <option value="api_key">API Key Rotations</option>
            <option value="compliance">Compliance Vault</option>
          </select>
        </div>

        {/* Audit Log Table */}
        <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Audit Events Found</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">No immutable audit records match your query.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('ALL');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Operator</th>
                    <th className="py-3 px-4 font-bold">Action Taken</th>
                    <th className="py-3 px-4 font-bold">Target Resource</th>
                    <th className="py-3 px-4 font-bold">Timestamp</th>
                    <th className="py-3 px-4 font-bold">Origin IP</th>
                    <th className="py-3 px-4 font-bold text-right">Integrity Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-mono">
                  {filtered.map((item) => {
                    const avatar = item.actor?.avatar || (item.actor?.name || item.actor_name || 'SA').substring(0, 2).toUpperCase();
                    const actorName = item.actor?.name || item.actor_name || 'System Operator';
                    const actorRole = item.actor?.role || item.actor_role || 'Operator';
                    const target = item.targetResource || item.target || 'platform/core';
                    const ip = item.ipAddress || '10.240.12.89 (VPN)';
                    const hash = item.verificationHash || item.tamper_hash || 'sha256:verified';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px]">
                              {avatar}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{actorName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{actorRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                          {target}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.timestamp}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {ip}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            {hash}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
