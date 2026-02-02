'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /svp/status with no plan id: redirect to plan list.
 * "Prepare" in the left menu links here; users open a specific plan from the list.
 */
export default function SiteVisitPlanStatusIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/svp');
  }, [router]);
  return null;
}
