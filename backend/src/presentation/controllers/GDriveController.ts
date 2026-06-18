import { FastifyReply, FastifyRequest } from 'fastify';
import { GoogleDriveService } from '../../infrastructure/integrations/googledrive/GoogleDriveService';
import { FetchDriveImagesUseCase } from '../../application/useCases/FetchDriveImagesUseCase';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase';

export class GDriveController {
  private fetchDriveImagesUseCase: FetchDriveImagesUseCase;

  constructor() {
    const gdriveService = new GoogleDriveService();
    const productRepo = new SupabaseProductRepository();
    this.fetchDriveImagesUseCase = new FetchDriveImagesUseCase(gdriveService, productRepo);
  }

  private async getUserId(request: FastifyRequest): Promise<string> {
    return (request as any).user.id;
  }

  async fetchImages(request: FastifyRequest<{ Body: { productId: string } }>, reply: FastifyReply) {
    try {
      const { productId } = request.body;
      const userId = await this.getUserId(request);

      const imageUrls = await this.fetchDriveImagesUseCase.execute({ productId, userId });

      return reply.send({ success: true, imageUrls });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({ error: error.message || 'Erro ao buscar e importar fotos do Google Drive' });
    }
  }

  async saveSettings(request: FastifyRequest<{ Body: { folderId: string } }>, reply: FastifyReply) {
    try {
      const { folderId } = request.body;
      const userId = await this.getUserId(request);

      const { error } = await supabase
        .from('users')
        .update({ drive_folder_id: folderId })
        .eq('id', userId);

      if (error) throw error;

      return reply.send({ success: true });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao salvar configurações do Google Drive' });
    }
  }
}
