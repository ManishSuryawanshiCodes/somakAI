from pydantic import BaseModel, ConfigDict, model_validator
from typing import Literal

class TavilyCitation(BaseModel):
    title: str
    url: str
    snippet: str

class RootCauseAnalysis(BaseModel):
    summary: str
    triggerMechanism: str
    tavilyCitations: list[TavilyCitation]

class SandboxExecution(BaseModel):
    sandboxId: str
    exitCode: int
    stdout: str
    testsPassed: int
    totalTests: int
    failureHistory: list[dict] = []

class Patch(BaseModel):
    targetFile: str
    unifiedDiff: str
    reproductionTest: str
    sandboxExecution: SandboxExecution | None = None

class Incident(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: str
    organization_id: str = "org_acme"
    fingerprint: str
    severity: Literal['SEV-1', 'SEV-2']
    service: str
    timestamp: str
    status: Literal['TRIAGING', 'INVESTIGATING', 'SANDBOX_VERIFYING', 'READY_FOR_DEPLOY', 'DEPLOYED', 'FAILED', 'NEEDS_HUMAN_REVIEW', 'RESOLVED', 'PROMOTED']
    confidenceScore: float | None = None
    astValidated: bool | None = None
    correctionLoops: int = 0
    rootCauseAnalysis: RootCauseAnalysis | None = None
    patch: Patch | None = None
    postMortemReport: str | None = None
    triage_provider: str = "nvidia_nim"
    triage_model: str = "nvidia/nemotron-3-super-120b-a12b"
    triage_source: str = "none"
    synthesis_provider: str = "nvidia_nim"
    synthesis_model: str = "nvidia/nemotron-3-ultra-550b-a55b"
    synthesis_source: str = "none"
    execution_mode: str = "simulated"
    provider_display_name: str = "Simulated"
    model_display_name: str = "No live API call"
    disclosure_badge: str = "Simulated result — no live API call"
    fallback_occurred: bool = False
    fallback_message: str | None = None
    reasoning_steps: list[dict] = []

    @model_validator(mode="after")
    def validate_complete_state(self):
        if self.status in ("READY_FOR_DEPLOY", "DEPLOYED", "PROMOTED"):
            if self.confidenceScore is None:
                raise ValueError("confidenceScore must be explicitly set before incident record is considered complete")
            if self.astValidated is None:
                raise ValueError("astValidated must be explicitly set before incident record is considered complete")
        return self

class CanaryStatus(BaseModel):
    incidentId: str
    trafficPercent: int
    baselineErrorRate: float
    canaryErrorRate: float
    baselineP99: float
    canaryP99: float
    status: Literal['IN_PROGRESS', 'PROMOTED', 'ROLLED_BACK', 'NOT_STARTED']

class SystemHealth(BaseModel):
    uptime: float
    activeIncidents: int
    mttr: str
    costSaved: float
    healthHistory: list[float]
    memoryUsage: list[dict]
    latencyData: list[dict]
    status: str = "operational"  # "operational" | "degraded" | "outage"
    database_status: str = "operational"
    ai_provider_status: str = "operational"
    webhook_status: str = "operational"
    sandbox_status: str = "operational"
