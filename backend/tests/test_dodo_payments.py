import pytest
import time
import json
import base64
import hmac
import hashlib
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.dodo_service import dodo_service
from app.core.config import settings

client = TestClient(app)

def test_dodo_service_initialization():
    assert dodo_service.api_key == settings.DODO_API_KEY
    assert dodo_service.webhook_secret == settings.DODO_WEBHOOK_SECRET
    
@patch('httpx.Client.post')
def test_create_checkout_session(mock_post):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "checkout_url": "https://checkout.dodopayments.com/pay_123",
        "payment_id": "pay_123"
    }
    mock_post.return_value = mock_response

    result = dodo_service.create_checkout_session(
        org_id="org_123",
        plan_id="team",
        customer_email="test@example.com",
        success_url="http://success",
        cancel_url="http://cancel",
        idempotency_key="idem_123"
    )

    assert result["checkout_url"] == "https://checkout.dodopayments.com/pay_123"
    assert result["payment_id"] == "pay_123"
    
    # Check if idempotency key is in headers
    args, kwargs = mock_post.call_args
    headers = kwargs.get('headers', {})
    assert headers.get("Idempotency-Key") == "idem_123"

def test_webhook_signature_verification_valid():
    webhook_id = "msg_123"
    webhook_timestamp = str(int(time.time()))
    payload_str = json.dumps({"type": "payment.succeeded", "data": {}})
    payload_bytes = payload_str.encode('utf-8')
    
    secret = dodo_service.webhook_secret
    if secret.startswith("whsec_"):
        secret = secret[6:]
    try:
        secret_bytes = base64.b64decode(secret)
    except Exception:
        secret_bytes = secret.encode("utf-8")
    
    to_sign = f"{webhook_id}.{webhook_timestamp}.{payload_str}".encode('utf-8')
    sig_bytes = hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()
    sig_b64 = base64.b64encode(sig_bytes).decode('utf-8')
    
    webhook_signature = f"v1,{sig_b64}"
    
    event = dodo_service.verify_webhook_signature(
        payload=payload_bytes,
        webhook_id=webhook_id,
        webhook_timestamp=webhook_timestamp,
        webhook_signature=webhook_signature
    )
    assert event["type"] == "payment.succeeded"

def test_webhook_signature_verification_invalid():
    with pytest.raises(ValueError, match="Invalid webhook signature"):
        dodo_service.verify_webhook_signature(
            payload=b'{"type": "test"}',
            webhook_id="msg_123",
            webhook_timestamp=str(int(time.time())),
            webhook_signature="v1,bad_signature"
        )

def test_handle_webhook_event_payment_succeeded():
    event = {
        "type": "payment.succeeded",
        "data": {
            "metadata": {
                "org_id": "org_123",
                "plan_id": "team"
            }
        }
    }
    with patch('app.services.org_store.org_store.update_org_plan') as mock_update:
        res = dodo_service.handle_webhook_event(event)
        assert res == "handled_payment_succeeded"
        mock_update.assert_called_once_with("org_123", "team")

def test_dodo_webhook_rejection():
    # Missing signature should return 401
    response = client.post("/api/billing/dodo-webhook", content=b"{}")
    assert response.status_code == 401
    
    # Invalid signature should return 401
    response = client.post(
        "/api/billing/dodo-webhook",
        headers={
            "webhook-id": "123",
            "webhook-timestamp": str(int(time.time())),
            "webhook-signature": "v1,invalid"
        },
        content=b"{}"
    )
    assert response.status_code == 401
