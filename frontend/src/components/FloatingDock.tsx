'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Radar, Terminal, Gauge, FileText } from 'lucide-react';

export default function FloatingDock({ incidentId = 'INC-2041' }: { incidentId?: string }) {
  const [mounted, setMounted] = useState(false);
  let pathname = '';

  try {
    const rawPath = usePathname();
    pathname = rawPath || '';
  } catch {
    pathname = '';
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      id: 'radar',
      label: 'Radar',
      screen: 'Screen 1',
      href: '/',
      icon: Radar,
      active: mounted && (pathname === '/' || pathname === ''),
    },
    {
      id: 'studio',
      label: 'Studio',
      screen: 'Screen 2',
      href: `/remediation/${incidentId}`,
      icon: Terminal,
      active: mounted && pathname.startsWith('/remediation'),
      badge: 'SEV-1',
    },
    {
      id: 'canary',
      label: 'Canary',
      screen: 'Screen 3',
      href: `/canary/${incidentId}`,
      icon: Gauge,
      active: mounted && pathname.startsWith('/canary'),
    },
    {
      id: 'postmortem',
      label: 'Post-Mortem',
      screen: 'Screen 4',
      href: `/postmortem/${incidentId}`,
      icon: FileText,
      active: mounted && pathname.startsWith('/postmortem'),
    },
  ];

  return (
    <>
    {/* Floating Tactical Navigation Dock */}
      <div className="fixed bottom-5 sm:bottom-6 mb-[env(safe-area-inset-bottom,0px)] inset-x-0 z-50 md:hidden flex justify-center px-3 sm:px-4 pointer-events-none">
      <motion.nav
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 25 }}
        aria-label="Screen Navigation Dock"
        className="pointer-events-auto glass-panel border border-slate-200/90 dark:border-slate-700/60 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1 sm:gap-2 max-w-md w-full sm:w-auto"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={`Navigate to ${item.label} (${item.screen})`}
              className={`relative flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors select-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                item.active
                  ? 'text-indigo-600 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              }`}
            >
              {item.active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-indigo-600/30 border border-indigo-500/40 shadow-xs pointer-events-none"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              <Icon className={`w-4 h-4 relative z-10 ${item.active ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              <span className="relative z-10">{item.label}</span>
              {item.badge && !item.active && (
                <span className="relative z-10 hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </motion.nav>
    </div>
    </>
  );
}
