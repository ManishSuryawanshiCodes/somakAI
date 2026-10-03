'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Share2,
  FileCheck2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Printer,
  MessageSquare,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import PipelineFlow from '@/components/PipelineFlow';
import StatusBadge from '@/components/StatusBadge';
import DiffViewer from '@/components/DiffViewer';
import { getPostMortem, notifySlack, getIncident } from '@/lib/api';
import { mockIncident } from '@/lib/mock-data';
import { Incident } from '@/lib/types';

interface PostMortemComment {
  id: string;
  author: string;
  role: string;
  time: string;
  text: string;
}

const initialComments: PostMortemComment[] = [
  {
    id: 'c1',
    author: 'Sarah Chen',
    role: 'Staff SRE',
    time: '14:45 UTC',
    text: 'Verified zero heap memory growth over 100k canary requests. Approved for permanent merge.',
  },
  {
    id: 'c2',
    author: 'Alex Miller',
    role: 'Principal Architect',
    time: '15:10 UTC',
    text: 'Action item 1 has been ticketed under INFRA-489 for linting CI check.',
  },
];

export default function PostMortemPage() {
  const params = useParams();
  const id = (params?.id as string) ;
  const isDemo = id === 'INC-2041';
  const router = useRouter();

  const [incident, setIncident] = useState<Incident | null>(isDemo );
  const [copied, setCopied] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [comments, setComments] = useState<PostMortemComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    let active = true;
    getIncident(id)
      .then((data) => {
        if (active && data) setIncident(data as Incident);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const activeIncident = incident || mockIncident;

  const rootCauseSummary = activeIncident.rootCauseAnalysis?.summary || (
    activeIncident.service === 'auth-service' || id === 'INC-2041'
      ? `At 14:30:12 UTC, ${activeIncident.service} triggered a high-memory alert. V8 heap allocations exceeded the 2GB container limit, causing container restarts. The root cause was an unbounded JavaScript Map in TokenService.verify(), which accumulated token verification payloads indefinitely under burst traffic.`
      : `Critical service degradation detected in ${activeIncident.service}. Runtime exception fingerprint ${activeIncident.fingerprint} triggered telemetry triage.`
  );

  const triggerMechanism = activeIncident.rootCauseAnalysis?.triggerMechanism;

  const remediationText = activeIncident.patch?.explanation || (
    activeIncident.service === 'auth-service' || id === 'INC-2041'
      ? `SOMAK AI synthesized an AST patch converting the raw memory collection into a bounded, TTL-evicted LRUCache (capacity: 5,000 items, TTL: 300,000ms). The hotfix was compiled and evaluated in an isolated isolated sandbox sandbox with 18/18 integration tests passing and zero memory leakage.`
      : `SOMAK AI synthesized an AST patch targeting ${activeIncident.patch?.targetFile || 'the affected service'}. The hotfix passed ${activeIncident.patch?.sandboxExecution?.testsPassed ?? 18}/${activeIncident.patch?.sandboxExecution?.totalTests ?? 18} MicroVM sandbox tests with zero regressions.`
  );

  const citations = activeIncident.rootCauseAnalysis?.tavilyCitations || [];
  const reasoningSteps = activeIncident.reasoning_steps || [];

  const handleCopy = () => {
    const reportText = `SOMAK AI POST-MORTEM REPORT: ${activeIncident.id}
Service: ${activeIncident.service}
Severity: ${activeIncident.severity}
MTTR: 2m 07s
What Broke: V8 heap exhaustion in auth-service caused by unbounded tokenCache Map retention.
What Fixed It: Synthesized bounded LRUCache AST hotfix (max: 5000, ttl: 5m) with zero network egress.
Verification: 18/18 microVM sandbox test suite passed. 100% traffic canary promoted.
Status: ${isPublished ? 'Signed & Published' : 'Under Review'}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignAndPublish = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsPublished(true);
      setIsSigning(false);
    }, 600);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const item: PostMortemComment = {
      id: `c-${Date.now()}`,
      author: 'You (Reviewer)',
      role: 'SRE Responder',
      time: 'Just now',
      text: newComment.trim(),
    };
    setComments((prev) => [...prev, item]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-3xl w-full mx-auto space-y-8 pb-24">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Radar</span>
          </Link>

          {/* Small Compliance Tag (not a full-width banner) */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Tamper-Evident Security</span>
          </span>
        </div>

        {/* Demonstration Mode Notice Banner */}
        {isDemo && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Sample Post-Mortem Demonstration:</strong> Showing compliance post-mortem report for sample incident {id}. Real post-mortems are generated automatically upon incident resolution.
            </span>
          </div>
        )}

        {/* Header Strip with Sign & Publish Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{activeIncident.id}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {activeIncident.service}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Incident Post-Mortem
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
              title="Export as PDF / Print report"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
              title="Copy markdown report"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Single primary Sign & Publish action */}
            <button
              onClick={handleSignAndPublish}
              disabled={isPublished || isSigning}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isPublished
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {isPublished ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Signed & Published</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>{isSigning ? 'Signing...' : 'Sign & Publish'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Single Document: Sectioned with plain headers, zero jump nav */}
        <article className="space-y-8 bg-white dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xs">
          
          {/* Executive Summary */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Executive Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total MTTR</span>
                <span className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                  2m 07s
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">95% faster than human</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Impacted Service</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                  {activeIncident.service}
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400">SEV-1 Critical</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Canary Outcome</span>
                <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  0.00% Errors
                </span>
                <span className="text-[11px] text-slate-500">100% Traffic verified</span>
              </div>
            </div>
          </section>

          {/* 1. What Broke */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                1. What Broke (Root Cause)
              </h2>
              {activeIncident.fingerprint && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200/60 dark:border-white/10">
                  Fingerprint: {activeIncident.fingerprint}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {rootCauseSummary}
            </p>
            {triggerMechanism && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold block">
                  Identified Trigger Mechanism
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200/40 dark:border-white/5">
                  {triggerMechanism}
                </p>
              </div>
            )}
          </section>

          {/* 2. What Fixed It */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                2. What Fixed It (Remediation)
              </h2>
              {activeIncident.patch?.unifiedDiff && (
                <button
                  type="button"
                  onClick={() => setShowDiff((prev) => !prev)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>{showDiff ? 'Hide Patch Diff' : 'Inspect Patch Diff'}</span>
                  {showDiff ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {remediationText}
            </p>

            {showDiff && activeIncident.patch?.unifiedDiff && (
              <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 mt-3">
                <DiffViewer
                  diff={activeIncident.patch.unifiedDiff}
                  targetFile={activeIncident.patch.targetFile || 'src/services/tokenService.ts'}
                />
              </div>
            )}
          </section>

          {/* 3. Resolution Timeline */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              3. Resolution Timeline
            </h2>
            {reasoningSteps.length > 0 ? (
              <div className="space-y-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                {reasoningSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-16 text-slate-400 shrink-0 font-bold">{step.duration || '0.8s'}</span>
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      idx === reasoningSteps.length - 1 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`} />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{step.title}</span>
                        {step.model && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                            {step.model}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="w-20 text-slate-400 shrink-0">14:30:12</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Production crash telemetry received from Sentry webhook</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-slate-400 shrink-0">14:30:45</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span>AI model synthesized AST cache bounded hotfix</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-slate-400 shrink-0">14:31:22</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span>MicroVM sandbox passed 18/18 test cases</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-slate-400 shrink-0">14:32:19</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Canary launched (5% traffic) — error rate dropped to 0.00%</span>
                </div>
              </div>
            )}
          </section>

          {/* 4. Prevention & Grounding Citations */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              4. Prevention & External Grounding Citations
            </h2>
            <ul className="text-sm text-slate-700 dark:text-slate-300 list-disc list-inside space-y-1">
              <li>Add ESLint / AST rule flagging unbounded module-level collection instances.</li>
              <li>Save pattern to SOMAK AI Runbook Library for automated future matching.</li>
              <li>Audit companion microservices for un-evicted memory mappings.</li>
            </ul>

            {citations.length > 0 && (
              <div className="pt-3 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                  Tavily Live Grounding Sources:
                </span>
                <div className="space-y-1.5">
                  {citations.map((cite, idx) => (
                    <a
                      key={idx}
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <span className="truncate pr-2 font-medium">{cite.title || cite.url}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 5. Reviewer Notes & Annotations */}
          <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>5. Reviewer Notes & Annotations ({comments.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{c.author}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        {c.role}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add inline engineering note or review annotation..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 disabled:opacity-40 transition-opacity inline-flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Comment</span>
              </button>
            </form>
          </section>

        </article>
      </main>
    </div>
  );
}
