import { FastifyReply, FastifyRequest } from 'fastify';
import { MercadoLivreAuthService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreAuthService';

export class MLAuthController {
  private mlAuthService: MercadoLivreAuthService;

  constructor() {
    this.mlAuthService = new MercadoLivreAuthService();
  }

  async getAuthUrl(request: FastifyRequest, reply: FastifyReply) {
    try {
      const url = this.mlAuthService.getAuthUrl();
      return reply.send({ url });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao gerar URL de autenticação' });
    }
  }

  async callback(request: FastifyRequest<{ Querystring: { code: string } }>, reply: FastifyReply) {
    try {
      const { code } = request.query;
      
      if (!code) {
        return reply.status(400).send({ error: 'O código de autorização não foi retornado pelo Mercado Livre' });
      }

      // Troca o código temporário pelo token de acesso oficial
      const tokenData = await this.mlAuthService.exchangeCode(code);
      
      // TODO: Salvar os tokens no Supabase associados ao usuário autenticado

      // Após salvar, redirecionamos o usuário de volta para o painel do Frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return reply.redirect(`${frontendUrl}/settings?ml_connected=true`);
      
    } catch (error) {
      request.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return reply.redirect(`${frontendUrl}/settings?ml_connected=false&error=auth_failed`);
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
    // O ML exige que sempre retornemos 200 OK rapidamente para confirmar o recebimento
    // Aqui no futuro vamos processar as notificações de estoque, vendas, etc.
    request.log.info({ notification: request.body }, 'Notificação recebida do Mercado Livre');
    return reply.status(200).send('OK');
  }
}
