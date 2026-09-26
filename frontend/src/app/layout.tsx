import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { AuthProvider } from '@/context/AuthContext';
import { OrgProvider } from '@/context/OrgContext';
import { NotificationProvider } from '@/context/NotificationContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import AppShell from '@/components/AppShell';
import '@/lib/sentry';
import './globals.css';

export const metadata: Metadata = {
  title: 'SOMAK AI — Autonomous Incident Remediation Platform',
  description: 'Enterprise Autonomous SRE Platform powered by NVIDIA Nemotron-3, Nebius Token Factory, and Tavily Search.',
  applicationName: 'SOMAK AI',
  metadataBase: new URL('https://app.somak.ai'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'SOMAK AI — Autonomous Incident Remediation Platform',
    description: 'Incidents fix themselves before your team wakes up. Continuous crash telemetry ingestion, zero-hallucination AST hotfixes, and automated canary rollouts.',
    url: 'https://app.somak.ai',
    siteName: 'SOMAK AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SOMAK AI Autonomous Incident Remediation Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SOMAK AI — Autonomous Incident Remediation Platform',
    description: 'Incidents fix themselves before your team wakes up. Continuous telemetry ingestion, AST hotfixes, and canary rollouts.',
    images: ['/og-image.png'],
    creator: '@somakai',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SOMAK AI',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('sentryops_theme')||localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&d)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen transition-colors duration-200 antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
        <ThemeProvider>
          <AuthProvider>
            <OrgProvider>
              <NotificationProvider>
                <ToastProvider>
                  <ServiceWorkerRegister />
                  <AppShell>
                    {children}
                  </AppShell>
                </ToastProvider>
              </NotificationProvider>
            </OrgProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
