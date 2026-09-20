'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface TerminalOutputProps {
  lines: string[];
  title?: string;
  isRunning?: boolean;
}

export default function TerminalOutput({ lines, title = 'Terminal', isRunning = false }: TerminalOutputProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedLines([]);
    setUserScrolledUp(false);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < lines.length) {
        setDisplayedLines(prev => [...prev, lines[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lines]);

  useEffect(() => {
    if (containerRef.current && !userScrolledUp) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedLines, userScrolledUp]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollTop + clientHeight < scrollHeight - 35;
    setUserScrolledUp(isUp);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setUserScrolledUp(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-slate-800 bg-[#0D1117] shadow-xl flex flex-col relative"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#161B22] border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
          </div>
          <div className="text-xs font-mono font-medium text-slate-400">{title}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Exit 0 (Live Stream)
          </span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="p-4 pb-16 overflow-y-auto max-h-[320px] font-mono text-[12px] leading-relaxed text-slate-300 relative"
      >
        {displayedLines.map((line, idx) => {
          let colorClass = 'text-slate-200';
          if (line.includes('✓') || line.includes('PASS') || line.includes('passed')) {
            colorClass = 'text-[#10B981] font-bold';
          } else if (line.includes('✗') || line.includes('FAIL') || line.includes('error')) {
            colorClass = 'text-[#EF4444] font-bold';
          } else if (line.startsWith('$')) {
            colorClass = 'text-[#06B6D4]';
          }

          return (
            <div key={idx} className={`whitespace-pre-wrap ${colorClass}`}>
              {line}
            </div>
          );
        })}
        
        {isRunning && (
          <div className="animate-pulse w-2 h-4 bg-white mt-1 inline-block"></div>
        )}
      </div>

      {/* Floating Jump to Latest Button */}
      <AnimatePresence>
        {userScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-3 right-4 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1 hover:bg-indigo-500 transition-all z-20 active:scale-95"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Jump to latest</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
