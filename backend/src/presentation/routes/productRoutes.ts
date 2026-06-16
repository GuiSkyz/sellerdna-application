import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/ProductController';
import { ImportProductsUseCase } from '../../application/useCases/ImportProductsUseCase';
import { InMemoryProductRepository } from '../../domain/repositories/InMemoryProductRepository';

export async function productRoutes(app: FastifyInstance) {
  const repository = new InMemoryProductRepository();
  const useCase = new ImportProductsUseCase(repository);
  const controller = new ProductController(useCase, repository);

  app.post('/import', controller.import.bind(controller));
  app.get('/', controller.list.bind(controller));
}
