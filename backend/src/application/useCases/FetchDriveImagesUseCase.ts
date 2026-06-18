import { GoogleDriveService } from '../../infrastructure/integrations/googledrive/GoogleDriveService';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase'; // Assuming direct auth/users access if needed

export interface FetchDriveImagesInput {
  productId: string;
  userId: string;
}

export class FetchDriveImagesUseCase {
  constructor(
    private googleDriveService: GoogleDriveService,
    private productRepository: SupabaseProductRepository
  ) {}

  async execute(input: FetchDriveImagesInput): Promise<string[]> {
    const { productId, userId } = input;

    // 1. Load Product
    const product = await this.productRepository.getById(productId, userId);
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    // 2. Load User's Google Drive Folder ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('drive_folder_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.drive_folder_id) {
      throw new Error('Pasta do Google Drive não configurada. Por favor, acesse Configurações para vincular sua pasta.');
    }

    const driveFolderId = user.drive_folder_id;

    // 3. Extract folder ID if the user pasted a full URL instead of just the ID
    let finalFolderId = driveFolderId;
    const match = driveFolderId.match(/[-\w]{25,}/);
    if (match) {
      finalFolderId = match[0];
    }

    // 4. Find the subfolder matching the product name
    const subfolderId = await this.googleDriveService.findSubfolderByName(finalFolderId, product.name);
    
    if (!subfolderId) {
      throw new Error(`Pasta '${product.name}' não encontrada dentro da sua pasta principal do Drive.`);
    }

    // 5. Fetch images inside that subfolder
    const imageUrls = await this.googleDriveService.getImagesInFolder(subfolderId);

    if (imageUrls.length === 0) {
      throw new Error(`Nenhuma imagem encontrada na pasta '${product.name}'.`);
    }

    if (imageUrls.length < 4) {
      // We don't block it entirely, but Mercado Livre might. We should just return them.
      // Or we can throw an error depending on business rules.
      console.warn(`Atenção: Apenas ${imageUrls.length} imagens encontradas. O Mercado Livre pode exigir 4 ou mais para certos anúncios.`);
    }

    // 6. Update Product in Database
    await this.productRepository.update(productId, userId, { imageUrls });

    return imageUrls;
  }
}
