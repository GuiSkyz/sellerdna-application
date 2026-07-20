import { FastifyInstance } from 'fastify';
import { AgentController } from '../controllers/AgentController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function agentRoutes(app: FastifyInstance) {
  const controller = new AgentController();

  // Internal endpoint for Python microservice to publish directly via Node CreateListingUseCase
  app.post('/internal-publish', controller.internalPublishListing.bind(controller));

  app.addHook('preHandler', authMiddleware);

  app.get('/overview', controller.getOverview.bind(controller));
  app.post('/config', controller.updateConfig.bind(controller));
  app.get('/reports', controller.listReports.bind(controller));
  app.get('/reports/:id', controller.getReportDetail.bind(controller));
  app.get('/actions', controller.listActions.bind(controller));
  app.post('/run-now', controller.triggerRunNow.bind(controller));
  app.post('/generate-audit', controller.generateAudit.bind(controller));
}
