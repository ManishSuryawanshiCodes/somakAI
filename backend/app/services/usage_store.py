"""
SOMAK AI — Per-Provider Cost & Usage Tracking Service
Tracks token consumption, stage invocations, and separates platform-metered vs BYOK calls.
Syncs with Supabase PostgreSQL provider_usage table.
"""

import uuid
import threading
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class UsageRecord(BaseModel):
    id: str = Field(default_factory=lambda: f"usg_{uuid.uuid4().hex[:10]}")
    org_id: str
    provider: str
    model: str
    stage: str  # "triage" | "synthesis"
    billing_type: str  # "metered" | "byok"
    tokens_in: int = 0
    tokens_out: int = 0
    total_tokens: int = 0
    cost_estimate: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProviderModelSummary(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    provider: str
    provider_name: str
    model: str
    model_name: str
    stage: str
    calls: int
    tokens_in: int
    tokens_out: int
    total_tokens: int
    billing_type: str  # "metered" | "byok"
    cost_saved: float
    status: str = "Active"


class OrgUsageSummary(BaseModel):
    org_id: str
    plan_name: str = "Enterprise Tier (Dedicated)"
    billing_cycle: str = "Sep 1 – Sep 30"
    total_calls: int
    platform_metered_calls: int
    byok_calls: int
    platform_tokens_used: int
    platform_tokens_limit: int = 5000000
    platform_tokens_percent: float
    byok_tokens_processed: int
    total_cost_saved: float
    breakdown: List[ProviderModelSummary]

class UsageStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(UsageStore, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self._lock = threading.Lock()
        self._records: List[UsageRecord] = []
        
        # Pre-seed realistic baseline consumption for demo org: org_acme
        # Prompt requirement: "342 Nemotron-Nano calls, 12 Claude Sonnet calls this month"
        now_iso = datetime.now(timezone.utc).isoformat()
        
        baseline_data = [
            # 1. Nebius Nemotron-3-Nano (Platform Metered Triage)
            {"org_id": "org_acme", "provider": "nebius", "model": "nvidia/nemotron-3-nano-30b-a3b", "stage": "triage", "billing_type": "metered", "calls": 342, "tokens_in": 240000, "tokens_out": 88000, "cost": 1240.0},
            # 2. Nebius Nemotron-3-Ultra (Platform Metered Synthesis)
            {"org_id": "org_acme", "provider": "nebius", "model": "nvidia/nemotron-3-ultra-550b", "stage": "synthesis", "billing_type": "metered", "calls": 84, "tokens_in": 820000, "tokens_out": 280500, "cost": 8900.0},
            # 3. Anthropic Claude 3.5 Sonnet (BYOK Deep Reasoning)
            {"org_id": "org_acme", "provider": "anthropic", "model": "claude-3-5-sonnet-20241022", "stage": "synthesis", "billing_type": "byok", "calls": 12, "tokens_in": 160000, "tokens_out": 85000, "cost": 3400.0},
            # 4. OpenAI GPT-4o-mini (BYOK Fast Triage)
            {"org_id": "org_acme", "provider": "openai", "model": "gpt-4o-mini", "stage": "triage", "billing_type": "byok", "calls": 68, "tokens_in": 58000, "tokens_out": 24000, "cost": 650.0},
            # 5. Google Gemini 1.5 Flash (BYOK Fast Triage)
            {"org_id": "org_acme", "provider": "google", "model": "gemini-1.5-flash", "stage": "triage", "billing_type": "byok", "calls": 24, "tokens_in": 26000, "tokens_out": 12000, "cost": 290.0}
        ]

        for item in baseline_data:
            for _ in range(item["calls"]):
                tin = item["tokens_in"] // item["calls"]
                tout = item["tokens_out"] // item["calls"]
                self._records.append(UsageRecord(
                    org_id=item["org_id"],
                    provider=item["provider"],
                    model=item["model"],
                    stage=item["stage"],
                    billing_type=item["billing_type"],
                    tokens_in=tin,
                    tokens_out=tout,
                    total_tokens=tin + tout,
                    cost_estimate=item["cost"] / item["calls"],
                    timestamp=now_iso
                ))

    def record_call(
        self,
        org_id: str,
        provider: str,
        model: str,
        stage: str,
        billing_type: str,
        tokens_in: int = 450,
        tokens_out: int = 250,
        cost_estimate: float = 15.0
    ) -> UsageRecord:
        record = UsageRecord(
            org_id=org_id,
            provider=provider.lower(),
            model=model,
            stage=stage.lower(),
            billing_type=billing_type.lower(),
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            total_tokens=tokens_in + tokens_out,
            cost_estimate=cost_estimate
        )
        with self._lock:
            self._records.append(record)

        self._sync_record_to_db(record)
        return record

    def get_org_usage(self, org_id: str) -> OrgUsageSummary:
        with self._lock:
            records = [r for r in self._records if r.org_id == org_id]

        total_calls = len(records)
        platform_calls = sum(1 for r in records if r.billing_type == "metered")
        byok_calls = sum(1 for r in records if r.billing_type == "byok")

        platform_tokens = sum(r.total_tokens for r in records if r.billing_type == "metered")
        byok_tokens = sum(r.total_tokens for r in records if r.billing_type == "byok")
        total_cost_saved = sum(r.cost_estimate for r in records)

        # Group by (provider, model, stage, billing_type)
        grouped: Dict[tuple, Dict[str, Any]] = {}
        for r in records:
            key = (r.provider, r.model, r.stage, r.billing_type)
            if key not in grouped:
                grouped[key] = {
                    "calls": 0,
                    "tokens_in": 0,
                    "tokens_out": 0,
                    "cost_saved": 0.0
                }
            grouped[key]["calls"] += 1
            grouped[key]["tokens_in"] += r.tokens_in
            grouped[key]["tokens_out"] += r.tokens_out
            grouped[key]["cost_saved"] += r.cost_estimate

        # Map to display names
        provider_display = {
            "nebius": "NVIDIA / Nebius Token Factory",
            "anthropic": "Anthropic Claude",
            "openai": "OpenAI GPT",
            "google": "Google Gemini"
        }

        breakdown = []
        for (prov, mdl, stg, btype), val in grouped.items():
            breakdown.append(ProviderModelSummary(
                provider=prov,
                provider_name=provider_display.get(prov, prov.capitalize()),
                model=mdl,
                model_name=mdl.split("/")[-1].replace("-", " ").title(),
                stage=stg.capitalize(),
                calls=val["calls"],
                tokens_in=val["tokens_in"],
                tokens_out=val["tokens_out"],
                total_tokens=val["tokens_in"] + val["tokens_out"],
                billing_type=btype,
                cost_saved=round(val["cost_saved"], 2),
                status="Active"
            ))

        # Sort: platform metered first, then highest calls
        breakdown.sort(key=lambda x: (x.billing_type != "metered", -x.calls))

        platform_limit = 5000000
        percent = round((platform_tokens / platform_limit) * 100, 1)

        return OrgUsageSummary(
            org_id=org_id,
            plan_name="Enterprise Tier (Dedicated)",
            billing_cycle="Sep 1 – Sep 30",
            total_calls=total_calls,
            platform_metered_calls=platform_calls,
            byok_calls=byok_calls,
            platform_tokens_used=platform_tokens,
            platform_tokens_limit=platform_limit,
            platform_tokens_percent=percent,
            byok_tokens_processed=byok_tokens,
            total_cost_saved=round(total_cost_saved, 2),
            breakdown=breakdown
        )

    def _sync_record_to_db(self, record: UsageRecord):
        try:
            from app.core.database import db
            query = """
            INSERT INTO provider_usage (id, org_id, provider, model, stage, billing_type, tokens_in, tokens_out, total_tokens, cost_estimate, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """
            db.execute_query(query, (
                record.id,
                record.org_id,
                record.provider,
                record.model,
                record.stage,
                record.billing_type,
                record.tokens_in,
                record.tokens_out,
                record.total_tokens,
                record.cost_estimate,
                record.timestamp
            ))
        except Exception:
            pass

usage_store = UsageStore()
