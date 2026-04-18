'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import type { QuestionAggregation } from '@/lib/supabase-transform';

interface LikertDist {
  label: string;
  count: number;
  percentage: number;
}

export function MvpCharts({ 
  likertDistribution, 
  byQuestion 
}: { 
  likertDistribution: LikertDist[],
  byQuestion: QuestionAggregation[] 
}) {
  const COLORS = {
    'Discordo Totalmente': '#ef4444',     // red-500
    'Discordo Parcialmente': '#f97316',   // orange-500
    'Indiferente': '#eab308',             // yellow-500
    'Concordo Parcialmente': '#84cc16',   // lime-500
    'Concordo Totalmente': '#22c55e',     // green-500
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição Likert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={likertDistribution} layout="vertical" margin={{ left: 50, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={120} tick={{fontSize: 12}} />
                <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value: number, name: string, props: any) => [`${value} respostas (${props.payload.percentage}%)`, 'Quantidade']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {likertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.label as keyof typeof COLORS] || '#ccc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Média por Pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byQuestion} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="questionKey" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [value.toFixed(2), 'Média']} labelFormatter={(label) => {
                  const q = byQuestion.find(q => q.questionKey === label);
                  return q ? q.questionLabel : label;
                }} />
                <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
