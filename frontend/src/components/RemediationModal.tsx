'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import DiffViewer from './DiffViewer';
import TerminalOutput from './TerminalOutput';
import { mockTerminalLines } from '@/lib/mock-data';
import type { Incident } from '@/lib/types';

interface RemediationModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (id: string) => void;
}

export default function RemediationModal({ incident, isOpen, onClose, onDeploy }: RemediationModalProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'test' | 'sources'>('logs');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isOpen && incident) {
        onDeploy(incident.id);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, incident, onDeploy, onClose]);

  if (!isOpen || !incident) return null;

  const rca = incident.rootCauseAnalysis;
  const patch = incident.patch;
  const sandbox = patch?.sandboxExecution;
  const citations = rca?.tavilyCitations || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{incident.id}</span>
                  {incident.severity}: Memory Leak in {incident.service}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{rca?.summary?.slice(0, 100)}...</p>
              </div>
              <StatusBadge status={incident.status} />
              <div className="hidden md:flex ml-4 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full border border-indigo-100 dark:border-indigo-800">
                Generated via Nemotron 3 Ultra | Grounded via Tavily
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Pane */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Time saved: ~42 minutes</span>
                </div>

                {rca && (
                  <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-xl">🔍</span> Root Cause Analysis
                    </h3>
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <strong className="block text-gray-900 dark:text-gray-100 mb-1">Summary:</strong>
                        <p>{rca.summary}</p>
                      </div>
                      <div>
                        <strong className="block text-gray-900 dark:text-gray-100 mb-1">Trigger Mechanism:</strong>
                        <p>{rca.triggerMechanism}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
                  <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <button 
                      onClick={() => setActiveTab('logs')}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Sandbox Logs
                    </button>
                    <button 
                      onClick={() => setActiveTab('test')}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'test' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Reproduction Test
                    </button>
                    <button 
                      onClick={() => setActiveTab('sources')}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sources' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Tavily Sources
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0D1117]">
                    {activeTab === 'logs' && (
                      <TerminalOutput lines={mockTerminalLines} title="Nebius Sandbox" />
                    )}
                    {activeTab === 'test' && (
                      <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                        <code>{patch?.reproductionTest || 'No reproduction test available'}</code>
                      </pre>
                    )}
                    {activeTab === 'sources' && (
                      <div className="p-4 space-y-4">
                        {citations.length > 0 ? citations.map((cite, idx) => (
                          <a key={idx} href={cite.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 transition-colors group">
                            <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-1">
                              {cite.title} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{cite.url}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{cite.snippet}</p>
                          </a>
                        )) : (
                          <p className="text-sm text-gray-500 text-center py-8">No Tavily sources available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane */}
              <div className="flex flex-col gap-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Proposed Patch</h3>
                  {patch && (
                    <DiffViewer diff={patch.unifiedDiff} targetFile={patch.targetFile} />
                  )}
                </div>

                {sandbox && (
                  <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" /> Test Verification
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                          Exit Code: <span className={sandbox.exitCode === 0 ? 'text-emerald-500' : 'text-red-500'}>{sandbox.exitCode}</span>
                        </span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {sandbox.testsPassed}/{sandbox.totalTests} Passed
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(sandbox.testsPassed / sandbox.totalTests) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onDeploy(incident.id)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  Merge & Deploy Hotfix <span className="text-emerald-200 font-normal text-sm ml-2">(⌘↵)</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
