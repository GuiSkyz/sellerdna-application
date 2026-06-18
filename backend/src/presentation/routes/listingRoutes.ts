import { FastifyInstance } from 'fastify';
import { ListingController } from '../controllers/ListingController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function listingRoutes(app: FastifyInstance) {
  const controller = new ListingController();

  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.list.bind(controller));
  app.post('/sync', controller.sync.bind(controller));
  app.post('/', controller.create.bind(controller));
  app.post('/:id/duplicate', controller.duplicate.bind(controller));
  app.post('/bulk-publish', controller.bulkPublish.bind(controller));
}
