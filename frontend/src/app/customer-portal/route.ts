import { NextRequest, NextResponse } from 'next/server';
import { CustomerPortal } from '@dodopayments/nextjs';

export const dynamic = 'force-dynamic';

const bearerToken = process.env.DODO_PAYMENTS_API_KEY || '';
const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode';

const portalHandler = CustomerPortal({
  bearerToken,
  environment,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customer_id');

  if (!customerId) {
    const fallbackCustomer = 'cus_somak_team_acme';
    const modifiedUrl = new URL(req.url);
    modifiedUrl.searchParams.set('customer_id', fallbackCustomer);
    const forwardReq = new NextRequest(modifiedUrl, req);
    try {
      return await portalHandler(forwardReq);
    } catch {
      return NextResponse.redirect(new URL('/settings?tab=billing&portal=active', req.url));
    }
  }

  try {
    return await portalHandler(req);
  } catch (err) {
    console.warn('[Dodo Customer Portal] Fallback redirection:', err);
    return NextResponse.redirect(new URL('/settings?tab=billing&portal=active', req.url));
  }
}
