import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase';
import { randomUUID } from 'crypto';

export interface CreateListingInput {
  userId: string;
  productId: string;
  accountId: string;
  accountToken: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  categoryId?: string;
}

/**
 * Mapeamento de campos do produto local para atributos do Mercado Livre.
 * Usado para preencher automaticamente os atributos obrigatórios da categoria.
 */
const PRODUCT_TO_ML_ATTRIBUTE_MAP: Record<string, (product: any) => string | undefined> = {
  'BRAND': (p) => p.brand,
  'GTIN': (p) => p.gtin,
  'COLOR': (p) => p.color,
  'SIZE': (p) => p.size || p.sizeMl,
  'WEIGHT': (p) => p.weight ? String(p.weight) : undefined,
  'SELLER_SKU': (p) => p.sku,
  'WARRANTY_TYPE': (p) => (p.warrantyType && p.warrantyType !== 'Sem garantia') ? p.warrantyType : undefined,
  'WARRANTY_TIME': (p) => p.warrantyTime,
  'GENDER': (p) => p.gender,
  'PERFUME_TYPE': (p) => p.perfumeType,
  'VOLUME': (p) => p.sizeMl ? `${p.sizeMl} ml` : undefined,
  'LINE': (p) => p.line,
  'MODEL': (p) => p.model,
  'FRAGRANCE_NAME': (p) => p.name,
};

export class CreateListingUseCase {
  constructor(
    private mlApiService: MercadoLivreApiService,
    private productRepository: SupabaseProductRepository
  ) {}

  async execute(input: CreateListingInput): Promise<any> {
    const { userId, productId, accountId, accountToken, title, description, price, quantity, categoryId } = input;

    // 1. Fetch Product from DB to get the Image URL and fallback data
    const product = await this.productRepository.getById(productId, userId);
    
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // 2. Resolve Category ID (Inference if missing)
    let resolvedCategoryId: string | undefined | null = product.mlCategoryId || categoryId;
    if (resolvedCategoryId) {
      const trimmed = resolvedCategoryId.trim().toUpperCase();
      const match = trimmed.match(/(ML[A-Z])-?(\d+)/);
      if (match) {
        resolvedCategoryId = `${match[1]}${match[2]}`;
      } else if (/^\d+$/.test(trimmed)) {
        resolvedCategoryId = `MLB${trimmed}`;
      } else {
        resolvedCategoryId = trimmed;
      }
    }
    if (!resolvedCategoryId) {
      resolvedCategoryId = await this.mlApiService.predictCategory(title);
      if (!resolvedCategoryId) {
        throw new Error('Não foi possível inferir a categoria para este produto automaticamente. Informe manualmente.');
      }
    }

    // 3. Buscar atributos obrigatórios da categoria PROATIVAMENTE
    const categoryInfo = await this.mlApiService.getCategoryRequiredInfo(resolvedCategoryId as string);

    // 4. Montar atributos com base nos dados do produto + atributos obrigatórios da categoria
    const attributes = this.buildAttributes(product, categoryInfo.requiredAttributes);

    // Helper function to format image URL (handles Google Drive links)
    const formatImageUrl = (url: string) => {
      let fileId = null;
      if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      } else if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      }
      
      if (fileId) {
        // Return a direct image link format that is fast and works reliably with third-party automated fetches
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
      return url;
    };

    // 5. Transform Product to ML Item Format (imagens)
    let mlPictures: { source: string }[] = [];
    if (product.imageUrls && product.imageUrls.length > 0) {
      mlPictures = product.imageUrls.map(url => ({ source: formatImageUrl(url) }));
    } else if (product.imageUrl) {
      mlPictures = [{ source: formatImageUrl(product.imageUrl) }];
    }

    if (mlPictures.length === 0) {
      throw new Error('O produto precisa ter pelo menos 1 imagem cadastrada para ser publicado no Mercado Livre.');
    }

