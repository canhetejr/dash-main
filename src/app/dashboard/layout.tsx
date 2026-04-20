import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import type { AppRole } from '@/types/profile';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? '';

  // Buscar profile para passar role e nome ao sidebar
  const { data: profile } = user
    ? await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
    : { data: null };

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      {/* ── Sidebar ───────────────────────────────────── */}
      <Sidebar
        userEmail={userEmail}
        userRole={(profile?.role ?? 'viewer') as AppRole}
        userFullName={profile?.full_name ?? undefined}
      />

      {/* ── Main Content Area ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ── Page Content ────────────────────────────────────── */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
