import { GoogleDriveService } from '../../infrastructure/integrations/google/GoogleDriveService';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase';
import { randomUUID } from 'crypto';

export class ImportPhotosFromDriveUseCase {
  constructor(
    private gdriveService: GoogleDriveService,
    private productRepository: SupabaseProductRepository
  ) {}

  async execute(userId: string, productId: string, tokens: any): Promise<any> {
    const product = await this.productRepository.getById(productId, userId);
    if (!product) throw new Error('Produto não encontrado');

    const folderName = product.name;
    const folderId = await this.gdriveService.searchFolderByName(tokens, folderName);

    if (!folderId) {
      throw new Error(`Pasta não encontrada no Google Drive para o produto: ${folderName}`);
    }

    const files = await this.gdriveService.listImagesInFolder(tokens, folderId);

    if (files.length === 0) {
      throw new Error('Nenhuma imagem encontrada na pasta do produto');
    }

    // Pega a primeira imagem (ou podemos pegar várias, dependendo do design)
    const fileToUpload = files[0];
    
    if (!fileToUpload.id) throw new Error('Arquivo de imagem inválido');

    const { stream, mimeType } = await this.gdriveService.downloadImage(tokens, fileToUpload.id);

    // Upload Stream directly to Supabase Storage
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const filePath = `${userId}/${productId}/${randomUUID()}.${ext}`;

    // Precisamos de um buffer, pois a API do Supabase Storage JS 
    // lida melhor com Buffer, ArrayBuffer ou Blob.
    const buffer = await this.streamToBuffer(stream);

    const { data, error } = await supabase
      .storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Erro ao subir imagem no Supabase: ${error.message}`);
    }

    // Gerar Public URL
    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Atualizar no banco
    const updatedProduct = { ...product, imageUrl: publicUrl };
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', productId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Erro ao salvar URL da imagem no banco de dados');
    }

    return {
      message: 'Foto importada com sucesso do Google Drive',
      imageUrl: publicUrl
    };
  }

  private streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
