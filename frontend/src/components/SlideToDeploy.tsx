'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronsRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SlideToDeployProps {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
}

export default function SlideToDeploy({
  onConfirm,
  disabled = false,
  label = 'Slide to Trigger Canary Deploy',
  confirmLabel = 'Deploying Hotfix...',
}: SlideToDeployProps) {
  const [confirmed, setConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Background fill progress based on slider position
  const backgroundOpacity = useTransform(x, [0, 200], [0.1, 0.4]);

  const handleDragEnd = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const knobWidth = 56;
    const maxDrag = containerWidth - knobWidth - 8;

    if (x.get() >= maxDrag * 0.8) {
      // Confirmed!
      x.set(maxDrag);
      setConfirmed(true);
      if (navigator.vibrate) {
        try { navigator.vibrate(50); } catch {}
      }
      onConfirm();
    } else {
      // Snap back
      x.set(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-14 w-full rounded-2xl p-1 overflow-hidden transition-all select-none ${
        confirmed
          ? 'bg-emerald-600 border border-emerald-500 shadow-lg shadow-emerald-600/30'
          : 'bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Dynamic Background fill */}
      {!confirmed && (
        <motion.div
          className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/25 pointer-events-none"
          style={{ opacity: backgroundOpacity }}
        />
      )}

      {/* Center Prompt Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {confirmed ? (
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
            {confirmLabel}
          </span>
        ) : (
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-8">
            {label}
          </span>
        )}
      </div>

      {/* Draggable Knob */}
      {!confirmed && (
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
          style={{ x }}
          whileTap={{ scale: 1.05 }}
          className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing active:shadow-emerald-500/40"
        >
          <ChevronsRight className="w-6 h-6 animate-pulse" />
        </motion.div>
      )}
    </div>
  );
}
