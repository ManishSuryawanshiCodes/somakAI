'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Copy,
  Check,
  Send,
  Download,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Globe,
  AlertTriangle,
  Code2,
  FileCheck2,
  Layers,
  Sparkles,
  Search,
  MessageSquare,
  MessageSquarePlus,
  Lock,
  History,
  UserCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileSignature,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import StatusBadge from '@/components/StatusBadge';
import FloatingDock from '@/components/FloatingDock';
import DiffViewer from '@/components/DiffViewer';
import { getPostMortem, notifySlack, getIncident } from '@/lib/api';
import { mockIncident } from '@/lib/mock-data';
import { Incident } from '@/lib/types';

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

export type WorkflowStatus = 'draft' | 'under_review' | 'published';

export interface ReviewComment {
  id: string;
  author: string;
  role: string;
  avatarColor: string;
  timestamp: string;
  text: string;
}

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  desc: string;
  icon: any;
  targetId: string;
}

export default function PostMortemPage() {
  const params = useParams();
  const id = (params?.id as string) || 'INC-2041';
  const [incident, setIncident] = useState<Incident>(mockIncident);
  const [postMortemText, setPostMortemText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [slackSent, setSlackSent] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('sec-summary');
  const [viewMode, setViewMode] = useState<'rich' | 'raw'>('rich');

  // ISO27001 / SOC-2 Audit Workflow State Machine
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('under_review');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Draggable/Scrubbable Sequence Timeline
  const [scrubIndex, setScrubIndex] = useState(0);

  // Inline Section Commenting
  const [comments, setComments] = useState<Record<string, ReviewComment[]>>({
    'sec-summary': [
      {
        id: 'c0',
        author: 'Marcus Vance',
        role: 'Principal SRE Lead',
        avatarColor: 'bg-indigo-500',
        timestamp: '14:05 UTC',
        text: 'Autonomous MTTR of 2m 07s meets Tier-0 SLA targets. Resolution logic verified against Prometheus telemetry.',
      },
    ],
    'sec-rca': [
      {
        id: 'c1',
        author: 'Sarah Chen',
        role: 'Staff Reliability Engineer',
        avatarColor: 'bg-amber-500',
        timestamp: '14:06 UTC',
        text: 'Heap dump analysis corroborates: 2.3M session keys in the tokenCache Map before OOM kill.',
      },
    ],
    'sec-patch': [
      {
        id: 'c2',
        author: 'Alex Mercer',
        role: 'Security & Compliance Architect',
        avatarColor: 'bg-emerald-500',
        timestamp: '14:08 UTC',
        text: 'LRU max size 5,000 with 5-minute TTL complies with RFC 7519 session validation and mitigates CWE-400 resource exhaustion.',
      },
    ],
  });
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Related Incidents with identical fingerprint (node-v8-oom-auth)
  const relatedIncidents = [
    {
      id: 'INC-1892',
      date: '3 weeks ago (Aug 28)',
      service: 'auth-service',
      fingerprint: 'node-v8-oom-auth',
      severity: 'SEV-1',
      mttr: '18m 42s',
      remediationType: 'Human Assisted Hotfix',
      rootCause: 'V8 heap memory exhaustion during flash sale token surge',
      status: 'RESOLVED',
    },
    {
      id: 'INC-1420',
      date: '2 months ago (Jul 12)',
      service: 'auth-service',
      fingerprint: 'node-v8-oom-auth',
      severity: 'SEV-2',
      mttr: '42m 15s',
      remediationType: 'Manual Hotfix Deployment',
      rootCause: 'EventEmitter maxListeners leak on high concurrent JWT verifies',
      status: 'RESOLVED',
    },
    {
      id: 'INC-0914',
      date: '5 months ago (Apr 03)',
      service: 'billing-service',
      fingerprint: 'node-v8-oom-auth',
      severity: 'SEV-1',
      mttr: '1h 14m',
      remediationType: 'Manual Rollback & Hotfix',
      rootCause: 'Token validation cache unbounded map memory growth',
      status: 'RESOLVED',
    },
  ];

  useEffect(() => {
    getIncident(id)
      .then((data) => {
        if (data) setIncident(data as Incident);
      })
      .catch(console.error);

    getPostMortem(id)
      .then((res) => {
        if (res?.markdown) {
          setPostMortemText(res.markdown);
        } else {
          setPostMortemText(`# Somak AI Executive Incident Post-Mortem

**Incident ID:** \`${id}\`  
**Severity:** \`SEV-1 Critical\` | **Service:** \`auth-service\`  
**Fingerprint:** \`ERR_EVENTEMITTER_LEAK\`  
**Status:** \`Verified in Nebius Sandbox #8841\`  
**Autonomous Patch Confidence:** \`99.4% (AST Syntactic & Semantic Check: PASS)\`  
**Incident Start:** \`14:02:11 UTC\` | **Canary Verified:** \`14:04:18 UTC\`  
**MTTR:** \`2m 07s\` (Industry Human Baseline: 48m)  

---

## 1. Executive Summary
On 14:02:11 UTC, an unhandled memory leak triggered high-priority pod crash alerts in auth-service. Somak AI autonomously ingested the stack trace, extracted the failure fingerprint via NVIDIA Nemotron-3-Nano, grounded resolution patterns via Tavily Search API, and synthesized a verified zero-regression AST patch via NVIDIA Nemotron-3-Ultra.

## 2. Root Cause Analysis
- Core Defect: In src/services/tokenService.ts, verified JWT session tokens were cached in an unbounded Map<string, any>.
- Trigger Condition: Sustained marketing traffic surge of ~50k req/min caused 2.3M unique keys to consume V8 heap memory until the 2GB limit was reached.
- Blast Radius: Downstream impact on api-gateway backpressure and redis-cache was isolated within 120 seconds.

## 3. Ground Truth Intelligence (Tavily Grounding)
- Citations Retrieved: 3 verified references covering Node.js EventEmitter memory leaks and TTL bounded caching patterns.
- Resolution Strategy: Replaced Map with a size-bounded, TTL-evicted LRUCache (max: 5000, ttl: 300,000ms).

## 4. Sandbox Artifacts & Verification Hash
- Sandbox ID: nbx-sandbox-8841
- Container Image: nbx-registry/sandbox-runner:v1.4.2
- Self-Correction Cycles: 1 loop (cleared listener reference on dispose)
- Test Results: 14 passed, 0 failed (Execution time: 4.218s)
- Exit Code: 0

## 5. Unified Code Hotfix Diff
Verified AST diff merged into canary image.

## 6. Audit Trail & Sign-Off
- Autonomous Lead: NVIDIA Nemotron-3-Ultra Agent
- Triaged by: NVIDIA Nemotron-3-Nano (Inference latency: 11ms)
- Canary Policy: 5% traffic split -> 0.00% error rate verified -> 100% production promotion.
`);
        }
      })
      .catch(console.error);
  }, [id]);

  const sections = [
    { id: 'sec-summary', label: 'Overview', num: '1' },
    { id: 'sec-rca', label: 'Root Cause', num: '2' },
    { id: 'sec-citations', label: 'Sources', num: '3' },
    { id: 'sec-sandbox', label: 'Sandbox', num: '4' },
    { id: 'sec-patch', label: 'Hotfix Diff', num: '5' },
    { id: 'sec-audit', label: 'Audit Trail', num: '6' },
    { id: 'sec-related', label: 'Pattern Insight', num: '7' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(postMortemText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSlackNotify = async () => {
    await notifySlack(id);
    setSlackSent(true);
    setTimeout(() => setSlackSent(false), 3000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const timelineEvents: TimelineItem[] = [
    {
      id: 'evt-1',
      time: '14:02:00 UTC',
      title: 'Telemetry Ingested',
      desc: 'Sentry webhook delivered SEV-1 memory crash payload.',
      icon: Clock,
      targetId: 'sec-summary',
    },
    {
      id: 'evt-2',
      time: '14:02:01 UTC',
      title: 'Triage & Fingerprint',
      desc: 'Nemotron-3-Nano extracted ERR_EVENTEMITTER_LEAK.',
      icon: Cpu,
      targetId: 'sec-summary',
    },
    {
      id: 'evt-3',
      time: '14:02:03 UTC',
      title: 'Tavily Search Grounding',
      desc: 'Queried 3 external diagnostic sources for Node 20 heap leaks.',
      icon: ExternalLink,
      targetId: 'sec-citations',
    },
    {
      id: 'evt-4',
      time: '14:02:07 UTC',
      title: 'AST Patch Synthesized',
      desc: 'Nemotron-3-Ultra generated LRUCache replacement & Jest spec.',
      icon: Code2,
      targetId: 'sec-patch',
    },
    {
      id: 'evt-5',
      time: '14:02:11 UTC',
      title: 'Nebius Sandbox Verified',
      desc: 'Exit code 0 confirmed; 14/14 Jest specs passed in container.',
      icon: ShieldCheck,
      targetId: 'sec-sandbox',
    },
    {
      id: 'evt-6',
      time: '14:02:45 UTC',
      title: 'Canary Rollout (5%)',
      desc: 'Envoy proxy routed 5% traffic to hotfix pod cluster.',
      icon: Layers,
      targetId: 'sec-audit',
    },
    {
      id: 'evt-7',
      time: '14:04:18 UTC',
      title: '100% Production Promotion',
      desc: 'Error rate dropped to 0.00%; Canary promoted to full production.',
      icon: CheckCircle2,
      targetId: 'sec-audit',
    },
  ];

  const scrollToSection = (targetId: string) => {
    setActiveSection(targetId);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrubChange = (newIndex: number) => {
    setScrubIndex(newIndex);
    const targetEvt = timelineEvents[newIndex];
    if (targetEvt) {
      scrollToSection(targetEvt.targetId);
    }
  };

  const handleAddComment = (sectionId: string) => {
    if (!commentInput.trim()) return;
    const newComment: ReviewComment = {
      id: `c-${Date.now()}`,
      author: 'You (SRE On-Call)',
      role: 'Incident Commander',
      avatarColor: 'bg-indigo-600',
      timestamp: 'Just now',
      text: commentInput.trim(),
    };
    setComments((prev) => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), newComment],
    }));
    setCommentInput('');
  };

  const handleStatusChange = (newStatus: WorkflowStatus) => {
    setWorkflowStatus(newStatus);
    if (newStatus === 'published') {
      setStatusMessage('Report locked to immutable SOC-2 / ISO27001 audit vault (Hash: 0x9f82...c41a).');
    } else if (newStatus === 'under_review') {
      setStatusMessage('Report moved to Under Review. Team comments unlocked.');
    } else {
      setStatusMessage('Report moved to Draft state.');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const citations = incident.rootCauseAnalysis?.tavilyCitations || [
    {
      title: 'Node.js Memory Leaks: EventEmitters and Caching Patterns',
      url: 'https://nodejs.org/en/docs/guides/diagnostics/memory/event-emitters',
      snippet: 'A common source of memory leaks in Node.js applications is unmanaged event listeners and unbounded cache objects storing large payload data. Always set maxListeners and implement cache eviction policies.',
    },
    {
      title: 'Best practices for implementing LRU cache in TypeScript',
      url: 'https://blog.logrocket.com/implementing-lru-cache-typescript/',
      snippet: 'When dealing with high-throughput services, unbounded Maps can quickly consume the V8 heap. Implement a size-limited LRU or TTL cache to prevent OOM errors. The lru-cache package provides a battle-tested solution.',
    },
    {
      title: 'Debugging V8 Out Of Memory Exceptions in Auth Services',
      url: 'https://engineering.auth0.com/debugging-oom-nodejs',
      snippet: 'In auth services, JWT token validation results in many intermediate objects. If you cache token verification results, ensure the cache has a strict upper bound. We recommend max 5000-10000 entries with 5-minute TTL.',
    },
  ];

  const patchDiff = incident.patch?.unifiedDiff || `--- a/src/services/tokenService.ts
+++ b/src/services/tokenService.ts
@@ -1,8 +1,9 @@
 import jwt from 'jsonwebtoken';
 import { EventEmitter } from 'events';
-import { Logger } from '../utils/logger';
+import { Logger } from '../utils/logger';
+import { LRUCache } from 'lru-cache';
 
 const logger = new Logger('TokenService');
-const tokenCache = new Map<string, { result: any; timestamp: number }>();
+const emitter = new EventEmitter();
+emitter.setMaxListeners(50);
 
@@ -12,25 +13,32 @@
 export class TokenService {
   private secret: string;
+  private cache: LRUCache<string, { result: any; timestamp: number }>;
 
   constructor(secret: string) {
     this.secret = secret;
+    this.cache = new LRUCache({
+      max: 5000,
+      ttl: 1000 * 60 * 5,        // 5 minute TTL
+      updateAgeOnGet: true,
+      allowStale: false,
+    });
   }
 
   async verify(token: string): Promise<TokenPayload> {
-    // BUG: Map grows unboundedly - never evicts entries
-    const cached = tokenCache.get(token);
-    if (cached && Date.now() - cached.timestamp < 300000) {
+    // FIXED: Use TTL-bounded LRU cache with automatic eviction
+    const cached = this.cache.get(token);
+    if (cached) {
       return cached.result;
     }
 
     try {
       const decoded = jwt.verify(token, this.secret) as TokenPayload;
-      tokenCache.set(token, { result: decoded, timestamp: Date.now() });
-      emitter.emit('token-verified', token);
+      this.cache.set(token, { result: decoded, timestamp: Date.now() });
       return decoded;
     } catch (err) {
-      tokenCache.set(token, { result: null, timestamp: Date.now() });
+      logger.warn('Token verification failed: ' + (err as Error).message);
       throw new AuthenticationError('Invalid token');
     }
   }
+
+  getCacheStats() {
+    return { size: this.cache.size, max: this.cache.max };
+  }
 }`;

  return (
    <div className="min-h-screen text-text-primary pb-36 md:pb-12 relative z-10">
      <TopNav />

      <main className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Bar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Link
              href={`/canary/${id}`}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Return to Canary Monitor"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Audit & Compliance
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">• Incident {id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-indigo-500" />
                Post-Mortem & Audit Trail
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mr-1">
              <button
                onClick={() => setViewMode('rich')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'rich'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Rich View
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'raw'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Raw Markdown
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            {/* Single Primary Action: Send to Slack */}
            <button
              onClick={handleSlackNotify}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{slackSent ? 'Dispatched to #incident-alerts' : 'Dispatch to Slack'}</span>
            </button>
          </div>
        </motion.div>

        {/* ISO27001 / SOC-2 AUDIT WORKFLOW STATE MACHINE */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-6 p-4 sm:p-5 rounded-2xl glass-card flex flex-col gap-3.5 border-indigo-500/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSignature className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  SOC-2 / ISO 27001 Audit Workflow
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                    Type II Certified
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Auditable remediation reports require multi-role review before signing and immutable vault publication.
                </p>
              </div>
            </div>

            {/* State Machine Stepper Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleStatusChange('draft')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  workflowStatus === 'draft'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>1. Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('under_review')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  workflowStatus === 'under_review'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>2. Under Review</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('published')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  workflowStatus === 'published'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>3. Published</span>
              </button>
            </div>
          </div>

          {/* Workflow Stage Details & Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              {workflowStatus === 'draft' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Draft generated autonomously by NVIDIA Nemotron-3-Ultra. Awaiting peer annotations.</span>
                </>
              )}
              {workflowStatus === 'under_review' && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Under Peer Review
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Reviewers:</span>
                    <div className="flex items-center -space-x-1.5">
                      <div
                        className="relative group cursor-pointer"
                        title="Marcus Vance (Principal SRE Lead)"
                      >
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                          MV
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="px-2 py-0.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-medium rounded shadow-lg whitespace-nowrap">
                            Marcus Vance • SRE Lead
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-white rotate-45 -mt-0.5"></div>
                        </div>
                      </div>
                      <div
                        className="relative group cursor-pointer"
                        title="Alex Mercer (Security & Compliance Architect)"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                          AM
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="px-2 py-0.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-medium rounded shadow-lg whitespace-nowrap">
                            Alex Mercer • Security Sign-off
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-white rotate-45 -mt-0.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                  <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">Inline commenting active</span>
                </div>
              )}
              {workflowStatus === 'published' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    Published & Signed • SOC-2 Immutable Hash: <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">0x9f82c41a-8841</code> • Compliance Locked.
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {statusMessage && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {statusMessage}
                </span>
              )}
              {workflowStatus !== 'published' ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange('published')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  <span>Sign & Lock to Audit Vault</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange('under_review')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all"
                >
                  Re-open for Review
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* STICKY SECTION JUMP NAVIGATION (Numbered 1-7 Rail) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="sticky top-14 z-20 mb-6 py-2 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar"
        >
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
              Jump to Section:
            </span>
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sec.num}
                  </span>
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Audit-Ready</span>
          </div>
        </motion.div>

        {/* 2-Column Layout: Left Timeline, Right Document */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Incident Timeline & Meta (lg:col-span-4) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4 flex flex-col gap-5 sticky top-20"
          >
            {/* KPI Summary Card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Remediation Performance
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block">Total MTTR</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">2m 07s</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block">Confidence</span>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">99.4%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Downtime Loss Avoided:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">~$42,800</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Sandbox Verification:</span>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Exit 0 (PASS 14/14)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Self-Correction Loops:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    1 Cycle (Converged)
                  </span>
                </div>
              </div>
            </div>

            {/* DRAGGABLE / SCRUBBABLE SEQUENCE TIMELINE */}
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Incident Sequence
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  Step {scrubIndex + 1} of {timelineEvents.length}
                </span>
              </div>

              {/* Scrubber slider */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Timeline Scrubber:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {timelineEvents[scrubIndex].time}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={timelineEvents.length - 1}
                  step={1}
                  value={scrubIndex}
                  onChange={(e) => handleScrubChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                  <span>14:02:00 (Crash)</span>
                  <span>14:04:18 (Promoted)</span>
                </div>
              </div>

              <div className="relative pl-6 space-y-3">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800"></div>

                {timelineEvents.map((evt, idx) => {
                  const Icon = evt.icon;
                  const isSelected = activeSection === evt.targetId || scrubIndex === idx;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setScrubIndex(idx);
                        scrollToSection(evt.targetId);
                      }}
                      className={`relative cursor-pointer p-2.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 ring-2 ring-indigo-500/60 shadow-xs'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div
                        className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{evt.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{evt.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {evt.desc}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-500">
                        <span>Jump to section &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Column 2: Document Reader View (lg:col-span-8) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.05 }}
            className="lg:col-span-8 glass-card rounded-2xl p-6 sm:p-8 flex flex-col gap-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  audit-report-{id}.md
                </span>
                <span className="text-xs text-slate-400">• ISO 27001 / SOC-2 Type II Certified</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Compliance Audit PASS
              </span>
            </div>

            {viewMode === 'raw' ? (
              /* RAW MARKDOWN VIEW */
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto">
                  {postMortemText}
                </pre>
              </div>
            ) : (
              /* RICH FORMATTED VIEW WITH INLINE COMMENTING */
              <div className="space-y-7">
                
                {/* Hero Header Card with Pill Badges */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Incident Summary & Executive Metadata
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Target Service: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{incident.service}</span> • Fingerprint: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{incident.fingerprint || 'ERR_EVENTEMITTER_LEAK'}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> SEV-1 Critical
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 99.4% Fix Verified
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                      AST Validated
                    </span>
                  </div>
                </div>

                {/* Section 1: Executive Overview */}
                <div id="sec-summary" className="scroll-mt-28 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        1. Executive Overview & Rapid Triage
                      </h3>
                    </div>
                    {/* Inline Comment Trigger */}
                    <button
                      type="button"
                      onClick={() => setActiveCommentSection(activeCommentSection === 'sec-summary' ? null : 'sec-summary')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{comments['sec-summary']?.length || 0} Review Notes</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    At 14:02:11 UTC, an unhandled V8 heap memory leak triggered production crash alerts on <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-red-600 dark:text-red-400">{incident.service}</code>. Somak AI autonomously routed incoming crash telemetry via <strong className="text-slate-900 dark:text-white">NVIDIA Nemotron-3-Nano</strong> (latency: 11ms) for stack fingerprint extraction, grounded resolution patterns via <strong className="text-slate-900 dark:text-white">Tavily Search API</strong>, and synthesized a zero-regression AST patch via <strong className="text-slate-900 dark:text-white">NVIDIA Nemotron-3-Ultra</strong> (latency: 42ms).
                  </p>

                  {/* Inline Comments Drawer */}
                  {activeCommentSection === 'sec-summary' && (
                    <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-indigo-500/30 flex flex-col gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Peer Review Comments (Section 1)
                      </span>
                      <div className="space-y-2">
                        {comments['sec-summary']?.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900 dark:text-white">{c.author} <span className="text-[10px] text-slate-400 font-normal">({c.role})</span></span>
                              <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add team feedback on this section..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment('sec-summary'); }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment('sec-summary')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Root Cause Analysis */}
                <div id="sec-rca" className="scroll-mt-28 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        2. Root Cause Analysis & Trigger Mechanism
                      </h3>
                    </div>
                    {/* Inline Comment Trigger */}
                    <button
                      type="button"
                      onClick={() => setActiveCommentSection(activeCommentSection === 'sec-rca' ? null : 'sec-rca')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                      <span>{comments['sec-rca']?.length || 0} Review Notes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong className="text-slate-900 dark:text-white block mb-1">Primary Defect:</strong>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Unbounded <code className="font-mono text-indigo-600 dark:text-indigo-400">Map&lt;string, any&gt;</code> in <code className="font-mono">TokenService.verify()</code>. Session validation results were cached indefinitely without eviction.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong className="text-slate-900 dark:text-white block mb-1">Traffic Trigger:</strong>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Marketing campaign surge (~50k req/min) generated 2.3M unique keys, overflowing the 2GB V8 container heap limit.
                      </p>
                    </div>
                  </div>

                  {/* Inline Comments Drawer */}
                  {activeCommentSection === 'sec-rca' && (
                    <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-amber-500/30 flex flex-col gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Peer Review Comments (Section 2 - Root Cause)
                      </span>
                      <div className="space-y-2">
                        {comments['sec-rca']?.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900 dark:text-white">{c.author} <span className="text-[10px] text-slate-400 font-normal">({c.role})</span></span>
                              <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add SRE root cause review note..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment('sec-rca'); }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment('sec-rca')}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Ground Truth Citations (Sources Component) */}
                <div id="sec-citations" className="scroll-mt-28 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          3. Sources & Ground Truth Diagnostics
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-bold border border-cyan-500/20">
                            Tavily Grounded
                          </span>
                        </h3>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {citations.length} Verified Sources
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Autonomous literature retrieval grounded against official engineering diagnostics and V8 memory management specs.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {citations.map((cite, idx) => {
                      const domain = (() => {
                        try { return new URL(cite.url).hostname.replace('www.', ''); } catch { return 'external-docs'; }
                      })();
                      return (
                        <a
                          key={idx}
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-4 rounded-xl glass-card border border-slate-200/90 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-150 group flex flex-col justify-between shadow-xs hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                   {idx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-medium border border-slate-200/80 dark:border-slate-700">
                                  {domain}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-1 mb-1 transition-colors">
                              {cite.title}
                            </h4>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {cite.snippet}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Verified Match</span>
                            <span>Citation [{idx + 1}]</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Nebius Sandbox Verification */}
                <div id="sec-sandbox" className="scroll-mt-28 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        4. Container Sandbox Verification & AST Guardrails
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      Exit Code 0
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Sandbox Hash</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">nbx-sbx-8841</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Test Suite</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">14/14 Passed</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Self-Correction</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">1 Loop (Exit 0)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Peak Heap Delta</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">-84.2%</span>
                    </div>
                  </div>
                </div>

                {/* Section 5: Unified Code Hotfix Diff */}
                <div id="sec-patch" className="scroll-mt-28 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        5. Verified Code Hotfix Diff
                      </h3>
                    </div>
                    {/* Inline Comment Trigger */}
                    <button
                      type="button"
                      onClick={() => setActiveCommentSection(activeCommentSection === 'sec-patch' ? null : 'sec-patch')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{comments['sec-patch']?.length || 0} Review Notes</span>
                    </button>
                  </div>

                  <DiffViewer diff={patchDiff} targetFile="src/services/tokenService.ts" />

                  {/* Inline Comments Drawer */}
                  {activeCommentSection === 'sec-patch' && (
                    <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-indigo-500/30 flex flex-col gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Peer Review Comments (Section 5 - Hotfix Diff)
                      </span>
                      <div className="space-y-2">
                        {comments['sec-patch']?.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900 dark:text-white">{c.author} <span className="text-[10px] text-slate-400 font-normal">({c.role})</span></span>
                              <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add code review comment..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment('sec-patch'); }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment('sec-patch')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 6: Audit Trail & Sign-off */}
                <div id="sec-audit" className="scroll-mt-28 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      6. Audit Trail & Compliance Verification
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-500">Autonomous Reasoning Agent:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">NVIDIA Nemotron-3-Ultra-550b</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-500">Fast Triage Model:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">NVIDIA Nemotron-3-Nano-30b-a3b</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-500">Canary Verification:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">5% Split -&gt; 100% Production</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="font-semibold text-slate-500">Operator Sign-Off:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Somak AI Automated Safe-Deploy Gate (PASS)</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 7: RELATED INCIDENTS (RECURRING-ISSUE DETECTION) */}
                <div id="sec-related" className="scroll-mt-28 p-6 sm:p-7 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 shadow-md flex flex-col gap-4 relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        7. Related Incidents & Recurring Defect Analysis
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                      Fingerprint: node-v8-oom-auth
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Somak AI Pattern Matcher detected 3 historical incidents sharing the identical failure fingerprint across auth and billing services.
                  </p>

                  {/* MTTR Acceleration Impact Callout */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-950/30 dark:to-emerald-950/20 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Autonomous Acceleration Impact
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Historical Mean MTTR: 45m 00s &rarr; Somak AI: 2m 07s
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        95.3% MTTR Reduction
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                        ~$72,400 Saved
                      </span>
                    </div>
                  </div>

                  {/* Related Incidents Table */}
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {relatedIncidents.map((past) => (
                      <div
                        key={past.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {past.id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                            {past.severity}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {past.service} • <span className="text-slate-400">{past.date}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                          <span>MTTR: <strong className="text-slate-800 dark:text-slate-200">{past.mttr}</strong></span>
                          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">({past.remediationType})</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{past.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </motion.div>

        </div>
      </main>

      {/* Floating Tactical Navigation Dock */}
      <FloatingDock incidentId={id} />
    </div>
  );
}
