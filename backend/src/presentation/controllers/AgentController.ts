import { FastifyReply, FastifyRequest } from 'fastify';
import { AgentUseCases } from '../../application/useCases/AgentUseCases';

export class AgentController {
  private useCases = new AgentUseCases();

  async getOverview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const data = await this.useCases.getOverview(userId);
      return reply.send(data);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao obter dados do Agente de IA' });
    }
  }

  async updateConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const updates = request.body as any;
      const data = await this.useCases.updateConfig(userId, updates);
      return reply.send({ success: true, config: data });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar configuração do Agente' });
    }
  }

  async listReports(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { limit } = (request.query || {}) as { limit?: number };
      const reports = await this.useCases.listReports(userId, limit ? Number(limit) : 20);
      return reply.send({ reports });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar relatórios do Agente' });
    }
  }

  async getReportDetail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = (request.params || {}) as { id: string };
      const report = await this.useCases.getReportDetail(userId, id);
      return reply.send(report);
    } catch (error) {
      request.log.error(error);
      return reply.status(404).send({ error: 'Relatório não encontrado ou sem permissão' });
    }
  }

  async listActions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { limit } = (request.query || {}) as { limit?: number };
      const actions = await this.useCases.listActions(userId, limit ? Number(limit) : 30);
      return reply.send({ actions });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar ações do Agente' });
    }
  }

  async triggerRunNow(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { target_count } = (request.body || {}) as { target_count?: number };
      const result = await this.useCases.triggerRunNow(userId, target_count || 15);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao executar rotina imediata do Agente' });
    }
  }

  async generateAudit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await this.useCases.generateAudit(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao gerar auditoria do Agente' });
    }
  }

  async internalPublishListing(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = request.body as any;
      if (!payload?.userId || !payload?.productId || !payload?.accountId) {
        return reply.status(400).send({ success: false, error: 'Parâmetros obrigatórios ausentes: userId, productId, accountId' });
      }
      const result = await this.useCases.internalPublishListing(payload);
      return reply.send(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({ success: false, error: error?.message || 'Erro ao publicar no Mercado Livre' });
    }
  }
}
