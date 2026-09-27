export interface TavilyCitation {
  title: string;
  url: string;
  snippet: string;
}

export interface RootCauseAnalysis {
  summary: string;
  triggerMechanism: string;
  tavilyCitations: TavilyCitation[];
}

export interface SandboxFailureHistory {
  loop?: number;
  timestamp?: string;
  error_message?: string;
  errorSummary?: string;
  test_output?: string;
  stdout?: string;
  exitCode?: number;
  patch_diff?: string;
  diff?: string;
}

export interface SandboxExecution {
  sandboxId: string;
  exitCode: number;
  stdout: string;
  testsPassed: number;
  totalTests: number;
  loops?: number;
  failureHistory?: SandboxFailureHistory[];
}

export interface Patch {
  targetFile: string;
  unifiedDiff: string;
  reproductionTest: string;
  sandboxExecution: SandboxExecution | null;
}

export interface Incident {
  id: string;
  organization_id?: string;
  fingerprint: string;
  severity: 'SEV-1' | 'SEV-2';
  service: string;
  timestamp: string;
  status: 'TRIAGING' | 'INVESTIGATING' | 'SANDBOX_VERIFYING' | 'READY_FOR_DEPLOY' | 'DEPLOYED' | 'FAILED' | 'NEEDS_HUMAN_REVIEW';
  confidenceScore?: number;
  astValidated?: boolean;
  correctionLoops?: number;
  rootCauseAnalysis: RootCauseAnalysis | null;
  patch: Patch | null;
  sandboxExecution?: SandboxExecution | null;
  postMortemReport?: string;
  triage_provider?: string;
  triage_model?: string;
  synthesis_provider?: string;
  synthesis_model?: string;
  triage_source?: 'byok' | 'server_fallback' | 'simulated';
  synthesis_source?: 'byok' | 'server_fallback' | 'simulated';
  execution_mode?: 'live' | 'simulated';
  provider_display_name?: string;
  model_display_name?: string;
  disclosure_badge?: string;
  fallback_occurred?: boolean;
  fallback_message?: string;
  reasoning_steps?: Array<{
    title: string;
    desc: string;
    duration: string;
    provider?: string;
    model: string;
    statusText: string;
    fallback?: boolean;
    fallbackMessage?: string;
  }>;
}

export interface SetupChecklist {
  sentry_connected: boolean;
  sentry_dsn: string;
  sentry_inbound_url: string;
  ai_connected: boolean;
  ai_api_key: string;
  nebius_api_key?: string;
  nvidia_nim_connected?: boolean;
  nvidia_nim_api_key?: string;
  ai_model_tier: string;
  triage_provider?: string;
  triage_model?: string;
  synthesis_provider?: string;
  synthesis_model?: string;
  anthropic_connected?: boolean;
  anthropic_api_key?: string;
  openai_connected?: boolean;
  openai_api_key?: string;
  google_connected?: boolean;
  google_api_key?: string;
  tavily_connected: boolean;
  tavily_api_key: string;
  notifications_connected: boolean;
  slack_webhook: string;
  pagerduty_key: string;
  team_invited: boolean;
  sandbox_concurrency?: number;
  sandbox_timeout?: number;
}

export interface ProviderModelSummary {
  provider: string;
  provider_name: string;
  model: string;
  model_name: string;
  stage: string;
  calls: number;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  billing_type: 'metered' | 'byok';
  cost_saved: number;
  status: string;
}

export interface OrgUsageSummary {
  org_id: string;
  plan_name: string;
  billing_cycle: string;
  total_calls: number;
  platform_metered_calls: number;
  byok_calls: number;
  platform_tokens_used: number;
  platform_tokens_limit: number;
  platform_tokens_percent: number;
  byok_tokens_processed: number;
  total_cost_saved: number;
  breakdown: ProviderModelSummary[];
}

export interface ProviderCatalogModel {
  id: string;
  name: string;
  speed: string;
  tier: string;
}

export interface ProviderCatalogItem {
  id: string;
  name: string;
  badge: string;
  keyPrefix: string;
  description?: string;
  isConfigured: boolean;
  isPlatformDefault: boolean;
  defaultTriage: string;
  defaultSynthesis: string;
  triageModels: ProviderCatalogModel[];
  synthesisModels: ProviderCatalogModel[];
}

export interface AvailableModelsResponse {
  providers: ProviderCatalogItem[];
  selectedTriage: { provider: string; model: string };
  selectedSynthesis: { provider: string; model: string };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  team_size?: string;
  primary_use_case?: string;
  plan?: 'free' | 'team' | 'business' | 'enterprise';
  created_at: string;
  created_by: string;
  setup_checklist: SetupChecklist;
  mfa_enforced?: boolean;
}

export interface OrgMemberUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  team: string;
  mfa_enabled?: boolean;
  email_verified?: boolean;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'Admin' | 'Operator' | 'Viewer';
  joined_at: string;
  user: OrgMemberUser;
}

export interface Invite {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  email: string;
  role: 'Admin' | 'Operator' | 'Viewer';
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

export interface CanaryStatus {
  incidentId: string;
  trafficPercent: number;
  baselineErrorRate: number;
  canaryErrorRate: number;
  baselineP99: number;
  canaryP99: number;
  status: 'IN_PROGRESS' | 'PROMOTED' | 'ROLLED_BACK' | 'NOT_STARTED';
}

export interface SystemHealth {
  uptime: number;
  activeIncidents: number;
  mttr: string;
  costSaved: number;
  healthHistory: number[];
  memoryUsage: { timestamp: string; value: number }[];
  latencyData: { timestamp: string; value: number }[];
}
