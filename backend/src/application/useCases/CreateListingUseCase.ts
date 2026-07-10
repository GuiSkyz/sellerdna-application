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
  'UNIT_VOLUME': (p) => p.sizeMl ? (String(p.sizeMl).toLowerCase().includes('ml') ? String(p.sizeMl) : `${p.sizeMl} mL`) : undefined,
  'VOLUME': (p) => p.sizeMl ? (String(p.sizeMl).toLowerCase().includes('ml') ? String(p.sizeMl) : `${p.sizeMl} mL`) : undefined,
  'PERFUME_NAME': (p) => p.name,
  'FRAGRANCE_NAME': (p) => p.name,
  'LINE': (p) => p.line,
  'MODEL': (p) => p.model,
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

    // 4. Montar atributos com base nos dados do produto + atributos obrigatórios/catálogo da categoria
    const attributes = this.buildAttributes(product, categoryInfo.allAttributes || categoryInfo.requiredAttributes);

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
      shipping: product.shippingMode === 'custom'
        ? { mode: 'custom', local_pick_up: true, free_shipping: false }
        : {
            mode: product.shippingMode || 'me2',
            local_pick_up: false,
            free_shipping: Number(price) >= 79,
            free_methods: Number(price) >= 79 ? [
              {
                id: 100009,
                rule: {
                  default: true,
                  free_mode: 'country',
                  free_shipping_flag: true
                }
              }
            ] : undefined
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
    let initialValidation = await this.mlApiService.validateItem(accountToken, payloadToCreate);

    if (!initialValidation.valid) {
      const errorStr = String(initialValidation.error || '');
      const rawErrStr = JSON.stringify(initialValidation.rawError || {});

      // Verificar se o erro é sobre envio / frete (ex: "User has not mode me1", "Mandatory free shipping added")
      const isShippingError =
        errorStr.includes('mode me1') ||
        errorStr.includes('mode me2') ||
        errorStr.includes('free shipping') ||
        errorStr.includes('shipping') ||
        rawErrStr.includes('mode me1') ||
        rawErrStr.includes('free shipping');

      if (isShippingError) {
        console.log(`[CreateListing] Erro/aviso de frete detectado ("${errorStr}"). Tentando Fallback 1: Omitir campo shipping para usar padrão da conta Correios.`);
        const { shipping: _removedShipping, ...payloadWithoutShipping } = payloadToCreate;
        let testVal = await this.mlApiService.validateItem(accountToken, payloadWithoutShipping);

        if (testVal.valid) {
          console.log(`[CreateListing] Fallback 1 bem-sucedido! Omitindo campo shipping para usar padrão da conta.`);
          payloadToCreate = payloadWithoutShipping;
          initialValidation = testVal;
        } else {
          console.log(`[CreateListing] Fallback 1 falhou. Tentando Fallback 2: me2 limpo sem free_methods.`);
          const payloadCleanMe2 = {
            ...payloadToCreate,
            shipping: { mode: 'me2', local_pick_up: false, free_shipping: Number(price) >= 79 }
          };
          testVal = await this.mlApiService.validateItem(accountToken, payloadCleanMe2);

          if (testVal.valid) {
            console.log(`[CreateListing] Fallback 2 bem-sucedido!`);
            payloadToCreate = payloadCleanMe2;
            initialValidation = testVal;
          } else {
            console.log(`[CreateListing] Fallback 2 falhou. Tentando Fallback 3: Modo not_specified.`);
            const payloadNotSpecified = {
              ...payloadToCreate,
              shipping: { mode: 'not_specified', local_pick_up: false, free_shipping: Number(price) >= 79 }
            };
            testVal = await this.mlApiService.validateItem(accountToken, payloadNotSpecified);
            if (testVal.valid) {
              payloadToCreate = payloadNotSpecified;
              initialValidation = testVal;
            }
          }
        }
      }

      if (!initialValidation.valid) {
        const errorStr2 = String(initialValidation.error || '');
        const rawErrStr2 = JSON.stringify(initialValidation.rawError || {});

        // Verificar se o erro é exclusivamente um aviso/nota não-fatal de frete do Mercado Livre
        const isNonFatalShippingWarningOnly =
          (errorStr2.includes('mode me1') || errorStr2.includes('Mandatory free shipping added')) &&
          !errorStr2.toLowerCase().includes('attribute') &&
          !errorStr2.toLowerCase().includes('brand') &&
          !errorStr2.toLowerCase().includes('gtin') &&
          !errorStr2.toLowerCase().includes('price');

        if (isNonFatalShippingWarningOnly) {
          console.log(`[CreateListing] Aviso não-fatal de frete detectado em /items/validate ("${errorStr2}"). Prosseguindo para criação do item.`);
        } else {
          // Verificar se o erro é sobre title/family_name (caso a detecção proativa tenha falhado)
          const isUserProductsModelError =
            errorStr2.includes('family_name') ||
            rawErrStr2.includes('family_name') ||
            errorStr2.includes('fields [title] are invalid') ||
            errorStr2.includes('The fields [title] are invalid') ||
            rawErrStr2.includes('fields [title] are invalid') ||
            rawErrStr2.includes('The fields [title] are invalid') ||
            (rawErrStr2.includes('body.invalid_fields') && rawErrStr2.includes('title'));

          if (isUserProductsModelError && payloadToCreate.title) {
            console.log(`[CreateListing] Erro de modelo User Products detectado reativamente. Trocando title → family_name.`);
            const { title: _removedTitle, ...restPayload } = payloadToCreate;
            payloadToCreate = {
              ...restPayload,
              family_name: title.substring(0, 60),
            };

            const retryValidation = await this.mlApiService.validateItem(accountToken, payloadToCreate);
            if (!retryValidation.valid) {
              const errRetryStr = String(retryValidation.error || '');
              const isRetryShippingOnly =
                (errRetryStr.includes('mode me1') || errRetryStr.includes('Mandatory free shipping added')) &&
                !errRetryStr.toLowerCase().includes('attribute');
              if (!isRetryShippingOnly) {
                throw new Error(this.buildActionableErrorMessage(retryValidation.error || initialValidation.error || '', categoryInfo));
              }
            }
          } else {
            throw new Error(this.buildActionableErrorMessage(initialValidation.error || '', categoryInfo));
          }
        }
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
  private buildAttributes(product: any, allCategoryAttributes: any[]): any[] {
    const attributeMap = new Map<string, string>();

    const isValidVal = (v: any): boolean => {
      if (v === null || v === undefined) return false;
      const s = String(v).trim();
      return s !== '' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined' && s !== 'Selecione...';
    };

    // 1. Mapear atributos do produto usando o mapeamento automático
    for (const [attrId, extractor] of Object.entries(PRODUCT_TO_ML_ATTRIBUTE_MAP)) {
      const value = extractor(product);
      if (isValidVal(value)) {
        attributeMap.set(attrId, String(value).trim());
      }
    }

    // 2. Sobrescrever/adicionar com mlAttributes customizados (prioridade sobre automático)
    if (product.mlAttributes) {
      for (const [key, value] of Object.entries(product.mlAttributes)) {
        if (isValidVal(value)) {
          attributeMap.set(key, String(value).trim());
        }
      }
    }

    // Normalizador inteligente para casar com os valores oficiais da categoria (ML catalog values)
    const normalizedAttributes: any[] = [];
    const attrLookup = new Map<string, any>();
    for (const catAttr of (allCategoryAttributes || [])) {
      attrLookup.set(catAttr.id, catAttr);
    }

    for (const [rawId, rawValue] of attributeMap.entries()) {
      let id = rawId;
      // Tratar aliases para categorias que exigem IDs específicos no catálogo do ML
      if (id === 'FRAGRANCE_NAME' && attrLookup.has('PERFUME_NAME')) {
        id = 'PERFUME_NAME';
      } else if (id === 'VOLUME' && attrLookup.has('UNIT_VOLUME')) {
        id = 'UNIT_VOLUME';
      }

      let finalVal = rawValue;
      const catAttr = attrLookup.get(id);

      // Normalização específica para PERFUME_TYPE e GENDER se o valor digitado não for exato
      if (id === 'PERFUME_TYPE') {
        const lower = rawValue.toLowerCase();
        if (lower === 'edp' || lower.includes('eau de parfum')) finalVal = 'Eau de parfum';
        else if (lower === 'edt' || lower.includes('eau de toilette')) finalVal = 'Eau de toilette';
        else if (lower === 'edc' || lower.includes('eau de cologne')) finalVal = 'Eau de cologne';
        else if (lower === 'parfum') finalVal = 'Parfum';
      } else if (id === 'GENDER') {
        const lower = rawValue.toLowerCase();
        if (lower === 'masculino') finalVal = 'Masculino';
        else if (lower === 'feminino') finalVal = 'Feminino';
        else if (lower === 'unissex' || lower === 'semigênero') finalVal = 'Semigênero';
      }

      // Se a categoria tem lista de valores aceitos (catAttr.values), tentar casar com o nome oficial ou ID
      if (catAttr && Array.isArray(catAttr.values) && catAttr.values.length > 0) {
        const exactMatch = catAttr.values.find((v: any) => 
          v.name.toLowerCase() === finalVal.toLowerCase() ||
          v.id === finalVal ||
          v.name.toLowerCase() === rawValue.toLowerCase()
        );
        if (exactMatch) {
          normalizedAttributes.push({ id, value_id: exactMatch.id, value_name: exactMatch.name });
          continue;
        }
      }

      normalizedAttributes.push({ id, value_name: finalVal });
    }

    // 3. Preenchimento automático inteligente para EMPTY_GTIN_REASON e atributos obrigatórios
    const hasGtin = normalizedAttributes.some(a => a.id === 'GTIN' && a.value_name && String(a.value_name).trim() !== '');
    if (!hasGtin && attrLookup.has('EMPTY_GTIN_REASON') && !normalizedAttributes.some(a => a.id === 'EMPTY_GTIN_REASON')) {
      const gtinReasonAttr = attrLookup.get('EMPTY_GTIN_REASON');
      if (gtinReasonAttr?.values && gtinReasonAttr.values.length > 0) {
        normalizedAttributes.push({
          id: 'EMPTY_GTIN_REASON',
          value_id: gtinReasonAttr.values[0].id,
          value_name: gtinReasonAttr.values[0].name
        });
      } else {
        normalizedAttributes.push({ id: 'EMPTY_GTIN_REASON', value_name: 'O produto não tem código cadastrado' });
      }
    }

    // Preencher outros atributos obrigatórios faltantes com default_value se existirem
    for (const reqAttr of (allCategoryAttributes || [])) {
      const isReq = reqAttr.required || reqAttr.tags?.required || reqAttr.tags?.catalog_required;
      const exists = normalizedAttributes.some(a => a.id === reqAttr.id);
      if (isReq && !exists && reqAttr.default_value) {
        normalizedAttributes.push({ id: reqAttr.id, value_name: reqAttr.default_value });
      }
    }

    return normalizedAttributes;
  }

  /**
   * Constrói uma mensagem de erro acionável para o usuário,
   * informando exatamente quais campos estão faltando e como preenchê-los.
   */
  private buildActionableErrorMessage(rawError: string, categoryInfo: any): string {
    const parts: string[] = [];

    if (rawError && rawError !== 'validation_error' && rawError !== 'Validation error') {
      parts.push(rawError);
    } else {
      parts.push('O Mercado Livre encontrou divergência na validação do anúncio.');
    }

    const isOnlyShippingError =
      rawError.includes('mode me1') ||
      rawError.includes('free shipping') ||
      rawError.includes('shipping');

    if (!isOnlyShippingError && categoryInfo && categoryInfo.requiredAttributes && categoryInfo.requiredAttributes.length > 0) {
      const missingHints: string[] = [];

      for (const attr of categoryInfo.requiredAttributes) {
        const friendlyName = attr.name || attr.id;
        missingHints.push(`• "${friendlyName}" (${attr.id}): Verifique se este campo está preenchido com uma opção aceita.`);
      }

      if (missingHints.length > 0) {
        parts.push('\nCampos obrigatórios desta categoria no Mercado Livre:');
        parts.push(missingHints.join('\n'));
      }
    }

    return parts.join('\n') || 'Falha na validação do anúncio no Mercado Livre. Verifique os dados do produto.';
  }
}
