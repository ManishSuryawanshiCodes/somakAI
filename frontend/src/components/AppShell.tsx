"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from './AuroraBackground';
import Sidebar from './Sidebar';
import SplashScreen from './SplashScreen';
import { useAuth } from '@/context/AuthContext';

interface AppShellContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
}

const AppShellContext = createContext<AppShellContextType>({
  sidebarCollapsed: false,
  toggleSidebar: () => {},
  mobileDrawerOpen: false,
  setMobileDrawerOpen: () => {},
});

export function useAppShell() {
  return useContext(AppShellContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sentryops_sidebar_collapsed');
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    } catch {}
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sentryops_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/status') ||
    pathname.startsWith('/changelog') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/forbidden') ||
    pathname.startsWith('/invite');

  // Route protection for unauthenticated users accessing protected pages
  useEffect(() => {
    if (mounted && !isAuthenticated && !isPublicPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isAuthenticated, isPublicPage, pathname, router]);

  const isStandalonePage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/status') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/forbidden') ||
    (pathname === '/' && !isAuthenticated);

  return (
    <AppShellContext.Provider
      value={{
        sidebarCollapsed: mounted ? sidebarCollapsed : false,
        toggleSidebar,
        mobileDrawerOpen,
        setMobileDrawerOpen,
      }}
    >
      {/* GPU Aurora Mesh Background */}
      <AuroraBackground />

      {/* Branded Loading / Splash Screen on Initial Load */}
      <SplashScreen />

      {!isStandalonePage && (
        <>
          {/* Desktop Fixed Left Sidebar */}
          <div className="hidden md:block">
            <Sidebar
              collapsed={mounted ? sidebarCollapsed : false}
              onToggleCollapse={toggleSidebar}
            />
          </div>

          {/* Mobile Slide-in Drawer with Backdrop Overlay */}
          <AnimatePresence>
            {mobileDrawerOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  className="relative z-10 w-72 max-w-[80vw] h-full"
                >
                  <Sidebar
                    collapsed={false}
                    onToggleCollapse={() => {}}
                    isMobileDrawer={true}
                    onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Main Page Layout Wrapper */}
      <div
        className={`min-h-screen transition-all duration-200 ease-in-out ${
          isStandalonePage
            ? 'w-full'
            : mounted && sidebarCollapsed
            ? 'md:ml-[72px]'
            : 'md:ml-60'
        }`}
      >
        {children}
      </div>
    </AppShellContext.Provider>
  );
}
