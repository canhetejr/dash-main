import { loginAction } from '@/app/actions/auth';
import { BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Entrar | UniCV Pesquisa de Satisfação',
  description: 'Acesse o dashboard analítico da UniCV.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  const error = searchParams.error;
  const redirectTo = searchParams.redirectTo || '/dashboard';

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-unicv-green text-white mb-4 shadow-lg">
            <BarChart3 className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">UniCV</h1>
          <p className="text-sm text-surface-500 mt-1">Pesquisa de Satisfação — Dashboard</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-surface-800 mb-5">Entrar na sua conta</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-surface-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@unicv.edu.cv"
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-unicv-green focus:outline-none focus:ring-2 focus:ring-unicv-green/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-surface-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-unicv-green focus:outline-none focus:ring-2 focus:ring-unicv-green/20 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-unicv-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-unicv-green/90 focus:outline-none focus:ring-2 focus:ring-unicv-green focus:ring-offset-2 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-surface-400 mt-6">
          Acesso restrito à equipe UniCV
        </p>
      </div>
    </div>
  );
}
