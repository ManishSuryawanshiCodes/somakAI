"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Dismiss as soon as client mounts and DOM is interactive
    const timer = setTimeout(() => {
      setVisible(false);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: 'easeOut' } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0A0A0A] transition-colors duration-150 select-none pointer-events-none"
        >
          {/* Subtle Ambient Radial Pulse */}
          <div className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent dark:from-indigo-600/20 dark:via-purple-600/10 dark:to-transparent blur-[90px] animate-pulse" />

          {/* Centered Brand Mark with Breathing Animation */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: [0.96, 1.04, 0.96], opacity: 1 }}
            transition={{
              scale: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
              opacity: { duration: 0.25 },
            }}
            className="relative z-10 flex flex-col items-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] border border-black/10 dark:border-white/10 p-2.5 flex items-center justify-center text-white shadow-2xl overflow-hidden">
              <img src="/somak-ai-icon-transparent.png" alt="SOMAK AI" className="w-full h-full object-contain aspect-square" />
            </div>

            <div className="text-center space-y-1">
              <div className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                SOMAK AI
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Autonomous Cloud SRE
              </div>
            </div>

            {/* Sleek Minimal Progress Bar */}
            <div className="w-36 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
