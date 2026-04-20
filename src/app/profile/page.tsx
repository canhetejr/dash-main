import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfilePageClient } from './profile-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meu Perfil — Unicive Dashboard',
  description: 'Edite seu perfil de usuário no sistema Unicive.',
};

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <ProfilePageClient
      profile={profile}
      email={user.email ?? ''}
    />
  );
}
