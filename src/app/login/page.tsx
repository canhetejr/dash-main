import { loginAction } from '@/app/actions/auth';
import { ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { SubmitButton } from './submit-button';

export const metadata = {
  title: 'Entrar | Unicive — Dashboard Analítico',
  description: 'Acesse o dashboard analítico da Unicive.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  const error = searchParams.error;
  const redirectTo = searchParams.redirectTo || '/dashboard';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      
      {/* Container */}
      <div className="w-full max-w-[380px]">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <Image 
              src="https://unicive.com/wp-content/uploads/2020/12/LOGOMARCA-UNICIVE.webp"
              alt="Unicive Logo"
              width={160}
              height={50}
              className="h-auto w-40 object-contain"
              priority
            />
          </div>
          <p className="text-[14px] text-surface-500 font-medium tracking-wide">
            DASHBOARD ANALÍTICO
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="px-8 py-8">
            <h2 
              className="text-lg font-bold text-surface-900 mb-1"
              style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
            >
              Entrar
            </h2>
            <p className="text-[13px] text-surface-500 mb-6">
              Acesso restrito à equipe de gestão.
            </p>

            {/* Error message */}
            {error && (
              <div
                className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2.5"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                <p className="text-[13px] text-red-700 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[12px] font-semibold text-surface-700 uppercase tracking-wider">
                  E-mail institucional
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@unicv.edu.cv"
                  className="w-full rounded-lg border border-surface-200 bg-surface-50/30 px-3.5 py-2.5 text-[14px] text-surface-900 placeholder:text-surface-400 focus:border-unicive-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-unicive-green transition-colors"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[12px] font-semibold text-surface-700 uppercase tracking-wider">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-surface-200 bg-surface-50/30 px-3.5 py-2.5 text-[14px] text-surface-900 placeholder:text-surface-400 focus:border-unicive-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-unicive-green transition-colors"
                />
              </div>

              {/* Submit button */}
              <SubmitButton />
            </form>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5 text-[11px] text-surface-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-surface-400" aria-hidden />
            Acesso seguro
          </div>
          <div className="h-3 w-px bg-surface-200" aria-hidden />
          <div className="flex items-center gap-1.5 text-[11px] text-surface-400 font-medium">
            <BookOpen className="h-3.5 w-3.5 text-surface-400" aria-hidden />
            Uso interno
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <span className="text-[11px] text-surface-400">Unicive © 2026</span>
        </div>
      </div>
    </div>
  );
}
