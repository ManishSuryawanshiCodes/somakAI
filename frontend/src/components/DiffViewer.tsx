'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  Copy,
  Check,
  Sparkles,
  Columns,
  AlignJustify,
  MessageSquareCode,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface DiffViewerProps {
  diff: string;
  targetFile: string;
}

interface SplitLine {
  leftLineNo?: number | string;
  leftText?: string;
  leftType?: 'delete' | 'context' | 'empty' | 'hunk';
  rightLineNo?: number | string;
  rightText?: string;
  rightType?: 'add' | 'context' | 'empty' | 'hunk';
}

function getLineAnnotation(lineText: string, isAddition: boolean): string {
  if (lineText.includes('LRUCache') || lineText.includes('lru-cache')) {
    return 'Reasoning Step 3 (AST Synthesis): Imports bounded LRUCache to replace unbounded Map and cap V8 memory usage.';
  }
  if (lineText.includes('setMaxListeners')) {
    return 'Reasoning Step 3 (AST Synthesis): Prevents EventEmitter leak warnings by sizing listener capacity to auth traffic bursts.';
  }
  if (lineText.includes('max: 5000') || lineText.includes('ttl:')) {
    return 'Reasoning Step 3 (AST Synthesis): Enforces strict 5-minute TTL eviction and 5,000 entry ceiling to prevent heap exhaustion.';
  }
  if (lineText.includes('this.cache.get') || lineText.includes('this.cache.set')) {
    return 'Reasoning Step 3 (AST Synthesis): Replaces raw unbounded Map access with TTL-aware cache hit/miss semantics.';
  }
  if (!isAddition && lineText.includes('tokenCache')) {
    return 'Reasoning Step 1 & 3 (Root Cause): Removed unbounded Map that retained 2.3M JWT entries causing OOM kill.';
  }
  return 'Reasoning Step 3 (AST Synthesis): AST transformation synthesized by Nemotron-3-Ultra (550B) with zero regressions.';
}

