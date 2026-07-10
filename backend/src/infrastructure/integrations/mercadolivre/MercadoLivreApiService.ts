/** Mapeamento de códigos de erro comuns do ML para mensagens em português com ações sugeridas */
const ML_ERROR_TRANSLATIONS: Record<string, string> = {
  'item.attribute.missing_required': 'Atributo obrigatório faltando. Verifique o cadastro do produto.',
  'item.attribute.missing_conditional_required': 'Atributo condicionalmente obrigatório faltando.',
  'item.attribute.invalid_value': 'Valor inválido para um atributo.',
  'item.category_id.invalid': 'Categoria inválida. Selecione outra categoria.',
  'item.price.invalid': 'Preço inválido. Verifique o valor informado.',
  'item.available_quantity.invalid': 'Quantidade inválida.',
  'item.pictures.invalid': 'Imagem inválida. Verifique a URL ou formato da imagem.',
  'item.pictures.min_quantity': 'O anúncio precisa ter pelo menos 1 imagem.',
  'item.title.invalid': 'Título inválido para esta categoria.',
  'body.invalid_fields': 'Campos inválidos no corpo da requisição.',
};

/** Nomes amigáveis para atributos comuns do ML */
const ATTRIBUTE_FRIENDLY_NAMES: Record<string, string> = {
  'BRAND': 'Marca',
  'MODEL': 'Modelo',
  'GTIN': 'Código de Barras (GTIN/EAN)',
  'COLOR': 'Cor',
  'SIZE': 'Tamanho',
  'WEIGHT': 'Peso',
  'HEIGHT': 'Altura',
  'WIDTH': 'Largura',
  'LENGTH': 'Comprimento',
  'MATERIAL': 'Material',
  'WARRANTY_TYPE': 'Tipo de Garantia',
  'WARRANTY_TIME': 'Tempo de Garantia',
  'SELLER_SKU': 'SKU do Vendedor',
  'PACKAGE_WEIGHT': 'Peso do Pacote',
  'PACKAGE_HEIGHT': 'Altura do Pacote',
  'PACKAGE_WIDTH': 'Largura do Pacote',
  'PACKAGE_LENGTH': 'Comprimento do Pacote',
  'UNITS_PER_PACK': 'Unidades por Pacote',
  'ALPHANUMERIC_MODEL': 'Modelo Alfanumérico',
  'LINE': 'Linha',
  'FRAGRANCE_NAME': 'Nome da Fragrância',
  'PERFUME_TYPE': 'Tipo de Perfume',
  'GENDER': 'Gênero',
  'VOLUME': 'Volume',
  'FAMILY_NAME': 'Nome da Família do Produto (Catálogo)',
};

