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

  async exchangeToken(request: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) {
    try {
      const { code } = request.body;
      if (!code) {
        return reply.status(400).send({ error: 'O código de autorização é obrigatório' });
      }

      const tokenData = await this.mlAuthService.exchangeCode(code);
      
      // TODO: Salvar os tokens no Supabase associados ao usuário autenticado

      return reply.send({ message: 'Conta conectada com sucesso', tokens: tokenData });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao processar o token do Mercado Livre' });
    }
  }
}
