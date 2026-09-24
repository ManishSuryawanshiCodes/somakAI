from pydantic import BaseModel
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
    id: str
    organization_id: str = "org_acme"
    fingerprint: str
    severity: Literal['SEV-1', 'SEV-2']
    service: str
    timestamp: str
    status: Literal['TRIAGING', 'INVESTIGATING', 'SANDBOX_VERIFYING', 'READY_FOR_DEPLOY', 'DEPLOYED', 'FAILED', 'NEEDS_HUMAN_REVIEW']
    confidenceScore: float = 99.4
    astValidated: bool = True
    correctionLoops: int = 0
    rootCauseAnalysis: RootCauseAnalysis | None = None
    patch: Patch | None = None
    postMortemReport: str | None = None
    triage_provider: str = "nebius"
    triage_model: str = "nvidia/nemotron-3-nano-30b-a3b"
    synthesis_provider: str = "nebius"
    synthesis_model: str = "nvidia/nemotron-3-ultra-550b"
    fallback_occurred: bool = False
    fallback_message: str | None = None
    reasoning_steps: list[dict] = []

class CanaryStatus(BaseModel):
    incidentId: str
    trafficPercent: int
    baselineErrorRate: float
    canaryErrorRate: float
    baselineP99: float
    canaryP99: float
    status: Literal['IN_PROGRESS', 'PROMOTED', 'ROLLED_BACK']

class SystemHealth(BaseModel):
    uptime: float
    activeIncidents: int
    mttr: str
    costSaved: float
    healthHistory: list[float]
    memoryUsage: list[dict]
    latencyData: list[dict]
