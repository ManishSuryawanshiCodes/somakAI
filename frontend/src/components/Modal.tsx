"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-xl', 'max-w-2xl', 'max-w-3xl'
  className?: string;
  zIndex?: string; // default 'z-[999]'
  showCloseOnBackdrop?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-xl',
  className = '',
  zIndex = 'z-[999]',
  showCloseOnBackdrop = true,
}: ModalProps) {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndex} overflow-y-auto`} role="dialog" aria-modal="true">
          {/* Solid opacity backdrop (isolated from transform layers to eliminate GPU blur tearing) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={showCloseOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-black/80 bg-opacity-80 transition-opacity"
            aria-hidden="true"
          />

          {/* Centering Positioner (pointer-events-none so backdrop clicks register correctly) */}
          <div className="fixed inset-0 flex min-h-full items-center justify-center p-3 sm:p-6 pointer-events-none">
            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full ${maxWidth} pointer-events-auto bg-white dark:bg-[#0A0A0A] border border-slate-200/90 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative text-slate-900 dark:text-slate-100 ${className}`}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
