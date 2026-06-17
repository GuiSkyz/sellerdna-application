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
      
      // Assinar o userId num JWT que expira em 10 minutos para prevenir CSRF
      const secret = process.env.SUPABASE_ANON_KEY || 'default_secret';
      const stateToken = jwt.sign({ userId }, secret, { expiresIn: '10m' });

      const url = this.mlAuthService.getAuthUrl(stateToken);
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

      // Troca o código temporário pelo token de acesso oficial
      const tokenData = await this.mlAuthService.exchangeCode(code);
      
      // Fetch Mercado Livre user profile to get nickname
      const mlProfileResponse = await fetch('https://api.mercadolibre.com/users/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const mlProfile = await mlProfileResponse.json();

      // O userId vem criptografado no parâmetro state (Token JWT)
      if (!stateToken) {
        throw new Error('State token não fornecido pela autenticação do Mercado Livre');
      }

      const secret = process.env.SUPABASE_ANON_KEY || 'default_secret';
      let userId: string;
      try {
        const decoded = jwt.verify(stateToken, secret) as { userId: string };
        userId = decoded.userId;
      } catch (err) {
        throw new Error('State token inválido ou expirado (CSRF Protection)');
      }

      if (!userId) {
        throw new Error('UserId não encontrado no token state');
      }

      if (userId) {
        // Upsert Account
        const { data: accountData, error: accountError } = await supabase.from('mercadolivre_accounts').upsert({
          user_id: userId,
          ml_user_id: String(tokenData.user_id),
          nickname: mlProfile.nickname || `User ${tokenData.user_id}`,
          status: 'ACTIVE',
        }, { onConflict: 'user_id,ml_user_id' }).select('id').single();

        if (accountError) throw accountError;

        // Upsert Token
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
        await supabase.from('mercadolivre_tokens').upsert({
          account_id: accountData.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'account_id' });
      }

      // Após salvar, redirecionamos o usuário de volta para o painel do Frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return reply.redirect(`${frontendUrl}/dashboard?ml_connected=true`);
      
    } catch (error) {
      request.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return reply.redirect(`${frontendUrl}/dashboard?ml_connected=false&error=auth_failed`);
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
