"""
SOMAK AI — Real-Time Alert & Notification Dispatching Service
Handles incident lifecycle event notifications (New Incident, Remediation Failed,
Canary Rollback, Sandbox Error) with org-scoped filtering and webhook/PagerDuty/SSE delivery.
"""

import time
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.core.encryption import decrypt_secret
from app.services.org_store import org_store

logger = logging.getLogger("somak.alerts")

class AlertEvent:
    def __init__(
        self,
        alert_id: str,
        org_id: str,
        event_type: str,
        severity: str,
        title: str,
        message: str,
        incident_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = alert_id
        self.org_id = org_id
        self.event_type = event_type
        self.severity = severity
        self.title = title
        self.message = message
        self.incident_id = incident_id
        self.metadata = metadata or {}
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.dispatched_channels: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "org_id": self.org_id,
            "event_type": self.event_type,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "incident_id": self.incident_id,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            "dispatched_channels": self.dispatched_channels,
        }

class AlertService:
    def __init__(self):
        self._alerts: Dict[str, List[AlertEvent]] = {}  # org_id -> list of alerts

    def get_org_alerts(self, org_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns org-scoped alert history."""
        alerts = self._alerts.get(org_id, [])
        return [a.to_dict() for a in reversed(alerts[-limit:])]

    async def dispatch(
        self,
        org_id: str,
        event_type: str,
        severity: str,
        title: str,
        message: str,
        incident_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AlertEvent:
        """
        Dispatches an incident alert to configured organizational channels:
        1. In-memory / DB notification history
        2. Real-time SSE broadcast (job_queue)
        3. Slack Webhook (if configured)
        4. PagerDuty Events API (if configured)
        """
        import uuid
        alert_id = f"alt_{uuid.uuid4().hex[:12]}"
        alert = AlertEvent(
            alert_id=alert_id,
            org_id=org_id,
            event_type=event_type,
            severity=severity,
            title=title,
            message=message,
            incident_id=incident_id,
            metadata=metadata,
        )

        # 1. Store in org alert history
        if org_id not in self._alerts:
            self._alerts[org_id] = []
        self._alerts[org_id].append(alert)
        alert.dispatched_channels.append("in_app")

        # 2. Broadcast via JobQueue for real-time SSE stream
        try:
            from app.core.job_queue import job_queue
            job_queue.broadcast(org_id, "alert_received", alert.to_dict())
            alert.dispatched_channels.append("sse_stream")
        except Exception as e:
            logger.debug(f"Job queue broadcast skipped: {e}")

        # 3. Retrieve org notification settings
        org = org_store.get_org(org_id)
        if not org or not org.setup_checklist:
            return alert

        checklist = org.setup_checklist

        # 4. Dispatch to Slack Webhook if configured
        if checklist.slack_webhook:
            raw_url = decrypt_secret(checklist.slack_webhook)
            if raw_url and raw_url.startswith("http"):
                asyncio.create_task(self._send_slack_notification(raw_url, alert))
                alert.dispatched_channels.append("slack")

        # 5. Dispatch to PagerDuty if configured
        if checklist.pagerduty_key:
            raw_pd_key = decrypt_secret(checklist.pagerduty_key)
            if raw_pd_key:
                asyncio.create_task(self._send_pagerduty_notification(raw_pd_key, alert))
                alert.dispatched_channels.append("pagerduty")

        logger.info(
            f"Alert dispatched: {event_type} for org {org_id} (channels: {alert.dispatched_channels})"
        )
        return alert

    async def _send_slack_notification(self, webhook_url: str, alert: AlertEvent):
        """Asynchronously posts formatted alert card to Slack."""
        payload = {
            "text": f"[{alert.severity.upper()}] {alert.title}",
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": f"🚨 {alert.title}"}
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Event:* `{alert.event_type}`"},
                        {"type": "mrkdwn", "text": f"*Severity:* `{alert.severity.upper()}`"},
                        {"type": "mrkdwn", "text": f"*Incident ID:* `{alert.incident_id or 'N/A'}`"},
                        {"type": "mrkdwn", "text": f"*Time:* `{alert.timestamp}`"},
                    ]
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*{alert.message}*"}
                }
            ]
        }
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(webhook_url, json=payload)
                logger.info(f"Slack webhook dispatch status: {res.status_code}")
        except Exception as e:
            logger.warning(f"Failed to deliver Slack alert: {e}")

    async def _send_pagerduty_notification(self, routing_key: str, alert: AlertEvent):
        """Asynchronously triggers event via PagerDuty Events API v2."""
        pd_severity = "error" if alert.severity == "critical" else "warning"
        payload = {
            "routing_key": routing_key,
            "event_action": "trigger",
            "dedup_key": f"somak-{alert.incident_id or alert.id}",
            "payload": {
                "summary": f"[SOMAK AI] {alert.title}: {alert.message}",
                "severity": pd_severity,
                "source": "somak-autonomous-sre",
                "custom_details": alert.to_dict()
            }
        }
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post("https://events.pagerduty.com/v2/enqueue", json=payload)
                logger.info(f"PagerDuty dispatch status: {res.status_code}")
        except Exception as e:
            logger.warning(f"Failed to deliver PagerDuty alert: {e}")

alert_service = AlertService()
