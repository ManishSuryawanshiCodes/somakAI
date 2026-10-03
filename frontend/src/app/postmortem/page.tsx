'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrg } from '@/context/OrgContext';
import { getActiveIncidents } from '@/lib/api';

export default function PostMortemIndex() {
  const router = useRouter();
  const { currentOrg } = useOrg();

  useEffect(() => {
    let active = true;
    const orgId = currentOrg?.id || 'org_acme';

    getActiveIncidents(orgId)
      .then((data) => {
        if (!active) return;
        if (data && data.length > 0) {
          router.replace(`/postmortem/${data[0].id}`);
        } else {
          router.replace('/postmortem/evt_live_desconnect_001');
        }
      })
      .catch(() => {
        if (active) {
          router.replace('/postmortem/evt_live_desconnect_001');
        }
      });

    return () => {
      active = false;
    };
  }, [currentOrg, router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