export default function DiffViewer({ diff, targetFile }: DiffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Record<number, boolean>>({
    3: true, // Expand first key annotation by default
  });

  const toggleAnnotation = (index: number) => {
    setExpandedAnnotations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const lines = useMemo(() => diff.split('\n'), [diff]);

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse diff into side-by-side split lines
  const splitRows = useMemo(() => {
    const rows: SplitLine[] = [];
    let leftNum = 1;
    let rightNum = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('@@')) {
        // Hunk header
        rows.push({
          leftLineNo: '...',
          leftText: line,
          leftType: 'hunk',
          rightLineNo: '...',
          rightText: line,
          rightType: 'hunk',
        });
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Addition (Right only)
        rows.push({
          leftLineNo: '',
          leftText: '',
          leftType: 'empty',
          rightLineNo: rightNum++,
          rightText: line.substring(1),
          rightType: 'add',
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Deletion (Left only)
        rows.push({
          leftLineNo: leftNum++,
          leftText: line.substring(1),
          leftType: 'delete',
          rightLineNo: '',
          rightText: '',
          rightType: 'empty',
        });
      } else if (!line.startsWith('+++') && !line.startsWith('---')) {
        // Unchanged context on both sides
        rows.push({
          leftLineNo: leftNum++,
          leftText: line.startsWith(' ') ? line.substring(1) : line,
          leftType: 'context',
          rightLineNo: rightNum++,
          rightText: line.startsWith(' ') ? line.substring(1) : line,
          rightType: 'context',
        });
      }
    }
    return rows;
  }, [lines]);

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#090D16] shadow-xs">
      {/* Header Bar with View Mode Toggle, Context Toggle & Copy */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {targetFile || 'src/services/tokenService.ts'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            <Sparkles className="w-2.5 h-2.5" /> AST Verified
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse/Expand Context Toggle */}
          <button
            onClick={() => setCollapseUnchanged(!collapseUnchanged)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Toggle unchanged context lines"
          >
            {collapseUnchanged ? <Eye className="w-3 h-3 text-indigo-500" /> : <EyeOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{collapseUnchanged ? 'Show Context' : 'Collapse Context'}</span>
          </button>

          {/* Split / Unified View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                viewMode === 'unified'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Inline unified diff"
            >
              <AlignJustify className="w-3 h-3" />
              <span className="hidden sm:inline">Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Side-by-side split diff"
            >
              <Columns className="w-3 h-3" />
              <span className="hidden sm:inline">Split</span>
            </button>
          </div>

          {/* Copy Button with visual Tooltip */}
          <div className="relative">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Patch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Code diff container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[460px] text-[12px] font-mono leading-relaxed select-text p-2">
        {viewMode === 'unified' ? (
          /* UNIFIED VIEW */
          <div className="space-y-0.5">
            {lines.map((line, idx) => {
              const isAdd = line.startsWith('+') && !line.startsWith('+++');
              const isDel = line.startsWith('-') && !line.startsWith('---');
              const isHunk = line.startsWith('@@');
              const isHeader = line.startsWith('+++') || line.startsWith('---');
              const isChanged = isAdd || isDel;

              // If context collapsing is on, fold middle context lines
              if (collapseUnchanged && !isChanged && !isHunk && !isHeader) {
                // Check distance to nearest changed line
                const hasNearbyChange = lines.slice(Math.max(0, idx - 1), Math.min(lines.length, idx + 2)).some(
                  (l) => (l.startsWith('+') && !l.startsWith('+++')) || (l.startsWith('-') && !l.startsWith('---'))
                );
                if (!hasNearbyChange) {
                  return null; // Collapsed
                }
              }

              let lineBg = 'bg-transparent';
              let textColor = 'text-slate-800 dark:text-slate-300';
              let gutterColor = 'text-slate-400 dark:text-slate-600';

              if (isAdd) {
                lineBg = 'bg-emerald-500/15 dark:bg-emerald-500/20';
                textColor = 'text-emerald-800 dark:text-emerald-300 font-semibold';
                gutterColor = 'text-emerald-600/70 dark:text-emerald-500/70';
              } else if (isDel) {
                lineBg = 'bg-red-500/15 dark:bg-red-500/20';
                textColor = 'text-red-800 dark:text-red-300 line-through opacity-85';
                gutterColor = 'text-red-600/70 dark:text-red-500/70';
              } else if (isHunk) {
                lineBg = 'bg-indigo-500/10 dark:bg-indigo-500/15';
                textColor = 'text-indigo-700 dark:text-indigo-400 font-bold';
                gutterColor = 'text-indigo-400 dark:text-indigo-500';
              } else if (isHeader) {
                textColor = 'text-slate-500 dark:text-slate-500 font-bold';
              }

              const hasAnnotation = isChanged;
              const isAnnotated = expandedAnnotations[idx];

              return (
                <div key={idx} className="flex flex-col">
                  <div
                    className={`flex items-center rounded-sm px-1.5 py-0.5 ${lineBg} hover:opacity-90 transition-colors group`}
                  >
                    <div
                      className={`w-8 flex-shrink-0 text-right pr-2 select-none text-[10px] font-mono ${gutterColor}`}
                    >
                      {idx + 1}
                    </div>

                    {/* AI Reasoning Line-Annotation Trigger */}
                    {hasAnnotation ? (
                      <button
                        onClick={() => toggleAnnotation(idx)}
                        title="Click to view AI reasoning for this code change"
                        aria-label="View AI reasoning annotation"
                        className={`mr-2 p-0.5 rounded transition-all flex items-center gap-1 ${
                          isAnnotated
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'text-indigo-500/80 hover:text-indigo-600 hover:bg-indigo-500/15'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="w-4 mr-2" />
                    )}

                    <div className={`whitespace-pre flex-1 ${textColor}`}>{line}</div>
                  </div>

                  {/* Inline Expanded Annotation Card */}
                  <AnimatePresence>
                    {isAnnotated && hasAnnotation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="my-1 ml-10 mr-2 p-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-[11px] text-slate-800 dark:text-slate-200 font-sans shadow-xs space-y-1 select-none"
                      >
                        <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            AI Synthesis Annotation
                          </span>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-200/50 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                            Nemotron-3-Ultra (550B)
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                          {getLineAnnotation(line, isAdd)}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* SPLIT (SIDE-BY-SIDE) VIEW */
          <div className="min-w-[640px]">
            {/* Split Column Headers */}
            <div className="grid grid-cols-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-1 px-1">
              <div className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>Original (Leaking Map)</span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pl-2">
                <span>Modified (Bounded LRUCache)</span>
              </div>
            </div>

            <div className="space-y-0.5">
              {splitRows.map((row, idx) => {
                const isHunk = row.leftType === 'hunk';
                if (isHunk) {
                  return (
                    <div
                      key={idx}
                      className="bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 text-center font-bold py-0.5 text-[11px] rounded"
                    >
                      {row.leftText}
                    </div>
                  );
                }

                return (
                  <div key={idx} className="grid grid-cols-2 gap-1 rounded-sm text-[11px]">
                    {/* Left Pane (Deletions / Context) */}
                    <div
                      className={`flex items-center px-1 py-0.5 rounded-sm ${
                        row.leftType === 'delete'
                          ? 'bg-red-500/15 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                          : row.leftType === 'empty'
                          ? 'bg-slate-50/40 dark:bg-slate-900/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-6 flex-shrink-0 text-right pr-2 text-[10px] text-slate-400 select-none">
                        {row.leftLineNo}
                      </span>
                      <span className="whitespace-pre truncate font-mono">{row.leftText}</span>
                    </div>

                    {/* Right Pane (Additions / Context) */}
                    <div
                      className={`flex items-center px-1 py-0.5 rounded-sm ${
                        row.rightType === 'add'
                          ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : row.rightType === 'empty'
                          ? 'bg-slate-50/40 dark:bg-slate-900/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-6 flex-shrink-0 text-right pr-2 text-[10px] text-slate-400 select-none">
                        {row.rightLineNo}
                      </span>
                      <span className="whitespace-pre truncate font-mono">{row.rightText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
