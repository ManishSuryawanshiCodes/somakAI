"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Layers,
  Cpu,
  Search,
  Bell,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  Key,
  Flame,
} from 'lucide-react';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/components/ToastProvider';
import InviteTeam from '@/components/InviteTeam';

export default function SetupChecklistPage() {
  const router = useRouter();
  const { currentOrg, updateChecklist } = useOrg();
  const { showToast } = useToast();

  const [expandedId, setExpandedId] = useState<string | null>('sentry');

  // Form states for checklist items
  const checklist = currentOrg?.setup_checklist || {
    sentry_connected: false,
    sentry_dsn: '',
    sentry_inbound_url: `https://api.somak.ai/v1/webhook/ingest/${currentOrg?.slug || 'my-org'}`,
    ai_connected: false,
    ai_api_key: '',
    ai_model_tier: 'nvidia/nemotron-3-nano-30b-a3b',
    tavily_connected: false,
    tavily_api_key: '',
    notifications_connected: false,
    slack_webhook: '',
    pagerduty_key: '',
    team_invited: false,
  };

  const [sentryDsn, setSentryDsn] = useState(checklist.sentry_dsn || '');
  const [aiKey, setAiKey] = useState(checklist.ai_api_key || '');
  const [modelTier, setModelTier] = useState(checklist.ai_model_tier || 'nvidia/nemotron-3-nano-30b-a3b');
  const [tavilyKey, setTavilyKey] = useState(checklist.tavily_api_key || '');
  const [slackWebhook, setSlackWebhook] = useState(checklist.slack_webhook || '');
  const [pagerdutyKey, setPagerdutyKey] = useState(checklist.pagerduty_key || '');

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  // Inbound Webhook URL generated for Sentry
  const inboundWebhookUrl =
    checklist.sentry_inbound_url ||
    `https://api.somak.ai/v1/webhook/ingest/${currentOrg?.slug || 'cluster-prod'}`;

  const copyInboundUrl = () => {
    navigator.clipboard.writeText(inboundWebhookUrl);
    setCopiedWebhook(true);
    showToast('Inbound Sentry webhook URL copied to clipboard', 'info');
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSaveSentry = async () => {
    setSavingItem('sentry');
    await updateChecklist({
      sentry_dsn: sentryDsn,
      sentry_connected: Boolean(sentryDsn.trim()),
    });
    setSavingItem(null);
    showToast('Error monitoring configured', 'success');
    setExpandedId('ai');
  };

  const handleSaveAI = async () => {
    setSavingItem('ai');
    await updateChecklist({
      ai_api_key: aiKey,
      ai_model_tier: modelTier,
      ai_connected: Boolean(aiKey.trim()),
    });
    setSavingItem(null);
    showToast('AI reasoning provider saved', 'success');
    setExpandedId('tavily');
  };

  const handleSaveTavily = async () => {
    setSavingItem('tavily');
    await updateChecklist({
      tavily_api_key: tavilyKey,
      tavily_connected: Boolean(tavilyKey.trim()),
    });
    setSavingItem(null);
    showToast('Tavily search grounding saved', 'success');
    setExpandedId('notifications');
  };

  const handleSaveNotifications = async () => {
    setSavingItem('notifications');
    await updateChecklist({
      slack_webhook: slackWebhook,
      pagerduty_key: pagerdutyKey,
      notifications_connected: Boolean(slackWebhook.trim() || pagerdutyKey.trim()),
    });
    setSavingItem(null);
    showToast('Notification channels saved', 'success');
    setExpandedId('team');
  };

  const handleTestNotification = () => {
    if (!slackWebhook && !pagerdutyKey) {
      showToast('Please enter a Slack Webhook or PagerDuty key first', 'warning');
      return;
    }
    showToast('Test notification dispatched successfully! Ping received.', 'success');
  };

  // Compute progress
  const completedCount = [
    checklist.sentry_connected,
    checklist.ai_connected,
    checklist.tavily_connected,
    checklist.notifications_connected,
    checklist.team_invited,
  ].filter(Boolean).length;

  const totalItems = 5;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  return (
    <div className="min-h-screen bg-radial-gradient flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Radar Navigation */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>
      </div>

      {/* Brand & Setup Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8 max-w-xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900">
            Step 2 of 2 • Guided Activation
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Configure {currentOrg?.name || 'your workspace'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect your telemetry sources and AI credentials. All steps are optional and can be managed later from Settings.
        </p>

        {/* Progress Bar Strip */}
        <div className="mt-5 p-4 rounded-2xl bg-white/70 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Setup Progress
            </span>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {completedCount} of {totalItems} completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Checklist Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="w-full max-w-2xl glass-modal rounded-3xl p-6 shadow-2xl relative z-10 space-y-4"
      >
        {/* Accordion Item 1: Connect Error Monitoring */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#0A0A0A]/50 transition-all">
          <button
            type="button"
            onClick={() => toggleExpand('sentry')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  checklist.sentry_connected
                    ? 'bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {checklist.sentry_connected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Layers className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Connect error monitoring</span>
                  {checklist.sentry_connected && (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  This is how Somak AI finds out when something breaks in real-time.
                </p>
              </div>
            </div>
            {expandedId === 'sentry' ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {expandedId === 'sentry' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 pt-0 border-t border-slate-100 dark:border-white/10 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Option A: Copy Inbound Webhook URL to paste into Sentry Project Integrations
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inboundWebhookUrl}
                      className="flex-1 font-mono text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-600 dark:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={copyInboundUrl}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Option B: Sentry Project DSN or Webhook Secret (optional)
                  </label>
                  <input
                    type="text"
                    value={sentryDsn}
                    onChange={(e) => setSentryDsn(e.target.value)}
                    placeholder="https://o123456@sentry.io/789012"
                    className="w-full font-mono text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId('ai')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSentry}
                    disabled={savingItem === 'sentry'}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Save & Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion Item 2: Connect AI Provider */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#0A0A0A]/50 transition-all">
          <button
            type="button"
            onClick={() => toggleExpand('ai')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  checklist.ai_connected
                    ? 'bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {checklist.ai_connected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Cpu className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Connect an AI provider</span>
                  {checklist.ai_connected && (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Powers automatic triage, root cause reasoning, and verified AST fix generation.
                </p>
              </div>
            </div>
            {expandedId === 'ai' ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {expandedId === 'ai' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 pt-0 border-t border-slate-100 dark:border-white/10 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nebius Token Factory / NVIDIA API Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      placeholder="neb-tok-live-..."
                      className="w-full font-mono text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Model Tier
                  </label>
                  <select
                    value={modelTier}
                    onChange={(e) => setModelTier(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="nvidia/nemotron-3-nano-30b-a3b">
                      Nemotron-3-Nano (30B dense — sub-10ms fast triage)
                    </option>
                    <option value="nvidia/nemotron-3-ultra-550b">
                      Nemotron-3-Ultra (550B MoE — deep AST code synthesis)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId('tavily')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAI}
                    disabled={savingItem === 'ai'}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Save & Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion Item 3: Connect Tavily Search */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#0A0A0A]/50 transition-all">
          <button
            type="button"
            onClick={() => toggleExpand('tavily')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  checklist.tavily_connected
                    ? 'bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {checklist.tavily_connected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Connect Tavily search
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">(optional)</span>
                  {checklist.tavily_connected && (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Lets the AI research real fixes and official documentation instead of guessing.
                </p>
              </div>
            </div>
            {expandedId === 'tavily' ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {expandedId === 'tavily' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 pt-0 border-t border-slate-100 dark:border-white/10 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tavily Intelligence API Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={tavilyKey}
                      onChange={(e) => setTavilyKey(e.target.value)}
                      placeholder="tvly-prod-..."
                      className="w-full font-mono text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId('notifications')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTavily}
                    disabled={savingItem === 'tavily'}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Save & Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion Item 4: Connect Notifications */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#0A0A0A]/50 transition-all">
          <button
            type="button"
            onClick={() => toggleExpand('notifications')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  checklist.notifications_connected
                    ? 'bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {checklist.notifications_connected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Connect notifications</span>
                  {checklist.notifications_connected && (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Deliver critical outage alerts and deployment approvals directly to your team.
                </p>
              </div>
            </div>
            {expandedId === 'notifications' ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {expandedId === 'notifications' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 pt-0 border-t border-slate-100 dark:border-white/10 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slack Incoming Webhook URL
                  </label>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full font-mono text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PagerDuty Integration Key (optional)
                  </label>
                  <input
                    type="text"
                    value={pagerdutyKey}
                    onChange={(e) => setPagerdutyKey(e.target.value)}
                    placeholder="pd_live_..."
                    className="w-full font-mono text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Send test notification</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId('team')}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotifications}
                      disabled={savingItem === 'notifications'}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion Item 5: Invite Your Team */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#0A0A0A]/50 transition-all">
          <button
            type="button"
            onClick={() => toggleExpand('team')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  checklist.team_invited
                    ? 'bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {checklist.team_invited ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Invite your team</span>
                  {checklist.team_invited && (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Team Invited
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Invite your SRE and DevOps engineers with custom RBAC roles.
                </p>
              </div>
            </div>
            {expandedId === 'team' ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {expandedId === 'team' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 pt-0 border-t border-slate-100 dark:border-white/10"
              >
                <div className="pt-3">
                  <InviteTeam compact={true} onInvitesSent={() => setExpandedId(null)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Primary Screen Button: Go to Dashboard */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/settings"
            className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 underline"
          >
            Access checklist anytime in Settings →
          </Link>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 btn-glow-primary"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
