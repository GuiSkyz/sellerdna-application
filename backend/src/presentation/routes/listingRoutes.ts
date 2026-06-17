import { FastifyInstance } from 'fastify';
import { ListingController } from '../controllers/ListingController';

export async function listingRoutes(app: FastifyInstance) {
  const controller = new ListingController();

  app.get('/', controller.list.bind(controller));
  app.post('/sync', controller.sync.bind(controller));
  app.post('/', controller.create.bind(controller));
  app.post('/:id/duplicate', controller.duplicate.bind(controller));
}
