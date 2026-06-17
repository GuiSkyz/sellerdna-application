import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function dashboardRoutes(app: FastifyInstance) {
  const controller = new DashboardController();

  app.addHook('preHandler', authMiddleware);

  app.get('/metrics', controller.getMetrics.bind(controller));
}
