"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Organization, Invite, SetupChecklist } from '@/lib/types';
import { useAuth, UserRole } from './AuthContext';
import * as api from '@/lib/api';

export interface UserOrgMembership {
  organization: Organization;
  role: UserRole;
}

interface OrgContextType {
  currentOrg: Organization | null;
  currentRole: UserRole;
  userOrgs: UserOrgMembership[];
  isLoading: boolean;
  switchOrg: (orgId: string) => void;
  createOrg: (data: {
    name: string;
    slug: string;
    team_size?: string;
    primary_use_case?: string;
  }) => Promise<Organization>;
  updateChecklist: (data: Partial<SetupChecklist>) => Promise<Organization | null>;
  updateOrgPlan: (plan: 'free' | 'team' | 'business' | 'enterprise') => Promise<Organization | null>;
  invites: Invite[];
  createInvites: (emails: string[], role: UserRole) => Promise<Invite[]>;
  revokeInvite: (inviteId: string) => Promise<boolean>;
  resendInvite: (inviteId: string) => Promise<Invite | null>;
  refreshOrgData: () => Promise<void>;
}

export const DEFAULT_ACME_ORG: Organization = {
  id: 'org_acme',
  name: 'Acme Corp',
  slug: 'acme',
  team_size: '11-50',
  primary_use_case: 'Autonomous Incident Remediation',
  plan: 'enterprise',
  created_at: '2026-09-01T00:00:00Z',
  created_by: 'usr_mv492',
  setup_checklist: {
    sentry_connected: true,
    sentry_dsn: 'https://o4505@sentry.io/450582',
    sentry_inbound_url: 'https://api.somak.ai/v1/webhook/ingest/acme-prod',
    ai_connected: true,
    ai_api_key: 'neb-tok-live-89f4b321',
    nebius_api_key: 'neb-tok-live-89f4b321',
    ai_model_tier: 'nvidia/nemotron-3-ultra-550b',
    triage_provider: 'nebius',
    triage_model: 'nvidia/nemotron-3-nano-30b-a3b',
    synthesis_provider: 'nebius',
    synthesis_model: 'nvidia/nemotron-3-ultra-550b',
    anthropic_connected: false,
    anthropic_api_key: '',
    openai_connected: false,
    openai_api_key: '',
    google_connected: false,
    google_api_key: '',
    tavily_connected: true,
    tavily_api_key: 'tvly-prod-c4391aa8',
    notifications_connected: true,
    slack_webhook: 'https://hooks.slack.com/services/T00/B00/X123456',
    pagerduty_key: 'pd_live_a89f920bc481',
    team_invited: true,
  },
};


