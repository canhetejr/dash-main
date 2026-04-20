'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';

export function MvpFilters({ 
  centros, 
  disciplinas, 
  currentCentro, 
  currentDisciplina 
}: { 
  centros: string[]; 
  disciplinas: string[];
  currentCentro: string;
  currentDisciplina: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/dashboard');
  };

  const hasFilters = !!(currentCentro || currentDisciplina);

  const selectBase =
    'h-9 w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 text-[13px] font-medium text-surface-900 ' +
    'shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-unicive-green/20 focus:border-unicive-green ' +
    'hover:bg-white hover:border-surface-300 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer ' +
    'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D\'http%3A//www.w3.org/2000/svg\'%20width%3D\'12\'%20height%3D\'12\'%20viewBox%3D\'0%200%2024%2024\'%20fill%3D\'none\'%20stroke%3D\'%235C6472\'%20stroke-width%3D\'2\'%3E%3Cpath%20d%3D\'M6%209l6%206%206-6\'/%3E%3C/svg%3E")] ' +
    'bg-no-repeat bg-[right_12px_center]';

  return (
    <div className="card-institution p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Label left */}
        <div className="flex items-center gap-2 text-surface-500 shrink-0 self-center">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-widest hidden sm:inline">Filtros</span>
        </div>

        {/* Centro */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px] max-w-[280px]">
          <label htmlFor="centro-filter" className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">
            Centro
          </label>
          <select
            id="centro-filter"
            value={currentCentro}
            onChange={(e) => handleFilterChange('centro', e.target.value)}
            className={selectBase}
          >
            <option value="">Todos os centros</option>
            {centros.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Disciplina */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-[340px]">
          <label htmlFor="disciplina-filter" className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">
            Disciplina
          </label>
          <select
            id="disciplina-filter"
            value={currentDisciplina}
            onChange={(e) => handleFilterChange('disciplina', e.target.value)}
            className={selectBase}
          >
            <option value="">Todas as disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Limpar filtros */}
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-[12px] font-semibold text-surface-600 shadow-sm transition-all hover:bg-surface-50 hover:border-surface-300 hover:text-surface-900 self-end"
          >
            <X className="h-4 w-4" aria-hidden />
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {hasFilters && (
        <div className="mt-3.5 pt-3.5 border-t border-surface-200">
          <p className="text-xs text-surface-500">
            <span className="font-semibold text-unicive-green">Filtrando por:</span>{' '}
            {[
              currentCentro && `Centro = ${currentCentro}`,
              currentDisciplina && `Disciplina = ${currentDisciplina}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