    // 6. Montar o payload correto com base no modelo da categoria
    const mlItemPayload: any = {
      category_id: resolvedCategoryId as string,
      price: Number(price),
      currency_id: 'BRL',
      available_quantity: Number(quantity) || 1,
      buying_mode: 'buy_it_now',
      condition: product.condition === 'Usado' ? 'used' : 'new',
      listing_type_id: product.listingTypeId || 'gold_special',
      pictures: mlPictures,
      attributes: attributes.length > 0 ? attributes : undefined,
      shipping: {
        mode: 'me2',
        local_pick_up: false,
        free_shipping: false
      }
    };

    // Decisão proativa: Se a categoria usa modelo User Products, enviar family_name ao invés de title
    if (categoryInfo.usesUserProductsModel) {
      mlItemPayload.family_name = title.substring(0, 60);
      console.log(`[CreateListing] Categoria ${resolvedCategoryId} usa modelo User Products. Usando family_name ao invés de title.`);
    } else {
      mlItemPayload.title = title.substring(0, 60); // ML max limit
    }

    // 7. Pré-validação oficial na API do Mercado Livre (/items/validate) antes de publicar
    let payloadToCreate = { ...mlItemPayload };
    const initialValidation = await this.mlApiService.validateItem(accountToken, payloadToCreate);

    if (!initialValidation.valid) {
      const errorStr = String(initialValidation.error || '');
      const rawErrStr = JSON.stringify(initialValidation.rawError || {});

      // Verificar se o erro é sobre title/family_name (caso a detecção proativa tenha falhado)
      const isUserProductsModelError =
        errorStr.includes('family_name') ||
        rawErrStr.includes('family_name') ||
        errorStr.includes('fields [title] are invalid') ||
        errorStr.includes('The fields [title] are invalid') ||
        rawErrStr.includes('fields [title] are invalid') ||
        rawErrStr.includes('The fields [title] are invalid') ||
        (rawErrStr.includes('body.invalid_fields') && rawErrStr.includes('title'));

      if (isUserProductsModelError && payloadToCreate.title) {
        // Fallback reativo: remover title e usar family_name
        console.log(`[CreateListing] Erro de modelo User Products detectado reativamente. Trocando title → family_name.`);
        const { title: _removedTitle, ...restPayload } = payloadToCreate;
        payloadToCreate = {
          ...restPayload,
          family_name: title.substring(0, 60),
        };

        // Revalidar com payload ajustado
        const retryValidation = await this.mlApiService.validateItem(accountToken, payloadToCreate);
        if (!retryValidation.valid) {
          // Apresentar erro detalhado ao usuário
          throw new Error(this.buildActionableErrorMessage(retryValidation.error || initialValidation.error || '', categoryInfo));
        }
      } else {
        // Erro NÃO é sobre title/family_name — apresentar erro detalhado com orientação
        throw new Error(this.buildActionableErrorMessage(initialValidation.error || '', categoryInfo));
      }
    }

    // 8. Criar anúncio no ML
    let mlResponse;
    try {
      mlResponse = await this.mlApiService.createItem(accountToken, payloadToCreate);
    } catch (createErr: any) {
      const errMsg = String(createErr?.message || createErr || '');
      const isUserProductsCreateError =
        errMsg.includes('family_name') ||
        errMsg.includes('fields [title] are invalid') ||
        errMsg.includes('The fields [title] are invalid') ||
        (errMsg.includes('body.invalid_fields') && errMsg.includes('title'));

      if (isUserProductsCreateError && payloadToCreate.title) {
        // Retry: trocar title → family_name
        const { title: _removedTitle, ...restPayload } = payloadToCreate;
        const retryPayload = {
          ...restPayload,
          family_name: title.substring(0, 60),
        };
        mlResponse = await this.mlApiService.createItem(accountToken, retryPayload);
      } else {
        throw new Error(this.buildActionableErrorMessage(errMsg, categoryInfo));
      }
    }
    
