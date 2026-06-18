import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { randomUUID } from 'crypto';

export interface CreateListingInput {
  userId: string;
  productId: string;
  accountToken: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  categoryId?: string;
}

export class CreateListingUseCase {
  constructor(
    private mlApiService: MercadoLivreApiService,
    private productRepository: SupabaseProductRepository
  ) {}

  async execute(input: CreateListingInput): Promise<any> {
    const { userId, productId, accountToken, title, description, price, quantity, categoryId } = input;

    // 1. Fetch Product from DB to get the Image URL and fallback data
    const product = await this.productRepository.getById(productId, userId);
    
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // 2. Resolve Category ID (Inference if missing)
    let resolvedCategoryId: string | undefined | null = product.mlCategoryId || categoryId;
    if (!resolvedCategoryId) {
      resolvedCategoryId = await this.mlApiService.predictCategory(title);
      if (!resolvedCategoryId) {
        throw new Error('Não foi possível inferir a categoria para este produto automaticamente. Informe manualmente.');
      }
    }

    const attributes: any[] = [];
    if (product.gtin) {
      attributes.push({ id: 'GTIN', value_name: product.gtin });
    }
    if (product.warrantyType && product.warrantyType !== 'Sem garantia') {
      attributes.push({ id: 'WARRANTY_TYPE', value_name: product.warrantyType });
      if (product.warrantyTime) {
        attributes.push({ id: 'WARRANTY_TIME', value_name: product.warrantyTime });
      }
    }

    if (product.mlAttributes) {
      for (const [key, value] of Object.entries(product.mlAttributes)) {
        if (value && String(value).trim() !== '') {
          attributes.push({ id: key, value_name: String(value) });
        }
      }
    }

    // Helper function to format image URL (handles Google Drive links)
    const formatImageUrl = (url: string) => {
      let fileId = null;
      if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      } else if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      }
      
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      return url;
    };

    // 3. Transform Product to ML Item Format
    let mlPictures: { source: string }[] = [];
    if (product.imageUrls && product.imageUrls.length > 0) {
      mlPictures = product.imageUrls.map(url => ({ source: formatImageUrl(url) }));
    } else if (product.imageUrl) {
      mlPictures = [{ source: formatImageUrl(product.imageUrl) }];
    }

    const mlItemPayload = {
      title: title.substring(0, 60), // ML max limit
      category_id: resolvedCategoryId as string,
      price: price,
      currency_id: 'BRL',
      available_quantity: quantity,
      buying_mode: 'buy_it_now',
      condition: product.condition === 'Usado' ? 'used' : 'new',
      listing_type_id: product.listingTypeId || 'gold_special',
      description: {
        plain_text: description
      },
      pictures: mlPictures.length > 0 ? mlPictures : [],
      attributes: attributes.length > 0 ? attributes : undefined
    };

    // 4. Call ML API
    const mlResponse = await this.mlApiService.createItem(accountToken, mlItemPayload);

    // 5. Build Local Record
    const newListing = {
      id: randomUUID(),
      accountId: 'account-uuid', // To be properly mapped
      productId: product.id,
      mlItemId: mlResponse.id,
      title: mlResponse.title,
      price: mlResponse.price,
      availableQuantity: mlResponse.available_quantity,
      status: mlResponse.status,
      permalink: mlResponse.permalink,
      createdAt: new Date()
    };

    // await this.listingRepository.create(newListing); // TODO: save to DB

    return newListing;
  }
}
