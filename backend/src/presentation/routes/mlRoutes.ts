import { FastifyInstance } from 'fastify';
import { MLAuthController } from '../controllers/MLAuthController';
import { MLCategoryController } from '../controllers/MLCategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function mlRoutes(app: FastifyInstance) {
  const authController = new MLAuthController();
  const categoryController = new MLCategoryController();

  app.get('/auth-url', { preHandler: [authMiddleware] }, authController.getAuthUrl.bind(authController));
  app.get('/accounts', { preHandler: [authMiddleware] }, authController.listAccounts.bind(authController));
  
  // Public routes (Called by Mercado Livre API)
  app.get('/callback', authController.callback.bind(authController));
  app.post('/exchange-token', authController.exchangeToken.bind(authController));
  app.post('/notifications', authController.notifications.bind(authController));

  // Category & Attributes routes (Called by authenticated frontend)
  app.get('/categories/predict', { preHandler: [authMiddleware] }, categoryController.predict.bind(categoryController));
  app.get('/categories/:id/attributes', { preHandler: [authMiddleware] }, categoryController.getAttributes.bind(categoryController));
}
