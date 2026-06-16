import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/ProductController';
import { ImportProductsUseCase } from '../../application/useCases/ImportProductsUseCase';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';

export async function productRoutes(app: FastifyInstance) {
  const repository = new SupabaseProductRepository();
  const useCase = new ImportProductsUseCase(repository);
  const controller = new ProductController(useCase, repository);

  app.post('/import', controller.import.bind(controller));
  app.get('/', controller.list.bind(controller));
}
