'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserOrganizations, backendLogin } from '@/lib/api';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Exchanging cryptographic credentials...');

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const error = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');

        if (error || errorDesc) {
          throw new Error(errorDesc || error || 'OAuth authentication failed.');
        }

        const supabase = createClient();
        const code = searchParams.get('code');
        let activeSession: any = null;

        if (code) {
          setStatusText('Exchanging authorization code with provider...');
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('[OAuth Callback] exchangeCodeForSession error:', exchangeError);
          }
          if (exchangeData?.session) {
            activeSession = exchangeData.session;
          }
        }

        if (!activeSession) {
          setStatusText('Verifying session and identity...');
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          if (currentSession) {
            activeSession = currentSession;
          } else if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            setStatusText('Parsing authentication tokens...');
            await new Promise((r) => setTimeout(r, 600));
            const { data: { session: hashSession } } = await supabase.auth.getSession();
            activeSession = hashSession;
          }
        }

        if (!activeSession?.user) {
          throw new Error('No active session found after OAuth redirect. Please try signing in again.');
        }

        const user = activeSession.user;
        const email = user.email || '';
        const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
        const role = (user.user_metadata?.role as any) || 'Admin';

        // Store user and session immediately so app shells and guards recognize authentication
        const parsedUser = {
          id: user.id,
          name,
          email,
          role,
          avatar: name.substring(0, 2).toUpperCase(),
          team: role === 'Admin' ? 'SecOps & Infrastructure' : 'Platform Reliability SRE',
          email_verified: !!user.email_confirmed_at,
          mfa_enabled: false,
        };

        try {
          localStorage.setItem('somak_user', JSON.stringify(parsedUser));
          localStorage.setItem('sentryops_user', JSON.stringify(parsedUser));
          localStorage.setItem('somak_session_token', activeSession.access_token);
          localStorage.setItem('somak_onboarding_completed', 'true');
          localStorage.setItem('sentryops_onboarding_completed', 'true');
          document.cookie = `somak_session=${activeSession.access_token}; path=/; max-age=604800; SameSite=Lax`;
        } catch {}

        // Non-blocking sync with backend
        try {
          backendLogin({
            email,
            name,
            role: 'Admin',
          }).catch((syncErr) => console.warn('[OAuth Callback] Backend sync non-fatal:', syncErr));
        } catch {}

        if (!isMounted) return;

        // Route directly to Dashboard - no forced setup redirects
        router.replace('/');
      } catch (err: any) {
        if (isMounted) {
          console.error('[OAuth Callback] Fatal error:', err);
          setErrorMsg(err?.message || 'Authentication failed. Please try again.');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-rose-500/20 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Authentication Failed</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{errorMsg}</p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-5">
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 animate-pulse border border-indigo-500/20" />
          <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-white flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Establishing Secure Session</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">{statusText}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06090F] flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading authentication handshake...</span>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
