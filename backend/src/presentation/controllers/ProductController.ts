import { FastifyReply, FastifyRequest } from 'fastify';
import { ImportProductsPayloadSchema } from '../../application/dto/ProductDTO';
import { ImportProductsUseCase } from '../../application/useCases/ImportProductsUseCase';
import { InMemoryProductRepository } from '../../domain/repositories/InMemoryProductRepository';

export class ProductController {
  constructor(
    private importProductsUseCase: ImportProductsUseCase,
    private productRepository: InMemoryProductRepository
  ) {}

  async import(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Mocking user ID until Auth is implemented
      const userId = '123e4567-e89b-12d3-a456-426614174000'; 

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
      const userId = '123e4567-e89b-12d3-a456-426614174000'; 
      const products = await this.productRepository.findAllByUserId(userId);
      return reply.send(products);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar produtos' });
    }
  }
}
