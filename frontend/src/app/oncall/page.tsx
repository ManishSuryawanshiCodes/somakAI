'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  Radio,
  User,
  Shield,
  Search,
  UserCheck,
  Timer,
  CheckCircle2,
  X,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/components/ToastProvider';
import { useOrg } from '@/context/OrgContext';
import { getOnCallShifts } from '@/lib/api';

interface Responder {
  name: string;
  email: string;
  phone: string;
}

interface ServiceOnCall {
  service: string;
  status: 'paging' | 'nominal';
  primary: Responder;
  secondary: Responder;
  escalationMinutes: number;
  weekSchedule: { day: string; responder: string; isToday?: boolean }[];
}

const INITIAL_ONCALL_SERVICES: ServiceOnCall[] = [
  {
    service: 'auth-service',
    status: 'paging',
    primary: {
      name: 'Elena Rostova',
      email: 'elena@somak.internal',
      phone: '+1 (555) 234-5678',
    },
    secondary: {
      name: 'Marcus Vance',
      email: 'marcus@somak.internal',
      phone: '+1 (555) 876-5432',
    },
    escalationMinutes: 5,
    weekSchedule: [
      { day: 'Mon', responder: 'Elena', isToday: true },
      { day: 'Tue', responder: 'Elena' },
      { day: 'Wed', responder: 'Marcus' },
      { day: 'Thu', responder: 'Marcus' },
      { day: 'Fri', responder: 'Devin' },
      { day: 'Sat', responder: 'Sarah' },
      { day: 'Sun', responder: 'Sarah' },
    ],
  },
  {
    service: 'ingress-nginx',
    status: 'nominal',
    primary: {
      name: 'Devin Zhao',
      email: 'devin@somak.internal',
      phone: '+1 (555) 345-6789',
    },
    secondary: {
      name: 'Elena Rostova',
      email: 'elena@somak.internal',
      phone: '+1 (555) 234-5678',
    },
    escalationMinutes: 10,
    weekSchedule: [
      { day: 'Mon', responder: 'Devin', isToday: true },
      { day: 'Tue', responder: 'Devin' },
      { day: 'Wed', responder: 'Devin' },
      { day: 'Thu', responder: 'Elena' },
      { day: 'Fri', responder: 'Elena' },
      { day: 'Sat', responder: 'Marcus' },
      { day: 'Sun', responder: 'Marcus' },
    ],
  },
  {
    service: 'payment-gateway',
    status: 'nominal',
    primary: {
      name: 'Marcus Vance',
      email: 'marcus@somak.internal',
      phone: '+1 (555) 876-5432',
    },
    secondary: {
      name: 'Sarah Chen',
      email: 'sarah@somak.internal',
      phone: '+1 (555) 456-7890',
    },
    escalationMinutes: 5,
    weekSchedule: [
      { day: 'Mon', responder: 'Marcus', isToday: true },
      { day: 'Tue', responder: 'Marcus' },
      { day: 'Wed', responder: 'Sarah' },
      { day: 'Thu', responder: 'Sarah' },
      { day: 'Fri', responder: 'Sarah' },
      { day: 'Sat', responder: 'Devin' },
      { day: 'Sun', responder: 'Devin' },
    ],
  },
];

