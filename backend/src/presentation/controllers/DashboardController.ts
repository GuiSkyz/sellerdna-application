import { FastifyReply, FastifyRequest } from 'fastify';
import { GetDashboardMetricsUseCase } from '../../application/useCases/GetDashboardMetricsUseCase';

export class DashboardController {
  private getDashboardMetricsUseCase: GetDashboardMetricsUseCase;

  constructor() {
    this.getDashboardMetricsUseCase = new GetDashboardMetricsUseCase();
  }

  async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const metrics = await this.getDashboardMetricsUseCase.execute(userId);
      
      return reply.send(metrics);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao carregar métricas do dashboard' });
    }
  }
}
