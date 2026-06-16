import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/DashboardController';

export async function dashboardRoutes(app: FastifyInstance) {
  const controller = new DashboardController();

  app.get('/metrics', controller.getMetrics.bind(controller));
}
