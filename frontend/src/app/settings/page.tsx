'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Bell,
  Users,
  Shield,
  Key,
  Trash2,
  Lock,
  ArrowLeft,
  Check,
  AlertTriangle,
  RotateCcw,
  Plus,
  Building,
  Globe,
  Radio,
  Sliders,
  ExternalLink,
  CreditCard,
  Zap,
  GitBranch,
  Cpu,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import MiniSparkline from '@/components/MiniSparkline';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { useOrg } from '@/context/OrgContext';
import {
  getServiceRepoMappings,
  saveServiceRepoMapping,
  deleteServiceRepoMapping,
  ServiceRepoMapping,
} from '@/lib/services-repo';

type SubTab = 'general' | 'keys' | 'members' | 'repositories' | 'notifications' | 'billing' | 'danger';

interface KeyProvider {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'rotated' | 'pending';
  fingerprint: string;
  lastRotated: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastActive: string;
}

const INITIAL_KEYS: KeyProvider[] = [
  {
    id: 'key-1',
    name: 'AWS KMS (us-east-1)',
    type: 'Envelope Encryption (BYOK)',
    status: 'active',
    fingerprint: 'arn:aws:kms:us-east-1:4921...:key/8a2b-9f1c',
    lastRotated: '14 days ago',
  },
  {
    id: 'key-2',
    name: 'HashiCorp Vault KV v2',
    type: 'Secrets Engine',
    status: 'active',
    fingerprint: 'vault://prod-sre/data/somakai-dek',
    lastRotated: '30 days ago',
  },
  {
    id: 'key-3',
    name: 'Google Cloud KMS (europe-west1)',
    type: 'Key Ring / HSM',
    status: 'active',
    fingerprint: 'projects/acme-prod/locations/europe-west1/keyRings/sre',
    lastRotated: '3 days ago',
  },
  {
    id: 'key-4',
    name: 'Nebius Token Factory (NVIDIA Nemotron)',
    type: 'Inference BYOK',
    status: 'active',
    fingerprint: 'sk-neb-moe-********************8f1a',
    lastRotated: '6 days ago',
  },
];

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'usr-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@somak.internal',
    role: 'Admin',
    avatar: 'ER',
    lastActive: '5m ago',
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@somak.internal',
    role: 'Operator',
    avatar: 'MV',
    lastActive: 'Active now',
  },
  {
    id: 'usr-3',
    name: 'Devin Zhao',
    email: 'devin.zhao@somak.internal',
    role: 'Operator',
    avatar: 'DZ',
    lastActive: '1h ago',
  },
  {
    id: 'usr-4',
    name: 'Sarah Connor',
    email: 'sarah.connor@somak.internal',
    role: 'Viewer',
    avatar: 'SC',
    lastActive: 'Yesterday',
  },
];

