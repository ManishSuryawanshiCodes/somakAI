"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Lock,
  FileText,
  Key,
  Users,
  Server,
  Terminal,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function SocAuditPage() {
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
          <span className="text-base font-black tracking-tight text-white leading-none">SOMAK AI</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Security & Compliance
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base">
            SOMAK AI is built from the ground up for enterprise reliability. Our autonomous engine operates within a strict trust boundary, validated by independent auditors and secured by modern cryptographic standards.
          </p>
        </div>

        {/* Compliance Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">SOC-2 Type II</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Certified by independent auditors for Security, Availability, and Confidentiality trust services criteria over a continuous observation window.
              </p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">ISO 27001</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Information Security Management System (ISMS) certified. Rigorous risk management and continuous security improvement processes.
              </p>
            </div>
          </div>
        </div>

        {/* Deep Dive Security Pillars */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">
            Security Architecture Pillars
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Lock className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm">Data Encryption</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                All data is encrypted in transit using TLS 1.3. Credentials and API keys are envelope-encrypted at rest using AES-128-CBC + HMAC-SHA256 Fernet.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm">Sandbox Isolation</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                AST remediation patches are synthesized and tested in ephemeral, strictly network-isolated Firecracker microVMs. Execution timeout caps enforce resource limits.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Users className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm">Enterprise RBAC & MFA</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Strict multi-tenant segregation. Granular roles (Admin, Operator, Viewer) govern access. Enforced TOTP multi-factor authentication for sensitive workspace actions.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Key className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm">Immutable Audit Logging</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tamper-evident, append-only cryptographic ledger hashes (SHA-256 chained) all actions, role changes, and system modifications for compliance verification.
              </p>
            </div>
          </div>
        </div>

        {/* CTA / Contact Sales */}
        <div className="mt-12 p-8 rounded-3xl border border-indigo-500/30 bg-indigo-900/20 text-center space-y-4">
          <h3 className="text-lg font-bold text-white">Request Compliance Documentation</h3>
          <p className="text-sm text-indigo-200/70 max-w-lg mx-auto">
            Customers on our Enterprise plan can request our full SOC-2 Type II report, penetration testing results, and completed CAIQ questionnaires.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
            >
              <span>Contact Sales Team</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 px-6 text-center text-xs text-neutral-500 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
        <p>© {new Date().getFullYear()} SOMAK AI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
