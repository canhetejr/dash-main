'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertCircle } from 'lucide-react';

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
    <div className="flex min-h-[55vh] w-full items-center justify-center p-6">
      <div className="card-institution max-w-md w-full text-center p-8">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertCircle className="h-7 w-7" aria-hidden />
        </div>

        {/* Copy */}
        <h2
          className="text-lg font-bold text-surface-900 mb-2"
          style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
        >
          Não foi possível carregar os dados
        </h2>
        <p className="text-sm text-surface-500 leading-relaxed mb-6">
          Ocorreu um erro ao buscar os indicadores. Verifique sua conexão e tente novamente.
        </p>

        {/* Action */}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-unicive-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-unicive-green-hover transition-colors focus:outline-none focus:ring-2 focus:ring-unicive-green focus:ring-offset-2"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
