import { createBrowserClient } from '@supabase/ssr';

/**
 * Cria um cliente Supabase para uso em Client Components.
 * Variáveis NEXT_PUBLIC_* são seguras para o browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
