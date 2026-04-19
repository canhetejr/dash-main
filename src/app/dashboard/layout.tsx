import Link from 'next/link';
import { BarChart3, LayoutDashboard, MessageSquare, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/server';

const NAV = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/comentarios', label: 'Comentários', icon: MessageSquare },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? '';

  return (
    <div className="min-h-screen bg-surface-100">
      <header className="sticky top-0 z-50 w-full border-b border-surface-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-unicv-green text-white">
              <BarChart3 className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-surface-900">Pesquisa de Satisfação</h1>
              <p className="text-[11px] text-surface-500">UniCV — Dashboard Analítico</p>
            </div>
          </div>

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            {NAV.map(({ href, label, icon: Icon }) => {
              // Não podemos usar usePathname em Server Component.
              // Usamos um Client wrapper apenas para o active state.
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-200 hover:text-surface-800 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </Link>
              );
            })}

            {/* Logout */}
            <form action={logoutAction}>
              <button
                type="submit"
                title={`Sair (${userEmail})`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors ml-2 border-l border-surface-200 pl-4"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
