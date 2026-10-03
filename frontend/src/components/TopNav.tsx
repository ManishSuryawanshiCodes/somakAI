"use client";

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '@/lib/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Sun,
  Moon,
  Zap,
  Search,
  Cpu,
  X,
  ArrowRight,
  Bell,
  CheckCheck,
  Radio,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Activity,
  History,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Gauge,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ChevronRight,
  Play,
  Pause,
  Copy,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAppShell } from './AppShell';
import { useOrg } from '@/context/OrgContext';
import Modal from './Modal';

interface TopNavProps {
  onSimulate?: () => void;
  isSimulating?: boolean;
}

export default function TopNav({ onSimulate, isSimulating = false }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { sidebarCollapsed, toggleSidebar, setMobileDrawerOpen } = useAppShell();

  // Modals & Menus
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'offline'>('connected');

  // Real-time System Status Poll
  useEffect(() => {
    let isMounted = true;
    const checkSystemHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (!res.ok) {
          if (isMounted) setConnectionState('offline');
          return;
        }
        const data = await res.json();
        if (!isMounted) return;
        if (data.status === 'operational') {
          setConnectionState('connected');
        } else if (data.status === 'degraded') {
          setConnectionState('reconnecting');
        } else {
          setConnectionState('offline');
        }
      } catch (err) {
        if (isMounted) setConnectionState('offline');
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 35000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const { currentOrg } = useOrg();
  const [streamPaused, setStreamPaused] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [streamLogs, setStreamLogs] = useState<string[]>([
    `[SSE_HANDSHAKE] Connected to /api/incidents/stream via HTTP/2 (200 OK)`,
    `[ORG_CONTEXT] Active workspace: ${currentOrg?.name || 'Workspace'} (id: ${currentOrg?.id || 'org_acme'})`,
    `[INGEST] Sentry webhook subscription: ACTIVE • 0 dropped packets`,
    `[HEARTBEAT] Ping seq #1024 • RTT: 12.4ms • Health: 100% NOMINAL`,
    `[SANDBOX] MicroVM Firecracker pool: 4 warm containers standby`,
  ]);

  // Real-time live SSE stream simulation
  useEffect(() => {
    if (!connectionModalOpen || streamPaused) return;

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const events = [
        `[${now}] [HEARTBEAT] Ping seq #${Math.floor(1000 + Math.random() * 9000)} • RTT: ${(10 + Math.random() * 4).toFixed(1)}ms • Zero packet loss`,
        `[${now}] [TELEMETRY] Ingest metrics: error_rate=0.00%, cpu=14.2%, memory=48.1%`,
        `[${now}] [INGEST] Inbound webhook buffer clear • 0 pending exceptions`,
        `[${now}] [SANDBOX] Firecracker microVM gate: 4 warm, 0 failed, isolation: ACTIVE`,
        `[${now}] [PROMOTION] Envoy mesh weight matrix validated • 0 canary regressions`,
      ];
      const ev = events[Math.floor(Math.random() * events.length)];
      setStreamLogs((prev) => [...prev.slice(-49), ev]);
    }, 2200);

    return () => clearInterval(interval);
  }, [connectionModalOpen, streamPaused, currentOrg]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setConnectionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  interface CommandItem {
    id: string;
    category: 'Navigation' | 'Incidents' | 'Actions';
    title: string;
    subtitle?: string;
    icon: React.ElementType;
    action: () => void;
  }

  const allCommands: CommandItem[] = [
    {
      id: 'nav-radar',
      category: 'Navigation',
      title: 'Incident Radar',
      subtitle: 'Cluster topology & live telemetry overview',
      icon: Activity,
      action: () => router.push('/'),
    },
    {
      id: 'nav-studio',
      category: 'Navigation',
      title: 'Remediation Studio (INC-2041)',
      subtitle: 'Nemotron-3 AST diffs & sandbox verification',
      icon: Terminal,
      action: () => router.push('/remediation/INC-2041'),
    },
    {
      id: 'nav-canary',
      category: 'Navigation',
      title: 'Canary Verification (INC-2041)',
      subtitle: 'Traffic split gauge & hold-to-rollback',
      icon: Radio,
      action: () => router.push('/canary/INC-2041'),
    },
    {
      id: 'nav-postmortem',
      category: 'Navigation',
      title: 'SOC-2 Post-Mortem (INC-2041)',
      subtitle: 'Audit trail, timeline scrubber & PDF export',
      icon: ShieldCheck,
      action: () => router.push('/postmortem/INC-2041'),
    },
    {
      id: 'nav-history',
      category: 'Navigation',
      title: 'Incident History & Analytics',
      subtitle: 'Historical MTTR trends and past RCA reports',
      icon: History,
      action: () => router.push('/history'),
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'System Settings & Integrations',
      subtitle: 'Nebius API, Slack webhooks, team roles',
      icon: Settings,
      action: () => router.push('/settings'),
    },
    {
      id: 'nav-status',
      category: 'Navigation',
      title: 'Public Status Page',
      subtitle: '99.98% uptime and component health',
      icon: ExternalLink,
      action: () => router.push('/status'),
    },
    {
      id: 'nav-slo',
      category: 'Navigation',
      title: 'Error Budget & SLO Tracker',
      subtitle: 'Per-service burn rate, exhaustion estimates & SLA health',
      icon: Gauge,
      action: () => router.push('/slo'),
    },
    {
      id: 'nav-oncall',
      category: 'Navigation',
      title: 'On-Call Rotations & Paging',
      subtitle: 'Active paging responders and escalation calendar',
      icon: Radio,
      action: () => router.push('/oncall'),
    },
    {
      id: 'nav-runbooks',
      category: 'Navigation',
      title: 'Runbook Library & AST Fix Patterns',
      subtitle: 'Searchable auto-remediation catalog for cloud failure modes',
      icon: Terminal,
      action: () => router.push('/runbooks'),
    },
    {
      id: 'nav-audit',
      category: 'Navigation',
      title: 'Admin Audit Log (SOC-2)',
      subtitle: 'Immutable human deployment, rollback and role actions',
      icon: ShieldCheck,
      action: () => router.push('/audit'),
    },
    {
      id: 'nav-integrations',
      category: 'Navigation',
      title: 'Integrations Marketplace',
      subtitle: 'Slack, PagerDuty, GitHub, Datadog, Nebius & Tavily connectors',
      icon: Settings,
      action: () => router.push('/integrations'),
    },
    {
      id: 'nav-usage',
      category: 'Navigation',
      title: 'Usage & Quotas',
      subtitle: 'Nemotron token consumption, sandbox runs and plan limits',
      icon: Cpu,
      action: () => router.push('/usage'),
    },
    {
      id: 'nav-changelog',
      category: 'Navigation',
      title: 'Product Changelog',
      subtitle: 'Platform updates, AST engine upgrades and release notes',
      icon: History,
      action: () => router.push('/changelog'),
    },
    {
      id: 'inc-2041',
      category: 'Incidents',
      title: 'INC-2041: auth-service V8 OOM Memory Leak',
      subtitle: 'SEV-1 • Ready for Deploy • 99.4% confidence',
      icon: AlertTriangle,
      action: () => router.push('/remediation/INC-2041'),
    },
    {
      id: 'inc-1892',
      category: 'Incidents',
      title: 'INC-1892: payment-gateway Webhook Timeout',
      subtitle: 'SEV-2 • Resolved • MTTR 3m 50s',
      icon: CheckCircle2,
      action: () => router.push('/postmortem/INC-2041'),
    },
    {
      id: 'nav-tour',
      category: 'Actions',
      title: 'Start Architecture Tour',
      subtitle: 'Guided walkthrough of Somak AI architecture — click ? in the sidebar',
      icon: Sparkles,
      action: () => router.push('/'),
    },
    {
      id: 'act-simulate',
      category: 'Actions',
      title: 'Simulate Sev-1 Production Crash',
      subtitle: 'Trigger mock telemetry spike & auto-triage',
      icon: Zap,
      action: () => {
        if (onSimulate) onSimulate();
      },
    },
    {
      id: 'act-theme',
      category: 'Actions',
      title: `Toggle Theme (Currently ${theme === 'dark' ? 'Dark' : 'Light'})`,
      subtitle: 'Switch between Pure Obsidian and Liquid Glass Cream',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
  ];

  const filteredCommands = allCommands.filter((cmd) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(query) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(query)) ||
      cmd.category.toLowerCase().includes(query)
    );
  });

  const handleCommandSelect = (index: number) => {
    const cmd = filteredCommands[index];
    if (cmd) {
      setSearchOpen(false);
      cmd.action();
    }
  };

  const handleKeyDownInSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSelect(selectedIndex);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 backdrop-blur-xl bg-[#FAF8F5]/85 dark:bg-[#0A0A0A]/85 border-b border-[#E8E3D9] dark:border-white/10 px-3 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
        {/* Element 1: Global Search / ⌘K (+ Mobile Drawer Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl pr-2">
          {/* Mobile Hamburger Drawer Trigger (< md) */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5/80 border border-slate-200/80 dark:border-white/10 transition-all focus:outline-none active:scale-95"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop/Laptop Sidebar Collapse/Expand Toggle (>= md) */}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-white/5/60 border border-slate-200/80 dark:border-white/10/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:outline-none active:scale-95 shrink-0"
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Breadcrumbs when inside nested view */}
          {(() => {
            const getBreadcrumbs = () => {
              if (pathname.startsWith('/remediation/')) {
                const id = pathname.split('/')[2] || 'INC-2041';
                return [
                  { label: 'Radar', href: '/' },
                  { label: id, href: `/remediation/${id}` },
                  { label: 'Fix Review', active: true },
                ];
              }
              if (pathname.startsWith('/canary/')) {
                const id = pathname.split('/')[2] || 'INC-2041';
                return [
                  { label: 'Radar', href: '/' },
                  { label: id, href: `/remediation/${id}` },
                  { label: 'Canary Gate', active: true },
                ];
              }
              if (pathname.startsWith('/postmortem/')) {
                const id = pathname.split('/')[2] || 'INC-2041';
                return [
                  { label: 'Radar', href: '/' },
                  { label: id, href: `/remediation/${id}` },
                  { label: 'Post-Mortem', active: true },
                ];
              }
              if (pathname === '/slo') {
                return [{ label: 'Radar', href: '/' }, { label: 'SLO Budgets', active: true }];
              }
              if (pathname === '/history') {
                return [{ label: 'Radar', href: '/' }, { label: 'History', active: true }];
              }
              if (pathname === '/status') {
                return [{ label: 'Radar', href: '/' }, { label: 'Status', active: true }];
              }
              if (pathname === '/settings') {
                return [{ label: 'Radar', href: '/' }, { label: 'Settings', active: true }];
              }
              if (pathname === '/integrations') {
                return [{ label: 'Radar', href: '/' }, { label: 'Integrations', active: true }];
              }
              if (pathname === '/audit') {
                return [{ label: 'Radar', href: '/' }, { label: 'Audit Log', active: true }];
              }
              if (pathname === '/runbooks') {
                return [{ label: 'Radar', href: '/' }, { label: 'Runbooks', active: true }];
              }
              return null;
            };

            const crumbs = getBreadcrumbs();
            if (!crumbs) return null;

            return (
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono shrink min-w-0 max-w-[200px] xl:max-w-[260px] truncate">
                {crumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>}
                    {crumb.active ? (
                      <span className="font-semibold text-slate-900 dark:text-white truncate">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href || '/'}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}

          {/* Desktop Search Trigger (min-width guaranteed) */}
          <button
            onClick={() => {
              setSearchOpen(true);
              setSearchQuery('');
            }}
            className="hidden md:flex flex-1 min-w-[160px] max-w-xs xl:max-w-sm items-center justify-between bg-slate-100/80 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.15] rounded-xl py-2 px-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-white/25 transition-all focus:outline-none shadow-2xs"
          >
            <span className="flex items-center gap-2 truncate pr-1">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Search incidents, actions...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.12] font-mono text-[10px] text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20 shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Icon Trigger (< md) */}
          <button
            onClick={() => {
              setSearchOpen(true);
              setSearchQuery('');
            }}
            aria-label="Open command search"
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100/80 dark:bg-white/5/80 border border-slate-200/80 dark:border-white/10 transition-all shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Elements 2-5: Live Status Dot, Notification Bell, Docs Link, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Element 2: Live Connection Status Dot with subtle pulse */}
          <button
            onClick={() => setConnectionModalOpen(true)}
            title="Click to view live connection telemetry"
            className="hidden md:flex h-9 px-3 items-center gap-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xs text-xs font-medium text-slate-700 dark:text-slate-200 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 shadow-2xs"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {connectionState === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionState === 'connected'
                    ? 'bg-emerald-500'
                    : connectionState === 'reconnecting'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="font-mono text-[11px] tracking-tight">
              {connectionState === 'connected' ? 'Live SSE' : connectionState}
            </span>
          </button>

          {/* Notifications Dropdown Bell (Hidden on small mobile) */}
          <div className="relative hidden sm:block" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-150 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 shadow-2xs active:scale-95"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs pointer-events-none ring-2 ring-[#FAF8F5] dark:ring-[#0A0A0A] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden z-50 flex flex-col shadow-2xl backdrop-blur-xl"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  </div>

                  {/* Render-Style Minimalist Filter Tabs */}
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[11px] font-medium">
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        notifFilter === 'all'
                          ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-semibold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter('unread')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        notifFilter === 'unread'
                          ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-semibold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      onClick={() => setNotifFilter('critical')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        notifFilter === 'critical'
                          ? 'bg-white dark:bg-white/10 text-rose-600 dark:text-rose-400 font-semibold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Critical ({notifications.filter((n) => n.severity === 'critical').length})
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                    {notifications.filter((n) => {
                      if (notifFilter === 'unread') return !n.read;
                      if (notifFilter === 'critical') return n.severity === 'critical';
                      return true;
                    }).length === 0 ? (
                      <div className="py-10 px-4 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {notifFilter === 'unread' ? 'No unread alerts' : notifFilter === 'critical' ? 'No critical incidents' : 'All systems nominal'}
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Zero active cluster disruptions or unacknowledged outages.
                        </p>
                      </div>
                    ) : (
                      notifications
                        .filter((n) => {
                          if (notifFilter === 'unread') return !n.read;
                          if (notifFilter === 'critical') return n.severity === 'critical';
                          return true;
                        })
                        .map((notif) => {
                          const iconMap = {
                            critical: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
                            warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
                            success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
                            info: <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />,
                          };

                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) {
                                  setNotifOpen(false);
                                  router.push(notif.link);
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors flex items-start gap-3 ${
                                !notif.read ? 'bg-slate-50 dark:bg-white/[0.03]' : ''
                              }`}
                            >
                              {iconMap[notif.severity]}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-semibold truncate ${
                                    !notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                                  }`}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                                    {notif.timestamp}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                  {notif.description}
                                </p>
                              </div>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5" />
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50/70 dark:bg-[#0A0A0A] border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                    <Link
                      href="/history"
                      onClick={() => setNotifOpen(false)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-[11px] flex items-center gap-1"
                    >
                      <span>Incident Audit Trail</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={clearAll}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[11px]"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="User account menu"
              aria-expanded={userMenuOpen}
              className="h-9 flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xs text-xs font-medium transition-all duration-150 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:border-indigo-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 shadow-2xs select-none group active:scale-95"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] shadow-xs shrink-0">
                {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'MV')}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                  {user?.name?.split(' ')[0] || 'Marcus'}
                </span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                user?.role === 'Admin'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : user?.role === 'Operator'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {user?.role || 'Operator'}
              </span>
            </button>

            {/* User Dropdown Popover */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 glass-modal rounded-2xl overflow-hidden z-50 flex flex-col shadow-2xl border border-slate-200/90 dark:border-white/10"
                >
                  <div className="p-3.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'MV')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {user?.name || 'Marcus Vance'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {user?.email || 'marcus@somak.ai'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Current Role</span>
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                        user?.role === 'Admin'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          : user?.role === 'Operator'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {user?.role || 'Operator'}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5 text-xs">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings & Team</span>
                    </Link>
                    <Link
                      href="/audit"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>SOC-2 Audit Log</span>
                    </Link>
                    <Link
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Documentation</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        <span>Appearance</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </button>
                  </div>

                  <div className="p-1.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01]">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        router.push('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ⌘K Command Palette Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-xl glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Search Header Input */}
              <div className="flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-white/10/80 gap-3">
                <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDownInSearch}
                  placeholder="Search screens, incidents, cluster actions... (↑↓ to navigate)"
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search overlay"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filtered Commands List */}
              <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                {filteredCommands.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No matching commands found
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const isSelected = idx === selectedIndex;

                    return (
                      <div
                        key={cmd.id}
                        onClick={() => handleCommandSelect(idx)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-600/20 text-indigo-900 dark:text-white font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {cmd.title}
                            </div>
                            {cmd.subtitle && (
                              <div className="text-[11px] text-slate-400 truncate">
                                {cmd.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                            {cmd.category}
                          </span>
                          {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-[#0A0A0A]/40 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/5 font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/5 font-mono text-[10px]">↓</kbd> to navigate</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/5 font-mono text-[10px]">↵</kbd> select</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/5 font-mono text-[10px]">ESC</kbd> dismiss</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Somak AI
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live SSE Telemetry Terminal Card / Modal */}
      <Modal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        maxWidth="max-w-2xl"
        zIndex="z-50"
      >
        {/* Terminal Window Header */}
        <div className="px-5 py-3.5 bg-slate-100/90 dark:bg-black/60 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  SOMAK AI LIVE TELEMETRY
                </span>
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SSE STREAM ACTIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                GET /api/incidents/stream • Protocol: HTTP/2 • Ingress: us-east-1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStreamPaused((p) => !p)}
              title={streamPaused ? 'Resume stream' : 'Pause stream'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              {streamPaused ? <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden sm:inline">{streamPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(streamLogs.join('\n'));
                setCopiedLogs(true);
                setTimeout(() => setCopiedLogs(false), 2000);
              }}
              title="Copy stream logs"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLogs ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => setStreamLogs([`[${new Date().toLocaleTimeString()}] [SSE_CLEARED] Stream log cleared by operator`])}
              title="Clear stream logs"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setConnectionModalOpen(false)}
              aria-label="Close telemetry card"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Streaming Monospace Terminal Body */}
        <div className="p-4 bg-[#07090E] border-b border-slate-800">
          <div className="font-mono text-xs text-slate-300 max-h-72 overflow-y-auto space-y-1.5 scrollbar-thin select-text">
            {streamLogs.map((log, index) => {
              const isHeartbeat = log.includes('[HEARTBEAT]');
              const isTelemetry = log.includes('[TELEMETRY]');
              const isIngest = log.includes('[INGEST]');
              const isSandbox = log.includes('[SANDBOX]');
              const isHandshake = log.includes('[SSE_HANDSHAKE]') || log.includes('[SSE_CONNECTED]');

              return (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none text-[10px] mt-0.5">❯</span>
                  <span className={
                    isHeartbeat
                      ? 'text-emerald-400'
                      : isTelemetry
                      ? 'text-cyan-400'
                      : isIngest
                      ? 'text-indigo-300'
                      : isSandbox
                      ? 'text-amber-300'
                      : isHandshake
                      ? 'text-emerald-300 font-semibold'
                      : 'text-slate-300'
                  }>
                    {log}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Metric Stats Bar & Controls */}
        <div className="p-4 bg-slate-50/70 dark:bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="grid grid-cols-3 gap-4 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Latency RTT</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">12ms</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Packet Loss</span>
              <strong className="text-slate-700 dark:text-slate-300 font-bold">0.00%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Workspace</span>
              <strong className="text-slate-700 dark:text-slate-300 font-bold truncate block max-w-28">
                {currentOrg?.name || 'Workspace'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-lg bg-slate-200/80 dark:bg-white/10 w-44">
              <button
                type="button"
                onClick={() => setConnectionState('connected')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                  connectionState === 'connected'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => setConnectionState('reconnecting')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                  connectionState === 'reconnecting'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Reconn
              </button>
              <button
                type="button"
                onClick={() => setConnectionState('offline')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                  connectionState === 'offline'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Offline
              </button>
            </div>

            <button
              onClick={() => setConnectionModalOpen(false)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
