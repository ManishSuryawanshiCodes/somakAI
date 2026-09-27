import { NextRequest, NextResponse } from 'next/server';
import { Webhooks } from '@dodopayments/nextjs';
import { Webhook, WebhookVerificationError } from 'standardwebhooks';

const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || '';

// Idempotency cache to prevent duplicate processing during webhook retries
const processedEvents = new Set<string>();

// Store recent billing audit events for frontend Audit Log integration
interface BillingAuditEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  actionCategory: 'billing' | 'setting' | 'deploy';
  resource: string;
  result: 'Success' | 'Warning' | 'Blocked';
  hash: string;
}

const recentBillingAudits: BillingAuditEvent[] = [];

function recordAuditLog(action: string, result: 'Success' | 'Warning' | 'Blocked' = 'Success') {
  const event: BillingAuditEvent = {
    id: `aud-bill-${Date.now()}`,
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    actor: 'Dodo Payments Webhook',
    action,
    actionCategory: 'billing',
    resource: 'Organization Billing Tier',
    result,
    hash: Math.random().toString(16).substring(2, 18),
  };
  recentBillingAudits.unshift(event);
  if (recentBillingAudits.length > 50) recentBillingAudits.pop();
}

// Built-in adapter handler
const dodoWebhookHandler = Webhooks({
  webhookKey,
  onPaymentSucceeded: async (payload: any) => {
    const orgId = payload?.data?.metadata?.org_id || 'org_acme';
    const plan = payload?.data?.metadata?.plan_id || 'team';
    recordAuditLog(`Subscription payment succeeded: Upgraded to ${plan.toUpperCase()} tier (25 seats active)`, 'Success');
    console.log(`[Dodo Webhook] payment.succeeded for org: ${orgId}, plan: ${plan}`);
  },
  onSubscriptionActive: async (payload: any) => {
    const orgId = payload?.data?.metadata?.org_id || 'org_acme';
    const plan = payload?.data?.metadata?.plan_id || 'team';
    recordAuditLog(`Subscription activated: ${plan.toUpperCase()} Plan with autonomous canary gates enabled`, 'Success');
    console.log(`[Dodo Webhook] subscription.active for org: ${orgId}`);
  },
  onSubscriptionRenewed: async (payload: any) => {
    const orgId = payload?.data?.metadata?.org_id || 'org_acme';
    recordAuditLog('Subscription renewed: Monthly billing cycle successfully charged', 'Success');
    console.log(`[Dodo Webhook] subscription.renewed for org: ${orgId}`);
  },
  onSubscriptionCancelled: async (payload: any) => {
    const orgId = payload?.data?.metadata?.org_id || 'org_acme';
    recordAuditLog('Subscription cancelled: Organization reverted to Developer/Free tier at period end', 'Warning');
    console.log(`[Dodo Webhook] subscription.cancelled for org: ${orgId}`);
  },
  onPaymentFailed: async (payload: any) => {
    const orgId = payload?.data?.metadata?.org_id || 'org_acme';
    recordAuditLog('Payment failed for Acme Corp: Automated Dodo invoice retry scheduled', 'Blocked');
    console.warn(`[Dodo Webhook] payment.failed for org: ${orgId}`);
  },
  onSubscriptionUpdated: async (payload: any) => {
    const orgId = payload?.data?.metadata?.org_id || 'org_acme';
    recordAuditLog('Subscription updated: Seat count or plan parameters modified', 'Success');
    console.log(`[Dodo Webhook] subscription.updated for org: ${orgId}`);
  },
});

export async function POST(req: NextRequest) {
  const webhookId = req.headers.get('webhook-id') || '';
  const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
  const webhookSignature = req.headers.get('webhook-signature') || '';

  // 1. Verify standardwebhooks signature
  const headers = {
    'webhook-id': webhookId,
    'webhook-timestamp': webhookTimestamp,
    'webhook-signature': webhookSignature,
  };

  const rawBody = await req.text();

  if (!webhookId || !webhookSignature) {
    return NextResponse.json({ error: 'Missing webhook verification headers' }, { status: 401 });
  }

  // Idempotency check: if this event ID has already been processed, acknowledge 200 immediately
  if (webhookId && processedEvents.has(webhookId)) {
    return NextResponse.json({ status: 'already_processed', event_id: webhookId }, { status: 200 });
  }

  try {
    const wh = new Webhook(webhookKey);
    wh.verify(rawBody, headers);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid webhook signature', details: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 401 });
  }

  // Mark event as processed for idempotency
  if (webhookId) {
    processedEvents.add(webhookId);
  }

  // Forward to adapter event dispatcher
  const forwardReq = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: rawBody,
  });

  return await dodoWebhookHandler(forwardReq);
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/webhooks/dodo',
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
    recent_audits: recentBillingAudits,
  });
}
