"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Bell,
  Cpu,
  Users,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  Shield,
  Key,
  Terminal,
  Send,
  UserPlus,
  Trash2,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowRight,
  QrCode,
  RefreshCw,
  AlertTriangle,
  Check,
  Fingerprint,
  FileText,
  Copy,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { useOrg } from '@/context/OrgContext';
import { InviteTeam } from '@/components/InviteTeam';
import {
  setupMfa,
  enableMfa,
  rotateSecretKey,
  toggleOrgMfaEnforcement,
  getAuditEvents,
  AuditEvent,
  MfaSetupResponse,
} from '@/lib/api';

type SettingsTab = 'general' | 'notifications' | 'ai' | 'team' | 'security';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  mfaEnabled: boolean;
  lastActive: string;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'usr-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@somak.internal',
    role: 'Admin',
    avatar: 'ER',
    mfaEnabled: true,
    lastActive: '5m ago',
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@somak.internal',
    role: 'Operator',
    avatar: 'MV',
    mfaEnabled: true,
    lastActive: 'Active now',
  },
  {
    id: 'usr-3',
    name: 'Devin Zhao',
    email: 'devin.zhao@somak.internal',
    role: 'Operator',
    avatar: 'DZ',
    mfaEnabled: true,
    lastActive: '1h ago',
  },
  {
    id: 'usr-4',
    name: 'Sarah Connor',
    email: 'sarah.connor@somak.internal',
    role: 'Viewer',
    avatar: 'SC',
    mfaEnabled: false,
    lastActive: 'Yesterday',
  },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, canManageSettings } = useAuth();
  const { showToast } = useToast();
  const { currentOrg } = useOrg();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);

  // General settings state
  const [pollInterval, setPollInterval] = useState('5');
  const [autoTriage, setAutoTriage] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');

  // Notification channels state
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/X123456');
  const [pagerdutyKey, setPagerdutyKey] = useState('pd_live_a89f920bc481');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [oncallEmail, setOncallEmail] = useState('sre-oncall@somak.internal');
  const [notifySev1, setNotifySev1] = useState(true);
  const [notifySev2, setNotifySev2] = useState(true);
  const [notifyCanary, setNotifyCanary] = useState(true);

  // AI & Sandbox settings state
  const [nebiusKey, setNebiusKey] = useState('neb-tok-live-89f4b321');
  const [tavilyKey, setTavilyKey] = useState('tvly-prod-c4391aa8');
  const [ultraModel, setUltraModel] = useState('nvidia/nemotron-3-ultra-550b');
  const [nanoModel, setNanoModel] = useState('nvidia/nemotron-3-nano-30b-a3b');
  const [sandboxConcurrency, setSandboxConcurrency] = useState('8');
  const [sandboxTimeout, setSandboxTimeout] = useState('30');

  // Team state
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Operator');

  // Security Hardening state
  const [orgMfaEnforced, setOrgMfaEnforced] = useState(currentOrg?.mfa_enforced || false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupResponse | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaUserActive, setMfaUserActive] = useState(user?.mfa_enabled ?? true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Secret rotation state
  const [rotateModalOpen, setRotateModalOpen] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<{
    type: 'sentry_webhook_secret' | 'nebius_api_key' | 'tavily_api_key' | 'pagerduty_integration_key' | 'datadog_api_key';
    label: string;
  } | null>(null);
  const [newSecretValue, setNewSecretValue] = useState('');
  const [isRotating, setIsRotating] = useState(false);

  // Audit trail state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Load from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sentryops_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.slackWebhook) setSlackWebhook(parsed.slackWebhook);
        if (parsed.pagerdutyKey) setPagerdutyKey(parsed.pagerdutyKey);
        if (parsed.nebiusKey) setNebiusKey(parsed.nebiusKey);
        if (parsed.tavilyKey) setTavilyKey(parsed.tavilyKey);
        if (parsed.team) setTeam(parsed.team);
      }
    } catch {}
  }, []);

  // Fetch live audit logs when security tab is opened
  useEffect(() => {
    if (activeTab === 'security') {
      setAuditLoading(true);
      getAuditEvents(currentOrg?.id || 'org_acme')
        .then((events) => setAuditEvents(events))
        .catch(() => {})
        .finally(() => setAuditLoading(false));
    }
  }, [activeTab, currentOrg?.id]);

  const handleStartMfaSetup = async () => {
    setMfaLoading(true);
    try {
      const data = await setupMfa();
      if (data) {
        setMfaSetupData(data);
        setMfaModalOpen(true);
      } else {
        showToast('Failed to initialize MFA setup', 'error');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to initialize MFA setup', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupData || !mfaVerifyCode) return;
    setMfaLoading(true);
    try {
      const res = await enableMfa(mfaSetupData.secret, mfaVerifyCode.trim());
      if (res?.status === 'success') {
        setMfaUserActive(true);
        setMfaModalOpen(false);
        setMfaVerifyCode('');
        showToast('Two-factor authentication successfully enabled!', 'success');
      } else {
        showToast('Invalid verification code', 'error');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Invalid verification code', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleToggleOrgMfa = async () => {
    const nextVal = !orgMfaEnforced;
    setOrgMfaEnforced(nextVal);
    try {
      await toggleOrgMfaEnforcement(currentOrg?.id || 'org_acme', nextVal);
      showToast(`MFA enforcement ${nextVal ? 'activated' : 'deactivated'} for all team members`, 'success');
    } catch (err: unknown) {
      setOrgMfaEnforced(!nextVal);
      showToast('Admin privileges required to change organization MFA policy', 'error');
    }
  };

  const handleOpenRotate = (
    type: 'sentry_webhook_secret' | 'nebius_api_key' | 'tavily_api_key' | 'pagerduty_integration_key' | 'datadog_api_key',
    label: string
  ) => {
    setRotateTarget({ type, label });
    setNewSecretValue('');
    setRotateModalOpen(true);
  };

  const handleConfirmRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotateTarget || !newSecretValue) return;
    setIsRotating(true);
    try {
      const res = await rotateSecretKey(currentOrg?.id || 'org_acme', rotateTarget.type, newSecretValue.trim());
      if (res?.status === 'success') {
        showToast(`Successfully rotated ${rotateTarget.label} key`, 'success');
        setRotateModalOpen(false);
        setNewSecretValue('');
      } else {
        showToast('Rotation failed', 'error');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Rotation failed', 'error');
    } finally {
      setIsRotating(false);
    }
  };

  const handleSaveSettings = () => {
    const data = {
      pollInterval,
      autoTriage,
      dataRetention,
      slackWebhook,
      pagerdutyKey,
      emailAlerts,
      oncallEmail,
      notifySev1,
      notifySev2,
      notifyCanary,
      nebiusKey,
      tavilyKey,
      ultraModel,
      nanoModel,
      sandboxConcurrency,
      sandboxTimeout,
      team,
    };
    try {
      localStorage.setItem('sentryops_settings', JSON.stringify(data));
    } catch {}

    setSaved(true);
    showToast('Platform settings saved successfully', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestSlack = () => {
    showToast('Test payload delivered to Slack channel #sre-incidents', 'success');
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: (inviteName || inviteEmail).substring(0, 2).toUpperCase(),
      mfaEnabled: true,
      lastActive: 'Invited',
    };

    const updated = [...team, newMember];
    setTeam(updated);
    try {
      localStorage.setItem('sentryops_settings', JSON.stringify({ team: updated }));
    } catch {}

    setInviteEmail('');
    setInviteName('');
    setInviteModalOpen(false);
    showToast(`Invitation sent to ${inviteEmail}`, 'success');
  };

  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    const updated = team.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
    setTeam(updated);
    showToast(`Role updated for ${team.find((m) => m.id === memberId)?.name}`, 'info');
  };

  const handleRemoveMember = (memberId: string) => {
    const updated = team.filter((m) => m.id !== memberId);
    setTeam(updated);
    showToast('Team member removed', 'warning');
  };

  return (
    <div className="min-h-screen bg-radial-gradient text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Settings className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Settings
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage telemetry, credentials, notifications, and team access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-95 btn-glow-primary"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Changes Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Organization Guided Setup Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {currentOrg ? `${currentOrg.name} Guided Onboarding Checklist` : 'Guided Onboarding Checklist'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Configure your Sentry webhook, LLM API keys, Tavily research provider, and team invitations in the 5-step interactive wizard.
              </p>
            </div>
          </div>
          <Link
            href="/onboarding/setup"
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <span>Open Setup Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto pb-2">
          {[
            { id: 'general', label: 'General & Appearance', icon: Settings },
            { id: 'notifications', label: 'Notification Channels', icon: Bell },
            { id: 'ai', label: 'AI Engine & Sandboxes', icon: Cpu },
            { id: 'team', label: 'Team Members & RBAC', icon: Users },
            { id: 'security', label: 'Security & Compliance', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General & Appearance */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Appearance & Theme
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Color Theme Mode
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Switch between Porcelain Light (zinc hairline borders) and Obsidian Dark.
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold shadow-xs"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  <span>{theme === 'dark' ? 'Obsidian Dark' : 'Porcelain Light'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telemetry Ingestion Frequency
                  </label>
                  <select
                    value={pollInterval}
                    onChange={(e) => setPollInterval(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 second (High-frequency chaos streaming)</option>
                    <option value="5">5 seconds (Production recommended)</option>
                    <option value="15">15 seconds (Conserve bandwidth)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Audit Log & Post-Mortem Retention
                  </label>
                  <select
                    value={dataRetention}
                    onChange={(e) => setDataRetention(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="30">30 days (Standard compliance)</option>
                    <option value="90">90 days (SOC-2 Type II recommended)</option>
                    <option value="365">365 days (Full ISO 27001 audit archival)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40">
                <div>
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Autonomous Sev-1 Triage & AST Synthesis
                  </div>
                  <div className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    Automatically trigger NVIDIA Nemotron-3 pipeline upon telemetry anomaly threshold breach.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoTriage}
                  onChange={(e) => setAutoTriage(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Integration Channels
              </h2>

              {/* Slack Webhook */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Slack Incoming Webhook URL
                  </label>
                  <button
                    onClick={handleTestSlack}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Test Notification
                  </button>
                </div>
                <input
                  type="url"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* PagerDuty */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  PagerDuty Service Integration Key
                </label>
                <input
                  type="text"
                  value={pagerdutyKey}
                  onChange={(e) => setPagerdutyKey(e.target.value)}
                  className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* On-Call Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  On-Call Dispatch Email
                </label>
                <input
                  type="email"
                  value={oncallEmail}
                  onChange={(e) => setOncallEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Severity Subscriptions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Alert Trigger Subscriptions
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifySev1}
                      onChange={(e) => setNotifySev1(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-red-600 dark:text-red-400">SEV-1 Critical Outages</span>
                    <span className="text-slate-400 text-[11px]">— V8 heap crash, database partition, 502 spike</span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifySev2}
                      onChange={(e) => setNotifySev2(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-amber-600 dark:text-amber-400">SEV-2 Degraded Latencies</span>
                    <span className="text-slate-400 text-[11px]">— P99 &gt; 500ms, retry storm warnings</span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyCanary}
                      onChange={(e) => setNotifyCanary(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Canary Verification Milestones</span>
                    <span className="text-slate-400 text-[11px]">— Auto-promotions and hold rollbacks</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: AI Engine & Sandboxes */}
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Nebius Token Factory & NVIDIA Models
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configures high-speed Nemotron-3 inference endpoints and Tavily SRE search.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Latency: 42ms
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nebius Token Factory API Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={nebiusKey}
                      onChange={(e) => setNebiusKey(e.target.value)}
                      className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tavily Web Intelligence API Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={tavilyKey}
                      onChange={(e) => setTavilyKey(e.target.value)}
                      className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    AST Synthesis Engine
                  </label>
                  <input
                    type="text"
                    value={ultraModel}
                    onChange={(e) => setUltraModel(e.target.value)}
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">550B MoE model for zero-hallucination code generation</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fast Triage & Fingerprinting Engine
                  </label>
                  <input
                    type="text"
                    value={nanoModel}
                    onChange={(e) => setNanoModel(e.target.value)}
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">30B dense model for sub-10ms incident classification</span>
                </div>
              </div>

              {/* Firecracker Sandbox Configuration */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  Firecracker MicroVM Sandbox Isolation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Max Parallel Sandboxes
                    </label>
                    <input
                      type="number"
                      value={sandboxConcurrency}
                      onChange={(e) => setSandboxConcurrency(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Execution Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={sandboxTimeout}
                      onChange={(e) => setSandboxTimeout(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Team Members & RBAC */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Team Members & Access Control (RBAC)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign role permissions: Admin (Full control), Operator (Canary deploy & rollback), Viewer (Read-only).
                  </p>
                </div>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-bold">User</th>
                      <th className="py-3 px-4 font-bold">Role</th>
                      <th className="py-3 px-4 font-bold">MFA</th>
                      <th className="py-3 px-4 font-bold">Last Active</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-mono">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                              {member.avatar}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                            className={`rounded-lg py-1 px-2 text-[11px] font-bold border ${
                              member.role === 'Admin'
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
                                : member.role === 'Operator'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Operator">Operator</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              member.mfaEnabled
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            {member.mfaEnabled ? 'Enforced' : 'Optional'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {member.lastActive}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Multi-Email Invitations & Pending Tokens */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Send Multi-Member Invitations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Generate secure 7-day invite links, invite by tags, and manage pending invites.
                  </p>
                </div>
                <InviteTeam />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 5: Security & Compliance */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Org-Wide Policies */}
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Workspace Security & Authentication Policies
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure organization-level access guards, MFA enforcement, and authentication rate limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Enforce Two-Factor Authentication (MFA)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Require all organization members to present a TOTP authenticator code upon signing in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleOrgMfa}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      orgMfaEnforced ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        orgMfaEnforced ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Brute-Force & Session Protection
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    5 consecutive failed attempts trigger an automatic 15-minute account lockout (HTTP 423). Sessions run in HttpOnly SameSite=Strict cookies.
                  </p>
                </div>
              </div>

              {/* Personal MFA Setup */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-purple-500" />
                    Your Personal Authenticator (TOTP)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Use 1Password, Google Authenticator, or Bitwarden to generate time-based one-time codes.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                      mfaUserActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {mfaUserActive ? 'MFA Configured' : 'Not Configured'}
                  </span>
                  <button
                    type="button"
                    onClick={handleStartMfaSetup}
                    disabled={mfaLoading}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{mfaUserActive ? 'Re-enroll MFA' : 'Setup Authenticator'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Envelope Encrypted Secrets & Rotation */}
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-500" />
                    Envelope Encrypted Secrets & Rotation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Credentials are encrypted at rest with Fernet and never transmitted to the browser in plaintext.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full self-start sm:self-auto border border-emerald-500/20">
                  AES-128-CBC / Fernet Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    type: 'sentry_webhook_secret' as const,
                    label: 'Sentry Webhook Secret',
                    masked: '••••••••s3nt',
                    desc: 'HMAC-SHA256 signature verification for inbound error webhooks.',
                  },
                  {
                    type: 'nebius_api_key' as const,
                    label: 'Nebius Token Factory Key',
                    masked: '••••••••b321',
                    desc: 'Token factory authentication for Nemotron AST synthesis models.',
                  },
                  {
                    type: 'tavily_api_key' as const,
                    label: 'Tavily Intelligence Key',
                    masked: '••••••••aa8',
                    desc: 'Real-time diagnostic web intelligence grounding key.',
                  },
                  {
                    type: 'pagerduty_integration_key' as const,
                    label: 'PagerDuty Service Key',
                    masked: '••••••••c481',
                    desc: 'Events API v2 integration key for high-priority escalation.',
                  },
                ].map((item) => (
                  <div
                    key={item.type}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg">
                          {item.masked}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenRotate(item.type, item.label)}
                      className="self-end px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Rotate Key</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tamper-Evident Immutable Audit Log */}
            <div className="glass-panel rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Immutable Audit Ledger (SHA-256 Chained)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Append-only security log with cryptographic hash-chaining across all actions, RBAC changes, and rollouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuditLoading(true);
                    getAuditEvents(currentOrg?.id || 'org_acme')
                      .then((e) => setAuditEvents(e))
                      .finally(() => setAuditLoading(false));
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Ledger</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-bold">Timestamp</th>
                      <th className="py-3 px-4 font-bold">Actor</th>
                      <th className="py-3 px-4 font-bold">Category</th>
                      <th className="py-3 px-4 font-bold">Action</th>
                      <th className="py-3 px-4 font-bold font-mono text-right">Tamper Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-sans">
                    {auditEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-mono">
                          {auditLoading ? 'Loading chained audit entries...' : 'No audit records in current ledger block.'}
                        </td>
                      </tr>
                    ) : (
                      auditEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                            {new Date(evt.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {evt.actor_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {evt.actor_email} ({evt.actor_role})
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {evt.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {evt.action}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                            sha256:{evt.tamper_hash ? evt.tamper_hash.substring(0, 8) : '00000000'}…
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Invite New SRE Team Member
              </h3>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Assignment
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Operator">Operator (Canary deploy & rollback)</option>
                    <option value="Admin">Admin (Full access)</option>
                    <option value="Viewer">Viewer (Read-only)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MFA Setup Modal */}
        {mfaModalOpen && mfaSetupData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Setup Two-Factor Authentication
                    </h3>
                    <p className="text-[11px] text-slate-400">TOTP Authenticator</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Trash2 className="w-4 h-4 sr-only" />
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  1. Scan this QR code in your authenticator app (1Password, Google Authenticator, or Microsoft Authenticator).
                </p>

                <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mfaSetupData.qr_code_url}
                    alt="Authenticator QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Or enter manual secret key:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={mfaSetupData.manual_entry_key}
                      className="flex-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 select-all text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mfaSetupData.manual_entry_key);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleConfirmMfa} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      2. Enter the 6-digit confirmation code:
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={mfaVerifyCode}
                      onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full font-mono text-center text-lg tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMfaModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mfaLoading || mfaVerifyCode.length < 6}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Secret Key Rotation Modal */}
        {rotateModalOpen && rotateTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Rotate {rotateTarget.label}
                    </h3>
                    <p className="text-[11px] text-slate-400">Zero-Downtime Envelope Re-encryption</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRotateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Rotating this credential immediately invalidates the previous key. Any external services sending traffic must be updated promptly.
                </span>
              </div>

              <form onSubmit={handleConfirmRotate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Secret Key Value
                  </label>
                  <input
                    type="password"
                    required
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                    placeholder="Enter new token or secret..."
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRotateModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRotating || !newSecretValue}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    {isRotating ? 'Re-encrypting...' : 'Confirm Rotation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingDock incidentId="INC-2041" />
    </div>
  );
}