    // 9. Adicionar descrição (ML exige chamada separada)
    if (description && description.trim() !== '') {
      try {
        await fetch(`https://api.mercadolibre.com/items/${mlResponse.id}/description`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accountToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plain_text: description })
        });
      } catch (descError) {
        console.error('Erro ao adicionar descrição no ML:', descError);
      }
    }

    // 10. Montar registro local
    const newListing = {
      id: randomUUID(),
      accountId: accountId,
      productId: product.id,
      mlItemId: mlResponse.id,
      title: mlResponse.title || mlResponse.family_name || title,
      price: mlResponse.price,
      availableQuantity: mlResponse.available_quantity,
      status: mlResponse.status,
      permalink: mlResponse.permalink,
      createdAt: new Date()
    };

    // 11. Salvar anúncio no banco de dados local
    const listingToInsert = {
      id: newListing.id,
      account_id: accountId,
      product_id: productId,
      ml_item_id: newListing.mlItemId,
      title: newListing.title,
      price: newListing.price,
      available_quantity: newListing.availableQuantity,
      status: newListing.status,
      permalink: newListing.permalink,
      pictures: mlPictures,
      attributes: attributes,
      created_at: newListing.createdAt.toISOString()
    };

    const { error: dbError } = await supabase.from('listings').insert(listingToInsert);
    if (dbError) {
      console.error('Erro ao salvar anúncio local no Supabase:', dbError);
      throw new Error(`Falha ao salvar anúncio no banco de dados local: ${dbError.message}`);
    }

    return newListing;
  }

  /**
   * Monta a lista de atributos para o payload do ML, combinando:
   * 1. Dados do produto local (brand, gtin, warranty, etc.)
   * 2. mlAttributes customizados salvos pelo usuário
   * 3. Atributos obrigatórios da categoria que podem ser preenchidos automaticamente
   */
  private buildAttributes(product: any, requiredAttributes: any[]): any[] {
    const attributeMap = new Map<string, string>();

    // 1. Mapear atributos do produto usando o mapeamento automático
    for (const [attrId, extractor] of Object.entries(PRODUCT_TO_ML_ATTRIBUTE_MAP)) {
      const value = extractor(product);
      if (value && String(value).trim() !== '') {
        attributeMap.set(attrId, String(value));
      }
    }

    // 2. Sobrescrever/adicionar com mlAttributes customizados (prioridade sobre automático)
    if (product.mlAttributes) {
      for (const [key, value] of Object.entries(product.mlAttributes)) {
        if (value && String(value).trim() !== '') {
          attributeMap.set(key, String(value));
        }
      }
    }

    // 3. Preencher atributos obrigatórios da categoria com valores padrão (se disponíveis e não já preenchidos)
    for (const reqAttr of requiredAttributes) {
      if (!attributeMap.has(reqAttr.id) && reqAttr.default_value) {
        attributeMap.set(reqAttr.id, reqAttr.default_value);
      }
    }

    // Converter o Map em array no formato que o ML aceita
    const attributes: any[] = [];
    for (const [id, value] of attributeMap.entries()) {
      attributes.push({ id, value_name: value });
    }

    return attributes;
  }

  /**
   * Constrói uma mensagem de erro acionável para o usuário,
   * informando exatamente quais campos estão faltando e como preenchê-los.
   */
  private buildActionableErrorMessage(rawError: string, categoryInfo: any): string {
    const parts: string[] = [];

    // Adicionar a mensagem original do ML
    if (rawError) {
      parts.push(rawError);
    }

    // Se temos informações da categoria, listar os atributos obrigatórios não preenchidos
    if (categoryInfo && categoryInfo.requiredAttributes && categoryInfo.requiredAttributes.length > 0) {
      const missingHints: string[] = [];

      // Verificar se a mensagem de erro menciona atributos específicos
      for (const attr of categoryInfo.requiredAttributes) {
        if (rawError.includes(attr.id) || rawError.includes(attr.name)) {
          const friendlyName = attr.name || attr.id;
          missingHints.push(`• "${friendlyName}" (${attr.id}): Edite o produto e preencha este campo.`);
        }
      }

      if (missingHints.length > 0) {
        parts.push('\n\nCampos que precisam ser preenchidos no cadastro do produto:');
        parts.push(missingHints.join('\n'));
      }
    }

    return parts.join('\n') || 'Falha na validação do anúncio no Mercado Livre. Verifique os dados do produto.';
  }
}
