"""
SOMAK AI — Asynchronous Multi-Tenant Background Job Queue & SSE Broadcaster
Decouples long-running LLM inference, grounding, and sandboxing from the request-response cycle.
Supports fair multi-tenant dispatching, dead-letter queuing, and real-time SSE event subscriptions.
"""

import time
import uuid
import asyncio
import logging
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from app.core.tenant_limiter import tenant_limiter

logger = logging.getLogger("somak.job_queue")

class JobRecord(BaseModel):
    id: str = Field(default_factory=lambda: f"job_{uuid.uuid4().hex[:10]}")
    incident_id: str
    org_id: str
    status: str = "QUEUED"  # "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
    stage: str = "queued"
    error: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

class AsyncJobQueue:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AsyncJobQueue, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._jobs: Dict[str, JobRecord] = {}
        self._dlq: List[JobRecord] = []
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        self._workers: List[asyncio.Task] = []
        self._running = False
        self._worker_count = 4

    def enqueue(self, payload: dict) -> JobRecord:
        """Enqueues a new incident processing job without blocking HTTP caller."""
        org_id = payload.get("organization_id", "org_acme")
        incident_id = payload.get("event_id") or payload.get("id") or f"INC-{uuid.uuid4().hex[:6].upper()}"
        
        job = JobRecord(
            incident_id=incident_id,
            org_id=org_id,
            payload=payload
        )
        self._jobs[job.id] = job
        self._queue.put_nowait(job)
        logger.info(f"[JobQueue] Enqueued job {job.id} for incident {incident_id} (Org: {org_id}). Queue depth: {self._queue.qsize()}")

        self.broadcast(org_id, "job_queued", {
            "job_id": job.id,
            "incident_id": incident_id,
            "org_id": org_id,
            "status": "QUEUED",
            "timestamp": time.time()
        })
        return job

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        return self._jobs.get(job_id)

    def get_dlq(self) -> List[JobRecord]:
        return list(self._dlq)

    def retry_job(self, job_id: str) -> Optional[JobRecord]:
        """Re-enqueues a failed job from the Dead-Letter Queue."""
        job = self._jobs.get(job_id)
        if not job or job.status != "FAILED":
            return None
        job.status = "QUEUED"
        job.error = None
        job.stage = "queued"
        self._queue.put_nowait(job)
        self._dlq = [j for j in self._dlq if j.id != job_id]
        logger.info(f"[JobQueue] Retried failed job {job_id}. Re-enqueued.")
        self.broadcast(job.org_id, "job_retried", {"job_id": job.id, "incident_id": job.incident_id})
        return job

    # -------------------------------------------------------------
    # SSE Pub/Sub Subscriptions
    # -------------------------------------------------------------

    def subscribe(self, org_id: str) -> asyncio.Queue:
        """Subscribes an SSE connection to an organization's live pipeline events."""
        q = asyncio.Queue(maxsize=100)
        if org_id not in self._subscribers:
            self._subscribers[org_id] = []
        self._subscribers[org_id].append(q)
        return q

    def unsubscribe(self, org_id: str, q: asyncio.Queue):
        """Unsubscribes a disconnected client."""
        if org_id in self._subscribers:
            self._subscribers[org_id] = [sub for sub in self._subscribers[org_id] if sub != q]
            if not self._subscribers[org_id]:
                del self._subscribers[org_id]

    def broadcast(self, org_id: str, event_type: str, data: dict):
        """Dispatches an SSE event payload to all active client streams for this org."""
        event_payload = {
            "event": event_type,
            "data": data,
            "timestamp": time.time()
        }
        subscribers = self._subscribers.get(org_id, [])
        for sub_q in subscribers:
            try:
                sub_q.put_nowait(event_payload)
            except asyncio.QueueFull:
                pass

    # -------------------------------------------------------------
    # Background Worker Execution Loop
    # -------------------------------------------------------------

    def start_workers(self, worker_count: int = 4):
        if self._running:
            return
        self._running = True
        self._worker_count = worker_count
        for i in range(worker_count):
            task = asyncio.create_task(self._worker_loop(i))
            self._workers.append(task)
        logger.info(f"[JobQueue] Started {worker_count} background pipeline workers.")

    async def stop_workers(self):
        self._running = False
        for task in self._workers:
            task.cancel()
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        logger.info("[JobQueue] Stopped all background workers.")

    async def _worker_loop(self, worker_idx: int):
        from app.services.agent_runner import AgentRunner
        runner = AgentRunner()

        while self._running:
            try:
                job: JobRecord = await self._queue.get()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_idx} queue error: {e}")
                continue

            # Fair-Queuing: Wait if organization concurrency cap is reached
            can_run, reason = await tenant_limiter.can_schedule_pipeline(job.org_id)
            if not can_run:
                # Re-queue with slight delay to allow fair interleaved execution
                await asyncio.sleep(0.5)
                self._queue.put_nowait(job)
                self._queue.task_done()
                continue

            async with tenant_limiter.tenant_slot(job.org_id):
                job.status = "PROCESSING"
                job.started_at = time.time()
                self.broadcast(job.org_id, "job_started", {
                    "job_id": job.id,
                    "incident_id": job.incident_id,
                    "stage": "processing"
                })

                try:
                    # Run full pipeline with timeout protection (max 45 seconds total)
                    incident = await asyncio.wait_for(runner.run_pipeline(job.payload), timeout=45.0)
                    job.status = "COMPLETED"
                    job.completed_at = time.time()
                    job.stage = "completed"
                    logger.info(f"[JobQueue] Worker {worker_idx} completed job {job.id} for {job.incident_id}.")

                    self.broadcast(job.org_id, "job_completed", {
                        "job_id": job.id,
                        "incident_id": incident.id,
                        "status": incident.status,
                        "fallback_occurred": incident.fallback_occurred
                    })
                except Exception as e:
                    job.status = "FAILED"
                    job.error = str(e)
                    job.completed_at = time.time()
                    self._dlq.append(job)
                    logger.error(f"[JobQueue] Worker {worker_idx} job {job.id} failed: {e}. Added to DLQ.")

                    self.broadcast(job.org_id, "job_failed", {
                        "job_id": job.id,
                        "incident_id": job.incident_id,
                        "error": str(e)
                    })
                finally:
                    self._queue.task_done()

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "queue_depth": self._queue.qsize(),
            "active_workers": self._worker_count if self._running else 0,
            "running": self._running,
            "total_jobs_tracked": len(self._jobs),
            "dlq_size": len(self._dlq),
            "active_sse_subscribers": sum(len(subs) for subs in self._subscribers.values())
        }

job_queue = AsyncJobQueue()
