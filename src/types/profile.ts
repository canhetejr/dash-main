/** Roles do sistema — espelha o enum app_role no Supabase */
export type AppRole = 'admin' | 'gestor' | 'analista' | 'viewer';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  moodle_id: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Profile enriquecido com email vindo de auth.users (via join/view) */
export interface ProfileWithEmail extends Profile {
  email: string | null;
}

/** Labels legíveis para exibição */
export const ROLE_LABELS: Record<AppRole, string> = {
  admin:    'Administrador',
  gestor:   'Gestor',
  analista: 'Analista',
  viewer:   'Visualizador',
};

/** Hierarquia numérica: quanto maior, mais privilégios */
export const ROLE_RANK: Record<AppRole, number> = {
  admin:    4,
  gestor:   3,
  analista: 2,
  viewer:   1,
};

/** Verifica se role tem privilégio de admin ou gestor */
export function canManageUsers(role: AppRole): boolean {
  return role === 'admin' || role === 'gestor';
}

/** Verifica se role é exclusivamente admin */
export function isAdmin(role: AppRole): boolean {
  return role === 'admin';
}