const BYOK_PROVIDERS = [
  {
    id: 'nvidia_nim',
    name: 'NVIDIA NIM',
    description: 'Free tier available, hosts Nemotron models',
    badge: 'Server Fallback #1 / BYOK',
    keyPrefix: 'nvapi-',
    triageModels: [
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron-3-Super (120B MoE)' }
    ],
    synthesisModels: [
      { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron-3-Ultra (550B MoE)' }
    ],
  },
  {
    id: 'nebius',
    name: 'Nebius AI Studio',
    description: 'Dedicated GPU cloud hosting Nemotron models',
    badge: 'BYOK Enabled',
    keyPrefix: 'sk-neb-',
    triageModels: [
      { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron-3-Nano (30B Dense)' }
    ],
    synthesisModels: [
      { id: 'nvidia/nemotron-3-ultra-550b', name: 'Nemotron-3-Ultra (550B MoE)' }
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Ultra-low latency, large context window',
    badge: 'Server Fallback #2 / BYOK',
    keyPrefix: 'AIzaSy',
    triageModels: [
      { id: 'gemini-flash-latest', name: 'Gemini 2.5 Flash' }
    ],
    synthesisModels: [
      { id: 'gemini-flash-latest', name: 'Gemini 2.5 Flash (AST Reasoning)' }
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Deep reasoning and frontier complexity',
    badge: 'BYOK Enabled',
    keyPrefix: 'sk-ant-',
    triageModels: [
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' }
    ],
    synthesisModels: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'High-precision code synthesis and fast triage',
    badge: 'BYOK Enabled',
    keyPrefix: 'sk-',
    triageModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
    ],
    synthesisModels: [
      { id: 'gpt-4o', name: 'GPT-4o' }
    ],
  },
];

function SettingsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { currentOrg, updateChecklist } = useOrg();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SubTab>('general');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // BYOK Multi-Provider & Model State
  const checklist = currentOrg?.setup_checklist;
  const [preferredProvider, setPreferredProvider] = useState<string>(checklist?.triage_provider || 'nvidia_nim');
  const [selectedTriageModel, setSelectedTriageModel] = useState<string>(checklist?.triage_model || 'nvidia/nemotron-3-super-120b-a12b');
  const [selectedSynthesisModel, setSelectedSynthesisModel] = useState<string>(checklist?.synthesis_model || 'nvidia/nemotron-3-ultra-550b-a55b');
  const [nvidiaNimKey, setNvidiaNimKey] = useState<string>('');
  const [nebiusKey, setNebiusKey] = useState<string>('');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [savingByok, setSavingByok] = useState<boolean>(false);
  const [showOtherKeys, setShowOtherKeys] = useState<boolean>(false);

  useEffect(() => {
    if (currentOrg?.setup_checklist) {
      const ch = currentOrg.setup_checklist;
      if (ch.triage_provider) setPreferredProvider(ch.triage_provider);
      if (ch.triage_model) setSelectedTriageModel(ch.triage_model);
      if (ch.synthesis_model) setSelectedSynthesisModel(ch.synthesis_model);
    }
  }, [currentOrg]);

  const activeProviderMeta = BYOK_PROVIDERS.find(p => p.id === preferredProvider) || BYOK_PROVIDERS[0];

  const handleProviderChange = (newProvId: string) => {
    setPreferredProvider(newProvId);
    const prov = BYOK_PROVIDERS.find(p => p.id === newProvId);
    if (prov) {
      if (prov.triageModels[0]) setSelectedTriageModel(prov.triageModels[0].id);
      if (prov.synthesisModels[0]) setSelectedSynthesisModel(prov.synthesisModels[0].id);
    }
  };

  const handleSaveByok = async () => {
    setSavingByok(true);
    try {
      const payload: Record<string, any> = {
        triage_provider: preferredProvider,
        synthesis_provider: preferredProvider,
        triage_model: selectedTriageModel,
        synthesis_model: selectedSynthesisModel,
      };
      if (nvidiaNimKey.trim()) {
        payload.nvidia_nim_api_key = nvidiaNimKey.trim();
        payload.nvidia_nim_connected = true;
      }
      if (nebiusKey.trim()) {
        payload.nebius_api_key = nebiusKey.trim();
        payload.ai_api_key = nebiusKey.trim();
        payload.ai_connected = true;
      }
      if (geminiKey.trim()) {
        payload.google_api_key = geminiKey.trim();
        payload.google_connected = true;
      }
      if (anthropicKey.trim()) {
        payload.anthropic_api_key = anthropicKey.trim();
        payload.anthropic_connected = true;
      }
      if (openaiKey.trim()) {
        payload.openai_api_key = openaiKey.trim();
        payload.openai_connected = true;
      }

      await updateChecklist(payload);
      showToast('AI Provider & BYOK settings encrypted and saved', 'success');
      setNvidiaNimKey('');
      setNebiusKey('');
      setGeminiKey('');
      setAnthropicKey('');
      setOpenaiKey('');
    } catch (err: any) {
      showToast('Failed to save BYOK keys: ' + (err?.message || 'Network error'), 'error');
    } finally {
      setSavingByok(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams?.get('tab') as SubTab;
    if (tabParam && ['general', 'keys', 'members', 'repositories', 'notifications', 'billing', 'danger'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Form State
  const [orgName, setOrgName] = useState(currentOrg?.name || 'Acme Infrastructure');
  const [orgSlug, setOrgSlug] = useState('acme-infra');
  const [timezone, setTimezone] = useState('UTC (GMT+00:00)');
  const [retentionDays, setRetentionDays] = useState('90');

  // Keys State
  const [keys, setKeys] = useState<KeyProvider[]>(INITIAL_KEYS);

  // Members State
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Operator');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Repositories State
  const [repoMappings, setRepoMappings] = useState<ServiceRepoMapping[]>([]);
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newRepoFullName, setNewRepoFullName] = useState('');
  const [newDefaultBranch, setNewDefaultBranch] = useState('main');
  const [newAutoMerge, setNewAutoMerge] = useState(true);

  useEffect(() => {
    setRepoMappings(getServiceRepoMappings());
  }, []);

  const handleToggleAutoMerge = (serviceName: string) => {
    const existing = repoMappings.find((m) => m.service_name === serviceName);
    if (!existing) return;
    saveServiceRepoMapping({
      ...existing,
      auto_merge: !existing.auto_merge,
    });
    setRepoMappings(getServiceRepoMappings());
    showToast(`Updated auto-merge gate for ${serviceName}`, 'success');
  };

  const handleRemoveRepoMapping = (serviceName: string) => {
    deleteServiceRepoMapping(serviceName);
    setRepoMappings(getServiceRepoMappings());
    showToast(`Removed repository mapping for ${serviceName}`, 'info');
  };

  const handleAddRepoMappingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newRepoFullName.trim()) return;
    saveServiceRepoMapping({
      service_name: newServiceName.trim(),
      repo_full_name: newRepoFullName.trim(),
      default_branch: newDefaultBranch.trim() || 'main',
      auto_merge: newAutoMerge,
    });
    setRepoMappings(getServiceRepoMappings());
    setNewServiceName('');
    setNewRepoFullName('');
    setNewDefaultBranch('main');
    setNewAutoMerge(true);
    setShowAddRepoModal(false);
    showToast(`Linked ${newServiceName} to ${newRepoFullName}`, 'success');
  };

  // Notifications State
  const [notifySev1, setNotifySev1] = useState(true);
  const [notifyCanaryRollback, setNotifyCanaryRollback] = useState(true);
  const [notifyBudgetBurn, setNotifyBudgetBurn] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  // Danger confirmation state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const markDirty = () => setIsDirty(true);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      showToast('Settings successfully updated', 'success');
    }, 600);
  };

  const handleReset = () => {
    setOrgName(currentOrg?.name || 'Acme Infrastructure');
    setOrgSlug('acme-infra');
    setTimezone('UTC (GMT+00:00)');
    setRetentionDays('90');
    setKeys(INITIAL_KEYS);
    setMembers(INITIAL_MEMBERS);
    setNotifySev1(true);
    setNotifyCanaryRollback(true);
    setNotifyBudgetBurn(true);
    setNotifyDigest(false);
    setIsDirty(false);
    showToast('Changes discarded', 'info');
  };

  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    markDirty();
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    markDirty();
    showToast('Member removed from organization', 'info');
  };

  const handleRotateKey = (keyId: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, lastRotated: 'Just now' } : k))
    );
    markDirty();
    showToast('Encryption key rotated securely', 'success');
  };

  const handleRemoveKey = (keyId: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
    markDirty();
    showToast('Key provider disconnected', 'info');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: inviteEmail.substring(0, 2).toUpperCase(),
      lastActive: 'Invited',
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail('');
    setShowInviteModal(false);
    markDirty();
    showToast(`Invite sent to ${inviteEmail}`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col pb-32 transition-colors selection:bg-indigo-500/20">
      <TopNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar</span>
        </Link>

        {/* Page Header with Usage Strip & Mini-Sparkline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Organization Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage tenancy boundaries, BYOK keys, team access, and notification policies.
            </p>
          </div>

          {/* Vercel-style Usage Mini-Card */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4 shrink-0">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Monthly Hotfix Tokens
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  14.2k / 50k
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  28.4%
                </span>
              </div>
            </div>
            <MiniSparkline
              data={[4, 6, 8, 9, 12, 11, 14, 15, 14.2]}
              color="emerald"
              width={48}
              height={18}
            />
          </div>
        </div>

        {/* Sub-tabs Navigation (Render In-Page Pattern) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-x-auto text-xs font-medium">
          {[
            { id: 'general', label: 'General' },
            { id: 'keys', label: 'Environment & Keys (BYOK)' },
            { id: 'members', label: `Members & Roles (${members.length})` },
            { id: 'repositories', label: 'Codebases & Repositories' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'billing', label: 'Billing' },
            { id: 'danger', label: 'Danger Zone', danger: true },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubTab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? tab.danger
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold shadow-2xs'
                    : 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : tab.danger
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: GENERAL */}
        {/* ======================================================== */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-6">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Organization Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  General workspace metadata and operational timezone.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Field 1: Org Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="sm:w-1/3">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Organization Name
                    </label>
                    <p className="text-[11px] text-slate-400">Displayed across alerts and audit logs.</p>
                  </div>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      markDirty();
                    }}
                    className="sm:w-2/3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                {/* Field 2: Slug */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="sm:w-1/3">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Workspace Slug
                    </label>
                    <p className="text-[11px] text-slate-400">Used in API routes and webhooks.</p>
                  </div>
                  <div className="sm:w-2/3 flex items-center">
                    <span className="px-3 py-2 bg-slate-100 dark:bg-white/5 border border-r-0 border-slate-200 dark:border-white/10 rounded-l-xl text-slate-400 font-mono text-xs">
                      somak.ai/org/
                    </span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => {
                        setOrgSlug(e.target.value);
                        markDirty();
                      }}
                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-r-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* Field 3: Timezone */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="sm:w-1/3">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Primary Timezone
                    </label>
                    <p className="text-[11px] text-slate-400">Used for incident timestamps and shift rotas.</p>
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      markDirty();
                    }}
                    className="sm:w-2/3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                    <option value="America/New_York (EST)">America/New_York (EST)</option>
                    <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                    <option value="Europe/London (BST)">Europe/London (BST)</option>
                    <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
                  </select>
                </div>

                {/* Field 4: Data Retention */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="sm:w-1/3">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Audit Trail Retention
                    </label>
                    <p className="text-[11px] text-slate-400">Rolling cryptographic log retention window.</p>
                  </div>
                  <select
                    value={retentionDays}
                    onChange={(e) => {
                      setRetentionDays(e.target.value);
                      markDirty();
                    }}
                    className="sm:w-2/3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days (SOC-2 Recommended)</option>
                    <option value="365">1 Year (Enterprise)</option>
                    <option value="forever">Indefinite (Append-Only Immutable)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ENVIRONMENT & KEYS (BYOK) */}
        {/* ======================================================== */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            {/* Priority Chain & Architecture Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Multi-Provider Priority Chain & Key Disclosure
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                When an incident is triaged or synthesized, Somak AI attempts providers strictly in the following priority order. Server-level keys are stored securely on the backend and rate-limited per organization plan tier to protect shared credits.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-indigo-100 dark:border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Org BYOK Key</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your org's custom encrypted API key for preferred provider. Zero platform token metering.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-indigo-100 dark:border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Server Fallback</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automated fallback: <strong className="text-slate-700 dark:text-slate-200">NVIDIA NIM</strong> first, then <strong className="text-slate-700 dark:text-slate-200">Google Gemini</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-indigo-100 dark:border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                    <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Simulated Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deterministic offline execution if live provider APIs are unavailable.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Provider & Models Selection Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <span>Inference Provider & Model Configuration (BYOK)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select your preferred AI engine and configure custom API keys for root cause reasoning and AST patch synthesis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveByok}
                  disabled={savingByok}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {savingByok ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save BYOK Configuration</span>
                </button>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Preferred Provider Dropdown */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Preferred Provider
                  </label>
                  <select
                    value={preferredProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {BYOK_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.description})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
                      {activeProviderMeta.badge}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Prefix format: <code className="font-mono text-slate-600 dark:text-slate-300">{activeProviderMeta.keyPrefix}...</code>
                    </span>
                  </div>
                </div>

                {/* Triage Model */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Triage Stage Model (Log Classification)
                  </label>
                  <select
                    value={selectedTriageModel}
                    onChange={(e) => setSelectedTriageModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {activeProviderMeta.triageModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Synthesis Model */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Synthesis Stage Model (AST Patch Generation)
                  </label>
                  <select
                    value={selectedSynthesisModel}
                    onChange={(e) => setSelectedSynthesisModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {activeProviderMeta.synthesisModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Provider BYOK Key Input */}
                <div className="space-y-1.5 md:col-span-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      {activeProviderMeta.name} API Key (BYOK)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {checklist && (
                        (preferredProvider === 'nvidia_nim' && checklist.nvidia_nim_connected) ||
                        (preferredProvider === 'nebius' && checklist.ai_connected) ||
                        (preferredProvider === 'gemini' && checklist.google_connected) ||
                        (preferredProvider === 'anthropic' && checklist.anthropic_connected) ||
                        (preferredProvider === 'openai' && checklist.openai_connected)
                      ) ? (
                        <span className="text-emerald-500 font-medium inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Org Key Configured
                        </span>
                      ) : (
                        <span className="text-amber-500 font-medium">Using Server Fallback</span>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder={`Enter ${activeProviderMeta.name} API key (${activeProviderMeta.keyPrefix}...)`}
                      value={
                        preferredProvider === 'nvidia_nim' ? nvidiaNimKey :
                        preferredProvider === 'nebius' ? nebiusKey :
                        preferredProvider === 'gemini' ? geminiKey :
                        preferredProvider === 'anthropic' ? anthropicKey :
                        openaiKey
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (preferredProvider === 'nvidia_nim') setNvidiaNimKey(val);
                        else if (preferredProvider === 'nebius') setNebiusKey(val);
                        else if (preferredProvider === 'gemini') setGeminiKey(val);
                        else if (preferredProvider === 'anthropic') setAnthropicKey(val);
                        else setOpenaiKey(val);
                      }}
                      className="w-full font-mono text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Saved keys are encrypted immediately with AES-GCM envelope encryption before persistence.
                  </p>
                </div>
              </div>

              {/* Collapsible Section for All Provider Keys */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowOtherKeys(!showOtherKeys)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{showOtherKeys ? 'Hide other provider credentials' : 'Configure keys for multiple providers'}</span>
                </button>

                {showOtherKeys && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* NVIDIA NIM */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NVIDIA NIM Key</label>
                      <input
                        type="password"
                        placeholder="nvapi-..."
                        value={nvidiaNimKey}
                        onChange={(e) => setNvidiaNimKey(e.target.value)}
                        className="w-full font-mono text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    {/* Google Gemini */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Google Gemini Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full font-mono text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    {/* Anthropic */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Anthropic Claude Key</label>
                      <input
                        type="password"
                        placeholder="sk-ant-..."
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        className="w-full font-mono text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    {/* OpenAI */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">OpenAI Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full font-mono text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KMS Envelope Encryption Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Tenant Envelope Encryption (KMS / HSM)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Envelope encryption keys managed inside your tenancy for zero data exposure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Connect a new AWS KMS or Vault ARN via Integrations', 'info')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs shadow-2xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Key Provider</span>
                </button>
              </div>

              {/* Rows (Vercel Env Variables Pattern) */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-900 dark:text-white">{k.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-white/5 text-slate-500">
                          {k.type}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate max-w-md">
                        {k.fingerprint}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <span className="text-[11px] font-mono text-slate-400">
                        Rotated {k.lastRotated}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRotateKey(k.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                      >
                        Rotate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveKey(k.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Disconnect Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MEMBERS & ROLES */}
        {/* ======================================================== */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Team Members
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage role permissions (Admin, Operator, Viewer) with dual-approval requirements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs shadow-2xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Member</span>
                </button>
              </div>

              {/* Members List */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                        {m.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        {m.lastActive}
                      </span>

                      {/* Inline Role Selector */}
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Operator">Operator</option>
                        <option value="Viewer">Viewer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xl max-w-md w-full space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Invite Team Member</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Invited users receive an email magic link to join the organization.
                    </p>
                  </div>

                  <form onSubmit={handleAddMember} className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="engineer@company.com"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Operator">Operator (Can trigger sandboxes & review fixes)</option>
                        <option value="Admin">Admin (Full tenancy control & canary promotion)</option>
                        <option value="Viewer">Viewer (Read-only access)</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      >
                        Send Invite
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: CODEBASES & REPOSITORIES */}
        {/* ======================================================== */}
        {activeTab === 'repositories' && (
          <div className="space-y-6">
            {/* GitHub App Connection Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white flex items-center justify-center shrink-0">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>GitHub Integration</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Connected (@acme-corp)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Somak AI GitHub App installed with scopes: <span className="font-mono">repo:status</span>, <span className="font-mono">pull_requests:write</span>, <span className="font-mono">checks:read</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <a
                    href="https://github.com/apps/somak-ai/installations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span>Manage on GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Target Repositories</div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                    {repoMappings.length} Repos Scoped
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">PR Generation</div>
                  <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Automated AST Diffs
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Verification Gate</div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                    18/18 MicroVM Tests
                  </div>
                </div>
              </div>
            </div>

            {/* Service-to-Repository Mappings List */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Service &rarr; Repository Mappings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Map each monitored microservice to its GitHub repository, default target branch, and auto-merge policy.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddRepoModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs shadow-2xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Map Service Repository</span>
                </button>
              </div>

              {repoMappings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No service-to-repository mappings configured. Click "Map Service Repository" to link your codebases.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {repoMappings.map((mapping) => (
                    <div
                      key={mapping.service_name}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <GitBranch className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                              {mapping.service_name}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">&rarr;</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {mapping.repo_full_name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Target Branch: <span className="font-semibold text-slate-600 dark:text-slate-300">{mapping.default_branch}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-start sm:self-center">
                        {/* Auto-merge toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAutoMerge(mapping.service_name)}
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                              mapping.auto_merge ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-white/10'
                            }`}
                            title="Auto-merge PR once 100% canary verification passes"
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                                mapping.auto_merge ? 'translate-x-4.5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            {mapping.auto_merge ? 'Auto-merge ON' : 'Auto-merge OFF'}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRepoMapping(mapping.service_name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Remove repository mapping"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal: Add Service-to-Repository Mapping */}
            {showAddRepoModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xl max-w-md w-full space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Map Service to GitHub Repository
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure where AST hotfixes will be committed and which branch will be targeted.
                    </p>
                  </div>

                  <form onSubmit={handleAddRepoMappingSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Service Identifier
                      </label>
                      <input
                        type="text"
                        required
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. auth-service, order-service, api-gateway"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        GitHub Repository (Org/Repo)
                      </label>
                      <input
                        type="text"
                        required
                        value={newRepoFullName}
                        onChange={(e) => setNewRepoFullName(e.target.value)}
                        placeholder="e.g. acme-corp/auth-service"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Default Deployment Branch
                      </label>
                      <input
                        type="text"
                        required
                        value={newDefaultBranch}
                        onChange={(e) => setNewDefaultBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoMergeCheckbox"
                        checked={newAutoMerge}
                        onChange={(e) => setNewAutoMerge(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="autoMergeCheckbox" className="text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                        Enable automatic pull request merge upon 100% canary verification
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddRepoModal(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      >
                        Save Mapping
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: NOTIFICATIONS */}
        {/* ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Notification Channels & Policies
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure real-time alerts without noisy alert fatigue.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {/* Toggle 1 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Page On-Call for SEV-1 Outages
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Triggers PagerDuty and SMS escalation when an unhandled outage occurs.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifySev1(!notifySev1);
                      markDirty();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      notifySev1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                        notifySev1 ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Slack Alerts for Canary Rollbacks
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Notifies the #sre-alerts channel if an automated canary rollback triggers.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifyCanaryRollback(!notifyCanaryRollback);
                      markDirty();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      notifyCanaryRollback ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                        notifyCanaryRollback ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      SLO Budget Freeze Warnings
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Dispatches an alert when error budget burns below 10% threshold.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifyBudgetBurn(!notifyBudgetBurn);
                      markDirty();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      notifyBudgetBurn ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                        notifyBudgetBurn ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 4 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Weekly MTTR & Reliability Digest
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Delivers an executive summary of prevented outages and SLA uptime every Monday.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifyDigest(!notifyDigest);
                      markDirty();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      notifyDigest ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                        notifyDigest ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: BILLING & DODO PAYMENTS CUSTOMER PORTAL */}
        {/* ======================================================== */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Current Plan Overview Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {currentOrg?.plan ? currentOrg.plan.toUpperCase() : 'TEAM'} Plan
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Managed securely via Dodo Payments • PCI-DSS Level 1 Compliant.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="/customer-portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    <span>Manage in Customer Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Subscription details strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Price & Cadence
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block font-mono">
                    $79 / seat / mo
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Active Seats
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block font-mono">
                    {members.length} / 25 seats
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Next Renewal Date
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block font-mono">
                    October 27, 2026
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Default Payment
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block font-mono flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    •••• 4242
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Self-serve cancel, change payment methods, update seat counts, or download PDF receipts directly in the Dodo Customer Portal.
                  </span>
                </div>
                <a
                  href="/customer-portal"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
                >
                  Open Portal &rarr;
                </a>
              </div>
            </div>

            {/* Plan Upgrades & Options */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Available Plans
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-indigo-500/80 bg-indigo-500/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Team Plan</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Autonomous canary gates, 25 seats, Slack & PagerDuty</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">$79/mo</span>
                  </div>
                  <Link
                    href="/checkout?plan=team&redirect=true"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-2xs"
                  >
                    <span>Checkout with Dodo</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Enterprise Plan</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Dedicated microVM clusters, custom SLA, SAML 2.0</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">Custom</span>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <span>Contact Enterprise Sales</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Invoices & Receipts */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Invoices & Payment Receipts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download past billing invoices and tax receipts.
                  </p>
                </div>
                <a
                  href="/customer-portal"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>All Invoices in Dodo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {[
                  { id: 'INV-2026-09-01', date: 'Sep 1, 2026', amount: '$1,975.00', status: 'Paid' },
                  { id: 'INV-2026-08-01', date: 'Aug 1, 2026', amount: '$1,975.00', status: 'Paid' },
                  { id: 'INV-2026-07-01', date: 'Jul 1, 2026', amount: '$1,975.00', status: 'Paid' },
                ].map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-900 dark:text-white font-medium">{inv.id}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{inv.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{inv.amount}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: DANGER ZONE */}
        {/* ======================================================== */}
        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-rose-500/30 ring-1 ring-rose-500/20 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400">
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Destructive operations that cannot be undone. All actions are cryptographically logged.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {/* Action 1 */}
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Revoke All BYOK DEKs & API Keys
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Immediately invalidates all active encryption keys and suspends autonomous sandboxes.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Key revocation request acknowledged. Confirmation sent to admins.', 'error')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold text-xs transition-colors shrink-0"
                  >
                    Revoke All Keys
                  </button>
                </div>

                {/* Action 2 */}
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Delete Organization & Wipe Audit Logs
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Permanently wipes all telemetry history, runbook patterns, and organization settings.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('To delete, contact enterprise support to satisfy SOC-2 retention.', 'error')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    Delete Organization
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Dirty-State Save Bar (Vercel Pattern) */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] p-3.5 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-2xl flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-medium text-slate-200">You have unsaved changes.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-white text-slate-950 font-semibold hover:bg-slate-100 transition-colors shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FloatingDock />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070709]" />}>
      <SettingsContent />
    </React.Suspense>
  );
}
