import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { randomUUID } from 'crypto';

export class CreateListingUseCase {
  constructor(private mlApiService: MercadoLivreApiService) {}

  async execute(userId: string, productId: string, accountToken: string, categoryId: string): Promise<any> {
    // 1. Fetch Product from DB
    // const product = await this.productRepository.findById(productId);
    
    // Mock Product for MVP
    const product = {
      id: productId,
      name: 'Perfume 212 Vip Carolina Herrera 100ml',
      price: 450.00,
      quantity: 10,
      imageUrl: 'https://example.com/image.jpg'
    };

    // 2. Transform Product to ML Item Format
    const mlItemPayload = {
      title: product.name,
      category_id: categoryId, // ML Category ID (e.g., MLB1234)
      price: product.price,
      currency_id: 'BRL',
      available_quantity: product.quantity,
      buying_mode: 'buy_it_now',
      condition: 'new',
      listing_type_id: 'gold_special', // Classic
      pictures: [
        { source: product.imageUrl }
      ],
      attributes: [
        { id: 'ITEM_CONDITION', value_id: '2230284' } // New
      ]
    };

    // 3. Call ML API
    const mlResponse = await this.mlApiService.createItem(accountToken, mlItemPayload);

    // 4. Save Listing in DB
    const newListing = {
      id: randomUUID(),
      accountId: 'account-uuid', // should come from the user's ML account mapping
      productId: product.id,
      mlItemId: mlResponse.id,
      title: mlResponse.title,
      price: mlResponse.price,
      availableQuantity: mlResponse.available_quantity,
      status: mlResponse.status,
      permalink: mlResponse.permalink,
      createdAt: new Date()
    };

    // await this.listingRepository.create(newListing);

    return newListing;
  }
}
