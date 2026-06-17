export class MercadoLivreApiService {
  private baseUrl = 'https://api.mercadolibre.com';

  constructor() {}

  async getUserItems(accessToken: string, mlUserId: string): Promise<string[]> {
    const url = `${this.baseUrl}/users/${mlUserId}/items/search`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar itens do usuário: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.results || [];
  }

  async getItemsDetails(accessToken: string, itemIds: string[]): Promise<any[]> {
    if (itemIds.length === 0) return [];
    
    const idsParam = itemIds.join(',');
    const url = `${this.baseUrl}/items?ids=${idsParam}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes dos itens: ${response.statusText}`);
    }

    const data: any[] = await response.json();
    return data.map(item => item.body);
  }

  async getItemVisits(accessToken: string, itemIds: string[]): Promise<Record<string, number>> {
    if (itemIds.length === 0) return {};
    
    const idsParam = itemIds.join(',');
    const url = `${this.baseUrl}/items/visits?ids=${idsParam}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return {};

    const data = await response.json();
    // data is like { "MLA123": 42, "MLA456": 12 }
    return data;
  }

  async createItem(accessToken: string, itemData: any): Promise<any> {
    const url = `${this.baseUrl}/items`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Erro ao criar item no ML: ${JSON.stringify(errorData || response.statusText)}`);
    }

    return await response.json();
  }

  async predictCategory(title: string): Promise<string | null> {
    const url = `${this.baseUrl}/sites/MLB/domain_discovery/search?limit=1&q=${encodeURIComponent(title)}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return data[0].category_id;
    }
    return null;
  }
}
