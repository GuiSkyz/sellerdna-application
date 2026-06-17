import { FastifyReply, FastifyRequest } from 'fastify';
import { ImportProductsPayloadSchema } from '../../application/dto/ProductDTO';
import { ImportProductsUseCase } from '../../application/useCases/ImportProductsUseCase';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase';

export class ProductController {
  constructor(
    private importProductsUseCase: ImportProductsUseCase,
    private productRepository: SupabaseProductRepository
  ) {}

  private async getUserId(request: FastifyRequest): Promise<string> {
    return (request as any).user.id;
  }

  async import(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);

      const parsed = ImportProductsPayloadSchema.safeParse(request.body);
      
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Dados de entrada inválidos',
          details: parsed.error.format()
        });
      }

      const products = await this.importProductsUseCase.execute(userId, parsed.data.products);

      return reply.status(201).send({
        message: `${products.length} produtos importados com sucesso!`,
        products
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro interno ao importar produtos' });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const { data: products } = await supabase.from('products').select('*').eq('user_id', userId);
      return reply.send(products || []);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar produtos' });
    }
  }
}
