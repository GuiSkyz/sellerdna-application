import { FastifyReply, FastifyRequest } from 'fastify';
import { MercadoLivreAuthService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreAuthService';
import { supabase } from '../../infrastructure/database/supabase';
import jwt from 'jsonwebtoken';

export class MLAuthController {
  private mlAuthService: MercadoLivreAuthService;

  constructor() {
    this.mlAuthService = new MercadoLivreAuthService();
  }

  async getAuthUrl(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      
      // Gerar PKCE code_verifier e code_challenge
      const codeVerifier = this.mlAuthService.generateCodeVerifier();
      const codeChallenge = this.mlAuthService.generateCodeChallenge(codeVerifier);

      // Assinar o userId + codeVerifier num JWT que expira em 10 minutos
      const secret = process.env.SUPABASE_ANON_KEY || 'default_secret';
      const stateToken = jwt.sign({ userId, codeVerifier }, secret, { expiresIn: '10m' });

      const url = this.mlAuthService.getAuthUrl(stateToken, codeChallenge);
      return reply.send({ url });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao gerar URL de autenticação' });
    }
  }

  async callback(request: FastifyRequest<{ Querystring: { code: string, state: string } }>, reply: FastifyReply) {
    try {
      const { code, state: stateToken } = request.query;
      
      if (!code) {
        return reply.status(400).send({ error: 'O código de autorização não foi retornado pelo Mercado Livre' });
      }

      // O userId e codeVerifier vêm criptografados no parâmetro state (Token JWT)
      if (!stateToken) {
        throw new Error('State token não fornecido pela autenticação do Mercado Livre');
      }

      const secret = process.env.SUPABASE_ANON_KEY || 'default_secret';
      let userId: string;
      let codeVerifier: string;
      try {
        const decoded = jwt.verify(stateToken, secret) as { userId: string; codeVerifier: string };
        userId = decoded.userId;
        codeVerifier = decoded.codeVerifier;
      } catch (err) {
        throw new Error('State token inválido ou expirado (CSRF Protection)');
      }

      // Troca o código temporário pelo token de acesso oficial (com PKCE)
      const tokenData = await this.mlAuthService.exchangeCode(code, codeVerifier);
      
      // Fetch Mercado Livre user profile to get nickname
      const mlProfileResponse = await fetch('https://api.mercadolibre.com/users/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const mlProfile = await mlProfileResponse.json();

      if (!userId) {
        throw new Error('UserId não encontrado no token state');
      }

      if (userId) {
        // Primeiro, tenta buscar a conta existente
        const { data: existingAccounts, error: searchError } = await supabase
          .from('mercadolivre_accounts')
          .select('id')
          .eq('user_id', userId)
          .eq('ml_user_id', String(tokenData.user_id));

        if (searchError) throw searchError;

        let accountId: string;
        if (existingAccounts && existingAccounts.length > 0) {
          // Atualiza
          accountId = existingAccounts[0].id;
          await supabase.from('mercadolivre_accounts').update({
            nickname: mlProfile.nickname || `User ${tokenData.user_id}`,
            status: 'ACTIVE',
          }).eq('id', accountId);
        } else {
          // Insere
          const { data: newAccount, error: insertError } = await supabase.from('mercadolivre_accounts').insert({
            user_id: userId,
            ml_user_id: String(tokenData.user_id),
            nickname: mlProfile.nickname || `User ${tokenData.user_id}`,
            status: 'ACTIVE',
          }).select('id').single();

          if (insertError) throw insertError;
          accountId = newAccount.id;
        }

        // Upsert Token (Ainda usamos eq('account_id') se for update, ou insert se não existir)
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
        
        const { data: existingTokens } = await supabase.from('mercadolivre_tokens').select('id').eq('account_id', accountId);
        if (existingTokens && existingTokens.length > 0) {
          await supabase.from('mercadolivre_tokens').update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          }).eq('account_id', accountId);
        } else {
          await supabase.from('mercadolivre_tokens').insert({
            account_id: accountId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          });
        }
      }

      // Após salvar, redirecionamos o usuário de volta para o painel do Frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return reply.redirect(`${frontendUrl}/dashboard?ml_connected=true`);
      
    } catch (error: any) {
      request.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = encodeURIComponent(error.message || 'auth_failed');
      return reply.redirect(`${frontendUrl}/onboarding?error=${errorMessage}`);
    }
  }

  async getConnectedAccounts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const { data: accounts, error } = await supabase
        .from('mercadolivre_accounts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return reply.send(accounts);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar contas do Mercado Livre' });
    }
  }

  async listAccounts(request: FastifyRequest, reply: FastifyReply) {
    try {
      let { data: users } = await supabase.from('users').select('id').limit(1);
      let userId = users?.[0]?.id;
      if (!userId) return reply.send([]);

      const { data: accounts, error } = await supabase
        .from('mercadolivre_accounts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return reply.send(accounts);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar contas do Mercado Livre' });
    }
  }

  // Mantemos o exchangeToken antigo caso o Frontend precise fazer a troca via POST
  async exchangeToken(request: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) {
    try {
      const { code } = request.body;
      if (!code) {
        return reply.status(400).send({ error: 'O código de autorização é obrigatório' });
      }

      const tokenData = await this.mlAuthService.exchangeCode(code);
      return reply.send({ message: 'Conta conectada com sucesso', tokens: tokenData });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao processar o token do Mercado Livre' });
    }
  }

  // Webhook para receber atualizações automáticas do ML (vendas, perguntas, etc)
  async notifications(request: FastifyRequest, reply: FastifyReply) {
    request.log.info({ notification: request.body }, 'Notificação recebida do Mercado Livre');
    return reply.status(200).send('OK');
  }
}
