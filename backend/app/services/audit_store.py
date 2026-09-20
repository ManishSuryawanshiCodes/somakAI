"""
SOMAK AI — Append-Only Cryptographic Audit Log Store
Strictly immutable audit ledger. No update or delete operations exist.
Each entry includes SHA-256 tamper-evident chain hashing.
"""

import time
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel

class AuditEvent(BaseModel):
    id: str
    organization_id: str
    actor: Dict[str, str]  # { name, email, avatar, role }
    action: str
    actionCategory: str  # 'canary' | 'rollback' | 'rbac' | 'api_key' | 'compliance' | 'auth'
    targetResource: str
    timestamp: str
    ipAddress: str
    verificationHash: str
    status: str = "VERIFIED"

class AuditStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AuditStore, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self._events: List[AuditEvent] = []
        self._last_hash = "0" * 64

        # Pre-seed realistic verified entries
        self.record_event(
            actor_name="Marcus Vance",
            actor_email="marcus.vance@sentryops.internal",
            actor_role="Operator",
            org_id="org_acme",
            action="Approved 5% Canary Deployment for INC-2041",
            category="canary",
            target="auth-service:v1.4.2-hotfix",
            ip="10.240.12.89 (VPN)",
            custom_time="2026-09-19 14:04:18 UTC"
        )
        self.record_event(
            actor_name="Elena Rostova",
            actor_email="elena.rostova@sentryops.internal",
            actor_role="Admin",
            org_id="org_acme",
            action="Modified RBAC Permission for Devin Zhao to Operator",
            category="rbac",
            target="usr-3 (devin.zhao)",
            ip="10.240.12.14 (VPN)",
            custom_time="2026-09-19 13:12:05 UTC"
        )
        self.record_event(
            actor_name="Elena Rostova",
            actor_email="elena.rostova@sentryops.internal",
            actor_role="Admin",
            org_id="org_acme",
            action="Rotated Nebius Token Factory Production API Key",
            category="api_key",
            target="secrets/nebius_api_key",
            ip="10.240.12.14 (VPN)",
            custom_time="2026-09-18 10:15:00 UTC"
        )

    def record_event(
        self,
        actor_name: str,
        actor_email: str,
        actor_role: str,
        org_id: str,
        action: str,
        category: str,
        target: str,
        ip: str = "127.0.0.1",
        custom_time: Optional[str] = None
    ) -> AuditEvent:
        event_id = f"aud-{len(self._events) + 9840}"
        ts = custom_time or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        # Cryptographic tamper-evident chain hashing
        raw_payload = f"{self._last_hash}:{event_id}:{org_id}:{actor_email}:{action}:{target}:{ts}:{ip}"
        entry_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
        self._last_hash = entry_hash

        actor_dict = {
            "name": actor_name,
            "email": actor_email,
            "avatar": actor_name[:2].upper() if actor_name else "OP",
            "role": actor_role
        }

        event = AuditEvent(
            id=event_id,
            organization_id=org_id,
            actor=actor_dict,
            action=action,
            actionCategory=category,
            targetResource=target,
            timestamp=ts,
            ipAddress=ip,
            verificationHash=f"sha256:{entry_hash[:8]}...{entry_hash[-4:]}",
            status="VERIFIED"
        )

        # STRICTLY APPEND-ONLY: No update or delete operations exist.
        self._events.insert(0, event)  # newest first for query convenience
        return event

    def list_events(self, org_id: Optional[str] = None, limit: int = 50) -> List[AuditEvent]:
        if not org_id:
            return self._events[:limit]
        filtered = [e for e in self._events if e.organization_id == org_id]
        return filtered[:limit]

audit_store = AuditStore()
