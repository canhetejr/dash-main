import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cria um cliente Supabase para uso em Server Components, Server Actions e Route Handlers.
 * Gerencia sessão via cookies HTTP-only — não expõe tokens ao browser.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll pode ser chamado de um Server Component sem capacidade de setar cookies.
            // Pode ser ignorado com segurança se um middleware está lidando com revalidação.
          }
        },
      },
    }
  );
}
