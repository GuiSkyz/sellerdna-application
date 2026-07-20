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

    // 3. Consultar vínculos existentes no banco para preservar product_id e ID
    const mlItemIds = allItems.map(item => item.id);
    const { data: existingListings } = await supabase
      .from('listings')
      .select('id, ml_item_id, product_id')
      .eq('account_id', accountId)
      .in('ml_item_id', mlItemIds);

    const existingProductMap = new Map<string, string>();
    const existingIdMap = new Map<string, string>();
    if (existingListings) {
      for (const l of existingListings) {
        if (l.id) existingIdMap.set(l.ml_item_id, l.id);
        if (l.product_id) existingProductMap.set(l.ml_item_id, l.product_id);
      }
    }

    // 4. Consultar produtos do usuário para tentar Auto-vínculo Inteligente de novos itens
    const { data: account } = await supabase
      .from('mercadolivre_accounts')
      .select('user_id')
      .eq('id', accountId)
      .single();

    let userProducts: any[] = [];
    if (account?.user_id) {
      const { data: prods } = await supabase
        .from('products')
        .select('id, sku, custom_id, gtin, name')
        .eq('user_id', account.user_id);
      if (prods) userProducts = prods;
    }

    // 5. Montar lista final com product_id preservado ou resolvido via Auto-vínculo
    const syncedListings = allItems.map(mlItem => {
      let resolvedProductId: string | null = existingProductMap.get(mlItem.id) || null;

      if (!resolvedProductId && userProducts.length > 0) {
        let itemSku: string | undefined = mlItem.seller_custom_field;
        let itemGtin: string | undefined;
        if (Array.isArray(mlItem.attributes)) {
          for (const attr of mlItem.attributes) {
            if (attr.id === 'SELLER_SKU' && attr.value_name) itemSku = String(attr.value_name).trim();
            if (attr.id === 'GTIN' && attr.value_name) itemGtin = String(attr.value_name).trim();
          }
        }

        let matchedProduct = null;
        // 1. Match por SKU ou Custom ID
        if (itemSku && itemSku !== '') {
          matchedProduct = userProducts.find(p => 
            (p.sku && p.sku.trim() === itemSku) || 
            (p.custom_id && p.custom_id.trim() === itemSku)
          );
        }
        // 2. Match por GTIN
        if (!matchedProduct && itemGtin && itemGtin !== '' && itemGtin.toLowerCase() !== 'null') {
          matchedProduct = userProducts.find(p => p.gtin && p.gtin.trim() === itemGtin);
        }
        // 3. Match por Título
        if (!matchedProduct && mlItem.title) {
          const cleanItemTitle = mlItem.title.trim().toLowerCase();
          matchedProduct = userProducts.find(p => p.name && p.name.trim().toLowerCase() === cleanItemTitle);
        }

        if (matchedProduct) {
          resolvedProductId = matchedProduct.id;
        }
      }

      return {
        id: existingIdMap.get(mlItem.id) || randomUUID(),
        account_id: accountId,
        product_id: resolvedProductId,
        ml_item_id: mlItem.id,
        title: mlItem.title,
        price: mlItem.price,
        available_quantity: mlItem.available_quantity,
        sold_quantity: mlItem.sold_quantity || 0,
        visits: allVisits[mlItem.id] || 0,
        health: mlItem.health || 0,
        status: mlItem.status,
        permalink: mlItem.permalink,
        pictures: mlItem.pictures || null,
        attributes: mlItem.attributes || null,
        created_at: new Date().toISOString()
      };
    });

    // Substituir no Supabase preservando product_id
    await supabase.from('listings').delete().eq('account_id', accountId).in('ml_item_id', mlItemIds);
    
    const { error } = await supabase.from('listings').insert(syncedListings);
    
    if (error) {
      console.error('Error saving listings:', error);
      throw new Error('Falha ao salvar anúncios no banco');
    }

    return syncedListings;
  }
}
