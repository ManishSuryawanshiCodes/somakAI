import { Organization, OrganizationMember, Invite, Incident, SystemHealth, CanaryStatus, SetupChecklist } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export class RateLimitError extends Error {
  public retryAfter: number;
  public limitDescription?: string;

  constructor(message: string, retryAfter: number, limitDescription?: string) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limitDescription = limitDescription;
  }
}

export class AccountLockedError extends Error {
  public remainingSeconds: number;

  constructor(message: string, remainingSeconds: number) {
    super(message);
    this.name = 'AccountLockedError';
    this.remainingSeconds = remainingSeconds;
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('somak_session_token') || localStorage.getItem('sentryops_session_token'))
      : null;
    const activeOrgId = typeof window !== 'undefined'
      ? (localStorage.getItem('somak_active_org_id') || localStorage.getItem('sentryops_active_org'))
      : null;

    const customHeaders = (options?.headers as Record<string, string>) || {};
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (activeOrgId && !headers['x-org-id'] && !url.startsWith('/api/organizations?') && url !== '/api/organizations') {
      headers['x-org-id'] = activeOrgId;
    }

    const res = await fetch(`${API_BASE}${url}`, {
      credentials: 'include', // Ensures HttpOnly session cookies are transmitted
      ...options,
      headers,
    });
    if (!res.ok) {
      if (res.status === 403 && typeof window !== 'undefined' && activeOrgId) {
        const stored = localStorage.getItem('sentryops_active_org') || localStorage.getItem('somak_active_org_id');
        if (stored === activeOrgId) {
          localStorage.removeItem('somak_active_org_id');
          localStorage.removeItem('sentryops_active_org');
        }
      }
      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const retrySeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
        let detail = `Rate limit exceeded. Please wait ${retrySeconds}s before retrying.`;
        let limitDesc: string | undefined;
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
          if (body?.limit) limitDesc = body.limit;
        } catch {}
        throw new RateLimitError(detail, retrySeconds, limitDesc);
      }
      if (res.status === 423) {
        const retryHeader = res.headers.get('Retry-After') || '900';
        let detail = 'Account temporarily locked due to consecutive failed attempts.';
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
        } catch {}
        throw new AccountLockedError(detail, parseInt(retryHeader, 10));
      }
      const errBody = await res.json().catch(() => ({}));
      const errDetail = errBody?.detail || `HTTP ${res.status}`;
      throw new Error(errDetail);
    }
    return await res.json();
  } catch (e) {
    if (e instanceof RateLimitError || e instanceof AccountLockedError) {
      throw e;
    }
    // Always rethrow errors for authentication and verification endpoints so callers can handle invalid credentials
    if (url.startsWith('/api/auth/') || url.includes('/signup') || url.includes('/login') || url.includes('/verify')) {
      throw e;
    }
    console.warn(`API call failed: ${url}`, e);
    return null;
  }
}

// -------------------------------------------------------------
// Organization & Auth APIs
// -------------------------------------------------------------

