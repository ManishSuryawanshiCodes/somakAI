'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ShieldAlert,
  CheckCircle,
  Database,
  Server,
  Globe,
  Cpu,
  Layers,
  HardDrive,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface DependencyStat {
  label: string;
  metric: string;
  impact: 'critical' | 'warning' | 'nominal';
}

interface NodeDetail {
  id: string;
  name: string;
  serviceKey: string;
  type: string;
  status: 'critical' | 'nominal' | 'warning';
  role: string;
  rps: string;
  latency: string;
  connectedLinks: string[];
  dependencies: DependencyStat[];
  impact: string;
}

const NODES: Record<string, NodeDetail> = {
  gateway: {
    id: 'gateway',
    name: 'API Gateway',
    serviceKey: 'ingress-nginx',
    type: 'Envoy Ingress',
    status: 'warning',
    role: 'Envoy Ingress & Edge TLS Termination',
    rps: '112,400 req/min',
    latency: '68ms P99',
    connectedLinks: ['gateway-auth'],
    dependencies: [
      { label: 'Ingress Queue Backpressure', metric: '+42ms delay', impact: 'warning' },
      { label: 'Downstream 502 Rate', metric: '4.8% errors', impact: 'warning' },
    ],
    impact: 'Upstream edge proxy holding client connections while Auth Pod resolves token verification timeouts.',
  },
  auth: {
    id: 'auth',
    name: 'Auth Pod',
    serviceKey: 'auth-service',
    type: 'Node.js v20 V8 Heap',
    status: 'critical',
    role: 'Token Verification & Session Validation',
    rps: '48,200 req/min',
    latency: '342ms (Spike)',
    connectedLinks: ['gateway-auth', 'auth-redis', 'redis-db'],
    dependencies: [
      { label: 'Queue Backpressure', metric: '+42ms', impact: 'critical' },
      { label: 'Token Retries', metric: '2.3k/min', impact: 'critical' },
      { label: 'Redis Session Lock', metric: '14.2% lock wait', impact: 'warning' },
      { label: 'DB Connection Hold', metric: '18 open pools', impact: 'warning' },
    ],
    impact: 'Critical V8 heap exhaustion (1.85GB / 2.0GB) triggered by unbounded Map caching in TokenService.verify().',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    serviceKey: 'redis-cluster',
    type: 'In-Memory Cache Cluster',
    status: 'nominal',
    role: 'Distributed Token Cache & Session Storage',
    rps: '34,000 ops/sec',
    latency: '1.2ms P99',
    connectedLinks: ['auth-redis', 'redis-db'],
    dependencies: [
      { label: 'TTL Starvation', metric: 'Pending eviction key', impact: 'warning' },
      { label: 'Cache Hit Ratio', metric: '94.8% nominal', impact: 'nominal' },
    ],
    impact: 'Nominal cluster throughput; awaiting AST patch deployment to accept bounded LRU key TTL invalidation.',
  },
  db: {
    id: 'db',
    name: 'DB',
    serviceKey: 'postgres-primary',
    type: 'PostgreSQL Primary',
    status: 'nominal',
    role: 'Persistent Account & RBAC Datastore',
    rps: '6,200 tx/sec',
    latency: '4.8ms P99',
    connectedLinks: ['redis-db'],
    dependencies: [
      { label: 'Connection Pool Saturation', metric: '64% capacity', impact: 'nominal' },
      { label: 'Write Replica Replication Lag', metric: '8ms nominal', impact: 'nominal' },
    ],
    impact: 'Database operating within normal query latency thresholds with read replicas absorbing fallback lookups.',
  },
};

const SERVICE_TO_NODE: Record<string, string> = {
  'auth-service': 'auth',
  'ingress-nginx': 'gateway',
  'redis-cluster': 'redis',
  'postgres-primary': 'db',
};

const NODE_TO_SERVICE: Record<string, string> = {
  auth: 'auth-service',
  gateway: 'ingress-nginx',
  redis: 'redis-cluster',
  db: 'postgres-primary',
};

interface ServiceTopologyProps {
  selectedService?: string | null;
  onSelectService?: (serviceName: string) => void;
  hoveredService?: string | null;
}

