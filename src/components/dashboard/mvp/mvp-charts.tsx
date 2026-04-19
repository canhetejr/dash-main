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
      <Card className="border-surface-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-surface-900">Distribuição Likert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={likertDistribution} layout="vertical" margin={{ left: 50, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={120} tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string, props: any) => [`${value} respostas (${props.payload.percentage}%)`, 'Quantidade']} 
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {likertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.label as keyof typeof COLORS] || '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-surface-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-surface-900">Média por Pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byQuestion} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="questionKey" tick={{fill: '#64748b'}} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{fill: '#64748b'}} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value.toFixed(2), 'Média']} 
                  labelFormatter={(label) => {
                    const q = byQuestion.find(q => q.questionKey === label);
                    return q ? q.questionLabel : label;
                  }} 
                />
                <Bar dataKey="avgScore" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
