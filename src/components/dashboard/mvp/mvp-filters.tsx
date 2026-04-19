'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FilterX } from 'lucide-react';

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
    // Sempre volta para a página 1 ao alterar filtros
    params.delete('page');
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/dashboard');
  };

  return (
    <Card className="border-surface-200 shadow-sm bg-surface-50/50">
      <CardContent className="p-4 flex flex-col sm:flex-row flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 w-full sm:w-[280px]">
          <label htmlFor="centro-filter" className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Centro</label>
          <select 
            id="centro-filter"
            value={currentCentro}
            onChange={(e) => handleFilterChange('centro', e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-unicv-green focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todos os centros</option>
            {centros.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-[320px]">
          <label htmlFor="disciplina-filter" className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Disciplina</label>
          <select 
            id="disciplina-filter"
            value={currentDisciplina}
            onChange={(e) => handleFilterChange('disciplina', e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-unicv-green focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todas as disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {(currentCentro || currentDisciplina) && (
          <button 
            onClick={handleClearFilters}
            className="h-10 px-4 py-2 bg-surface-200 text-surface-700 hover:bg-surface-300 hover:text-surface-900 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unicv-green disabled:pointer-events-none disabled:opacity-50"
          >
            <FilterX className="h-4 w-4 mr-2" />
            Limpar Filtros
          </button>
        )}
      </CardContent>
    </Card>
  );
}
