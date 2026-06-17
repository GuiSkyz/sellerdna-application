import { FastifyInstance } from 'fastify';
import { MLAuthController } from '../controllers/MLAuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function mlRoutes(app: FastifyInstance) {
  const controller = new MLAuthController();

  app.get('/auth-url', { preHandler: [authMiddleware] }, controller.getAuthUrl.bind(controller));
  app.get('/accounts', { preHandler: [authMiddleware] }, controller.listAccounts.bind(controller));
  
  // Public routes (Called by Mercado Livre API)
  app.get('/callback', controller.callback.bind(controller));
  app.post('/exchange-token', controller.exchangeToken.bind(controller));
  app.post('/notifications', controller.notifications.bind(controller));
}
