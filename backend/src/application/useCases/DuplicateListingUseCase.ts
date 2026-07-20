import { OptimizeListingUseCase } from './OptimizeListingUseCase';
import { CreateListingUseCase } from './CreateListingUseCase';
import { supabase } from '../../infrastructure/database/supabase';
import { randomUUID } from 'crypto';

export class DuplicateListingUseCase {
  constructor(
    private optimizeListingUseCase: OptimizeListingUseCase,
    private createListingUseCase: CreateListingUseCase
  ) {}

  async execute(userId: string, originalListingId: string, accountToken: string, accountId: string, categoryId: string, useAI: boolean = true): Promise<any> {
    // 1. Fetch original listing from DB
    const { data: originalListing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', originalListingId)
      .single();

    if (listingError || !originalListing) {
      throw new Error('Anúncio original não encontrado no banco de dados');
    }

    if (!originalListing.product_id) {
      throw new Error('O anúncio original precisa estar conectado a um produto antes de ser duplicado.');
    }

    // 2. Fetch Base Product Data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', originalListing.product_id)
      .eq('user_id', userId)
      .single();

    if (productError || !product) {
      throw new Error('Produto associado ao anúncio original não foi encontrado.');
    }

    const productData = {
      name: originalListing.title,
      price: Number(originalListing.price),
      quantity: Number(originalListing.available_quantity) || 1,
      brand: product.brand,
      sizeMl: product.size_ml,
      perfumeType: product.perfume_type,
    };

    let finalTitle = originalListing.title + ' - Nova Versão';
    let finalDescription = '';

    if (useAI) {
      // 3. Use AI to optimize
      const { optimizedTitle, optimizedDescription } = await this.optimizeListingUseCase.execute(productData);
      finalTitle = optimizedTitle;
      finalDescription = optimizedDescription;
    }

    // 4. Create new Listing Payload (maintaining product_id connection)
    const newListing = await this.createListingUseCase.execute({
      userId,
      productId: originalListing.product_id,
      accountId,
      accountToken,
      title: finalTitle,
      description: finalDescription,
      price: Number(originalListing.price),
      quantity: Number(originalListing.available_quantity) || 1,
      categoryId
    });

    // 5. Update the duplicated listing reference (LISTING_DUPLICATES table)
    await supabase.from('listing_duplicates').insert({
      id: randomUUID(),
      original_listing_id: originalListing.id,
      new_listing_id: newListing.id,
      new_title: finalTitle,
      new_description: finalDescription,
      status: 'DONE',
      created_at: new Date().toISOString()
    });

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
