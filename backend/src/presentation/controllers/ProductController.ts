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

  private async getUserId(): Promise<string> {
    let { data: users } = await supabase.from('users').select('id').limit(1);
    let userId = users?.[0]?.id;

    if (!userId) {
      const { data: newUser } = await supabase.from('users').insert({ 
        email: 'test@sellerdna.com', 
        name: 'Test User' 
      }).select('id').single();
      userId = newUser?.id;
    }
    return userId;
  }

  async import(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId();

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
      // O repositório lista tudo (depois filtraremos por userId quando tivermos Multi-tenant real)
      const products = await this.productRepository.listAll();
      return reply.send(products);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar produtos' });
    }
  }
}