const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(DEFAULT_ACME_ORG);
  const [userOrgs, setUserOrgs] = useState<UserOrgMembership[]>([
    { organization: DEFAULT_ACME_ORG, role: 'Operator' },
  ]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load organizations from backend or localStorage
  const refreshOrgData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check local storage first
      let localOrgs: UserOrgMembership[] = [];
      const storedOrgs = localStorage.getItem(`sentryops_orgs_${user.id}`);
      if (storedOrgs) {
        try {
          localOrgs = JSON.parse(storedOrgs);
        } catch {}
      }

      // If user is a demo user, ensure Acme Corp is present
      const isDemoUser = ['usr_mv492', 'usr_elena', 'usr_observer'].includes(user.id) ||
        user.email.includes('somak.internal') ||
        user.email.includes('sentryops.internal');
      
      if (isDemoUser && !localOrgs.some((o) => o.organization.id === DEFAULT_ACME_ORG.id)) {
        localOrgs = [{ organization: DEFAULT_ACME_ORG, role: user.role }, ...localOrgs];
      }

      // 2. Try fetching from backend API
      const remoteOrgs = await api.getUserOrganizations(user.id, user.email);
      let combined: UserOrgMembership[] = localOrgs;
      if (remoteOrgs && remoteOrgs.length > 0) {
        // Merge without duplicates
        const map = new Map<string, UserOrgMembership>();
        localOrgs.forEach((o) => map.set(o.organization.id, o));
        remoteOrgs.forEach((o) => map.set(o.organization.id, o));
        combined = Array.from(map.values());
      }

      setUserOrgs(combined);
      try {
        localStorage.setItem(`sentryops_orgs_${user.id}`, JSON.stringify(combined));
      } catch {}

      // Determine active org
      const savedOrgId = localStorage.getItem(`sentryops_active_org_${user.id}`);
      const matched = combined.find((o) => o.organization.id === savedOrgId);

      if (matched) {
        setCurrentOrg(matched.organization);
      } else if (combined.length > 0) {
        setCurrentOrg(combined[0].organization);
        try {
          localStorage.setItem(`sentryops_active_org_${user.id}`, combined[0].organization.id);
        } catch {}
      } else {
        setCurrentOrg(null);
      }

      // Load invites for the current org
      const activeId = matched?.organization.id || (combined[0]?.organization.id);
      if (activeId) {
        const orgInvites = await api.getOrganizationInvites(activeId);
        if (orgInvites) {
          setInvites(orgInvites);
        } else {
          // fallback to localStorage invites
          const storedInvites = localStorage.getItem(`sentryops_invites_${activeId}`);
          if (storedInvites) {
            try {
              setInvites(JSON.parse(storedInvites));
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load org data', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshOrgData();
  }, [refreshOrgData]);

  const switchOrg = (orgId: string) => {
    const found = userOrgs.find((o) => o.organization.id === orgId);
    if (found) {
      setCurrentOrg(found.organization);
      if (user) {
        try {
          localStorage.setItem(`sentryops_active_org_${user.id}`, orgId);
        } catch {}
      }
      // Load invites for new org
      api.getOrganizationInvites(orgId).then((data) => {
        if (data) setInvites(data);
      });
    }
  };

  const createOrg = async (data: {
    name: string;
    slug: string;
    team_size?: string;
    primary_use_case?: string;
  }): Promise<Organization> => {
    if (!user) throw new Error('Must be authenticated to create an organization');

    let newOrg: Organization | null = null;
    try {
      newOrg = await api.createOrganization({
        name: data.name,
        slug: data.slug,
        team_size: data.team_size,
        primary_use_case: data.primary_use_case,
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
      });
    } catch (e) {
      console.warn('Backend createOrg failed, falling back to local creation', e);
    }

    if (!newOrg) {
      const generatedId = `org_${Math.random().toString(36).substring(2, 10)}`;
      newOrg = {
        id: generatedId,
        name: data.name,
        slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
        team_size: data.team_size || '2-10',
        primary_use_case: data.primary_use_case || 'Autonomous Incident Remediation',
        created_at: new Date().toISOString(),
        created_by: user.id,
        setup_checklist: {
          sentry_connected: false,
          sentry_dsn: '',
          sentry_inbound_url: `https://api.somak.ai/v1/webhook/ingest/${data.slug}`,
          ai_connected: false,
          ai_api_key: '',
          ai_model_tier: 'nvidia/nemotron-3-nano-30b-a3b',
          tavily_connected: false,
          tavily_api_key: '',
          notifications_connected: false,
          slack_webhook: '',
          pagerduty_key: '',
          team_invited: false,
        },
      };
    }

    const membership: UserOrgMembership = {
      organization: newOrg,
      role: 'Admin',
    };

    const updatedOrgs = [...userOrgs.filter((o) => o.organization.id !== newOrg!.id), membership];
    setUserOrgs(updatedOrgs);
    setCurrentOrg(newOrg);

    try {
      localStorage.setItem(`sentryops_orgs_${user.id}`, JSON.stringify(updatedOrgs));
      localStorage.setItem(`sentryops_active_org_${user.id}`, newOrg.id);
    } catch {}

    return newOrg;
  };

  const updateChecklist = async (data: Partial<SetupChecklist>): Promise<Organization | null> => {
    if (!currentOrg) return null;

    let updated: Organization | null = null;
    try {
      updated = await api.updateOrganizationSetup(currentOrg.id, data);
    } catch (e) {
      console.warn('Backend updateSetup failed, applying locally', e);
    }

    const nextOrg: Organization = updated || {
      ...currentOrg,
      setup_checklist: {
        ...currentOrg.setup_checklist,
        ...data,
      },
    };

    setCurrentOrg(nextOrg);
    const nextUserOrgs = userOrgs.map((o) =>
      o.organization.id === nextOrg.id ? { ...o, organization: nextOrg } : o
    );
    setUserOrgs(nextUserOrgs);

    if (user) {
      try {
        localStorage.setItem(`sentryops_orgs_${user.id}`, JSON.stringify(nextUserOrgs));
      } catch {}
    }

    return nextOrg;
  };

  const updateOrgPlan = async (plan: 'free' | 'team' | 'business' | 'enterprise'): Promise<Organization | null> => {
    if (!currentOrg) return null;

    let updated: Organization | null = null;
    try {
      updated = await api.updateOrganizationPlan(currentOrg.id, plan);
    } catch (e) {
      console.warn('Backend updateOrganizationPlan failed, applying locally', e);
    }

    const nextOrg: Organization = updated || {
      ...currentOrg,
      plan,
    };

    setCurrentOrg(nextOrg);
    const nextUserOrgs = userOrgs.map((o) =>
      o.organization.id === nextOrg.id ? { ...o, organization: nextOrg } : o
    );
    setUserOrgs(nextUserOrgs);

    if (user) {
      try {
        localStorage.setItem(`sentryops_orgs_${user.id}`, JSON.stringify(nextUserOrgs));
      } catch {}
    }

    return nextOrg;
  };

  const createInvites = async (emails: string[], role: UserRole): Promise<Invite[]> => {
    if (!currentOrg || !user) return [];

    let newInvites: Invite[] | null = null;
    try {
      newInvites = await api.createOrganizationInvites(currentOrg.id, {
        emails,
        role,
        invited_by: user.name || user.email,
      });
    } catch (e) {
      console.warn('Backend invite failed, generating local invites', e);
    }

    if (!newInvites || newInvites.length === 0) {
      const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      newInvites = emails.map((email) => ({
        id: `inv_${Math.random().toString(36).substring(2, 9)}`,
        organization_id: currentOrg.id,
        organization_name: currentOrg.name,
        organization_slug: currentOrg.slug,
        email: email.trim(),
        role,
        token: `inv_${Math.random().toString(36).substring(2, 14)}`,
        invited_by: user.name || user.email,
        created_at: new Date().toISOString(),
        expires_at: exp,
        status: 'pending' as const,
      }));
    }

    const updated = [...newInvites, ...invites];
    setInvites(updated);

    try {
      localStorage.setItem(`sentryops_invites_${currentOrg.id}`, JSON.stringify(updated));
    } catch {}

    // Mark checklist item complete
    updateChecklist({ team_invited: true });

    return newInvites;
  };

  const revokeInvite = async (inviteId: string): Promise<boolean> => {
    if (!currentOrg) return false;
    try {
      await api.revokeOrganizationInvite(currentOrg.id, inviteId);
    } catch {}

    const updated = invites.map((inv) =>
      inv.id === inviteId ? { ...inv, status: 'revoked' as const } : inv
    );
    setInvites(updated);
    try {
      localStorage.setItem(`sentryops_invites_${currentOrg.id}`, JSON.stringify(updated));
    } catch {}
    return true;
  };

  const resendInvite = async (inviteId: string): Promise<Invite | null> => {
    if (!currentOrg) return null;
    let res: Invite | null = null;
    try {
      res = await api.resendOrganizationInvite(currentOrg.id, inviteId);
    } catch {}

    const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const updated = invites.map((inv) =>
      inv.id === inviteId ? (res || { ...inv, status: 'pending' as const, expires_at: exp }) : inv
    );
    setInvites(updated);
    try {
      localStorage.setItem(`sentryops_invites_${currentOrg.id}`, JSON.stringify(updated));
    } catch {}
    return res || updated.find((i) => i.id === inviteId) || null;
  };

  // Find user's role in current organization
  const currentMembership = userOrgs.find((o) => o.organization.id === currentOrg?.id);
  const currentRole: UserRole = currentMembership?.role || user?.role || 'Viewer';

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        currentRole,
        userOrgs,
        isLoading,
        switchOrg,
        createOrg,
        updateChecklist,
        updateOrgPlan,
        invites,
        createInvites,
        revokeInvite,
        resendInvite,
        refreshOrgData,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
