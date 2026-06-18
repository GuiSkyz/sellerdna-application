import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/ProductController';
import { ImportProductsUseCase } from '../../application/useCases/ImportProductsUseCase';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { OptimizeListingUseCase } from '../../application/useCases/OptimizeListingUseCase';
import { GeminiService } from '../../infrastructure/integrations/gemini/GeminiService';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function productRoutes(app: FastifyInstance) {
  const repository = new SupabaseProductRepository();
  const importUseCase = new ImportProductsUseCase(repository);
  const geminiService = new GeminiService();
  const optimizeUseCase = new OptimizeListingUseCase(geminiService);
  const controller = new ProductController(importUseCase, repository, optimizeUseCase);

  app.addHook('preHandler', authMiddleware);

  app.post('/import', controller.import.bind(controller));
  app.get('/', controller.list.bind(controller));
  app.post('/', controller.create.bind(controller));
  app.get('/:id', controller.getById.bind(controller));
  app.put('/:id', controller.update.bind(controller));
  app.post('/:id/generate-ad-copy', controller.generateAdCopy.bind(controller));
  app.delete('/:id', controller.delete.bind(controller));
  app.post('/bulk-delete', controller.deleteBulk.bind(controller));
}
