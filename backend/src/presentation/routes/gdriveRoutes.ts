import { FastifyInstance } from 'fastify';
import { GDriveController } from '../controllers/GDriveController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function gdriveRoutes(app: FastifyInstance) {
  const controller = new GDriveController();

  // Rotas que não precisam do token Bearer do nosso app, 
  // pois o Google vai redirecionar de volta.
  // Porém, auth é enviado via state ou query se possível, mas 
  // para simplificar, usaremos o state no callback.
  app.get('/auth', { preHandler: authMiddleware }, controller.auth.bind(controller));
  app.get<{ Querystring: { code: string, state: string } }>('/callback', controller.callback.bind(controller));

  app.get('/status', { preHandler: authMiddleware }, controller.status.bind(controller));
  
  // Rota para disparar a busca de fotos e upload
  app.post<{ Body: { productId: string } }>('/import-photos', { preHandler: authMiddleware }, controller.importPhotos.bind(controller));
}
