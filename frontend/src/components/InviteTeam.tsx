"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Send,
  Plus,
  X,
  Clock,
  RotateCw,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/components/ToastProvider';
import { UserRole } from '@/context/AuthContext';
import { analytics } from '@/lib/analytics';

interface InviteTeamProps {
  compact?: boolean;
  onInvitesSent?: () => void;
}

interface RoleInfo {
  label: UserRole;
  badgeColor: string;
  description: string;
}

const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  Admin: {
    label: 'Admin',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    description: 'Full control, manages integrations and billing',
  },
  Operator: {
    label: 'Operator',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    description: 'Can approve deploys and rollbacks',
  },
  Viewer: {
    label: 'Viewer',
    badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
    description: 'Read-only access to incidents and reports',
  },
};

export default function InviteTeam({ compact = false, onInvitesSent }: InviteTeamProps) {
  const { currentOrg, invites, createInvites, revokeInvite, resendInvite } = useOrg();
  const { showToast } = useToast();

  const [emailInput, setEmailInput] = useState('');
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Operator');
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Add email tag from input
  const addEmail = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return;
    if (emailTags.includes(trimmed)) return;
    if (!trimmed.includes('@')) return;
    setEmailTags((prev) => [...prev, trimmed]);
    setEmailInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(emailInput);
    } else if (e.key === 'Backspace' && !emailInput && emailTags.length > 0) {
      setEmailTags((prev) => prev.slice(0, -1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',') || pasted.includes(' ') || pasted.includes('\n')) {
      e.preventDefault();
      const parts = pasted.split(/[\s,\n]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes('@'));
      setEmailTags((prev) => Array.from(new Set([...prev, ...parts])));
      setEmailInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEmailTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    const allEmails = [...emailTags];
    if (emailInput.trim() && emailInput.includes('@')) {
      allEmails.push(emailInput.trim().toLowerCase());
    }

    if (allEmails.length === 0) {
      showToast('Please enter at least one valid email address', 'error');
      return;
    }

    setIsSending(true);
    try {
      const created = await createInvites(allEmails, selectedRole);
      analytics.track('invite_sent', {
        role: selectedRole,
        org_id: currentOrg?.id,
        count: created.length,
      });
      setEmailTags([]);
      setEmailInput('');
      showToast(`Successfully sent ${created.length} invitation${created.length > 1 ? 's' : ''}`, 'success');
      onInvitesSent?.();
    } catch {
      showToast('Failed to send invites. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    showToast('Invite link copied to clipboard', 'info');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleResend = async (id: string, email: string) => {
    await resendInvite(id);
    showToast(`Invitation resent to ${email} (7 days extended)`, 'info');
  };

  const handleRevoke = async (id: string, email: string) => {
    await revokeInvite(id);
    showToast(`Invitation for ${email} revoked`, 'warning');
  };

  const activeRoleDescription = ROLE_DEFINITIONS[hoveredRole || selectedRole].description;

  return (
    <div className="space-y-5">
      {/* Invite Form Card */}
      <form onSubmit={handleSendInvites} className="space-y-4">
        {/* Email Input with Multiple Tag Support */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Team Member Emails
          </label>
          <div className="min-h-[42px] p-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            {emailTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-indigo-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => emailInput && addEmail(emailInput)}
              placeholder={emailTags.length === 0 ? 'Enter comma-separated emails or press enter' : 'Add another...'}
              className="flex-1 min-w-[180px] bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-1 px-1"
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Press enter or comma to add multiple recipients
          </span>
        </div>

        {/* Role Selector with inline descriptions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Role
            </label>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 italic">
              {activeRoleDescription}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Admin', 'Operator', 'Viewer'] as UserRole[]).map((role) => {
              const info = ROLE_DEFINITIONS[role];
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  onMouseEnter={() => setHoveredRole(role)}
                  onMouseLeave={() => setHoveredRole(null)}
                  onFocus={() => setHoveredRole(role)}
                  onBlur={() => setHoveredRole(null)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{role}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {info.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Invitations expire after 7 days</span>
          </div>

          <button
            type="submit"
            disabled={isSending || (emailTags.length === 0 && !emailInput.trim())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50 btn-glow-primary"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending Invites...' : 'Send Invites'}</span>
          </button>
        </div>
      </form>

      {/* Pending Invites List */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Pending Invitations ({invites.filter((i) => i.status === 'pending').length})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentOrg?.name}
          </span>
        </div>

        {invites.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No pending invites. Invite teammates above to collaborate.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50">
            {invites.map((inv) => {
              const roleInfo = ROLE_DEFINITIONS[inv.role] || ROLE_DEFINITIONS.Operator;
              const isPending = inv.status === 'pending';
              const isExpired = inv.status === 'expired';

              return (
                <div
                  key={inv.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-900/50">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {inv.email}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${roleInfo.badgeColor}`}>
                          {inv.role}
                        </span>
                        {isExpired && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Invited {new Date(inv.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Expires in 7 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {/* Copy Link button for rapid local testing */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(inv.token)}
                        title="Copy direct invite link to test acceptance"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/70 transition-colors"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleResend(inv.id, inv.email)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      title="Resend invitation"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.id, inv.email)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { InviteTeam };
