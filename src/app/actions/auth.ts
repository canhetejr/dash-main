'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server Action — realiza login com e-mail e senha via Supabase Auth.
 * Executada no servidor; não expõe lógica de autenticação ao browser.
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Preencha todos os campos.')}`);
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent('E-mail ou senha inválidos.')}`);
  }

  redirect(redirectTo);
}

/**
 * Server Action — encerra a sessão do usuário autenticado.
 */
export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
