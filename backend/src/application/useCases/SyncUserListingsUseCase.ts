import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { supabase } from '../../infrastructure/database/supabase';
import { randomUUID } from 'crypto';

export class SyncUserListingsUseCase {
  constructor(private mlApiService: MercadoLivreApiService) {}

  async execute(accountId: string, mlUserId: string, accountToken: string): Promise<any[]> {
    // 1. Fetch item IDs
    const itemIds = await this.mlApiService.getUserItems(accountToken, mlUserId);
    
    if (itemIds.length === 0) return [];

    // 2. Fetch full details (chunking by 20 for ML limits)
    const chunkSize = 20;
    let allItems: any[] = [];
    let allVisits: Record<string, number> = {};
    
    for (let i = 0; i < itemIds.length; i += chunkSize) {
      const chunk = itemIds.slice(i, i + chunkSize);
      const [details, visits] = await Promise.all([
        this.mlApiService.getItemsDetails(accountToken, chunk),
        this.mlApiService.getItemVisits(accountToken, chunk)
      ]);
      allItems = allItems.concat(details);
      allVisits = { ...allVisits, ...visits };
    }

    // 3. Sync to Database
    const syncedListings = allItems.map(mlItem => ({
      id: randomUUID(),
      account_id: accountId,
      ml_item_id: mlItem.id,
      title: mlItem.title,
      price: mlItem.price,
      available_quantity: mlItem.available_quantity,
      sold_quantity: mlItem.sold_quantity || 0,
      visits: allVisits[mlItem.id] || 0,
      health: mlItem.health || 0,
      status: mlItem.status,
      permalink: mlItem.permalink,
      created_at: new Date().toISOString()
    }));

    // Upsert into Supabase (delete old ones to avoid duplicates or use upsert)
    // To simplify for this MVP, we delete the ones that exist and insert again
    // In production we would do an actual upsert matching ml_item_id
    const mlItemIds = syncedListings.map(l => l.ml_item_id);
    await supabase.from('listings').delete().eq('account_id', accountId).in('ml_item_id', mlItemIds);
    
    const { error } = await supabase.from('listings').insert(syncedListings);
    
    if (error) {
      console.error('Error saving listings:', error);
      throw new Error('Falha ao salvar anúncios no banco');
    }

    return syncedListings;
  }
}
