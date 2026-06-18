import { OptimizeListingUseCase } from './OptimizeListingUseCase';
import { CreateListingUseCase } from './CreateListingUseCase';

export class DuplicateListingUseCase {
  constructor(
    private optimizeListingUseCase: OptimizeListingUseCase,
    private createListingUseCase: CreateListingUseCase
  ) {}

  async execute(userId: string, originalListingId: string, accountToken: string, accountId: string, categoryId: string, useAI: boolean = true): Promise<any> {
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
    const newListing = await this.createListingUseCase.execute({
      userId,
      productId: originalListing.productId,
      accountId,
      accountToken,
      title: finalTitle,
      description: finalDescription,
      price: originalListing.price,
      quantity: originalListing.availableQuantity,
      categoryId
    });

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
