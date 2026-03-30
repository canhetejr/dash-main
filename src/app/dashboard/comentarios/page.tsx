'use client';

import { useDashboardData } from '@/hooks/use-dashboard-data';
import { EMPTY_FILTERS } from '@/lib/filters';
import { CommentsPanel } from '@/components/dashboard/comments-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHero } from '@/components/dashboard/page-hero';

export default function ComentariosPage() {
  const { data, isLoading, error, refetch } = useDashboardData(EMPTY_FILTERS);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-800">{error}</p>
        <button onClick={refetch} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Tentar novamente</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHero title="Comentários" subtitle="Análise textual e exportações filtradas." right={null} />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero title="Comentários" subtitle="Análise textual e exportações filtradas." right={null} />
      <CommentsPanel rows={data?.rows ?? []} isLoading={false} />
    </div>
  );
}
