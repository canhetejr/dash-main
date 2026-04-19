'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-red-100 bg-red-50/50">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-red-800">Erro ao carregar os dados</CardTitle>
          <CardDescription className="text-red-600/80">
            Não foi possível carregar as informações do dashboard. Verifique sua conexão e tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={reset}
            variant="outline"
            className="w-full bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
