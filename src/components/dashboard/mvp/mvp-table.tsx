import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SentimentLabel } from '@/types/survey';

interface DisciplinaAggregate {
  disciplina: string;
  centro: string;
  totalResponses: number;
  likertAverage: number;
  classificationBadge: SentimentLabel;
}

export function MvpTable({ disciplinas }: { disciplinas: DisciplinaAggregate[] }) {
  const getBadgeVariant = (label: string) => {
    if (label === 'Excelente') return 'default';
    if (label === 'Bom') return 'secondary';
    if (label === 'Regular') return 'outline';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados por Disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Disciplina</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Centro</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Respostas</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Média</th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Classificação</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {disciplinas.map((row, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">{row.disciplina}</td>
                  <td className="p-4 align-middle">{row.centro}</td>
                  <td className="p-4 align-middle text-right">{row.totalResponses}</td>
                  <td className="p-4 align-middle text-right font-semibold">{row.likertAverage.toFixed(2)}</td>
                  <td className="p-4 align-middle text-center">
                    <Badge variant={getBadgeVariant(row.classificationBadge)}>
                      {row.classificationBadge}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {disciplinas.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">Nenhuma disciplina encontrada.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
