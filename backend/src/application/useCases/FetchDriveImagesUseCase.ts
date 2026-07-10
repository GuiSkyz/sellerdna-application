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
      throw new Error(`Não encontrado pasta do produto "${product.name}" no Google Drive.`);
    }

    // 5. Fetch images files inside that subfolder
    const driveFiles = await this.googleDriveService.getImagesFiles(subfolderId);

    if (driveFiles.length === 0) {
      throw new Error(`Não encontrado imagens na pasta do produto "${product.name}" no Google Drive.`);
    }

    if (driveFiles.length < 4) {
      console.warn(`Atenção: Apenas ${driveFiles.length} imagens encontradas. O Mercado Livre pode exigir 4 ou mais para certos anúncios.`);
    }

    // 6. Download from Drive and upload to Supabase Storage
    const imageUrls: string[] = [];
    
    for (const driveFile of driveFiles) {
      try {
        const cleanName = driveFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const extension = cleanName.includes('.') ? '' : '.jpg';
        const filePath = `${userId}/${productId}/${driveFile.id}${extension}`;

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        const expectedUrl = publicUrlData?.publicUrl;

        // Se a imagem já existe no produto atual com esta mesma URL do Supabase, nós a reutilizamos e pulamos o download
        if (expectedUrl && product.imageUrls?.includes(expectedUrl)) {
          imageUrls.push(expectedUrl);
          continue;
        }

        const buffer = await this.googleDriveService.downloadFileAsBuffer(driveFile.id);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, buffer, {
            contentType: driveFile.mimeType || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Erro ao fazer upload para o Supabase Storage:', uploadError);
          continue;
        }

        if (expectedUrl) {
          imageUrls.push(expectedUrl);
        }
      } catch (e) {
        console.error(`Falha ao processar arquivo ${driveFile.name}:`, e);
      }
    }

    if (imageUrls.length === 0) {
      throw new Error('Falha ao fazer upload das imagens para o servidor.');
    }

    // 7. Update Product in Database
    await this.productRepository.update(productId, userId, { 
      imageUrls,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined 
    });

    return imageUrls;
  }
}