export async function backendSignup(data: { email: string; password?: string; name?: string }) {
  return fetchJSON<{ user_id: string; email: string; name: string; has_organizations: boolean; verification_code_sent?: boolean }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function backendLogin(data: { email: string; password?: string; role?: string; name?: string }) {
  return fetchJSON<{
    status?: string;
    mfa_ticket?: string;
    session_token?: string;
    user?: unknown;
    has_organizations?: boolean;
    organizations?: unknown[];
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function backendLogout(): Promise<{ status: string; message: string } | null> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('somak_session_token') : null;
  return fetchJSON<{ status: string; message: string }>('/api/auth/logout', {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
  });
}

export interface MfaSetupResponse {
  secret: string;
  qr_code_url: string;
  manual_entry_key: string;
  issuer: string;
  account: string;
}

export async function setupMfa(): Promise<MfaSetupResponse | null> {
  return fetchJSON<MfaSetupResponse>('/api/auth/mfa/setup', { method: 'POST' });
}

export async function enableMfa(secret: string, code: string): Promise<{ status: string; message: string } | null> {
  return fetchJSON('/api/auth/mfa/enable', {
    method: 'POST',
    body: JSON.stringify({ secret, code }),
  });
}

export async function disableMfa(password: string): Promise<{ status: string; message: string } | null> {
  return fetchJSON('/api/auth/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function verifyMfa(mfaTicket: string, code: string) {
  return fetchJSON<{
    status: string;
    session_token: string;
    user: any;
    organizations: any[];
    last_org_id?: string;
  }>('/api/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ mfa_ticket: mfaTicket, code }),
  });
}

export async function verifyEmailCode(email: string, code: string) {
  return fetchJSON<{ status: string; message: string }>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function rotateSecretKey(
  orgId: string,
  secretType: 'sentry_webhook_secret' | 'nebius_api_key' | 'tavily_api_key' | 'pagerduty_integration_key' | 'datadog_api_key' | string,
  newValue: string
) {
  return fetchJSON<{ status: string; message: string }>(`/api/organizations/${orgId}/secrets/rotate`, {
    method: 'POST',
    body: JSON.stringify({ secret_type: secretType, new_value: newValue }),
  });
}

export async function toggleOrgMfaEnforcement(orgId: string, mfaEnforced: boolean) {
  return fetchJSON<{ status: string; mfa_enforced: boolean }>(`/api/organizations/${orgId}/mfa-enforcement`, {
    method: 'POST',
    body: JSON.stringify({ mfa_enforced: mfaEnforced }),
  });
}

export async function checkSlugAvailability(slug: string): Promise<{ slug: string; available: boolean; suggestion?: string } | null> {
  return fetchJSON(`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`);
}

export async function createOrganization(data: {
  name: string;
  slug: string;
  team_size?: string;
  primary_use_case?: string;
  user_id: string;
  user_name: string;
  user_email: string;
}): Promise<Organization | null> {
  return fetchJSON('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  return fetchJSON(`/api/organizations/${orgId}`);
}

export async function updateOrganizationSetup(orgId: string, data: Partial<SetupChecklist>): Promise<Organization | null> {
  return fetchJSON(`/api/organizations/${orgId}/setup`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateOrganizationPlan(orgId: string, plan: 'free' | 'team' | 'business' | 'enterprise'): Promise<Organization | null> {
  return fetchJSON(`/api/organizations/${orgId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

export async function getUserOrganizations(userId?: string, email?: string): Promise<{ organization: Organization; role: 'Admin' | 'Operator' | 'Viewer' }[] | null> {
  const query = new URLSearchParams();
  if (userId) query.set('user_id', userId);
  if (email) query.set('email', email);
  try {
    return await fetchJSON(`/api/organizations?${query.toString()}`);
  } catch {
    return null;
  }
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[] | null> {
  return fetchJSON(`/api/organizations/${orgId}/members`);
}

export async function createOrganizationInvites(orgId: string, data: {
  emails: string[];
  role: 'Admin' | 'Operator' | 'Viewer';
  invited_by: string;
}): Promise<Invite[] | null> {
  return fetchJSON(`/api/organizations/${orgId}/invites`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOrganizationInvites(orgId: string): Promise<Invite[] | null> {
  return fetchJSON(`/api/organizations/${orgId}/invites`);
}

export async function revokeOrganizationInvite(orgId: string, inviteId: string): Promise<{ status: string; message: string } | null> {
  return fetchJSON(`/api/organizations/${orgId}/invites/${inviteId}`, {
    method: 'DELETE',
  });
}

export async function resendOrganizationInvite(orgId: string, inviteId: string): Promise<Invite | null> {
  return fetchJSON(`/api/organizations/${orgId}/invites/${inviteId}/resend`, {
    method: 'POST',
  });
}

export async function validateInviteToken(token: string): Promise<{
  valid: boolean;
  status: string;
  is_expired: boolean;
  invite: Invite;
} | null> {
  return fetchJSON(`/api/invites/${encodeURIComponent(token)}`);
}

export async function acceptInvite(token: string, data: {
  name?: string;
  password?: string;
  user_id?: string;
}): Promise<{
  status: string;
  organization: Organization;
  member: OrganizationMember;
  user: { id: string; name: string; email: string; avatar: string; team: string };
  already_member: boolean;
} | null> {
  return fetchJSON(`/api/invites/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// -------------------------------------------------------------
// Incident & Telemetry APIs (Org-Scoped)
// -------------------------------------------------------------

export async function simulateIncident(orgId: string = "org_acme") {
  return fetchJSON('/api/incidents/simulate', {
    method: 'POST',
    body: JSON.stringify({ organization_id: orgId }),
  });
}

export async function getActiveIncidents(orgId?: string) {
  const url = orgId ? `/api/incidents/active?org_id=${encodeURIComponent(orgId)}` : '/api/incidents/active';
  return fetchJSON<Incident[]>(url);
}

export async function getIncident(id: string) {
  return fetchJSON<Incident>(`/api/incidents/${id}`);
}

export async function getSystemHealth(orgId?: string) {
  const url = orgId ? `/api/health?org_id=${encodeURIComponent(orgId)}` : '/api/health';
  return fetchJSON<SystemHealth>(url);
}

export async function deployRemediation(incidentId: string) {
  return fetchJSON<CanaryStatus>('/api/remediation/deploy', {
    method: 'POST',
    body: JSON.stringify({ incidentId }),
  });
}

export async function getConfirmationToken(incidentId: string, action: 'promote' | 'rollback') {
  return fetchJSON<{
    status: string;
    confirmation_token: string;
    action: string;
    incident_id: string;
    expires_in: number;
  }>('/api/remediation/confirmation-token', {
    method: 'POST',
    body: JSON.stringify({ incidentId, action }),
  });
}

export async function promoteCanary(incidentId: string, confirmationToken?: string) {
  let token = confirmationToken;
  if (!token) {
    const res = await getConfirmationToken(incidentId, 'promote');
    if (res?.confirmation_token) {
      token = res.confirmation_token;
    }
  }
  return fetchJSON<CanaryStatus>('/api/remediation/promote', {
    method: 'POST',
    headers: token ? { 'x-confirmation-token': token } : undefined,
    body: JSON.stringify({ incidentId, confirmation_token: token }),
  });
}

export async function rollbackCanary(incidentId: string, confirmationToken?: string) {
  let token = confirmationToken;
  if (!token) {
    const res = await getConfirmationToken(incidentId, 'rollback');
    if (res?.confirmation_token) {
      token = res.confirmation_token;
    }
  }
  return fetchJSON<CanaryStatus>('/api/remediation/rollback', {
    method: 'POST',
    headers: token ? { 'x-confirmation-token': token } : undefined,
    body: JSON.stringify({ incidentId, confirmation_token: token }),
  });
}

export async function getCanaryStatus(incidentId: string) {
  return fetchJSON<CanaryStatus>(`/api/canary/${incidentId}`);
}

export async function getPostMortem(incidentId: string) {
  return fetchJSON<{ incidentId: string; markdown: string }>(`/api/incidents/${incidentId}/post-mortem`);
}

export async function notifySlack(incidentId: string) {
  return fetchJSON<{ status: string; channel: string; message: string }>(`/api/incidents/${incidentId}/slack-notify`, {
    method: 'POST',
  });
}

// -------------------------------------------------------------
// Security Hardening APIs (Audit Store)
// -------------------------------------------------------------

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor_name?: string;
  actor_email?: string;
  actor_role?: string;
  actor?: { name: string; email: string; avatar: string; role: string };
  org_id?: string;
  organization_id?: string;
  action: string;
  category?: 'auth' | 'rbac' | 'api_key' | 'deploy' | 'rollback' | 'sandbox' | 'compliance' | string;
  actionCategory?: string;
  target?: string;
  targetResource?: string;
  details?: Record<string, unknown>;
  previous_hash?: string;
  tamper_hash?: string;
  verificationHash?: string;
  ipAddress?: string;
  status?: string;
}

export async function getAuditEvents(limitOrOrgId?: number | string, offsetOrLimit: number = 0): Promise<AuditEvent[]> {
  let limit = 50;
  let offset = 0;
  let orgId: string | undefined;

  if (typeof limitOrOrgId === 'string') {
    orgId = limitOrOrgId;
    limit = typeof offsetOrLimit === 'number' && offsetOrLimit > 0 ? offsetOrLimit : 50;
  } else if (typeof limitOrOrgId === 'number') {
    limit = limitOrOrgId;
    offset = offsetOrLimit;
  }

  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (orgId) query.set('org_id', orgId);
  const res = await fetchJSON<AuditEvent[]>(`/api/audit/events?${query.toString()}`);
  return res || [];
}

// -------------------------------------------------------------
// Multi-Provider AI (BYOK) & Usage Quota APIs
// -------------------------------------------------------------

import type { AvailableModelsResponse, OrgUsageSummary } from './types';

export async function getAvailableModels(orgId: string = 'org_acme'): Promise<AvailableModelsResponse | null> {
  return fetchJSON<AvailableModelsResponse>(`/api/models/available?org_id=${encodeURIComponent(orgId)}`);
}

export async function getOrgUsage(orgId: string = 'org_acme'): Promise<OrgUsageSummary | null> {
  return fetchJSON<OrgUsageSummary>(`/api/organizations/${encodeURIComponent(orgId)}/usage`);
}

// -------------------------------------------------------------
// Sandbox Execution & Queue APIs
// -------------------------------------------------------------

export interface SandboxQueueStatus {
  max_parallel?: number;
  active_count?: number;
  queued_count?: number;
  available_slots?: number;
  active_sandboxes?: string[];
  maxConcurrency?: number;
  activeSandboxes?: number;
  queueLength?: number;
  estimatedWaitSec?: number;
  orgQueuePosition?: number | null;
}

export async function getSandboxQueueStatus(): Promise<SandboxQueueStatus | null> {
  return fetchJSON<SandboxQueueStatus>('/api/sandbox/queue-status');
}

export async function retrySandboxExecution(incidentId: string): Promise<Incident | null> {
  return fetchJSON<Incident>(`/api/incidents/${encodeURIComponent(incidentId)}/sandbox-retry`, {
    method: 'POST',
  });
}

// -------------------------------------------------------------
// Real Org-Scoped Services (SLO, On-Call, Runbooks, Integrations, History, Public Status)
// -------------------------------------------------------------

export async function getStreamToken() {
  return fetchJSON<{ stream_token: string; expires_in: number; org_id: string }>('/api/incidents/stream-token', {
    method: 'POST',
  });
}

export async function getSLOs(orgId?: string) {
  const query = orgId ? `?org_id=${encodeURIComponent(orgId)}` : '';
  return fetchJSON<any[]>(`/api/slo${query}`);
}

export async function getOnCallShifts(orgId?: string) {
  const query = orgId ? `?org_id=${encodeURIComponent(orgId)}` : '';
  return fetchJSON<any[]>(`/api/oncall/shifts${query}`);
}

export async function getRunbooks(orgId?: string) {
  const query = orgId ? `?org_id=${encodeURIComponent(orgId)}` : '';
  return fetchJSON<any[]>(`/api/runbooks${query}`);
}

export async function getIntegrations(orgId?: string) {
  const query = orgId ? `?org_id=${encodeURIComponent(orgId)}` : '';
  return fetchJSON<any[]>(`/api/integrations${query}`);
}

export async function getHistory(orgId?: string) {
  const query = orgId ? `?org_id=${encodeURIComponent(orgId)}` : '';
  return fetchJSON<any[]>(`/api/history${query}`);
}

export async function getPublicStatus() {
  return fetchJSON<{
    status: string;
    description: string;
    uptimePercent: string;
    components: any[];
  }>('/api/status/public');
}

export interface BillingConfig {
  is_test_mode: boolean;
  supported_test_cards: {
    brand: string;
    number: string;
    cvc: string;
    expiry: string;
  }[];
}

export async function getBillingConfig(): Promise<BillingConfig | null> {
  return fetchJSON<BillingConfig>('/api/billing/config');
}

export async function createBillingCheckoutSession(data: {
  org_id: string;
  plan: 'free' | 'team' | 'business' | 'enterprise';
  customer_email?: string;
  success_url: string;
  cancel_url: string;
  idempotency_key?: string;
}): Promise<{ session_id: string; checkout_url: string; mode?: string } | null> {
  return fetchJSON('/api/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
