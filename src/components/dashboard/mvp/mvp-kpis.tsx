import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SurveyAggregation } from '@/lib/supabase-transform';

export function MvpKpis({ aggregation }: { aggregation: SurveyAggregation }) {
  const favoravelPercent = (aggregation.distribution.favorableRate * 100).toFixed(1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aggregation.totalResponses}</div>
          <p className="text-xs text-muted-foreground">Únicas neste filtro</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aggregation.likertAverage.toFixed(2)} / 5.00</div>
          <p className="text-xs text-muted-foreground">Média Likert q1-q6</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Classificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aggregation.classificationBadge}</div>
          <p className="text-xs text-muted-foreground">Baseado na média</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Favorabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{favoravelPercent}%</div>
          <p className="text-xs text-muted-foreground">Respostas 4 e 5</p>
        </CardContent>
      </Card>
    </div>
  );
}
