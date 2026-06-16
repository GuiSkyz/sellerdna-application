import { FastifyInstance } from 'fastify';
import { MLAuthController } from '../controllers/MLAuthController';

export async function mlRoutes(app: FastifyInstance) {
  const controller = new MLAuthController();

  app.get('/auth-url', controller.getAuthUrl.bind(controller));
  app.get('/callback', controller.callback.bind(controller));
  app.post('/exchange-token', controller.exchangeToken.bind(controller));
  app.post('/notifications', controller.notifications.bind(controller));
}
