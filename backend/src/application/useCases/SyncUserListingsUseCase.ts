import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { randomUUID } from 'crypto';

export class SyncUserListingsUseCase {
  constructor(private mlApiService: MercadoLivreApiService) {}

  async execute(userId: string, mlUserId: string, accountToken: string): Promise<any[]> {
    // 1. Fetch item IDs
    const itemIds = await this.mlApiService.getUserItems(accountToken, mlUserId);
    
    if (itemIds.length === 0) return [];

    // 2. Fetch full details (chunking by 20 for ML limits)
    const chunkSize = 20;
    let allItems: any[] = [];
    
    for (let i = 0; i < itemIds.length; i += chunkSize) {
      const chunk = itemIds.slice(i, i + chunkSize);
      const details = await this.mlApiService.getItemsDetails(accountToken, chunk);
      allItems = allItems.concat(details);
    }

    // 3. Sync to Database
    const syncedListings = allItems.map(mlItem => ({
      id: randomUUID(), // In a real scenario, we'd check if mlItemId already exists to Update instead of Insert
      accountId: 'account-uuid', // Should be the actual account ID from DB
      mlItemId: mlItem.id,
      title: mlItem.title,
      price: mlItem.price,
      availableQuantity: mlItem.available_quantity,
      status: mlItem.status,
      permalink: mlItem.permalink,
      createdAt: new Date()
    }));

    // TODO: Upsert into listingRepository
    // await this.listingRepository.upsertMany(syncedListings);

    return syncedListings;
  }
}
