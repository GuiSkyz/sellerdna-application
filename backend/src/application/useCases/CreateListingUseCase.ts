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
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      resolvedCategoryId = await this.mlApiService.predictCategory(title);
      if (!resolvedCategoryId) {
        throw new Error('Não foi possível inferir a categoria para este produto automaticamente. Informe manualmente.');
      }
    }

    // 3. Transform Product to ML Item Format
    const mlItemPayload = {
      title: title.substring(0, 60), // ML max limit
      category_id: resolvedCategoryId,
      price: price,
      currency_id: 'BRL',
      available_quantity: quantity,
      buying_mode: 'buy_it_now',
      condition: 'new',
      listing_type_id: 'gold_special', // Classic (gold_pro for Premium)
      description: {
        plain_text: description
      },
      pictures: product.imageUrl ? [
        { source: product.imageUrl }
      ] : [],
      attributes: [
        { id: 'ITEM_CONDITION', value_name: 'Novo' }
      ]
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
