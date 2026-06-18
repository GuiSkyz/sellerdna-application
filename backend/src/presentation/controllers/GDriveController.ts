import { FastifyReply, FastifyRequest } from 'fastify';
import { GoogleDriveService } from '../../infrastructure/integrations/google/GoogleDriveService';
import { ImportPhotosFromDriveUseCase } from '../../application/useCases/ImportPhotosFromDriveUseCase';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase';

export class GDriveController {
  private gdriveService: GoogleDriveService;
  private importPhotosUseCase: ImportPhotosFromDriveUseCase;

  constructor() {
    this.gdriveService = new GoogleDriveService();
    const productRepo = new SupabaseProductRepository();
    this.importPhotosUseCase = new ImportPhotosFromDriveUseCase(this.gdriveService, productRepo);
  }

  private async getUserId(request: FastifyRequest): Promise<string> {
    return (request as any).user.id;
  }

  async auth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const url = this.gdriveService.getAuthUrl(userId);
      return reply.send({ url });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao gerar URL de autenticação do Google' });
    }
  }

  async callback(request: FastifyRequest<{ Querystring: { code: string, state: string } }>, reply: FastifyReply) {
    try {
      const { code, state: userId } = request.query;
      
      if (!code || !userId) {
        return reply.status(400).send({ error: 'Código ou usuário inválido' });
      }

      const tokens = await this.gdriveService.getTokens(code);

      // Salvar os tokens no Supabase na tabela de integrações ou no usuário
      // Para este MVP, vamos criar uma tabela user_integrations ou usar a accounts_google.
      // Vamos assumir que a migration existirá ou salvaremos em JSONB no user.
      const { error } = await supabase
        .from('google_integrations')
        .upsert({ user_id: userId, tokens: tokens, updated_at: new Date() }, { onConflict: 'user_id' });

      if (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Erro ao salvar integração com o Google' });
      }

      // Redireciona de volta pro frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return reply.redirect(`${frontendUrl}/settings?gdrive=success`);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro no callback do Google' });
    }
  }

  async importPhotos(request: FastifyRequest<{ Body: { productId: string } }>, reply: FastifyReply) {
    try {
      const { productId } = request.body;
      const userId = await this.getUserId(request);

      const { data: integration } = await supabase
        .from('google_integrations')
        .select('tokens')
        .eq('user_id', userId)
        .single();

      if (!integration || !integration.tokens) {
        return reply.status(400).send({ error: 'Conta do Google Drive não conectada' });
      }

      const result = await this.importPhotosUseCase.execute(userId, productId, integration.tokens);

      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar e importar fotos do Google Drive' });
    }
  }

  async status(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      
      const { data: integration, error } = await supabase
        .from('google_integrations')
        .select('updated_at')
        .eq('user_id', userId)
        .single();

      if (error || !integration) {
        return reply.send({ connected: false });
      }

      return reply.send({ connected: true, updatedAt: integration.updated_at });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao verificar status do Google Drive' });
    }
  }
}
