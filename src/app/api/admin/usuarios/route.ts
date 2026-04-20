import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/usuarios
 * Retorna profiles + emails (requer service_role para ler auth.users).
 * Protegido: apenas admin ou gestor pode chamar.
 */
export async function GET() {
  // 1. Verificar sessão e role do caller
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['admin', 'gestor'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // 2. Buscar todos os profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // 3. Enriquecer com emails via admin client (service role)
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let emailMap: Record<string, string> = {};
  if (adminKey) {
    const adminSupabase = createAdminClient(adminUrl, adminKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    if (usersData?.users) {
      emailMap = Object.fromEntries(
        usersData.users.map((u) => [u.id, u.email ?? ''])
      );
    }
  }

  const enriched = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? null,
  }));

  return NextResponse.json({ users: enriched });
}
