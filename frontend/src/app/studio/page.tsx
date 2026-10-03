'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/remediation');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
