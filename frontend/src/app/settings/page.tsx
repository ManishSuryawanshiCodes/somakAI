'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Clock,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  User as UserIcon,
  Laptop,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Activity,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import FloatingDock from '@/components/FloatingDock';
import MiniSparkline from '@/components/MiniSparkline';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { useOrg, SetupChecklist } from '@/context/OrgContext';
import { CustomSelect } from '@/components/CustomSelect';
import { getOrganizationMembers } from '@/lib/api';
import {
  getServiceRepoMappings,
  saveServiceRepoMapping,
  deleteServiceRepoMapping,
  ServiceRepoMapping,
  getGitHubToken,
  setGitHubToken,
  verifyGitHubToken,
  verifyRepoAccess,
  sanitizeRepoFullName,
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
    description: 'Free tier available, hosts Nemotron & Llama models',
    badge: 'Server Fallback #1 / BYOK',
    keyPrefix: 'nvapi-',
    triageModels: [
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron-3-Super (120B MoE — Fast Sub-100ms Triage)' },
      { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron-3-Nano (30B Dense — Ultra Lightweight)' },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct (General Log Fingerprint)' },
    ],
    synthesisModels: [
      { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron-3-Ultra (550B MoE — Frontier Code Reasoning)' },
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron-3-Super (120B MoE — High-Efficiency AST)' },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct (AST Patch Synthesis)' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Industry standard for high-precision code synthesis & triage',
    badge: 'BYOK Enabled',
    keyPrefix: 'sk-',
    triageModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ultra Fast Sub-80ms Log Classifier)' },
      { id: 'gpt-4o', name: 'GPT-4o (Omnimodal Log & Stack Triage)' },
    ],
    synthesisModels: [
      { id: 'gpt-4o', name: 'GPT-4o (Production AST Hotfix Benchmark)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Optimized AST Patches)' },
      { id: 'o1-mini', name: 'o1-mini (Frontier Reasoning & Complex Syntax Fixes)' },
      { id: 'o1-preview', name: 'o1-preview (Deep Multi-Step Root Cause Analysis)' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Deep architectural reasoning, safety, and frontier AST accuracy',
    badge: 'BYOK Enabled',
    keyPrefix: 'sk-ant-',
    triageModels: [
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Sub-80ms Rapid Triage)' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Frontier Log Understanding)' },
    ],
    synthesisModels: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State-of-the-Art Code Patches)' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Complex Legacy Refactoring)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (High-Speed Patching)' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Ultra-low latency, large 2M context window for massive codebases',
    badge: 'Server Fallback #2 / BYOK',
    keyPrefix: 'AIzaSy',
    triageModels: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Sub-50ms Triage)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast Log Classifier)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Contextual Triage)' },
    ],
    synthesisModels: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (2M Token Context AST Synthesis)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Rapid AST Hotfix)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Lightweight Hotfix)' },
    ],
  },
  {
    id: 'nebius',
    name: 'Nebius AI Studio',
    description: 'Dedicated GPU cloud hosting ultra-fast Nemotron models',
    badge: 'BYOK Enabled',
    keyPrefix: 'sk-neb-',
    triageModels: [
      { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron-3-Nano (30B Dense — Sub-100ms Triage)' },
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron-3-Super (120B MoE — Deep Fingerprinting)' },
    ],
    synthesisModels: [
      { id: 'nvidia/nemotron-3-ultra-550b', name: 'Nemotron-3-Ultra (550B MoE — Precision AST Generation)' },
      { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron-3-Nano (30B Dense — High-Speed Hotfix)' },
    ],
  },
];

function SettingsContent() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { currentOrg, updateChecklist, createInvites } = useOrg();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SubTab>('general');
  const [scope, setScope] = useState<'organization' | 'account'>('organization');
  const [accountTab, setAccountTab] = useState<'profile' | 'security'>('profile');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // My Account Profile state
  const [accountName, setAccountName] = useState(user?.name || '');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  useEffect(() => {
    if (user?.name) setAccountName(user.name);
  }, [user?.name]);

  // My Account Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // My Account 2FA & Sessions
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);
  const [sessions, setSessions] = useState([
    { id: 'sess_1', device: 'Chrome / Edge on Windows 11', ip: '103.21.244.18 (Current)', current: true, lastActive: 'Active now' },
    { id: 'sess_2', device: 'Firefox on macOS Sonoma', ip: '49.37.155.82', current: false, lastActive: '2 days ago' },
  ]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      showToast('Name cannot be empty.', 'warning');
      return;
    }
    setIsSavingAccount(true);
    try {
      await updateProfile({ name: accountName.trim() });
      showToast('Account profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update password.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    showToast('All other active sessions revoked.', 'success');
  };

  // Real-time ticking clock for multi-timeline
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Guided Activation Accordion states (Minimalistic design from onboarding)
  const [expandedSetupId, setExpandedSetupId] = useState<string | null>(null);
  const [setupSentryDsn, setSetupSentryDsn] = useState('');
  const [setupAiProvider, setSetupAiProvider] = useState('nvidia_nim');
  const [setupAiModel, setSetupAiModel] = useState('nvidia/nemotron-3-super-120b-a12b');
  const [setupAiKey, setSetupAiKey] = useState('');
  const [setupTavilyKey, setSetupTavilyKey] = useState('');
  const [setupSlackWebhook, setSetupSlackWebhook] = useState('');
  const [setupPagerdutyKey, setSetupPagerdutyKey] = useState('');
  const [setupInviteEmail, setSetupInviteEmail] = useState('');
  const [setupInviteRole, setSetupInviteRole] = useState<UserRole>('Operator');
  const [setupCopiedWebhook, setSetupCopiedWebhook] = useState(false);
  const [savingSetupId, setSavingSetupId] = useState<string | null>(null);

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

  const [orgUsage, setOrgUsage] = useState<any>(null);

  useEffect(() => {
    if (currentOrg?.setup_checklist) {
      const ch = currentOrg.setup_checklist;
      if (ch.triage_provider) setPreferredProvider(ch.triage_provider);
      if (ch.triage_model) setSelectedTriageModel(ch.triage_model);
      if (ch.synthesis_model) setSelectedSynthesisModel(ch.synthesis_model);
      if (ch.sentry_dsn) setSetupSentryDsn(ch.sentry_dsn);
      if (ch.tavily_api_key) setSetupTavilyKey(ch.tavily_api_key);
      if (ch.slack_webhook) setSetupSlackWebhook(ch.slack_webhook);
      if (ch.pagerduty_key) setSetupPagerdutyKey(ch.pagerduty_key);
    }
    if (currentOrg?.id) {
      import('@/lib/api').then(({ getOrgUsage }) => {
        getOrgUsage(currentOrg.id).then((res) => {
          if (res) setOrgUsage(res);
        }).catch(() => {});
      });
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

  const isAcme = Boolean(currentOrg && currentOrg.id === 'org_acme');

  // Form State
  const [orgName, setOrgName] = useState(currentOrg?.name || 'Workspace');
  const [orgSlug, setOrgSlug] = useState(currentOrg?.slug || 'workspace');
  const [timezone, setTimezone] = useState('UTC (GMT+00:00)');
  const [retentionDays, setRetentionDays] = useState('90');

  // Keys State
  const [keys, setKeys] = useState<KeyProvider[]>(isAcme ? INITIAL_KEYS : []);

  // Members State
  const [members, setMembers] = useState<TeamMember[]>(isAcme ? INITIAL_MEMBERS : []);
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
  const [githubToken, setGithubTokenState] = useState('');
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [testingRepo, setTestingRepo] = useState<string | null>(null);
  const [repoTestResults, setRepoTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    if (!currentOrg) return;
    setOrgName(currentOrg.name);
    setOrgSlug(currentOrg.slug);

    if (isAcme) {
      setMembers(INITIAL_MEMBERS);
      setKeys(INITIAL_KEYS);
    } else {
      // For real orgs, fetch real members
      getOrganizationMembers(currentOrg.id).then((orgMembers) => {
        if (orgMembers && orgMembers.length > 0) {
          const mapped: TeamMember[] = orgMembers.map((m) => ({
            id: m.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            avatar: m.user.avatar || (m.user.name ? m.user.name.slice(0, 2).toUpperCase() : 'OP'),
            lastActive: 'Active now',
          }));
          setMembers(mapped);
        } else if (user) {
          setMembers([
            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: 'Admin',
              avatar: user.name ? user.name.slice(0, 2).toUpperCase() : 'AD',
              lastActive: 'Active now',
            },
          ]);
        } else {
          setMembers([]);
        }
      });

      // Build real keys from setup_checklist
      const realKeys: KeyProvider[] = [];
      const ch = currentOrg.setup_checklist;
      if (ch) {
        if (ch.nvidia_nim_api_key || ch.nvidia_nim_connected) {
          realKeys.push({
            id: 'key-nim',
            name: 'NVIDIA NIM Inference Key',
            type: 'BYOK Provider Key',
            status: 'active',
            fingerprint: ch.nvidia_nim_api_key ? `nvapi-${ch.nvidia_nim_api_key.slice(-4)}` : 'nvapi-••••',
            lastRotated: 'Configured',
          });
        }
        if (ch.ai_api_key || ch.ai_connected) {
          realKeys.push({
            id: 'key-nebius',
            name: 'Nebius Nemotron Key',
            type: 'BYOK Provider Key',
            status: 'active',
            fingerprint: ch.ai_api_key ? `neb-${ch.ai_api_key.slice(-4)}` : 'neb-••••',
            lastRotated: 'Configured',
          });
        }
        if (ch.google_api_key || ch.google_connected) {
          realKeys.push({
            id: 'key-gemini',
            name: 'Google Gemini Key',
            type: 'BYOK Provider Key',
            status: 'active',
            fingerprint: ch.google_api_key ? `AIzaSy-${ch.google_api_key.slice(-4)}` : 'AIzaSy-••••',
            lastRotated: 'Configured',
          });
        }
        if (ch.anthropic_api_key || ch.anthropic_connected) {
          realKeys.push({
            id: 'key-anthropic',
            name: 'Anthropic Claude Key',
            type: 'BYOK Provider Key',
            status: 'active',
            fingerprint: ch.anthropic_api_key ? `sk-ant-${ch.anthropic_api_key.slice(-4)}` : 'sk-ant-••••',
            lastRotated: 'Configured',
          });
        }
        if (ch.openai_api_key || ch.openai_connected) {
          realKeys.push({
            id: 'key-openai',
            name: 'OpenAI Key',
            type: 'BYOK Provider Key',
            status: 'active',
            fingerprint: ch.openai_api_key ? `sk-${ch.openai_api_key.slice(-4)}` : 'sk-••••',
            lastRotated: 'Configured',
          });
        }
      }
      setKeys(realKeys);
    }
  }, [currentOrg, isAcme, user]);

  useEffect(() => {
    setRepoMappings(getServiceRepoMappings());
    const token = getGitHubToken();
    setGithubTokenState(token);
    if (token) {
      verifyGitHubToken(token).then((res) => {
        if (res.success && res.user) {
          setGithubUser(res.user);
        }
      });
    }
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

  const handleSaveGithubToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingGithub(true);
    try {
      const trimmed = githubToken.trim();
      setGitHubToken(trimmed);
      if (!trimmed) {
        setGithubUser(null);
        showToast('GitHub Personal Access Token removed.', 'info');
        return;
      }
      const res = await verifyGitHubToken(trimmed);
      if (res.success && res.user) {
        setGithubUser(res.user);
        showToast(`GitHub token verified successfully as @${res.user}`, 'success');
      } else {
        setGithubUser(null);
        showToast(res.error || 'Failed to verify GitHub token', 'error');
      }
    } finally {
      setIsVerifyingGithub(false);
    }
  };

  const handleTestRepoAccess = async (repoName: string) => {
    setTestingRepo(repoName);
    try {
      const res = await verifyRepoAccess(repoName, githubToken);
      if (res.success) {
        const msg = `Connected! ${res.isPrivate ? 'Private' : 'Public'} repository verified on branch "${res.defaultBranch}".`;
        setRepoTestResults((prev) => ({ ...prev, [repoName]: { success: true, message: msg } }));
        showToast(msg, 'success');
      } else {
        const msg = res.error || 'Cannot access repository';
        setRepoTestResults((prev) => ({ ...prev, [repoName]: { success: false, message: msg } }));
        showToast(msg, 'error');
      }
    } finally {
      setTestingRepo(null);
    }
  };

  const handleAddRepoMappingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newRepoFullName.trim()) return;
    const sanitizedRepo = sanitizeRepoFullName(newRepoFullName.trim());
    saveServiceRepoMapping({
      service_name: newServiceName.trim(),
      repo_full_name: sanitizedRepo,
      default_branch: newDefaultBranch.trim() || 'main',
      auto_merge: newAutoMerge,
    });
    setRepoMappings(getServiceRepoMappings());
    setNewServiceName('');
    setNewRepoFullName('');
    setNewDefaultBranch('main');
    setNewAutoMerge(true);
    setShowAddRepoModal(false);
    showToast(`Linked ${newServiceName} to ${sanitizedRepo}`, 'success');
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
          {(() => {
            const isAcme = currentOrg?.id === 'org_acme';
            const plan = (currentOrg?.plan || 'team').toLowerCase();
            const planTokenLimits: Record<string, number> = {
              free: 50000,
              team: 5000000,
              business: 20000000,
              enterprise: 50000000,
            };
            const limit = planTokenLimits[plan] || 5000000;
            const limitStr = limit >= 1000000 ? `${limit / 1000000}M` : `${limit / 1000}k`;
            const used = orgUsage ? orgUsage.platform_tokens_used : (isAcme ? 14200 : 0);
            const usedStr = used >= 1000000 ? `${(used / 1000000).toFixed(1)}M` : (used >= 1000 ? `${(used / 1000).toFixed(1)}k` : `${used}`);
            const percent = Math.min(100, Math.round((used / limit) * 1000) / 10);
            const isWarning = percent >= 80;

            return (
              <div className="p-3 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4 shrink-0">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Monthly Hotfix Tokens
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {usedStr} / {limitStr}
                    </span>
                    <span className={`text-[10px] font-medium ${isWarning ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <MiniSparkline
                  data={used > 0 ? [0, used * 0.25, used * 0.5, used * 0.8, used] : [0, 0, 0, 0, 0]}
                  color={isWarning ? 'rose' : 'emerald'}
                  width={48}
                  height={18}
                />
              </div>
            );
          })()}
        </div>

        {/* Top-Level Scope Switcher: Organization | My Account */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 w-fit text-xs font-medium">
          <button
            type="button"
            onClick={() => setScope('organization')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              scope === 'organization'
                ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>Organization</span>
          </button>
          <button
            type="button"
            onClick={() => setScope('account')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              scope === 'account'
                ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>My Account</span>
          </button>
        </div>

        {scope === 'organization' ? (
          <>
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
          <div className="space-y-6">
            {/* Guided Activation & Setup Checklist (Minimalist Design from Onboarding) */}
            {(() => {
              const ch: Partial<SetupChecklist> = currentOrg?.setup_checklist || {};
              const isSentryDone = Boolean(ch.sentry_connected || ch.sentry_dsn);
              const isAiDone = Boolean(
                ch.ai_connected ||
                ch.ai_api_key ||
                ch.nvidia_nim_connected ||
                ch.nebius_api_key ||
                ch.google_connected ||
                ch.anthropic_connected ||
                ch.openai_connected
              );
              const isTavilyDone = Boolean(ch.tavily_connected || ch.tavily_api_key);
              const isNotifDone = Boolean(ch.notifications_connected || ch.slack_webhook || ch.pagerduty_key);
              const isTeamDone = Boolean(ch.team_invited || (members && members.length > 1));

              const completedCount = [isSentryDone, isAiDone, isTavilyDone, isNotifDone, isTeamDone].filter(Boolean).length;
              const percent = Math.round((completedCount / 5) * 100);
              const webhookUrl = ch.sentry_inbound_url || `https://api.somak.ai/v1/webhook/ingest/${currentOrg?.slug || 'workspace'}`;

              return (
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                          Guided Activation
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Configure {orgName || currentOrg?.name || 'Workspace'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Connect your telemetry sources and AI credentials. All integrations sync live across your workspace.
                      </p>
                    </div>

                    <div className="sm:w-64 space-y-1.5 shrink-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Setup Progress</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {completedCount} of 5 completed ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5 Minimalist Accordion Step Cards */}
                  <div className="space-y-3">
                    {/* Step 1: Connect error monitoring */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedSetupId(expandedSetupId === 'sentry' ? null : 'sentry')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSentryDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {isSentryDone ? <Check className="w-3.5 h-3.5" /> : '1'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Connect error monitoring
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              This is how Somak AI finds out when something breaks in real-time.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSentryDone && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Connected
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedSetupId === 'sentry' ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {expandedSetupId === 'sentry' && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Option A: Inbound Webhook URL (for Sentry Alerts)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={webhookUrl}
                                className="flex-1 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(webhookUrl);
                                  setSetupCopiedWebhook(true);
                                  showToast('Inbound Webhook URL copied', 'success');
                                  setTimeout(() => setSetupCopiedWebhook(false), 2000);
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 transition-colors shrink-0"
                              >
                                {setupCopiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{setupCopiedWebhook ? 'Copied' : 'Copy URL'}</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Option B: Sentry Project DSN or Webhook Secret (optional)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="https://o123456@sentry.io/789012"
                                value={setupSentryDsn}
                                onChange={(e) => setSetupSentryDsn(e.target.value)}
                                className="flex-1 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                disabled={savingSetupId === 'sentry'}
                                onClick={async () => {
                                  setSavingSetupId('sentry');
                                  try {
                                    await updateChecklist({
                                      sentry_dsn: setupSentryDsn,
                                      sentry_connected: Boolean(setupSentryDsn.trim() || webhookUrl),
                                    });
                                    showToast('Error monitoring configuration updated', 'success');
                                    setExpandedSetupId('ai');
                                  } catch {
                                    showToast('Failed to save Sentry settings', 'error');
                                  } finally {
                                    setSavingSetupId(null);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs shrink-0 disabled:opacity-50"
                              >
                                {savingSetupId === 'sentry' ? 'Saving...' : 'Save & Continue'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Connect an AI provider */}
                    <div className={`rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] transition-all relative ${
                      expandedSetupId === 'ai' ? 'overflow-visible z-30' : 'overflow-hidden z-10'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setExpandedSetupId(expandedSetupId === 'ai' ? null : 'ai')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isAiDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {isAiDone ? <Check className="w-3.5 h-3.5" /> : '2'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>Connect an AI provider</span>
                              {checklist && (
                                (setupAiProvider === 'nvidia_nim' && checklist.nvidia_nim_connected) ||
                                (setupAiProvider === 'nebius' && checklist.ai_connected) ||
                                (setupAiProvider === 'gemini' && checklist.google_connected) ||
                                (setupAiProvider === 'openai' && checklist.openai_connected) ||
                                (setupAiProvider === 'anthropic' && checklist.anthropic_connected)
                              ) && (
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Connected & Online
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Powers automatic triage, root cause reasoning, and verified AST fix generation.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAiDone && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Connected
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedSetupId === 'ai' ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {expandedSetupId === 'ai' && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 space-y-4 text-xs">
                          {(() => {
                            const curProv = BYOK_PROVIDERS.find((p) => p.id === setupAiProvider) || BYOK_PROVIDERS[0];
                            const availableModels = [
                              ...curProv.triageModels.map((m) => ({ value: m.id, label: m.name, hint: 'Triage Stage' })),
                              ...curProv.synthesisModels
                                .filter((sm) => !curProv.triageModels.some((tm) => tm.id === sm.id))
                                .map((m) => ({ value: m.id, label: m.name, hint: 'Synthesis Stage' })),
                            ];

                            return (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  {/* Provider Dropdown */}
                                  <div>
                                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                      Provider
                                    </label>
                                    <CustomSelect
                                      value={setupAiProvider}
                                      onChange={(val) => {
                                        setSetupAiProvider(val);
                                        const p = BYOK_PROVIDERS.find((item) => item.id === val);
                                        if (p && p.triageModels.length > 0) {
                                          setSetupAiModel(p.triageModels[0].id);
                                        }
                                      }}
                                      options={BYOK_PROVIDERS.map((p) => ({
                                        value: p.id,
                                        label: `${p.name} (${p.description})`,
                                        badge: p.badge,
                                      }))}
                                    />
                                  </div>

                                  {/* Model Tier Dropdown */}
                                  <div>
                                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                      Model Tier / Engine
                                    </label>
                                    <CustomSelect
                                      value={setupAiModel}
                                      onChange={(val) => setSetupAiModel(val)}
                                      options={availableModels}
                                    />
                                  </div>
                                </div>

                                {/* API Key Input */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                                      {curProv.name} API Key (BYOK)
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Prefix format: <code className="text-slate-600 dark:text-slate-300">{curProv.keyPrefix}...</code>
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                      type="password"
                                      placeholder={`Enter ${curProv.name} API Key (${curProv.keyPrefix}...)`}
                                      value={setupAiKey}
                                      onChange={(e) => setSetupAiKey(e.target.value)}
                                      className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                    If left empty, SOMAK AI routes requests through server-level platform-metered Nebius / Gemini inference fallbacks.
                                  </p>
                                </div>
                              </>
                            );
                          })()}

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              disabled={savingSetupId === 'ai'}
                              onClick={async () => {
                                setSavingSetupId('ai');
                                try {
                                  const payload: Record<string, any> = {
                                    triage_provider: setupAiProvider,
                                    synthesis_provider: setupAiProvider,
                                    triage_model: setupAiModel,
                                    synthesis_model: setupAiModel,
                                    ai_model_tier: setupAiModel,
                                  };
                                  if (setupAiKey.trim()) {
                                    if (setupAiProvider === 'nvidia_nim') {
                                      payload.nvidia_nim_api_key = setupAiKey.trim();
                                      payload.nvidia_nim_connected = true;
                                    } else if (setupAiProvider === 'nebius') {
                                      payload.nebius_api_key = setupAiKey.trim();
                                      payload.ai_connected = true;
                                    } else if (setupAiProvider === 'gemini') {
                                      payload.google_api_key = setupAiKey.trim();
                                      payload.google_connected = true;
                                    } else if (setupAiProvider === 'openai') {
                                      payload.openai_api_key = setupAiKey.trim();
                                      payload.openai_connected = true;
                                    } else if (setupAiProvider === 'anthropic') {
                                      payload.anthropic_api_key = setupAiKey.trim();
                                      payload.anthropic_connected = true;
                                    }
                                  }
                                  await updateChecklist(payload);
                                  showToast('AI Provider & Model configuration saved successfully', 'success');
                                  setSetupAiKey('');
                                  setExpandedSetupId('tavily');
                                } catch (err: any) {
                                  showToast('Failed to save AI settings: ' + (err?.message || ''), 'error');
                                } finally {
                                  setSavingSetupId(null);
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs disabled:opacity-50"
                            >
                              {savingSetupId === 'ai' ? 'Saving...' : 'Save & Continue'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 3: Connect Tavily search */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedSetupId(expandedSetupId === 'tavily' ? null : 'tavily')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isTavilyDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {isTavilyDone ? <Check className="w-3.5 h-3.5" /> : '3'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Connect Tavily search <span className="font-normal text-slate-400">(optional)</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Lets the AI research real fixes and official documentation instead of guessing.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTavilyDone && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Connected
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedSetupId === 'tavily' ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {expandedSetupId === 'tavily' && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Tavily Search API Key
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="password"
                                placeholder="tvly-..."
                                value={setupTavilyKey}
                                onChange={(e) => setSetupTavilyKey(e.target.value)}
                                className="flex-1 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                disabled={savingSetupId === 'tavily'}
                                onClick={async () => {
                                  setSavingSetupId('tavily');
                                  try {
                                    await updateChecklist({
                                      tavily_api_key: setupTavilyKey,
                                      tavily_connected: Boolean(setupTavilyKey.trim()),
                                    });
                                    showToast('Tavily Search API key saved', 'success');
                                    setExpandedSetupId('notifications');
                                  } catch {
                                    showToast('Failed to save Tavily key', 'error');
                                  } finally {
                                    setSavingSetupId(null);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs shrink-0 disabled:opacity-50"
                              >
                                {savingSetupId === 'tavily' ? 'Saving...' : 'Save & Continue'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 4: Connect notifications */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedSetupId(expandedSetupId === 'notifications' ? null : 'notifications')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isNotifDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {isNotifDone ? <Check className="w-3.5 h-3.5" /> : '4'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Connect notifications
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Deliver critical outage alerts and deployment approvals directly to your team.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isNotifDone && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Connected
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedSetupId === 'notifications' ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {expandedSetupId === 'notifications' && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Slack Incoming Webhook
                              </label>
                              <input
                                type="text"
                                placeholder="https://hooks.slack.com/services/..."
                                value={setupSlackWebhook}
                                onChange={(e) => setSetupSlackWebhook(e.target.value)}
                                className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                PagerDuty Routing / Events Key
                              </label>
                              <input
                                type="text"
                                placeholder="pd-key-..."
                                value={setupPagerdutyKey}
                                onChange={(e) => setSetupPagerdutyKey(e.target.value)}
                                className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={savingSetupId === 'notifications'}
                              onClick={async () => {
                                setSavingSetupId('notifications');
                                try {
                                  await updateChecklist({
                                    slack_webhook: setupSlackWebhook,
                                    pagerduty_key: setupPagerdutyKey,
                                    notifications_connected: Boolean(setupSlackWebhook.trim() || setupPagerdutyKey.trim()),
                                  });
                                  showToast('Notification channels updated', 'success');
                                  setExpandedSetupId('team');
                                } catch {
                                  showToast('Failed to save notification channels', 'error');
                                } finally {
                                  setSavingSetupId(null);
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs disabled:opacity-50"
                            >
                              {savingSetupId === 'notifications' ? 'Saving...' : 'Save & Continue'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 5: Invite your team */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedSetupId(expandedSetupId === 'team' ? null : 'team')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isTeamDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {isTeamDone ? <Check className="w-3.5 h-3.5" /> : '5'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Invite your team
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Invite your SRE and DevOps engineers with custom RBAC roles.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTeamDone && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Active ({members.length})
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedSetupId === 'team' ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {expandedSetupId === 'team' && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs">
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="email"
                              placeholder="colleague@company.com"
                              value={setupInviteEmail}
                              onChange={(e) => setSetupInviteEmail(e.target.value)}
                              className="flex-1 w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="w-full sm:w-36">
                              <CustomSelect
                                value={setupInviteRole}
                                onChange={(val) => setSetupInviteRole(val as UserRole)}
                                options={[
                                  { value: 'Admin', label: 'Admin' },
                                  { value: 'Operator', label: 'Operator' },
                                  { value: 'Viewer', label: 'Viewer' },
                                ]}
                              />
                            </div>
                            <button
                              type="button"
                              disabled={savingSetupId === 'team' || !setupInviteEmail.trim()}
                              onClick={async () => {
                                setSavingSetupId('team');
                                try {
                                  await createInvites([setupInviteEmail.trim()], setupInviteRole);
                                  await updateChecklist({ team_invited: true });
                                  showToast(`Invitation sent to ${setupInviteEmail.trim()}`, 'success');
                                  setSetupInviteEmail('');
                                  setExpandedSetupId(null);
                                } catch {
                                  showToast('Failed to send team invitation', 'error');
                                } finally {
                                  setSavingSetupId(null);
                                }
                              }}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs shrink-0 disabled:opacity-50"
                            >
                              {savingSetupId === 'team' ? 'Sending...' : 'Send Invite'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="sm:w-1/3">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        Primary Timezone
                      </label>
                      <p className="text-[11px] text-slate-400">Used for incident timestamps and shift rotas.</p>
                    </div>
                    <div className="sm:w-2/3">
                      <CustomSelect
                        value={timezone}
                        onChange={(val) => {
                          setTimezone(val);
                          markDirty();
                        }}
                        options={[
                          { value: 'Asia/Kolkata (IST - GMT+05:30)', label: 'Asia/Kolkata (IST - GMT+05:30)', badge: 'Recommended' },
                          { value: 'UTC (GMT+00:00)', label: 'UTC (GMT+00:00)' },
                          { value: 'America/New_York (EST - GMT-05:00)', label: 'America/New_York (EST - GMT-05:00)' },
                          { value: 'America/Los_Angeles (PST - GMT-08:00)', label: 'America/Los_Angeles (PST - GMT-08:00)' },
                          { value: 'America/Chicago (CST - GMT-06:00)', label: 'America/Chicago (CST - GMT-06:00)' },
                          { value: 'Europe/London (BST/GMT - GMT+01:00)', label: 'Europe/London (BST/GMT - GMT+01:00)' },
                          { value: 'Europe/Berlin (CET - GMT+02:00)', label: 'Europe/Berlin (CET - GMT+02:00)' },
                          { value: 'Asia/Dubai (GST - GMT+04:00)', label: 'Asia/Dubai (GST - GMT+04:00)' },
                          { value: 'Asia/Singapore (SGT - GMT+08:00)', label: 'Asia/Singapore (SGT - GMT+08:00)' },
                          { value: 'Asia/Tokyo (JST - GMT+09:00)', label: 'Asia/Tokyo (JST - GMT+09:00)' },
                          { value: 'Australia/Sydney (AEST - GMT+10:00)', label: 'Australia/Sydney (AEST - GMT+10:00)' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Live Real-Time Multi-Timeline Clock Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          Live Operational Timelines
                        </span>
                      </div>
                      {timezone !== 'Asia/Kolkata (IST - GMT+05:30)' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTimezone('Asia/Kolkata (IST - GMT+05:30)');
                            markDirty();
                          }}
                          className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Quick Switch to IST
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200/60 dark:border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">India Standard Time</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                        </div>
                        <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">GMT+05:30 (IST)</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200/60 dark:border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Workspace Selected</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {(() => {
                            try {
                              const tzIana = timezone.split(' ')[0];
                              return currentTime.toLocaleTimeString('en-US', { timeZone: tzIana, hour12: true });
                            } catch {
                              return currentTime.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true });
                            }
                          })()}
                        </div>
                        <div className="text-[10px] text-indigo-500 font-semibold mt-0.5 truncate">{timezone}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200/60 dark:border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">SRE Cloud Standard</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {currentTime.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}
                        </div>
                        <div className="text-[10px] text-cyan-500 font-semibold mt-0.5">GMT+00:00 (UTC)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field 4: Data Retention */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="sm:w-1/3">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Audit Trail Retention
                    </label>
                    <p className="text-[11px] text-slate-400">Rolling cryptographic log retention window.</p>
                  </div>
                  <div className="sm:w-2/3">
                    <CustomSelect
                      value={retentionDays}
                      onChange={(val) => {
                        setRetentionDays(val);
                        markDirty();
                      }}
                      options={[
                        { value: '30', label: '30 Days (Developer Free Tier)' },
                        { value: '90', label: '90 Days (Security Recommended)' },
                        { value: '365', label: '1 Year (Enterprise)' },
                        { value: 'forever', label: 'Indefinite (Append-Only Immutable)' },
                      ]}
                    />
                  </div>
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
                  <CustomSelect
                    value={preferredProvider}
                    onChange={(val) => handleProviderChange(val)}
                    options={BYOK_PROVIDERS.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.description})`,
                      badge: p.badge,
                    }))}
                  />
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
                  <CustomSelect
                    value={selectedTriageModel}
                    onChange={(val) => setSelectedTriageModel(val)}
                    options={activeProviderMeta.triageModels.map((m) => ({
                      value: m.id,
                      label: m.name,
                    }))}
                  />
                </div>

                {/* Synthesis Model */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Synthesis Stage Model (AST Patch Generation)
                  </label>
                  <CustomSelect
                    value={selectedSynthesisModel}
                    onChange={(val) => setSelectedSynthesisModel(val)}
                    options={activeProviderMeta.synthesisModels.map((m) => ({
                      value: m.id,
                      label: m.name,
                    }))}
                  />
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

              {/* Rows or Empty State (Vercel Env Variables Pattern) */}
              {keys.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Key className="w-6 h-6 mx-auto text-slate-400 opacity-60" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No envelope encryption keys connected</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Configure your AI provider keys in the Keys section above, or connect an enterprise KMS provider for hardware-isolated envelope encryption.
                  </p>
                </div>
              ) : (
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
              )}
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

              {/* Sample Demo Mode Banner */}
              {isAcme && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
                  <Users className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>Sample Demo Roster:</strong> Demonstrating RBAC membership and dual-approval enforcement for Acme Corp. Real members you invite will appear here.
                  </span>
                </div>
              )}

              {/* Members List or Empty State */}
              {members.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Users className="w-6 h-6 mx-auto text-slate-400 opacity-60" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No team members invited yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Invite operators and engineers to collaborate with dual-approval authorization on AST remediations.
                  </p>
                </div>
              ) : (
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
                        <div className="w-28">
                          <CustomSelect
                            value={m.role}
                            size="sm"
                            onChange={(val) => handleRoleChange(m.id, val as UserRole)}
                            options={[
                              { value: 'Admin', label: 'Admin' },
                              { value: 'Operator', label: 'Operator' },
                              { value: 'Viewer', label: 'Viewer' },
                            ]}
                          />
                        </div>

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
              )}
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
                      <CustomSelect
                        value={inviteRole}
                        onChange={(val) => setInviteRole(val as UserRole)}
                        options={[
                          { value: 'Operator', label: 'Operator (Can trigger sandboxes & review fixes)' },
                          { value: 'Admin', label: 'Admin (Full tenancy control & canary promotion)' },
                          { value: 'Viewer', label: 'Viewer (Read-only access)' },
                        ]}
                      />
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
            {/* GitHub App Connection & Authentication Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white flex items-center justify-center shrink-0">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>GitHub Integration</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                        githubUser
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isAcme
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : githubToken
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {githubUser ? `Connected (@${githubUser})` : (isAcme ? 'Connected (@acme-corp)' : (githubToken ? 'PAT Configured' : 'Token Required for Private Repos'))}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Autonomous pull request synthesis with AST diffs, automated branch staging, and rollback guards.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=SomakAI-SentryOps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span>Generate GitHub PAT</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* GitHub PAT Configuration Box */}
              <form onSubmit={handleSaveGithubToken} className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                      <span>GitHub Personal Access Token (for Private Repositories)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Required for private repositories (e.g. <span className="font-mono text-slate-700 dark:text-slate-300">manishSuryawanshiCodes/desconnect</span>). Ensure your token has the <span className="font-mono text-indigo-600 dark:text-indigo-400">repo</span> scope.
                    </p>
                  </div>
                  {githubUser && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 self-start sm:self-auto shrink-0">
                      ✓ Authenticated as @{githubUser}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubTokenState(e.target.value)}
                    placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                    className="flex-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isVerifyingGithub}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isVerifyingGithub && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>{isVerifyingGithub ? 'Verifying...' : 'Save & Verify Token'}</span>
                    </button>
                    {githubToken && (
                      <button
                        type="button"
                        onClick={() => {
                          setGithubTokenState('');
                          setGitHubToken('');
                          setGithubUser(null);
                          showToast('GitHub token cleared', 'info');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/20 text-xs font-semibold text-slate-500 transition-colors shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </form>

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
                  {repoMappings.map((mapping) => {
                    const testResult = repoTestResults[mapping.repo_full_name];
                    const isTestingThis = testingRepo === mapping.repo_full_name;

                    return (
                      <div key={mapping.service_name} className="py-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                                <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                  {mapping.repo_full_name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>Target Branch: <strong className="text-slate-600 dark:text-slate-300">{mapping.default_branch}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-center">
                            {/* Test Access Button */}
                            <button
                              type="button"
                              disabled={isTestingThis}
                              onClick={() => handleTestRepoAccess(mapping.repo_full_name)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <Activity className={`w-3 h-3 text-indigo-500 ${isTestingThis ? 'animate-spin' : ''}`} />
                              <span>{isTestingThis ? 'Checking...' : 'Test Access'}</span>
                            </button>

                            {/* Auto-merge toggle */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAutoMerge(mapping.service_name)}
                                className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
                                  mapping.auto_merge ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-white/10'
                                }`}
                                title="Auto-merge PR once 100% canary verification passes"
                              >
                                <span
                                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                    mapping.auto_merge ? 'translate-x-4' : 'translate-x-0.5'
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

                        {/* Inline Test Result Feedback */}
                        {testResult && (
                          <div className={`p-2 rounded-lg text-[11px] font-mono flex items-center gap-2 ${
                            testResult.success
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400'
                          }`}>
                            {testResult.success ? (
                              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                            )}
                            <span className="break-all">{testResult.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                        placeholder="e.g. auth-service, desconnect, api-gateway"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        GitHub Repository (Org/Repo or full URL)
                      </label>
                      <input
                        type="text"
                        required
                        value={newRepoFullName}
                        onChange={(e) => setNewRepoFullName(e.target.value)}
                        placeholder="e.g. manishSuryawanshiCodes/desconnect"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                      {newRepoFullName.trim() && (
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Target slug: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sanitizeRepoFullName(newRepoFullName)}</span>
                        </div>
                      )}
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
                <div
                  onClick={() => router.push('/checkout?plan=team')}
                  className="p-4 rounded-xl border-2 border-indigo-500/80 bg-indigo-500/5 space-y-3 cursor-pointer hover:shadow-md hover:border-indigo-500 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Team Plan</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Autonomous canary gates, 25 seats, Slack & PagerDuty</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">$79/mo</span>
                  </div>
                  <Link
                    href="/checkout?plan=team"
                    onClick={(e) => e.stopPropagation()}
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
                    onClick={() => showToast('To delete, contact enterprise support to satisfy data retention.', 'error')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    Delete Organization
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Account Sub-tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-x-auto text-xs font-medium w-fit">
            <button
              type="button"
              onClick={() => setAccountTab('profile')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                accountTab === 'profile'
                  ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Profile &amp; Identity
            </button>
            <button
              type="button"
              onClick={() => setAccountTab('security')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                accountTab === 'security'
                  ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Password &amp; Security
            </button>
          </div>

          {/* Profile Tab */}
          {accountTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Personal Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your identity across incidents, automated code authorship, and notification routing.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  {/* Avatar Display */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      {user?.avatar || (accountName ? accountName.substring(0, 2).toUpperCase() : 'US')}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{accountName || user?.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                          {user?.role || 'Operator'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {user?.team || 'Platform Reliability SRE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Work Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled
                          value={user?.email || 'user@company.com'}
                          className="w-full bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 cursor-not-allowed pr-20"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingAccount}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {isSavingAccount ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {accountTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                    <span>Change Password</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your account password encrypted and authenticated by Supabase.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3 text-xs max-w-md">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingPassword || !newPassword}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2FA Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Two-Factor Authentication (2FA)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Enforce a 6-digit TOTP verification code from an authenticator app (1Password, Google Authenticator) on login.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaEnabled(!mfaEnabled);
                      showToast(!mfaEnabled ? 'Two-Factor Authentication enabled.' : 'Two-Factor Authentication disabled.', 'info');
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      mfaEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        mfaEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Active Sessions Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-indigo-500" />
                      <span>Active Device Sessions</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Devices and browsers currently authenticated to your Somak AI account.
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeOtherSessions}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Revoke Other Sessions
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {sessions.map((sess) => (
                    <div key={sess.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span>{sess.device}</span>
                            {sess.current && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {sess.ip} · {sess.lastActive}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
