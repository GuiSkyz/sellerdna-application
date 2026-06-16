import { FastifyInstance } from 'fastify';
import { ListingController } from '../controllers/ListingController';

export async function listingRoutes(app: FastifyInstance) {
  const controller = new ListingController();

  app.post('/sync', controller.sync.bind(controller));
  app.post('/', controller.create.bind(controller));
  app.post('/:id/duplicate', controller.duplicate.bind(controller));
}
