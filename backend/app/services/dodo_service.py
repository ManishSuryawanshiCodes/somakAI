import os
import time
import logging
import hmac
import hashlib
import base64
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.org_store import org_store

logger = logging.getLogger("somak.dodo")

DODO_API_BASE = "https://live.dodopayments.com"
DODO_TEST_API_BASE = "https://test.dodopayments.com"

PLAN_CATALOG = {
    "team": {
        "name": "Team Plan",
        "price_cents": 7900,
        "currency": "USD",
        "interval": "month",
        "features": ["Up to 25 team members", "Canary deployment gates", "SOC-2 audit logging"]
    },
    "business": {
        "name": "Business Plan",
        "price_cents": 49900,
        "currency": "USD",
        "interval": "month",
        "features": ["Unlimited members", "Multi-provider BYOK", "Cryptographic audit trail"]
    },
    "enterprise": {
        "name": "Enterprise Plan",
        "price_cents": 0,  # Custom pricing
        "currency": "USD",
        "interval": "month",
        "features": ["Dedicated cluster", "Custom SLA", "24/7 on-call"]
    }
}

class DodoPaymentService:
    def __init__(self):
        self.api_key = settings.DODO_API_KEY
        self.webhook_secret = settings.DODO_WEBHOOK_SECRET
        self.is_test_mode = self.api_key.startswith("test_") if self.api_key else True
        self.base_url = DODO_TEST_API_BASE if self.is_test_mode else DODO_API_BASE

    def _get_headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        return headers

    def create_checkout_session(
        self,
        org_id: str,
        plan_id: str,
        customer_email: str,
        success_url: str,
        cancel_url: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        if plan_id not in PLAN_CATALOG:
            raise ValueError(f"Invalid plan ID: {plan_id}")

        plan = PLAN_CATALOG[plan_id]
        
        payload = {
            "customer": {
                "email": customer_email,
                "name": customer_email.split("@")[0]
            },
            "product_cart": [{
                "name": plan["name"],
                "price_cents": plan["price_cents"],
                "currency": plan["currency"],
                "interval": plan["interval"]
            }],
            "return_url": success_url,
            "metadata": {
                "org_id": org_id,
                "plan_id": plan_id
            }
        }

        with httpx.Client() as client:
            try:
                response = client.post(
                    f"{self.base_url}/checkouts",
                    json=payload,
                    headers=self._get_headers(idempotency_key),
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                return {
                    "checkout_url": data.get("checkout_url"),
                    "payment_id": data.get("payment_id")
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Dodo API error: {e.response.text}")
                raise ValueError("Payment gateway error.")
            except Exception as e:
                logger.error(f"Dodo request failed: {e}")
                raise ValueError("Payment gateway unavailable.")

    def verify_webhook_signature(
        self, 
        payload: bytes, 
        webhook_id: str, 
        webhook_timestamp: str, 
        webhook_signature: str
    ) -> Dict[str, Any]:
        if not self.webhook_secret:
            raise ValueError("Webhook secret not configured")

        now = int(time.time())
        try:
            ts = int(webhook_timestamp)
        except ValueError:
            raise ValueError("Invalid webhook timestamp format")

        if abs(now - ts) > 300:
            raise ValueError("Webhook timestamp outside tolerance zone")

        secret = self.webhook_secret
        if secret.startswith("whsec_"):
            secret = secret[6:]
        
        try:
            secret_bytes = base64.b64decode(secret)
        except Exception:
            secret_bytes = secret.encode("utf-8")

        try:
            raw_body_utf8 = payload.decode("utf-8")
        except Exception:
            raise ValueError("Invalid payload encoding")

        to_sign = f"{webhook_id}.{webhook_timestamp}.{raw_body_utf8}".encode("utf-8")
        expected_sig_bytes = hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()
        expected_sig_b64 = base64.b64encode(expected_sig_bytes).decode("utf-8")

        is_valid = False
        for sig in webhook_signature.split(" "):
            if sig.startswith("v1,"):
                sig_val = sig[3:]
                if hmac.compare_digest(expected_sig_b64, sig_val):
                    is_valid = True
                    break
                    
        if not is_valid:
            raise ValueError("Invalid webhook signature")

        import json
        try:
            return json.loads(payload.decode('utf-8'))
        except Exception:
            raise ValueError("Invalid JSON payload")

    def handle_webhook_event(self, event: Dict[str, Any]) -> str:
        event_type = event.get("type")
        data = event.get("data", {})
        metadata = data.get("metadata", {})
        org_id = metadata.get("org_id")

        if not org_id and event_type in ["payment.succeeded", "subscription.active"]:
            logger.warning("No org_id in metadata, ignoring event")
            return "ignored"

        if event_type == "payment.succeeded":
            plan_id = metadata.get("plan_id")
            if org_id and plan_id:
                org_store.update_org_plan(org_id, plan_id)
            return "handled_payment_succeeded"

        elif event_type == "subscription.active":
            plan_id = metadata.get("plan_id")
            if org_id and plan_id:
                org_store.update_org_plan(org_id, plan_id)
            return "handled_subscription_active"
            
        elif event_type == "subscription.updated":
            plan_id = metadata.get("plan_id")
            if org_id and plan_id:
                org_store.update_org_plan(org_id, plan_id)
            return "handled_subscription_updated"

        elif event_type in ["subscription.cancelled", "payment.failed", "subscription.on_hold"]:
            if org_id:
                org_store.update_org_plan(org_id, "free")
            return "handled_subscription_downgrade"
            
        elif event_type == "dispute.opened":
            logger.warning(f"Chargeback dispute opened for payment")
            return "handled_dispute"

        return "ignored"

dodo_service = DodoPaymentService()
