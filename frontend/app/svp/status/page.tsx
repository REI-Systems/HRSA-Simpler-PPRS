'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SiteVisitPlanStatusIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/svp');
  }, [router]);
  return null;
}
