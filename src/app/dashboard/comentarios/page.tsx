import { getCachedComments } from '@/lib/supabase-pipeline';
import { CommentsPanel } from '@/components/dashboard/comments-panel';
import { PageHero } from '@/components/dashboard/page-hero';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComentariosPage({
  searchParams
}: {
  searchParams: {
    centro?: string;
    disciplina?: string;
  }
}) {
  const allComments = await getCachedComments();

  return (
    <div className="space-y-6 pb-12">
      <PageHero title="Comentários" subtitle="Análise textual e exportações filtradas." right={null} />
      <CommentsPanel 
        rows={allComments} 
        isLoading={false} 
        initialCentro={searchParams.centro} 
        initialDisciplina={searchParams.disciplina} 
      />
    </div>
  );
}

