import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { productRoutes } from './presentation/routes/productRoutes';
import { mlRoutes } from './presentation/routes/mlRoutes';
import { listingRoutes } from './presentation/routes/listingRoutes';
import { dashboardRoutes } from './presentation/routes/dashboardRoutes';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const allowedOrigins = ['http://localhost:3000'];
  if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

  await app.register(cors, {
    origin: allowedOrigins,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Registre as rotas aqui
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(mlRoutes, { prefix: '/api/ml' });
  await app.register(listingRoutes, { prefix: '/api/listings' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });

  return app;
}
