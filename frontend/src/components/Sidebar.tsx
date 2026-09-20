"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Radar,
  Terminal,
  Gauge,
  FileText,
  History,
  Activity,
  Settings,
  Users,
  Cpu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Command,
  LogOut,
  Check,
  Building2,
  Lock,
  Target,
  Radio,
  BookOpen,
  ShieldCheck,
  Layers,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import OnboardingTour from './OnboardingTour';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  incidentId?: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  incidentId = 'INC-2041',
}: SidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const { currentOrg, currentRole, userOrgs, switchOrg } = useOrg();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        {
          id: 'radar',
          label: 'Incident Radar',
          href: '/',
          icon: Radar,
        },
        {
          id: 'slo',
          label: 'Error Budgets & SLOs',
          href: '/slo',
          icon: Target,
        },
        {
          id: 'history',
          label: 'Audit History',
          href: '/history',
          icon: History,
        },
        {
          id: 'status',
          label: 'Public Status',
          href: '/status',
          icon: Activity,
        },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        {
          id: 'studio',
          label: 'Remediation Studio',
          href: `/remediation/${incidentId}`,
          icon: Terminal,
          badge: 'SEV-1',
          badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20',
        },
        {
          id: 'canary',
          label: 'Canary Verification',
          href: `/canary/${incidentId}`,
          icon: Gauge,
        },
        {
          id: 'postmortem',
          label: 'Post-Mortem & Audit',
          href: `/postmortem/${incidentId}`,
          icon: FileText,
        },
        {
          id: 'oncall',
          label: 'On-Call Rotation',
          href: '/oncall',
          icon: Radio,
          badge: 'LIVE',
          badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        },
        {
          id: 'runbooks',
          label: 'Runbook Library',
          href: '/runbooks',
          icon: BookOpen,
        },
      ],
    },
    {
      group: 'PLATFORM',
      items: [
        {
          id: 'settings',
          label: 'Settings & RBAC',
          href: '/settings',
          icon: Settings,
        },
        {
          id: 'integrations',
          label: 'Integrations',
          href: '/integrations',
          icon: Layers,
        },
        {
          id: 'audit',
          label: 'Admin Audit Log',
          href: '/audit',
          icon: ShieldCheck,
        },
        {
          id: 'usage',
          label: 'Usage & Quotas',
          href: '/usage',
          icon: Cpu,
        },
        {
          id: 'changelog',
          label: 'Changelog',
          href: '/changelog',
          icon: Sparkles,
        },
        {
          id: 'docs',
          label: 'Documentation',
          href: '/docs',
          icon: HelpCircle,
        },
      ],
    },
  ];

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'Operator':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'Viewer':
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <>
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-all duration-200 ease-in-out border-r border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/70 backdrop-blur-2xl shadow-xl select-none ${
          isMobileDrawer
            ? 'w-72 inset-y-0'
            : collapsed
            ? 'w-[72px]'
            : 'w-60'
        }`}
      >
        {/* Top: Logo & Workspace Switcher */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => isMobileDrawer && onCloseMobileDrawer?.()}
              className="flex items-center gap-2.5 group overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              {(!collapsed || isMobileDrawer) && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    Somak AI
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      SRE
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Autonomous Reliability
                  </span>
                </div>
              )}
            </Link>

            {/* Header Action Icons: Tour Help + Collapse */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTourOpen(true)}
                title="Start 4-step architecture tour (?)"
                aria-label="Start product tour"
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {!isMobileDrawer && (
                <button
                  onClick={onToggleCollapse}
                  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Workspace / Org Switcher Dropdown */}
          {(!collapsed || isMobileDrawer) && (
            <div className="relative mt-1" ref={workspaceRef}>
              <button
                onClick={() => setWorkspaceOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currentOrg?.name || 'Acme Corp'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${getRoleBadgeColor(currentRole)}`}>
                    {currentRole}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </button>

              <AnimatePresence>
                {workspaceOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 right-0 top-full mt-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 space-y-0.5"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Your Organizations
                    </div>
                    {userOrgs.map((item) => {
                      const isSelected = currentOrg?.id === item.organization.id;
                      return (
                        <button
                          key={item.organization.id}
                          onClick={() => {
                            switchOrg(item.organization.id);
                            setWorkspaceOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate">{item.organization.name}</span>
                          <div className="flex items-center gap-1 shrink-0 ml-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${getRoleBadgeColor(item.role)}`}>
                              {item.role}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}

                    <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href="/onboarding/create-org"
                        onClick={() => setWorkspaceOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Create new organization</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              {(!collapsed || isMobileDrawer) && (
                <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {group.group}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => isMobileDrawer && onCloseMobileDrawer?.()}
                    title={collapsed && !isMobileDrawer ? item.label : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-indigo-50/80 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                    } ${collapsed && !isMobileDrawer ? 'justify-center px-2' : ''}`}
                  >
                    {/* Active Accent Border Indicator on the Left */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />

                    {(!collapsed || isMobileDrawer) && (
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                    )}

                    {(!collapsed || isMobileDrawer) && item.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
                          item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom: User Profile Pill & Quick Actions */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className={`w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all text-left ${
              collapsed && !isMobileDrawer ? 'justify-center p-1' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              {user?.avatar || 'OP'}
            </div>

            {(!collapsed || isMobileDrawer) && (
              <div className="flex-1 min-w-0 leading-tight">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Operator'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getRoleBadgeColor(user?.role || 'Operator')}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            )}

            {(!collapsed || isMobileDrawer) && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            )}
          </button>

          {/* User Popover Menu */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.14 }}
                className="absolute left-2 right-2 bottom-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1"
              >
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user?.email}
                  </div>
                </div>

                {/* Quick Role Switcher */}
                <div className="p-1 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Quick Role (RBAC)
                  </span>
                  {(['Admin', 'Operator', 'Viewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs ${
                        user?.role === r
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setTourOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Product Tour</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Onboarding Product Tour Modal */}
      <OnboardingTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
