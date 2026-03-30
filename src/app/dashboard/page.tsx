import { Suspense } from 'react';
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-2" aria-busy="true" aria-live="polite">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-lg bg-surface-200/50" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-surface-200/50" />
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
