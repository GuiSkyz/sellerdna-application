import { createClient } from '@/utils/supabase/client';

/**
 * Fetch wrapper que automaticamente inclui o token de autenticação do Supabase
 * em todas as requisições para o Backend.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(options.headers || {});
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
