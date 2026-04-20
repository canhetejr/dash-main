import { createClient } from '@/lib/supabase/server';
import type { Profile, ProfileWithEmail, AppRole } from '@/types/profile';

/**
 * Busca o profile do usuário autenticado atual.
 * Retorna null se não houver sessão ou profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data ?? null;
}

/**
 * Busca todos os profiles (requer role admin ou gestor — protegido via RLS).
 * Para admin list precisamos de service role; usamos API route com service role.
 */
export async function getAllProfilesWithEmail(): Promise<ProfileWithEmail[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as ProfileWithEmail[];
}

/**
 * Atualiza campos permitidos do próprio perfil.
 */
export async function updateOwnProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  return { error: error?.message ?? null };
}

/**
 * Admin: atualiza qualquer campo de um perfil.
 */
export async function adminUpdateProfile(
  targetUserId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role' | 'is_active' | 'moodle_id'>>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetUserId);

  return { error: error?.message ?? null };
}
