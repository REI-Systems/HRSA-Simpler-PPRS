'use client';

import { Suspense } from 'react';
import SiteVisitPlanList from '../components/SiteVisitPlanList/SiteVisitPlanList';

function ListFallback() {
  return <div style={{ padding: '1rem', color: '#555' }}>Loading...</div>;
}

export default function SiteVisitPlanPage() {
  return (
    <Suspense fallback={<ListFallback />}>
      <SiteVisitPlanList />
    </Suspense>
  );
}
