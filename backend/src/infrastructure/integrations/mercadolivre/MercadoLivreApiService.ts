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

  async validateItem(accessToken: string, itemData: any): Promise<{ valid: boolean; error?: string; rawError?: any }> {
    const url = `${this.baseUrl}/items/validate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (response.ok || response.status === 204) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => null);
    console.error('[ML API Validation Error] POST /items/validate response:', JSON.stringify(errorData, null, 2));

    let friendlyMessage = '';
    if (errorData?.cause && Array.isArray(errorData.cause)) {
      const errorMessages = errorData.cause
        .filter((c: any) => c.type !== 'warning')
        .map((c: any) => {
          if (c.code === 'item.attribute.missing_conditional_required' && c.message?.includes('GTIN')) {
            return 'O Mercado Livre exige o código de barras (GTIN/EAN) para publicar produtos nesta categoria.';
          }
          if (c.message && c.code) return `${c.message} (${c.code})`;
          if (c.message) return c.message;
          return c.code;
        })
        .filter(Boolean);

      if (errorMessages.length > 0) {
        friendlyMessage = errorMessages.join(' | ');
      }
    }

    if (!friendlyMessage && errorData?.message) {
      friendlyMessage = `${errorData.message} - Detalhes do ML: ${JSON.stringify(errorData)}`;
    }

    return {
      valid: false,
      error: friendlyMessage || `Validação do Mercado Livre falhou: ${JSON.stringify(errorData)}`,
      rawError: errorData,
    };
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
      console.error('[ML API Error] POST /items response:', JSON.stringify(errorData, null, 2));
      
      let friendlyMessage = '';
      if (errorData?.cause && Array.isArray(errorData.cause)) {
        const errorMessages = errorData.cause
          .filter((c: any) => c.type !== 'warning')
          .map((c: any) => {
            if (c.code === 'item.attribute.missing_conditional_required' && c.message?.includes('GTIN')) {
              return 'O Mercado Livre exige o código de barras (GTIN/EAN) para publicar produtos nesta categoria. Edite o produto e preencha este campo.';
            }
            if (c.message && c.code) return `${c.message} (${c.code})`;
            if (c.message) return c.message;
            return c.code;
          })
          .filter(Boolean);
        
        if (errorMessages.length > 0) {
          friendlyMessage = errorMessages.join(' | ');
        }
      }

      if (!friendlyMessage && errorData?.message) {
        if (typeof errorData.message === 'string' && errorData.message.includes('family_name')) {
          friendlyMessage = 'O Mercado Livre exige a propriedade "family_name" para esta categoria/conta no novo modelo de catálogo (User Products).';
        } else if (errorData.message === 'body.invalid_fields') {
          friendlyMessage = `O Mercado Livre recusou os dados do anúncio (campos inválidos): ${JSON.stringify(errorData)}`;
        } else {
          friendlyMessage = `${errorData.message} - Detalhes do ML: ${JSON.stringify(errorData)}`;
        }
      }

      throw new Error(friendlyMessage ? friendlyMessage : `Erro ao criar anúncio no Mercado Livre: ${JSON.stringify(errorData || response.statusText)}`);
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

  async predictCategoryFull(title: string): Promise<{ id: string, name: string } | null> {
    const url = `${this.baseUrl}/sites/MLB/domain_discovery/search?limit=1&q=${encodeURIComponent(title)}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return { id: data[0].category_id, name: data[0].category_name };
    }
    return null;
  }

  async getCategoryAttributes(categoryId: string): Promise<any[]> {
    const url = `${this.baseUrl}/categories/${categoryId}/attributes`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar atributos da categoria: ${response.statusText}`);
    }
    return await response.json();
  }
}
