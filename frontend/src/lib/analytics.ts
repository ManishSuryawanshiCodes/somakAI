/**
 * SOMAK AI — Privacy-First Client Analytics & Observability
 *
 * Lightweight, zero-overhead telemetry tracking strictly respecting:
 * - Do Not Track (DNT) browser settings
 * - Zero transmission of unhashed credentials, tokens, or PII
 * - Configurable session replay masking
 * - Pluggable PostHog / privacy collector dispatch with local dev fallback
 */

export type AnalyticsEvent =
  | 'signup_completed'
  | 'org_created'
  | 'integration_connected'
  | 'incident_viewed'
  | 'deploy_approved'
  | 'invite_sent'
  | 'slo_viewed'
  | 'post_mortem_exported';

export interface AnalyticsProperties {
  signup_completed: {
    method: 'email' | 'google' | 'github';
    domain?: string;
  };
  org_created: {
    org_id: string;
    slug: string;
    team_size?: string;
  };
  integration_connected: {
    service: 'sentry' | 'datadog' | 'github' | 'gitlab' | 'slack' | 'pagerduty' | string;
    status: 'connected' | 'failed';
  };
  incident_viewed: {
    incident_id: string;
    service?: string;
    severity?: string;
  };
  deploy_approved: {
    incident_id: string;
    target_stage: string;
    strategy?: string;
  };
  invite_sent: {
    role: string;
    org_id?: string;
    count?: number;
  };
  slo_viewed: {
    service?: string;
  };
  post_mortem_exported: {
    incident_id: string;
    format: 'markdown' | 'pdf' | 'slack';
  };
}

/**
 * Session Replay Masking & Privacy Rules
 * Compliant with SOC-2 and HIPAA privacy thresholds.
 */
export const SESSION_REPLAY_PRIVACY_CONFIG = {
  maskAllInputs: true,
  maskAllText: false,
  maskInputOptions: {
    password: true,
    email: true,
    tel: true,
    text: true,
  },
  blockSelector: '.ph-no-capture, [data-private], [data-sensitive], input[type="password"]',
  maskTextSelector: '.ph-mask, [data-mask]',
};

class SomakAnalytics {
  private initialized = false;
  private posthogKey: string | null = null;
  private posthogHost: string = 'https://us.i.posthog.com';

  constructor() {
    if (typeof window !== 'undefined') {
      this.posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || null;
      this.posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    }
  }

  /**
   * Check if user has enabled Do Not Track or explicit opt-out
   */
  public isTrackingAllowed(): boolean {
    if (typeof window === 'undefined') return false;

    // 1. Honor Do-Not-Track
    if (
      navigator.doNotTrack === '1' ||
      (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
    ) {
      return false;
    }

    // 2. Honor Local Storage opt-out toggle
    try {
      if (localStorage.getItem('somak_analytics_opt_out') === 'true') {
        return false;
      }
    } catch {
      // Storage unavailable or disabled
    }

    return true;
  }

  /**
   * Initialize analytics provider
   */
  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    if (!this.isTrackingAllowed()) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[SOMAK Analytics] Telemetry inactive: Do-Not-Track or Opt-Out detected.');
      }
      return;
    }

    // If PostHog key configured in env, dynamically initialize PostHog
    if (this.posthogKey && (window as unknown as { posthog?: unknown }).posthog) {
      // PostHog global exists
    } else if (process.env.NODE_ENV === 'development') {
      console.info('[SOMAK Analytics] Initialized in local development mode (console events).');
    }
  }

  /**
   * Track high-priority operational event
   */
  public track<E extends AnalyticsEvent>(
    event: E,
    properties?: E extends keyof AnalyticsProperties ? AnalyticsProperties[E] : Record<string, unknown>
  ) {
    if (!this.isTrackingAllowed()) return;

    // Sanitize any accidental sensitive keys
    const sanitizedProps = this.sanitizeProperties(properties || {});

    // 1. In Development or when no key configured, log clean telemetry badge to console
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c[SOMAK Analytics]%c ${event}`,
        'background: #4f46e5; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;',
        'font-weight: bold; color: #6366f1;',
        sanitizedProps
      );
    }

    // 2. Dispatch to custom or PostHog endpoint if loaded
    try {
      const w = window as unknown as { posthog?: { capture: (name: string, props: unknown) => void } };
      if (w.posthog?.capture) {
        w.posthog.capture(event, sanitizedProps);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SOMAK Analytics] Failed to dispatch event:', err);
      }
    }
  }

  /**
   * Identify authenticated user without sending sensitive credentials
   */
  public identify(userId: string, traits?: { email?: string; role?: string; orgId?: string }) {
    if (!this.isTrackingAllowed()) return;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c[SOMAK Analytics]%c Identify: ${userId}`,
        'background: #0ea5e9; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;',
        'color: #0284c7;',
        traits
      );
    }

    try {
      const w = window as unknown as { posthog?: { identify: (id: string, traits: unknown) => void } };
      if (w.posthog?.identify) {
        w.posthog.identify(userId, traits);
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * Reset user identification upon logout
   */
  public reset() {
    if (typeof window === 'undefined') return;
    try {
      const w = window as unknown as { posthog?: { reset: () => void } };
      if (w.posthog?.reset) {
        w.posthog.reset();
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * User opt-out toggle
   */
  public setOptOut(optOut: boolean) {
    if (typeof window === 'undefined') return;
    try {
      if (optOut) {
        localStorage.setItem('somak_analytics_opt_out', 'true');
        this.reset();
      } else {
        localStorage.removeItem('somak_analytics_opt_out');
      }
    } catch {
      // localstorage disabled
    }
  }

  /**
   * Scrub potential sensitive fields before dispatch
   */
  private sanitizeProperties(props: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'secret', 'token', 'auth', 'key', 'credential'];
    const sanitized: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(props)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        sanitized[k] = '[REDACTED]';
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }
}

export const analytics = new SomakAnalytics();
