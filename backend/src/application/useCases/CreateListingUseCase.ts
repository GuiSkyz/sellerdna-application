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

    const attributes: any[] = [];
    if (product.gtin) {
      attributes.push({ id: 'GTIN', value_name: product.gtin });
    }
    if (product.warrantyType && product.warrantyType !== 'Sem garantia') {
      attributes.push({ id: 'WARRANTY_TYPE', value_name: product.warrantyType });
      if (product.warrantyTime) {
        attributes.push({ id: 'WARRANTY_TIME', value_name: product.warrantyTime });
      }
    }

    if (product.mlAttributes) {
      for (const [key, value] of Object.entries(product.mlAttributes)) {
        if (value && String(value).trim() !== '') {
          attributes.push({ id: key, value_name: String(value) });
        }
      }
    }

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

    // 3. Transform Product to ML Item Format
    let mlPictures: { source: string }[] = [];
    if (product.imageUrls && product.imageUrls.length > 0) {
      mlPictures = product.imageUrls.map(url => ({ source: formatImageUrl(url) }));
    } else if (product.imageUrl) {
      mlPictures = [{ source: formatImageUrl(product.imageUrl) }];
    }

    if (mlPictures.length === 0) {
      throw new Error('O produto precisa ter pelo menos 1 imagem cadastrada para ser publicado no Mercado Livre.');
    }

    const mlItemPayload: any = {
      title: title.substring(0, 60), // ML max limit
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

    // 4. Pré-validação oficial na API do Mercado Livre (/items/validate) antes de publicar
    let payloadToCreate = { ...mlItemPayload };
    const initialValidation = await this.mlApiService.validateItem(accountToken, payloadToCreate);

    if (!initialValidation.valid) {
      const errorStr = String(initialValidation.error || '');
      const rawErrStr = JSON.stringify(initialValidation.rawError || {});

      const isUserProductsModelError =
        errorStr.includes('family_name') ||
        rawErrStr.includes('family_name') ||
        errorStr.includes('fields [title] are invalid') ||
        errorStr.includes('The fields [title] are invalid') ||
        rawErrStr.includes('fields [title] are invalid') ||
        rawErrStr.includes('The fields [title] are invalid') ||
        (rawErrStr.includes('body.invalid_fields') && rawErrStr.includes('title'));

      if (isUserProductsModelError) {
        // No modelo User Products (ou categorias migradas), a API rejeita "title" no nível superior.
        // Devemos remover "title" e enviar "family_name".
        const { title: _removedTitle, ...restPayload } = payloadToCreate;
        const userProductsPayload = {
          ...restPayload,
          family_name: title.substring(0, 60),
        };

        const secondValidation = await this.mlApiService.validateItem(accountToken, userProductsPayload);
        if (secondValidation.valid) {
          payloadToCreate = userProductsPayload;
        } else {
          // Caso alguma categoria específica exija tanto title quanto family_name
          const payloadWithBoth = {
            ...userProductsPayload,
            title: title.substring(0, 60),
          };
          const thirdValidation = await this.mlApiService.validateItem(accountToken, payloadWithBoth);
          if (thirdValidation.valid) {
            payloadToCreate = payloadWithBoth;
          } else {
            throw new Error(secondValidation.error || initialValidation.error || 'Falha na validação do anúncio no Mercado Livre.');
          }
        }
      } else {
        throw new Error(initialValidation.error || 'Falha na validação do anúncio no Mercado Livre.');
      }
    }

    // 5. Call ML API to create item de forma segura após aprovação na validação
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
        const { title: _removedTitle, ...restPayload } = payloadToCreate;
        const retryPayload = {
          ...restPayload,
          family_name: title.substring(0, 60),
        };
        mlResponse = await this.mlApiService.createItem(accountToken, retryPayload);
      } else {
        throw createErr;
      }
    }
    
    // 4.1. Call ML API to add description (ML requires this to be a separate call)
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

    // 5. Build Local Record
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

    // 6. Save Listing to DB
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
}
