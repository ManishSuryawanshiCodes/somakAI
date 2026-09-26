/**
 * SOMAK AI — Production Client Error Tracking & Telemetry
 * Provides client-side exception capture with opt-in Sentry DSN configuration.
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  incidentId?: string;
  orgId?: string;
  metadata?: Record<string, unknown>;
}

class FrontendTelemetry {
  private dsn: string | null = null;
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || null;
    this.initialized = true;

    // Global uncaught error listener
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        component: 'GlobalWindow',
        action: 'UncaughtError',
        metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    });

    // Global unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        component: 'GlobalPromise',
        action: 'UnhandledRejection',
      });
    });

    if (this.dsn) {
      console.log('[Telemetry] Sentry client error monitoring active.');
    }
  }

  public captureException(error: Error | unknown, context?: ErrorContext) {
    const err = error instanceof Error ? error : new Error(String(error));
    const timestamp = new Date().toISOString();

    const report = {
      message: err.message,
      name: err.name,
      stack: err.stack,
      timestamp,
      context,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Somak Client Telemetry Error Caught]:', report);
    }

    // In production with DSN, forward to external monitoring endpoint
    if (this.dsn && typeof window !== 'undefined') {
      try {
        fetch(this.dsn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
          mode: 'no-cors',
        }).catch(() => {});
      } catch {}
    }
  }
}

export const telemetry = new FrontendTelemetry();
if (typeof window !== 'undefined') {
  telemetry.init();
}
