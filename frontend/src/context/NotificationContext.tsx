"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SentryNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  read: boolean;
  link?: string;
  incidentId?: string;
}

interface NotificationContextType {
  notifications: SentryNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<SentryNotification, 'id' | 'timestamp' | 'read'>) => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: SentryNotification[] = [
  {
    id: 'notif-1',
    title: 'Sev-1 Memory Leak Detected',
    description: 'auth-service container heap reached 1.8GB (V8 OOM risk). Auto-triage initiated.',
    timestamp: '2m ago',
    severity: 'critical',
    read: false,
    link: '/remediation/INC-2041',
    incidentId: 'INC-2041',
  },
  {
    id: 'notif-2',
    title: 'Nemotron-3 Ultra AST Fix Verified',
    description: 'TTL-bounded LRUCache patch passed 14/14 sandbox test suites in 4.2s.',
    timestamp: '1m ago',
    severity: 'success',
    read: false,
    link: '/remediation/INC-2041',
    incidentId: 'INC-2041',
  },
  {
    id: 'notif-3',
    title: 'Canary 5% Traffic Active',
    description: 'Canary error rate 0.00% vs 3.82% baseline on us-east-1 ingress cluster.',
    timestamp: '30s ago',
    severity: 'info',
    read: false,
    link: '/canary/INC-2041',
    incidentId: 'INC-2041',
  },
  {
    id: 'notif-4',
    title: 'INC-1892 Post-Mortem Signed Off',
    description: 'Executive post-mortem and SOC-2 audit signed off for payment-gateway incident.',
    timestamp: '2h ago',
    severity: 'info',
    read: true,
    link: '/postmortem/INC-2041',
    incidentId: 'INC-2041',
  },
  {
    id: 'notif-5',
    title: 'Emergency Rollback Guard Active',
    description: 'Canary auto-promotes in 4m 12s unless p99 latency threshold is exceeded.',
    timestamp: '4m ago',
    severity: 'warning',
    read: true,
    link: '/canary/INC-2041',
    incidentId: 'INC-2041',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SentryNotification[]>(INITIAL_NOTIFICATIONS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sentryops_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        localStorage.setItem('sentryops_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
      }
    } catch {
      // fallback
    }
    setMounted(true);
  }, []);

  const saveToStorage = (items: SentryNotification[]) => {
    try {
      localStorage.setItem('sentryops_notifications', JSON.stringify(items));
    } catch {}
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      saveToStorage(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      saveToStorage(updated);
      return updated;
    });
  };

  const addNotification = (notif: Omit<SentryNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: SentryNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      saveToStorage(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    saveToStorage([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: mounted ? notifications : INITIAL_NOTIFICATIONS,
        unreadCount: mounted ? unreadCount : INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,
        markAsRead,
        markAllAsRead,
        addNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
