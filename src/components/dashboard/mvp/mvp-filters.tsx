'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

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
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/dashboard');
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 w-full sm:w-[300px]">
          <label htmlFor="centro-filter" className="text-sm font-medium">Centro</label>
          <select 
            id="centro-filter"
            value={currentCentro}
            onChange={(e) => handleFilterChange('centro', e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todos os centros</option>
            {centros.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-[300px]">
          <label htmlFor="disciplina-filter" className="text-sm font-medium">Disciplina</label>
          <select 
            id="disciplina-filter"
            value={currentDisciplina}
            onChange={(e) => handleFilterChange('disciplina', e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Limpar Filtros
          </button>
        )}
      </CardContent>
    </Card>
  );
}
