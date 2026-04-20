'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AppRole } from '@/types/profile';

/** Atualiza nome e avatar do próprio perfil */
export async function updateProfileAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const full_name = formData.get('full_name') as string | null;
  const avatar_url = formData.get('avatar_url') as string | null;

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, avatar_url })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { error: null };
}

/** Admin: atualiza role, is_active, moodle_id de qualquer usuário */
export async function adminUpdateUserAction(
  targetUserId: string,
  updates: { role?: AppRole; is_active?: boolean; moodle_id?: string; full_name?: string }
) {
  const supabase = createClient();

  // Verificar que o caller é admin ou gestor (double-check RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['admin', 'gestor'].includes(callerProfile.role)) {
    return { error: 'Sem permissão para esta ação' };
  }

  // Gestor não pode promover a admin
  if (updates.role === 'admin' && callerProfile.role !== 'admin') {
    return { error: 'Apenas admin pode atribuir role de admin' };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetUserId);

  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  return { error: null };
}