export interface CategoryAttributeInfo {
  id: string;
  name: string;
  required: boolean;
  tags: Record<string, any>;
  values?: { id: string; name: string }[];
  type: string;
  default_value?: string;
}

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

  /**
   * Busca os atributos obrigatórios de uma categoria do Mercado Livre.
   * Retorna informações sobre quais atributos são obrigatórios (required),
   * se a categoria usa o modelo User Products (family_name), e quais
   * valores são aceitos para cada atributo.
   */
  async getCategoryRequiredInfo(categoryId: string): Promise<{
    requiredAttributes: CategoryAttributeInfo[];
    usesUserProductsModel: boolean;
    allAttributes: CategoryAttributeInfo[];
  }> {
    try {
      const allAttrs = await this.getCategoryAttributes(categoryId);

      const requiredAttributes: CategoryAttributeInfo[] = [];
      let usesUserProductsModel = false;

      for (const attr of allAttrs) {
        // Verificar se é atributo obrigatório (required ou conditional_required não-warning)
        const isRequired =
          attr.tags?.required === true ||
          attr.tags?.conditional_required === true ||
          attr.tags?.catalog_required === true;

        if (isRequired) {
          requiredAttributes.push({
            id: attr.id,
            name: attr.name || attr.id,
            required: true,
            tags: attr.tags || {},
            values: attr.values,
            type: attr.value_type || 'string',
            default_value: attr.default_value,
          });
        }

        // Detectar modelo User Products — se existir FAMILY_NAME como atributo
        if (attr.id === 'FAMILY_NAME') {
          usesUserProductsModel = true;
        }
      }

      return { requiredAttributes, usesUserProductsModel, allAttributes: allAttrs };
    } catch (error) {
      console.warn(`[ML API] Não foi possível buscar atributos da categoria ${categoryId}:`, error);
      return { requiredAttributes: [], usesUserProductsModel: false, allAttributes: [] };
    }
  }

  /**
   * Formata erros da API do Mercado Livre em mensagens amigáveis e acionáveis.
   * Extrai detalhes do array cause[] e traduz códigos de erro para português.
   */
  private formatMLErrors(errorData: any): string {
    if (!errorData) return '';

    const messages: string[] = [];

    // 1. Extrair erros do array cause[]
    if (errorData.cause && Array.isArray(errorData.cause)) {
      for (const cause of errorData.cause) {
        if (cause.type === 'warning') continue;

        const code = cause.code || '';
        const rawMessage = cause.message || '';
        const references = cause.references || [];

        // Detectar atributo faltante e traduzir
        if (code.includes('missing') && code.includes('required')) {
          // Extrair nome do atributo da mensagem ou references
          const attrMatch = rawMessage.match(/\[([A-Z_]+)\]/);
          const attrId = attrMatch ? attrMatch[1] : (references[0] || '');
          const friendlyName = ATTRIBUTE_FRIENDLY_NAMES[attrId] || attrId;

          if (attrId === 'GTIN') {
            messages.push(`O Mercado Livre exige o código de barras (GTIN/EAN) para esta categoria. Edite o produto e preencha este campo.`);
          } else if (friendlyName) {
            messages.push(`Atributo obrigatório faltando: "${friendlyName}" (${attrId}). Edite o produto e preencha este campo.`);
          } else {
            messages.push(`Atributo obrigatório faltando: ${rawMessage} (${code})`);
          }
          continue;
        }

        // Detectar valor inválido
        if (code.includes('invalid_value') || code.includes('invalid')) {
          const attrMatch = rawMessage.match(/\[([A-Z_]+)\]/);
          const attrId = attrMatch ? attrMatch[1] : '';
          const friendlyName = ATTRIBUTE_FRIENDLY_NAMES[attrId] || attrId;
          if (friendlyName) {
            messages.push(`Valor inválido para o atributo "${friendlyName}": ${rawMessage}`);
          } else {
            messages.push(rawMessage || ML_ERROR_TRANSLATIONS[code] || code);
          }
          continue;
        }

        // Fallback para outros códigos
        const translated = ML_ERROR_TRANSLATIONS[code];
        if (translated) {
          messages.push(`${translated} ${rawMessage ? `(${rawMessage})` : ''}`);
        } else if (rawMessage && code) {
          messages.push(`${rawMessage} (${code})`);
        } else if (rawMessage) {
          messages.push(rawMessage);
        } else if (code) {
          messages.push(code);
        }
      }
    }

    // 2. Fallback: mensagem de nível superior (error + message)
    if (messages.length === 0 && errorData.message) {
      if (typeof errorData.message === 'string' && errorData.message.includes('family_name')) {
        messages.push('Esta categoria usa o modelo de catálogo "User Products" do Mercado Livre. O sistema tentará ajustar automaticamente.');
      } else if (errorData.message === 'body.invalid_fields') {
        // Extrair campos inválidos se disponíveis
        const invalidFields = errorData.fields || [];
        if (invalidFields.length > 0) {
          messages.push(`Campos inválidos no corpo da requisição: ${invalidFields.join(', ')}. Verifique se os dados estão corretos.`);
        } else {
          messages.push(`O Mercado Livre rejeitou campos do anúncio. Detalhes: ${JSON.stringify(errorData)}`);
        }
      } else {
        const errorLabel = errorData.error ? `${errorData.error}: ` : '';
        messages.push(`${errorLabel}${errorData.message}`);
      }
    }

    return messages.join(' | ');
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

    const friendlyMessage = this.formatMLErrors(errorData);

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
      
      const friendlyMessage = this.formatMLErrors(errorData);

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
