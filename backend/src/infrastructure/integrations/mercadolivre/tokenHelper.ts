import { supabase } from '../../database/supabase';
import { MercadoLivreAuthService } from './MercadoLivreAuthService';

export async function getValidMLToken(accountId: string): Promise<string> {
  const { data: tokenRecord, error } = await supabase
    .from('mercadolivre_tokens')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (error || !tokenRecord) {
    throw new Error('Token do Mercado Livre não encontrado para esta conta');
  }

  const now = new Date();
  const expiresAt = new Date(tokenRecord.expires_at);

  // Se o token expira em menos de 5 minutos, fazemos o refresh
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const authService = new MercadoLivreAuthService();
    const newTokens = await authService.refreshToken(tokenRecord.refresh_token);

    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('mercadolivre_tokens')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', accountId);

    if (updateError) {
      console.error('Erro ao salvar token renovado:', updateError);
      throw new Error('Falha ao renovar token do Mercado Livre');
    }

    return newTokens.access_token;
  }

  return tokenRecord.access_token;
}