export default function OnCallPage() {
  const { currentOrg } = useOrg();
  const isAcme = Boolean(currentOrg && currentOrg.id === 'org_acme');
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<ServiceOnCall[]>(isAcme ? INITIAL_ONCALL_SERVICES : []);
  const [countdownSeconds, setCountdownSeconds] = useState(258); // 04:18
  const [overrideModalService, setOverrideModalService] = useState<ServiceOnCall | null>(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState('Marcus Vance');
  const [overrideReason, setOverrideReason] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (!currentOrg) {
      setServices([]);
      return;
    }
    if (isAcme) {
      setServices(INITIAL_ONCALL_SERVICES);
      return;
    }

    getOnCallShifts().then((shifts) => {
      if (shifts && shifts.length > 0) {
        const mapped: ServiceOnCall[] = shifts.map((s: any) => ({
          service: s.service || 'production-workloads',
          status: s.status || 'nominal',
          primary: {
            name: s.primary?.name || 'On-Call Engineer',
            email: s.primary?.email || 'sre@company.com',
            phone: s.primary?.phone || '+1 (555) 000-0000',
          },
          secondary: {
            name: s.secondary?.name || 'Secondary SRE',
            email: s.secondary?.email || 'sre-2@company.com',
            phone: s.secondary?.phone || '+1 (555) 000-0001',
          },
          escalationMinutes: 10,
          weekSchedule: (s.schedule || []).map((sc: any) => ({
            day: sc.day,
            responder: sc.responder,
            isToday: sc.isToday,
          })),
        }));
        setServices(mapped);
      } else {
        setServices([]);
      }
    });
  }, [currentOrg, isAcme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalService) return;

    setServices((prev) =>
      prev.map((s) => {
        if (s.service === overrideModalService.service) {
          const substituteMap: Record<string, Responder> = {
            'Marcus Vance': {
              name: 'Marcus Vance',
              email: 'marcus@somak.internal',
              phone: '+1 (555) 876-5432',
            },
            'Elena Rostova': {
              name: 'Elena Rostova',
              email: 'elena@somak.internal',
              phone: '+1 (555) 234-5678',
            },
            'Devin Zhao': {
              name: 'Devin Zhao',
              email: 'devin@somak.internal',
              phone: '+1 (555) 345-6789',
            },
            'Sarah Chen': {
              name: 'Sarah Chen',
              email: 'sarah@somak.internal',
              phone: '+1 (555) 456-7890',
            },
          };

          const newPrimary = substituteMap[selectedSubstitute] || {
            name: selectedSubstitute,
            email: `${selectedSubstitute.toLowerCase().replace(' ', '.')}@somak.internal`,
            phone: '+1 (555) 000-1122',
          };

          return {
            ...s,
            primary: newPrimary,
          };
        }
        return s;
      })
    );

    addToast(`Shift handoff confirmed: ${selectedSubstitute} is now primary on-call for ${overrideModalService.service}.`, 'success');
    setOverrideModalService(null);
    setOverrideReason('');
  };

  const filtered = services.filter((s) =>
    s.service.toLowerCase().includes(search.toLowerCase()) ||
    s.primary.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-4xl w-full mx-auto space-y-8 pb-24">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Radar</span>
        </Link>

        {/* Calm Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              On-Call Roster
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active primary responders, live escalation timers, and coverage handoff.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by service or name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Sample Demo Mode Banner */}
        {isAcme && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
            <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Sample Demo Roster:</strong> Demonstrating on-call rotation policies for Acme Corp. Add team members in Settings to configure your organization&apos;s real schedule.
            </span>
          </div>
        )}

        {/* One clean card per service or empty state */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-10 text-center bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No on-call rotations configured
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Add team members or configure service ownership in Settings to set up automated primary and secondary responder rotations.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/settings?tab=members"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
                >
                  <span>Invite Team Members</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const isPaging = item.status === 'paging';

            return (
              <div
                key={item.service}
                className="bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Header: Service + Status dot + Request Override */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isPaging ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                      {item.service}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                        isPaging
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {isPaging ? 'Paging Active' : 'Nominal'}
                    </span>

                    <button
                      onClick={() => setOverrideModalService(item)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                    >
                      Request Override
                    </button>
                  </div>
                </div>

                {/* Active Escalation Countdown Ticker */}
                {isPaging && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-800 dark:text-rose-300">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 animate-pulse text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        <strong className="font-mono font-bold text-rose-700 dark:text-rose-300">
                          {formatCountdown(countdownSeconds)}
                        </strong>{' '}
                        until Tier-2 escalation to{' '}
                        <span className="font-semibold">{item.secondary.name}</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">
                      Auto-escalating
                    </span>
                  </div>
                )}

                {/* Plain-language sentence */}
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.primary.name}
                  </span>{' '}
                  is on call, escalates to{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.secondary.name}
                  </span>{' '}
                  after {item.escalationMinutes} min.
                </p>

                {/* Contact info in clean muted strip */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <a
                    href={`mailto:${item.primary.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.primary.email}</span>
                  </a>
                  <a
                    href={`tel:${item.primary.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.primary.phone}</span>
                  </a>
                </div>

                {/* Simple Horizontal Week Schedule Strip */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Week Schedule
                  </div>
                  <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
                    {item.weekSchedule.map((slot, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 min-w-[54px] p-2 rounded-xl text-center border transition-all ${
                          slot.isToday
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] font-mono opacity-70">{slot.day}</div>
                        <div className="text-xs font-semibold mt-0.5 truncate">{slot.responder}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          }))}
        </div>
      </main>

      {/* Request Override / Shift Handoff Modal */}
      {overrideModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                  <UserCheck className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Request Shift Handoff
                  </h3>
                  <p className="text-xs text-slate-500">{overrideModalService.service}</p>
                </div>
              </div>
              <button
                onClick={() => setOverrideModalService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOverride} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Primary Responder
                </label>
                <input
                  type="text"
                  disabled
                  value={`${overrideModalService.primary.name} (${overrideModalService.primary.email})`}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Substitute Responder
                </label>
                <select
                  value={selectedSubstitute}
                  onChange={(e) => setSelectedSubstitute(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="Marcus Vance">Marcus Vance (Secondary / SRE Lead)</option>
                  <option value="Devin Zhao">Devin Zhao (Infrastructure SRE)</option>
                  <option value="Sarah Chen">Sarah Chen (Staff SRE)</option>
                  <option value="Elena Rostova">Elena Rostova (Senior On-Call)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Handoff Reason (Optional)
                </label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Coverage swap, appointment, timezone overlap"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalService(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-xl transition-opacity shadow-xs"
                >
                  Confirm Handoff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
