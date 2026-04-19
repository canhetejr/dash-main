import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SurveyAggregation } from '@/lib/supabase-transform';
import { Users, Star, Activity, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MvpKpis({ aggregation }: { aggregation: SurveyAggregation }) {
  const favoravelPercent = (aggregation.distribution.favorableRate * 100).toFixed(1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-surface-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-surface-600">Total de Respostas</CardTitle>
          <div className="rounded-md bg-blue-50 p-2 text-blue-600">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-surface-900">{aggregation.totalResponses}</div>
          <p className="text-xs text-muted-foreground mt-1">Únicas neste filtro</p>
        </CardContent>
      </Card>
      
      <Card className="border-surface-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-surface-600">Média Geral</CardTitle>
          <div className="rounded-md bg-amber-50 p-2 text-amber-600">
            <Star className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-surface-900">
            {aggregation.likertAverage.toFixed(2)} <span className="text-lg text-surface-400 font-medium">/ 5.00</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Média Likert q1-q6</p>
        </CardContent>
      </Card>
      
      <Card className="border-surface-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-surface-600">Classificação</CardTitle>
          <div className={cn(
            "rounded-md p-2",
            aggregation.classificationBadge === 'Excelente' ? "bg-green-50 text-green-600" :
            aggregation.classificationBadge === 'Bom' ? "bg-blue-50 text-blue-600" :
            aggregation.classificationBadge === 'Regular' ? "bg-yellow-50 text-yellow-600" :
            "bg-red-50 text-red-600"
          )}>
            <Activity className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold tracking-tight",
            aggregation.classificationBadge === 'Excelente' ? "text-green-700" :
            aggregation.classificationBadge === 'Bom' ? "text-blue-700" :
            aggregation.classificationBadge === 'Regular' ? "text-yellow-700" :
            "text-red-700"
          )}>
            {aggregation.classificationBadge}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Baseado na média</p>
        </CardContent>
      </Card>

      <Card className="border-surface-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-surface-600">Taxa Favorável</CardTitle>
          <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
            <ThumbsUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-surface-900">{favoravelPercent}%</div>
          <p className="text-xs text-muted-foreground mt-1">Respostas 4 e 5</p>
        </CardContent>
      </Card>
    </div>
  );
}
