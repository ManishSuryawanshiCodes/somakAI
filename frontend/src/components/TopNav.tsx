"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAppShell } from './AppShell';
import OnboardingTour from './OnboardingTour';

interface TopNavProps {
  onSimulate?: () => void;
  isSimulating?: boolean;
}

export default function TopNav({ onSimulate, isSimulating = false }: TopNavProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { sidebarCollapsed, toggleSidebar, setMobileDrawerOpen } = useAppShell();

  // Modals & Menus
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'offline'>('connected');

  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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
      title: 'INC-1892: payment-gateway Stripe Webhook Timeout',
      subtitle: 'SEV-2 • Resolved • MTTR 3m 50s',
      icon: CheckCircle2,
      action: () => router.push('/postmortem/INC-2041'),
    },
    {
      id: 'nav-tour',
      category: 'Actions',
      title: 'Start Architecture Tour',
      subtitle: 'Guided walkthrough of Somak AI architecture',
      icon: Sparkles,
      action: () => setTourOpen(true),
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
      <header className="sticky top-0 z-30 h-16 backdrop-blur-xl bg-[#FAF8F5]/85 dark:bg-[#030306]/85 border-b border-[#E8E3D9] dark:border-white/10 px-3 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
        {/* Element 1: Global Search / ⌘K (+ Mobile Drawer Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 max-w-md">
          {/* Mobile Hamburger Drawer Trigger (< md) */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 transition-all focus:outline-none active:scale-95"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop/Laptop Sidebar Collapse/Expand Toggle (>= md) */}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:outline-none active:scale-95 shrink-0"
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Desktop Search Trigger (⌘K) */}
          <button
            onClick={() => {
              setSearchOpen(true);
              setSearchQuery('');
            }}
            className="hidden md:flex w-full items-center justify-between bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl py-2 px-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:outline-none shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search incidents, telemetry, actions...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
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
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 transition-all"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Elements 2-5: Live Status Dot, Notification Bell, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Element 2: Live Connection Status Dot */}
          <button
            onClick={() => setConnectionModalOpen(true)}
            title="Click to view live connection telemetry"
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-full border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors focus:outline-none shadow-2xs"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-emerald-500 animate-pulse glow-healthy'
                  : connectionState === 'reconnecting'
                  ? 'bg-amber-500 animate-ping glow-warning'
                  : 'bg-red-500 glow-critical'
              }`}
            />
            <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] tracking-tight">
              {connectionState === 'connected' ? 'Live SSE' : connectionState}
            </span>
          </button>

          {/* Notifications Dropdown Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notifications"
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
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
                  className="absolute right-0 mt-2 w-80 sm:w-96 glass-modal rounded-2xl overflow-hidden z-50 flex flex-col"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
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

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => {
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
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-start gap-3 ${
                              !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
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
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {notif.timestamp}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                {notif.description}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <Link
                      href="/history"
                      onClick={() => setNotifOpen(false)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-[11px]"
                    >
                      Audit Trail &rarr;
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

          {/* Docs Hub Link */}
          <Link
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            title="Open Somak AI Documentation"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Docs</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* User Profile Pill */}
          <Link
            href="/settings"
            title={`Signed in as ${user?.name || 'Marcus Vance'} (${user?.role || 'Operator'})`}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500/40 transition-all select-none group"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'MV')}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                {user?.name?.split(' ')[0] || 'Marcus'}
              </span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
              user?.role === 'Admin'
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                : user?.role === 'Operator'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {user?.role || 'Operator'}
            </span>
          </Link>
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
              <div className="flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 gap-3">
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
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
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
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
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
              <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↓</kbd> to navigate</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↵</kbd> select</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">ESC</kbd> dismiss</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Somak AI
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connection State Info Modal */}
      <AnimatePresence>
        {connectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-modal rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse glow-healthy" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Telemetry Connection
                  </h3>
                </div>
                <button
                  onClick={() => setConnectionModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Transport:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">Server-Sent Events (SSE)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Ingress Region:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">us-east-1 (N. Virginia)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Stream RTT:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">12ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Packet Loss:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">0.00%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Simulate State:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConnectionState('connected')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        connectionState === 'connected' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Live
                    </button>
                    <button
                      onClick={() => setConnectionState('reconnecting')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        connectionState === 'reconnecting' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Reconn
                    </button>
                    <button
                      onClick={() => setConnectionState('offline')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        connectionState === 'offline' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Offline
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setConnectionModalOpen(false)}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors btn-glow-primary"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Onboarding Product Tour Modal */}
      <OnboardingTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