export default function ServiceTopology({
  selectedService,
  onSelectService,
  hoveredService,
}: ServiceTopologyProps) {
  const [selectedNode, setSelectedNode] = useState<string>('auth');

  useEffect(() => {
    if (selectedService && SERVICE_TO_NODE[selectedService]) {
      setSelectedNode(SERVICE_TO_NODE[selectedService]);
    }
  }, [selectedService]);

  const activeNode = NODES[selectedNode] || NODES.auth;
  const hoveredNode = hoveredService ? SERVICE_TO_NODE[hoveredService] : null;

  const isLinkActive = (linkKey: string) => activeNode.connectedLinks.includes(linkKey);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    const serviceName = NODE_TO_SERVICE[nodeId] || nodeId;
    if (onSelectService) {
      onSelectService(serviceName);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Topology Header & Status Legend */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-600 dark:text-slate-300">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dependency Graph</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Nominal</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Degraded</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Failing</span>
          </span>
        </div>
      </div>

      {/* Interactive Visual Service Graph */}
      <div className="w-full h-48 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-2 flex items-center justify-center relative overflow-hidden select-none">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 380 180">
          <defs>
            <linearGradient id="link-gw-auth" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="link-auth-red" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="link-red-db" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.85} />
            </linearGradient>
          </defs>

          {/* Link 1: Gateway -> Auth Pod */}
          <motion.path
            d="M 68 85 L 142 85"
            stroke={isLinkActive('gateway-auth') ? 'url(#link-gw-auth)' : '#CBD5E1'}
            strokeWidth={isLinkActive('gateway-auth') ? 2.5 : 1.5}
            strokeDasharray="4 4"
            initial={{ strokeDashoffset: 40 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          />

          {/* Link 2: Auth Pod -> Redis */}
          <motion.path
            d="M 194 85 L 238 85"
            stroke={isLinkActive('auth-redis') ? 'url(#link-auth-red)' : '#CBD5E1'}
            strokeWidth={isLinkActive('auth-redis') ? 2.5 : 1.5}
            strokeDasharray="4 4"
            initial={{ strokeDashoffset: 40 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />

          {/* Link 3: Redis -> DB */}
          <motion.path
            d="M 288 85 L 324 85"
            stroke={isLinkActive('redis-db') ? 'url(#link-red-db)' : '#CBD5E1'}
            strokeWidth={isLinkActive('redis-db') ? 2.5 : 1.5}
            strokeDasharray="4 4"
            initial={{ strokeDashoffset: 40 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ repeat: Infinity, duration: 2.0, ease: 'linear' }}
          />
        </svg>

        <div className="grid grid-cols-4 w-full px-2 relative z-10">
          {/* Node 1: API Gateway */}
          <div
            onClick={() => handleNodeClick('gateway')}
            className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
              selectedNode === 'gateway' || hoveredNode === 'gateway' ? 'scale-105' : 'hover:scale-102 opacity-90'
            }`}
          >
            <div className="relative">
              <div
                className={`w-10 h-10 bg-white dark:bg-slate-800 border-2 rounded-xl shadow-xs flex items-center justify-center transition-all ${
                  selectedNode === 'gateway'
                    ? 'border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                    : hoveredNode === 'gateway'
                    ? 'border-amber-500 ring-2 ring-amber-400/60 shadow-md'
                    : 'border-amber-400 dark:border-amber-500/70'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-800" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-200">API Gateway</span>
            <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-semibold">68ms</span>
          </div>

          {/* Node 2: Auth Pod (Failing Node with subtle pulsing alert glow) */}
          <div
            onClick={() => handleNodeClick('auth')}
            className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
              selectedNode === 'auth' || hoveredNode === 'auth' ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className="relative">
              {/* Subtle expanding pulse alert glow ring */}
              <motion.div
                className="absolute -inset-2 rounded-xl border border-rose-500/60 pointer-events-none"
                animate={{ scale: [1, 1.35, 1.6], opacity: [0.8, 0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              />
              <div className="absolute -inset-1 bg-rose-500/20 rounded-xl animate-pulse pointer-events-none" />
              <div
                className={`w-11 h-11 bg-white dark:bg-slate-800 border-2 border-rose-500 rounded-xl shadow-md shadow-rose-500/30 flex items-center justify-center relative z-10 ${
                  hoveredNode === 'auth' ? 'ring-2 ring-rose-400' : ''
                }`}
              >
                <Server className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800 animate-pulse glow-critical z-20" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              Auth Pod
            </span>
            <span className="text-[9px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1 rounded">
              342ms OOM
            </span>
          </div>

          {/* Node 3: Redis */}
          <div
            onClick={() => handleNodeClick('redis')}
            className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
              selectedNode === 'redis' || hoveredNode === 'redis' ? 'scale-105' : 'hover:scale-102 opacity-90'
            }`}
          >
            <div className="relative">
              <div
                className={`w-10 h-10 bg-white dark:bg-slate-800 border-2 rounded-xl shadow-xs flex items-center justify-center transition-all ${
                  selectedNode === 'redis'
                    ? 'border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                    : hoveredNode === 'redis'
                    ? 'border-emerald-500 ring-2 ring-emerald-400/60 shadow-md'
                    : 'border-emerald-400 dark:border-emerald-500/60'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-800" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-200">Redis</span>
            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">1.2ms</span>
          </div>

          {/* Node 4: DB */}
          <div
            onClick={() => handleNodeClick('db')}
            className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
              selectedNode === 'db' || hoveredNode === 'db' ? 'scale-105' : 'hover:scale-102 opacity-90'
            }`}
          >
            <div className="relative">
              <div
                className={`w-10 h-10 bg-white dark:bg-slate-800 border-2 rounded-xl shadow-xs flex items-center justify-center transition-all ${
                  selectedNode === 'db'
                    ? 'border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                    : hoveredNode === 'db'
                    ? 'border-cyan-500 ring-2 ring-cyan-400/60 shadow-md'
                    : 'border-cyan-400 dark:border-cyan-500/60'
                }`}
              >
                <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white dark:border-slate-800" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-200">DB</span>
            <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">4.8ms</span>
          </div>
        </div>
      </div>

      {/* Dynamic Blast Radius Card directly beneath the service graph */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeNode.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-2.5 text-xs"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  activeNode.status === 'critical'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : activeNode.status === 'warning'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}
              >
                {activeNode.status === 'critical' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : activeNode.status === 'warning' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                  {activeNode.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeNode.type}
                </span>
              </div>
            </div>

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                activeNode.status === 'critical'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400'
                  : activeNode.status === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400'
              }`}
            >
              {activeNode.status === 'critical' ? 'SEV-1 Root' : activeNode.status}
            </span>
          </div>

          {/* Real-Time Affected Dependencies Grid */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Real-Time Blast Radius & Dependencies
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {activeNode.dependencies.map((dep, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-[11px] flex flex-col justify-between ${
                    dep.impact === 'critical'
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                      : dep.impact === 'warning'
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{dep.label}</span>
                  <span className="font-mono font-bold mt-0.5">{dep.metric}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Summary */}
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {activeNode.impact}
          </p>

          {/* Footer Metadata & SLO Link */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              Throughput: {activeNode.rps}
            </span>
            <Link
              href={`/slo?service=${activeNode.serviceKey}`}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <span>Inspect SLO &rarr;</span>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
