"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Building,
  User,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Shield,
  Clock,
  Globe2,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('Enterprise Deployment & Custom BYOK');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please provide your name, work email, and a message.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server returned error (${res.status})`);
      }

      const data = await res.json();
      setSuccess(true);
      setSubmissionId(data.id || '');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-900/15 via-purple-900/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-1 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/somak-ai-icon-simplified-transparent.png" alt="SOMAK AI" className="w-6 h-6 object-contain aspect-square" />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">SOMAK AI</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Context & SLAs */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-400 mb-4">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Global Enterprise Support</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Speak with a Principal Reliability Engineer
            </h1>
            <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
              Explore how Somak AI executes autonomous triage, deterministic AST validation, and progressive canary rollbacks on your high-throughput clusters.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Response SLA</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Sub-15 minute response time for P1 enterprise pilot onboarding and dedicated private VPC deployments.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Zero Host Leak Sandbox</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Strict ephemeral container sandboxes with dual-layer AES-256-GCM BYOK envelope encryption.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            For urgent security inquiries or vulnerability reports, email directly at{' '}
            <a href="mailto:security@somak.ai" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
              security@somak.ai
            </a>.
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl relative"
          >
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white">Inquiry Received</h2>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Thank you for contacting Somak AI. Reference tracking ID:{' '}
                  <span className="font-mono text-indigo-400 font-semibold">{submissionId}</span>. A reliability architect will reach out within 2 hours.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setMessage('');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Elena Rostova"
                        className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Work Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena@enterprise.io"
                        className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Company / Organization
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Global Inc"
                        className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="Enterprise Deployment & Custom BYOK">Enterprise Deployment & BYOK</option>
                      <option value="Proof of Concept / Staging Pilot">Proof of Concept / Staging Pilot</option>
                      <option value="Security Architecture & Audit Review">Security Architecture & Audit</option>
                      <option value="Custom Model & LLM Integration">Custom Model & LLM Integration</option>
                      <option value="Billing & Custom Plan Quote">Billing & Custom Plan Quote</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Message / Deployment Details <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your infrastructure (Kubernetes, AWS, Datadog/Sentry) and your monthly incident volume..."
                      className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting to Reliability Core...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 px-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} SOMAK AI Inc. All rights reserved. Zero-leak telemetry processing and autonomous incident remediation.
      </footer>
    </div>
  );
}
