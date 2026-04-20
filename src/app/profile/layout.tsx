import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { redirect } from 'next/navigation';
import type { AppRole } from '@/types/profile';

/**
 * Layout compartilhado para /profile
 * Reutiliza a mesma estrutura visual do /dashboard (sidebar + main)
 */
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      <Sidebar
        userEmail={user.email ?? ''}
        userRole={(profile?.role ?? 'viewer') as AppRole}
        userFullName={profile?.full_name ?? undefined}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
