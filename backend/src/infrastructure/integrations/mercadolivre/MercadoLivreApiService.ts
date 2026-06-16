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
    
    // ML API allows up to 20 ids per request on /items?ids=...
    // For simplicity in this MVP, assuming itemIds length <= 20
    const idsParam = itemIds.join(',');
    const url = `${this.baseUrl}/items?ids=${idsParam}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes dos itens: ${response.statusText}`);
    }

    const data: any[] = await response.json();
    return data.map(item => item.body); // ML returns [{ code: 200, body: {...} }]
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
}
