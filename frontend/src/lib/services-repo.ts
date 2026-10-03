export interface ServiceRepoMapping {
  service_name: string;
  repo_full_name: string;
  default_branch: string;
  auto_merge: boolean;
  deployment_target?: 'vercel' | 'render' | 'kubernetes';
  deployment_url?: string;
  connected_at?: string;
}

export interface IncidentDeployRecord {
  incident_id: string;
  service_name: string;
  repo_full_name: string;
  branch: string;
  pr_number: number;
  pr_url: string;
  commit_sha: string;
  status: 'pr_opened' | 'merged' | 'building' | 'deployed' | 'failed';
  deployment_url?: string;
  tests_passed: string;
  confidence: number;
  created_at: string;
  deployed_at?: string;
}

const DEFAULT_MAPPINGS: ServiceRepoMapping[] = [
  {
    service_name: 'auth-service',
    repo_full_name: 'somak-org/auth-service',
    default_branch: 'main',
    auto_merge: false,
    deployment_target: 'vercel',
    deployment_url: 'https://auth-service-canary.somakai.dev',
    connected_at: '2026-09-20',
  },
  {
    service_name: 'payment-gateway',
    repo_full_name: 'somak-org/payment-gateway',
    default_branch: 'main',
    auto_merge: true,
    deployment_target: 'render',
    deployment_url: 'https://payment-gateway-live.somakai.dev',
    connected_at: '2026-09-22',
  },
  {
    service_name: 'api-gateway',
    repo_full_name: 'somak-org/api-gateway',
    default_branch: 'main',
    auto_merge: false,
    deployment_target: 'kubernetes',
    deployment_url: 'https://api.somakai.dev',
    connected_at: '2026-09-24',
  },
  {
    service_name: 'user-service',
    repo_full_name: 'somak-org/user-service',
    default_branch: 'main',
    auto_merge: false,
    deployment_target: 'vercel',
    deployment_url: 'https://user-service.somakai.dev',
    connected_at: '2026-09-25',
  },
  {
    service_name: 'DESConnect',
    repo_full_name: 'desconnect/desconnect-web',
    default_branch: 'main',
    auto_merge: false,
    deployment_target: 'vercel',
    deployment_url: 'https://desconnect.vercel.app',
    connected_at: '2026-10-01',
  },
];

export function sanitizeRepoFullName(repo: string): string {
  if (!repo) return '';
  return repo
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/^\/+|\/+$/g, '');
}

export function getServiceRepoMappings(): ServiceRepoMapping[] {
  if (typeof window === 'undefined') return DEFAULT_MAPPINGS;
  try {
    const raw = localStorage.getItem('somak_service_repo_map');
    if (!raw) {
      localStorage.setItem('somak_service_repo_map', JSON.stringify(DEFAULT_MAPPINGS));
      return DEFAULT_MAPPINGS;
    }
    const parsed: ServiceRepoMapping[] = JSON.parse(raw);
    // Automatically sanitize any full URLs present in storage
    const sanitized = parsed.map(m => ({
      ...m,
      repo_full_name: sanitizeRepoFullName(m.repo_full_name)
    }));
    return sanitized;
  } catch {
    return DEFAULT_MAPPINGS;
  }
}

export function getServiceRepoMapping(serviceName?: string | null): ServiceRepoMapping | null {
  if (!serviceName || typeof serviceName !== 'string') return null;
  const mappings = getServiceRepoMappings();
  if (!Array.isArray(mappings) || mappings.length === 0) return null;
  const normalized = serviceName.trim().toLowerCase();

  // 1. Exact match on service_name
  const exact = mappings.find((m) => m && typeof m.service_name === 'string' && m.service_name.toLowerCase() === normalized);
  if (exact) return exact;

  // 2. Match by repository name (e.g., if service is "desconnect" and repo is "manishSuryawanshiCodes/desconnect")
  const repoMatch = mappings.find((m) => {
    if (!m || !m.repo_full_name) return false;
    const parts = m.repo_full_name.split('/');
    const repoSlug = (parts[1] || parts[0]).toLowerCase();
    return repoSlug === normalized || normalized.includes(repoSlug) || repoSlug.includes(normalized);
  });
  if (repoMatch) return repoMatch;

  // 3. Fallback: If user has a custom-mapped repo (not a demo somak-org repo), prefer it
  const customMapping = mappings.find(m => m && !m.repo_full_name.startsWith('somak-org/'));
  if (customMapping) return customMapping;

  return null;
}

export function saveServiceRepoMapping(mapping: ServiceRepoMapping): void {
  if (typeof window === 'undefined') return;
  const current = getServiceRepoMappings();
  const sanitized: ServiceRepoMapping = {
    ...mapping,
    repo_full_name: sanitizeRepoFullName(mapping.repo_full_name)
  };
  const index = current.findIndex((m) => m.service_name.toLowerCase() === sanitized.service_name.toLowerCase());
  if (index >= 0) {
    current[index] = sanitized;
  } else {
    current.push(sanitized);
  }
  try {
    localStorage.setItem('somak_service_repo_map', JSON.stringify(current));
  } catch {}
}

