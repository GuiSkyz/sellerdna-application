import { FastifyReply, FastifyRequest } from 'fastify';
import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';

export class MLCategoryController {
  private mlApiService: MercadoLivreApiService;

  constructor() {
    this.mlApiService = new MercadoLivreApiService();
  }

  async predict(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { title } = request.query as { title: string };
      if (!title) {
        return reply.status(400).send({ error: 'Título é obrigatório' });
      }

      const category = await this.mlApiService.predictCategoryFull(title);
      
      if (!category) {
        return reply.status(404).send({ error: 'Nenhuma categoria encontrada para este título' });
      }

      return reply.send(category);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao prever categoria' });
    }
  }

  async getAttributes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const attributes = await this.mlApiService.getCategoryAttributes(id);
      
      return reply.send(attributes);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar atributos da categoria' });
    }
  }
}
