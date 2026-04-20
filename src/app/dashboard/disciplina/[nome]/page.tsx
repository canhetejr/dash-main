import { getCachedPipeline, getCachedComments } from '@/lib/supabase-pipeline';
import { MvpKpis } from '@/components/dashboard/mvp/mvp-kpis';
import { MvpCharts } from '@/components/dashboard/mvp/mvp-charts';
import { ArrowLeft, BookOpen, ExternalLink, MessageSquare, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { formatDateBR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { SentimentLabel } from '@/types/survey';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BADGE_VARIANT: Record<SentimentLabel, string> = {
  Excelente: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Bom:       'bg-sky-50 text-sky-700 border-sky-200',
  Regular:   'bg-amber-50 text-amber-700 border-amber-200',
  Crítico:   'bg-red-50 text-red-700 border-red-200',
};

export default async function DisciplinaPage({
  params
}: {
  params: { nome: string }
}) {
  const disciplinaName = decodeURIComponent(params.nome);

  // Busca pipeline filtrando apenas para essa disciplina
  const [data, allComments] = await Promise.all([
    getCachedPipeline(undefined, disciplinaName),
    getCachedComments(),
  ]);

  const agg = data.aggregation;

  // Filtra comentários apenas da disciplina atual
  const disciplinaComments = allComments.filter(
    (c) => c.disciplina === disciplinaName
  );

  // Moodle: extrai o externalId da disciplina (course_id) dos dados agregados por disciplina
  const disciplinaAgg = data.byDisciplina.find(d => d.disciplina === disciplinaName);
  const moodleCourseId = disciplinaAgg?.externalId || '';
  const moodleUrl = moodleCourseId
    ? `https://ava.graduacaoead.unicv.edu.br/course/view.php?id=${moodleCourseId}`
    : null;

  const hasComments = disciplinaComments.length > 0;
  const criticalCount = disciplinaComments.filter(c => c.classificationBadge === 'Crítico').length;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Barra de navegação ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-unicive-green transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Dashboard
        </Link>

        {/* Link Moodle */}
        {moodleUrl && (
          <a
            href={moodleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-unicive-green px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-unicive-green/90 active:scale-[0.98] transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Abrir no Moodle
          </a>
        )}
      </div>

      {/* ── Hero / Faixa de contexto ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-surface-200">

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-unicive-green-pale">
              <BookOpen className="h-4 w-4 text-unicive-green" aria-hidden />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-widest text-unicive-green">
              Relatório Executivo da Disciplina
            </span>
          </div>

          <h1
            className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-surface-900 leading-none"
            style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
          >
            {disciplinaName}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Público da Amostra</p>
              <p className="mt-1 text-sm font-medium text-surface-700">{agg.totalResponses.toLocaleString('pt-BR')} respostas</p>
            </div>
            <div className="w-px h-8 bg-surface-200 hidden sm:block" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Contexto Geográfico</p>
              <p className="mt-1 text-sm font-medium text-surface-700">{agg.uniqueCentros} {agg.uniqueCentros === 1 ? 'Centro/Polo' : 'Centros/Polos'}</p>
            </div>
            <div className="w-px h-8 bg-surface-200 hidden sm:block" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Comentários</p>
              <p className="mt-1 text-sm font-medium text-surface-700">{disciplinaComments.length} registrado{disciplinaComments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Destaque Média */}
        <div className="shrink-0 flex items-center gap-5 rounded-2xl bg-white p-6 border border-surface-200 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500 text-right mb-1">Score Global</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-[40px] font-extrabold tracking-tighter text-unicive-green leading-none" style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}>
                {agg.likertAverage.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-surface-400">/5</span>
            </div>
          </div>
          <div className="w-px h-14 bg-surface-200" />
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mb-2">Classificação</span>
            <span className={`inline-flex items-center justify-center w-full rounded-lg px-3 py-1.5 text-[13px] font-bold tracking-wide border ${
              agg.classificationBadge === 'Excelente' ? 'bg-unicive-green-pale text-unicive-green border-unicive-green/20' :
              agg.classificationBadge === 'Bom' ? 'bg-sky-50 text-sky-700 border-sky-200' :
              agg.classificationBadge === 'Regular' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {agg.classificationBadge}
            </span>
          </div>
        </div>

      </div>

      {/* ── 1. KPIs ──────────────────────────────────────────────── */}
      <MvpKpis aggregation={agg} />

      {/* ── 2. Gráficos ──────────────────────────────────────────── */}
      <MvpCharts
        likertDistribution={data.likertDistribution}
        byQuestion={data.byQuestion}
      />

      {/* ── 3. Comentários da Disciplina ─────────────────────────── */}
      <section aria-labelledby="comments-heading">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-surface-100">
            <MessageSquare className="h-4 w-4 text-surface-500" aria-hidden />
          </div>
          <h2
            id="comments-heading"
            className="text-base font-bold text-surface-900"
            style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
          >
            Comentários da Disciplina
          </h2>
          <span className="ml-1 inline-flex items-center rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-semibold text-surface-600">
            {disciplinaComments.length}
          </span>
        </div>

        {/* Alerta críticos */}
        {criticalCount > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" aria-hidden />
            <p className="text-sm text-red-800">
              <span className="font-semibold">{criticalCount}</span> comentário{criticalCount > 1 ? 's' : ''} com avaliação <span className="font-semibold">Crítica</span> — feedbacks com média abaixo de 3.0.
            </p>
          </div>
        )}

        {!hasComments ? (
          /* Estado vazio elegante */
          <div className="card-institution flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 mb-4">
              <MessageSquare className="h-5 w-5 text-surface-400" aria-hidden />
            </div>
            <p className="text-sm font-medium text-surface-700 mb-1">
              Nenhum comentário encontrado para esta disciplina.
            </p>
            <p className="text-xs text-surface-400">
              Os estudantes não deixaram sugestões ou comentários nesta pesquisa.
            </p>
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {disciplinaComments.map((comment, idx) => {
              const key = `${comment.id}-${idx}`;
              const isCritical = comment.classificationBadge === 'Crítico';
              return (
                <li
                  key={key}
                  className={cn(
                    'card-institution px-5 py-4 transition-all duration-150',
                    isCritical
                      ? 'border-red-200 bg-red-50/50'
                      : 'hover:border-unicive-green/15 hover:bg-unicive-green/[0.012]'
                  )}
                >
                  {/* Meta */}
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_VARIANT[comment.classificationBadge]}`}>
                      {comment.classificationBadge}
                    </span>
                    {comment.centroSigla && (
                      <span className="text-[11px] font-medium text-surface-500">{comment.centroSigla}</span>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      <span className={cn(
                        'text-xs font-bold tabular-nums',
                        comment.likertAverage >= 4 ? 'text-emerald-600' :
                        comment.likertAverage >= 3 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {comment.likertAverage.toFixed(1)}
                      </span>
                      {comment.submittedAt && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-surface-400">
                          <CalendarDays className="h-3 w-3" aria-hidden />
                          {formatDateBR(comment.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Texto */}
                  <p className="text-[13px] leading-relaxed text-surface-700">
                    {comment.suggestion}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Link Moodle (rodapé alternativo se não houver link no topo) ── */}
      {moodleUrl && (
        <div className="border-t border-surface-200 pt-6 flex items-center justify-between">
          <p className="text-[13px] text-surface-500">
            Acesse o ambiente virtual da disciplina para mais informações.
          </p>
          <a
            href={moodleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-unicive-green/20 bg-unicive-green-pale px-4 py-2 text-[13px] font-semibold text-unicive-green hover:bg-unicive-green hover:text-white transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Abrir no Moodle
          </a>
        </div>
      )}
    </div>
  );
}