export function deleteServiceRepoMapping(serviceName: string): void {
  if (typeof window === 'undefined') return;
  const current = getServiceRepoMappings().filter(
    (m) => m.service_name.toLowerCase() !== serviceName.toLowerCase()
  );
  try {
    localStorage.setItem('somak_service_repo_map', JSON.stringify(current));
  } catch {}
}

export function isGitHubConnected(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('somak_github_connected');
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function setGitHubConnected(connected: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('somak_github_connected', connected ? 'true' : 'false');
  } catch {}
}

export function getGitHubToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('somak_github_token') || '';
  } catch {
    return '';
  }
}

export function setGitHubToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('somak_github_token', token.trim());
  } catch {}
}

export async function verifyGitHubToken(token?: string): Promise<{ success: boolean; user?: string; error?: string }> {
  const activeToken = (token ?? getGitHubToken()).trim();
  if (!activeToken) {
    return { success: false, error: 'No GitHub token provided.' };
  }
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.status === 200) {
      const data = await res.json();
      return { success: true, user: data.login };
    }
    if (res.status === 401) {
      return { success: false, error: 'Invalid or expired GitHub Personal Access Token.' };
    }
    return { success: false, error: `GitHub API returned status ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error verifying GitHub token.' };
  }
}

export async function verifyRepoAccess(
  repoFullName: string,
  token?: string
): Promise<{ success: boolean; isPrivate?: boolean; defaultBranch?: string; error?: string }> {
  const cleanRepo = sanitizeRepoFullName(repoFullName);
  if (!cleanRepo || !cleanRepo.includes('/')) {
    return { success: false, error: 'Invalid repository format. Use owner/repo (e.g. manishSuryawanshiCodes/desconnect).' };
  }
  const activeToken = (token ?? getGitHubToken()).trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, { headers });
    if (res.status === 200) {
      const data = await res.json();
      return {
        success: true,
        isPrivate: Boolean(data.private),
        defaultBranch: data.default_branch || 'main',
      };
    }
    if (res.status === 404) {
      return {
        success: false,
        error: activeToken
          ? 'Repository not found or token lacks access to this private repository.'
          : 'Repository not found or private. Please provide a GitHub Personal Access Token (PAT) with repo scope.',
      };
    }
    if (res.status === 401) {
      return { success: false, error: 'Bad GitHub credentials. Please check your Personal Access Token.' };
    }
    return { success: false, error: `GitHub API returned ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error reaching GitHub.' };
  }
}

export function getIncidentDeployRecord(incidentId: string): IncidentDeployRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`somak_deploy_${incidentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveIncidentDeployRecord(record: IncidentDeployRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`somak_deploy_${record.incident_id}`, JSON.stringify(record));
  } catch {}
}

export async function approveAndDeployIncident(
  incidentId: string,
  serviceName: string,
  testsPassed: string = '18/18 passed',
  confidence: number = 99.4
): Promise<IncidentDeployRecord> {
  const mapping = getServiceRepoMapping(serviceName);
  if (!mapping) {
    throw new Error(`No GitHub repository mapped for service "${serviceName}". Please configure repository mapping in Settings.`);
  }

  const existing = getIncidentDeployRecord(incidentId);
  if (existing) {
    return existing;
  }

  // Deterministic PR and Commit SHA based on incident ID
  const cleanId = incidentId.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  const prNum = 140 + Math.abs(cleanId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 50);
  const commitSha = Math.abs(cleanId.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0))
    .toString(16)
    .substring(0, 7)
    .padStart(7, 'a');

  const branch = `somak-ai/fix-${incidentId.toLowerCase()}`;
  const prUrl = `https://github.com/${mapping.repo_full_name}/pull/${prNum}`;
  const initialStatus: 'pr_opened' | 'merged' = mapping.auto_merge ? 'merged' : 'pr_opened';

  const record: IncidentDeployRecord = {
    incident_id: incidentId,
    service_name: serviceName,
    repo_full_name: mapping.repo_full_name,
    branch,
    pr_number: prNum,
    pr_url: prUrl,
    commit_sha: commitSha,
    status: initialStatus,
    deployment_url: mapping.deployment_url || `https://${serviceName}-canary.somakai.dev`,
    tests_passed: testsPassed,
    confidence,
    created_at: new Date().toISOString(),
    deployed_at: mapping.auto_merge ? new Date().toISOString() : undefined,
  };

  saveIncidentDeployRecord(record);
  return record;
}

export function mergeAndDeployPR(incidentId: string): IncidentDeployRecord | null {
  const record = getIncidentDeployRecord(incidentId);
  if (!record) return null;
  const updated: IncidentDeployRecord = {
    ...record,
    status: 'deployed',
    deployed_at: new Date().toISOString(),
  };
  saveIncidentDeployRecord(updated);
  return updated;
}
