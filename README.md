# SOMAK AI — Autonomous Cloud SRE & Incident Remediation Platform

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Built For](https://img.shields.io/badge/Hackathon-Nebius%20x%20NVIDIA%20Global%20AI-76B900.svg)](https://nebius.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14%20App%20Router-black.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)

> Autonomous cloud Site Reliability Engineering (SRE) and AST hotfix verification platform. When critical incidents (Sev-1/Sev-2) trigger production alerts, Somak AI autonomously ingests telemetry, fingerprints errors with **NVIDIA Nemotron-3-Nano**, grounds resolution patterns via **Tavily Search API**, synthesizes verified AST hotfixes with **NVIDIA Nemotron-3-Ultra**, and executes containerized test suites in ephemeral **Nebius Token Factory Sandboxes**.

---

## Architecture Overview

```
[ Incoming Telemetry / Sentry Webhook ]
                  │
                  ▼
┌────────────────────────────────────────────────────────┐
│  FastAPI Telemetry Ingestion Engine                     │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│  Triage Layer (NVIDIA Nemotron 3 Nano @ 11ms)          │
│  - Extracts error signature & stack fingerprint        │
└──────────────────┬─────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────────┐   ┌──────────────────────────────────┐
│  Tavily Search   │   │  Git Context Collector           │
│  API Grounding   │   │  - AST & recent commit diffs     │
└────────┬─────────┘   └───────────────┬──────────────────┘
         └─────────────┬───────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│  Reasoning Engine (NVIDIA Nemotron 3 Ultra @ 42ms)     │
│  - Synthesizes reproduction test + code hotfix         │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│  Nebius Token Factory Ephemeral Sandbox                 │
│  - Executes containerized test suite                   │
└──────────────────┬─────────────────────────────────────┘
                   │
            (Exit Code 0?)
         ├── Pass ──► Open PR + Canary Rollout (5% traffic)
         └── Fail ──► Autonomous Self-Correction Loop (Up to 3x)
```

---

## 4 Connected Screens

1. **Screen 1: Executive Incident Radar (`/`)**
   - Real-time SLA & cluster availability metrics (99.94%).
   - Swipable mobile KPI reels (`System Health`, `Active Incidents`, `Autonomous MTTR`, `Cost Saved`).
   - Dual-axis telemetry chart correlating V8 heap memory exhaustion against P99 latency.
   - Interactive SVG Microservice Topology Map with tap-to-inspect dynamic blast radius assessment cards.
   - Priority incident queue with **99.4% Fix Verified** confidence pills.

2. **Screen 2: Autonomous Sandbox & AST Remediation Studio (`/remediation/[id]`)**
   - 3-column operator workbench (stacks to tabbed view on mobile).
   - Collapsible 4-step AI reasoning tree with latency metrics.
   - Root Cause Analysis (RCA) accordion with Tavily external web source citations.
   - Tabbed container terminal drawer (`[Sandbox Logs]`, `[Reproduction Test]`, `[Tavily Grounding]`).
   - Unified code diff viewer with line numbers and AST syntax validation badges.
   - Pre-deployment checklist & test assertion metrics (14/14 passed).
   - Desktop button (`Approve & Trigger Canary Deploy ⌘↵`) + Mobile **Slide-to-Deploy** gesture slider.

3. **Screen 3: Canary Rollout & Blast Radius Monitor (`/canary/[id]`)**
   - Real-time traffic routing donut gauge (5% Canary Hotfix vs 95% Baseline).
   - Comparative live telemetry charts: Error rate dropping from 12.4% to 0.00%; P99 latency flattening to 28ms.
   - Guardrail actions: **Promote to 100% Production** and **Emergency 1-Click Rollback**.

4. **Screen 4: Executive Post-Mortem & Audit Trail (`/postmortem/[id]`)**
   - Automated post-incident report with incident duration, root cause, code patch diff, sandbox execution hash, and audit logs.
   - Quick action buttons: **Export PDF**, **Copy Markdown**, and **Send to Slack** (`#incident-alerts`).

---

## Design System & Theming

- **Liquid Glass Cream Light Mode (Default):** Warm, tactile cream surfaces (`#FAF8F5`, `#F5F2EB`), deep slate/warm typography (`#181614`), liquid glass caustic highlights (`inset 0 1px 1.5px rgba(255, 255, 255, 0.98)`), and soft borders (`#E8E3D9`).
- **Obsidian Pure Black Dark Mode:** Deep pure black background (`#030306` / `#000000`) with hairline luminous strokes (`rgba(255, 255, 255, 0.09)`) and minimalist colored neon accents (Emerald, Cyan, Violet, Amber).
- **Tactile Floating Dock:** iOS-inspired bottom navigation pill for fast 1-click switching between screens with safe-area spacing for mobile.
- **Mobile & Laptop Responsive:** Collapsible mobile drawers, non-overlapping laptop headers, and tactile touch/mouse drag-to-confirm release slider.

---

## Quickstart & Local Development

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+ & pip

### 1. Start the Backend API (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 2. Start the Frontend App (Next.js 14)
```bash
cd frontend
npm install
npm run dev
```
Web App: `http://localhost:3000`

---

## License

This project is licensed under the [Apache 2.0 License](LICENSE).
