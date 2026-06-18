import { FastifyInstance } from 'fastify';
import { GDriveController } from '../controllers/GDriveController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function gdriveRoutes(app: FastifyInstance) {
  const controller = new GDriveController();

  app.post<{ Body: { productId: string } }>('/fetch-images', { preHandler: authMiddleware }, controller.fetchImages.bind(controller));
  
  app.post<{ Body: { folderId: string } }>('/settings', { preHandler: authMiddleware }, controller.saveSettings.bind(controller));
}
