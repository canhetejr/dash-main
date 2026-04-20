import { createClient } from '@/lib/supabase/server';
import { AdminUsuariosClient } from './admin-usuarios-client';

export default async function AdminUsuariosPage() {
  // Layout já verificou permissão (admin/gestor)
  const supabase = createClient();

  // Busca via view segura (inclui email via função security definer)
  const { data: profiles } = await supabase
    .from('profiles_with_email')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single();

  return (
    <AdminUsuariosClient
      initialProfiles={profiles ?? []}
      callerRole={callerProfile?.role ?? 'gestor'}
    />
  );
}
