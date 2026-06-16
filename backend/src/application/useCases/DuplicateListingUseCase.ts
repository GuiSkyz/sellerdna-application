import { OptimizeListingUseCase } from './OptimizeListingUseCase';
import { CreateListingUseCase } from './CreateListingUseCase';

export class DuplicateListingUseCase {
  constructor(
    private optimizeListingUseCase: OptimizeListingUseCase,
    private createListingUseCase: CreateListingUseCase
  ) {}

  async execute(userId: string, originalListingId: string, accountToken: string, categoryId: string, useAI: boolean = true): Promise<any> {
    // 1. Fetch original listing from DB
    // const originalListing = await this.listingRepository.findById(originalListingId);

    // Mock data for MVP
    const originalListing = {
      id: originalListingId,
      productId: 'prod-123',
      title: 'Perfume 212 Vip Carolina Herrera',
      price: 450.00,
      availableQuantity: 5,
    };

    // 2. Fetch Base Product Data
    // const product = await this.productRepository.findById(originalListing.productId);
    const productData = {
      name: originalListing.title,
      price: originalListing.price,
      quantity: originalListing.availableQuantity,
    };

    let finalTitle = originalListing.title + ' - Nova Versão'; // fallback
    let finalDescription = '';

    if (useAI) {
      // 3. Use AI to optimize
      const { optimizedTitle, optimizedDescription } = await this.optimizeListingUseCase.execute(productData);
      finalTitle = optimizedTitle;
      finalDescription = optimizedDescription;
    }

    // 4. Create new Listing Payload
    // In a real scenario, CreateListingUseCase would accept the overrides (finalTitle, finalDescription)
    // For this MVP, we simulate passing the new data to ML
    const newListing = await this.createListingUseCase.execute(userId, originalListing.productId, accountToken, categoryId);

    // 5. Update the duplicated listing reference (LISTING_DUPLICATES table)
    // await this.duplicateRepository.create({ originalListingId, newListingId: newListing.id, ... })

    return {
      message: 'Anúncio duplicado com sucesso',
      originalId: originalListing.id,
      newListing: newListing,
      aiGenerated: {
        title: finalTitle,
        description: finalDescription
      }
    };
  }
}
