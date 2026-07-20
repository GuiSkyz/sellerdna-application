import { FastifyReply, FastifyRequest } from 'fastify';
import { SyncUserListingsUseCase } from '../../application/useCases/SyncUserListingsUseCase';
import { CreateListingUseCase } from '../../application/useCases/CreateListingUseCase';
import { DuplicateListingUseCase } from '../../application/useCases/DuplicateListingUseCase';
import { OptimizeListingUseCase } from '../../application/useCases/OptimizeListingUseCase';
import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { GeminiService } from '../../infrastructure/integrations/gemini/GeminiService';
import { supabase } from '../../infrastructure/database/supabase';
import { getValidMLToken } from '../../infrastructure/integrations/mercadolivre/tokenHelper';

import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';

export class ListingController {
  private syncUserListingsUseCase: SyncUserListingsUseCase;
  private createListingUseCase: CreateListingUseCase;
  private duplicateListingUseCase: DuplicateListingUseCase;
  private optimizeListingUseCase: OptimizeListingUseCase;

  constructor() {
    const mlApiService = new MercadoLivreApiService();
    const aiService = new GeminiService();
    const productRepository = new SupabaseProductRepository();
    
    this.syncUserListingsUseCase = new SyncUserListingsUseCase(mlApiService);
    this.createListingUseCase = new CreateListingUseCase(mlApiService, productRepository);
    
    this.optimizeListingUseCase = new OptimizeListingUseCase(aiService);
    this.duplicateListingUseCase = new DuplicateListingUseCase(this.optimizeListingUseCase, this.createListingUseCase);
  }

  private async getUserId(request: FastifyRequest): Promise<string> {
    return (request as any).user.id;
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const { data: accounts } = await supabase.from('mercadolivre_accounts').select('id').eq('user_id', userId);
      const accountIds = (accounts || []).map(a => a.id);
      
      if (accountIds.length === 0) return reply.send([]);

      const { data: listings, error } = await supabase
        .from('listings')
        .select('*, product:products(id, name, sku)')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return reply.send(listings);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar anúncios' });
    }
  }

  async sync(request: FastifyRequest<{ Body: { accountId: string } }>, reply: FastifyReply) {
    try {
      const { accountId } = request.body;
      if (!accountId) return reply.status(400).send({ error: 'accountId é obrigatório' });

      // Fetch ML User ID
      const { data: account } = await supabase.from('mercadolivre_accounts').select('ml_user_id').eq('id', accountId).single();
      
      if (!account) {
        return reply.status(400).send({ error: 'Conta não encontrada' });
      }

      const validToken = await getValidMLToken(accountId);

      const listings = await this.syncUserListingsUseCase.execute(accountId, account.ml_user_id, validToken);

      return reply.send({ message: 'Sincronização concluída', count: listings.length, listings });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao sincronizar anúncios' });
    }
  }

  async create(request: FastifyRequest<{ Body: { productId: string, title: string, description: string, price: number, quantity: number, categoryId?: string } }>, reply: FastifyReply) {
    try {
      const { productId, title, description, price, quantity, categoryId } = request.body;
      if (!productId) {
        return reply.status(400).send({ error: 'productId é obrigatório' });
      }

      const userId = await this.getUserId(request);
      
      const { data: account } = await supabase.from('mercadolivre_accounts').select('id').eq('user_id', userId).single();
      if (!account) return reply.status(400).send({ error: 'Nenhuma conta do Mercado Livre conectada' });
      
      const validToken = await getValidMLToken(account.id);

      const newListing = await this.createListingUseCase.execute({
        userId,
        productId,
        accountId: account.id,
        accountToken: validToken,
        title,
        description,
        price,
        quantity,
        categoryId
      });

      return reply.status(201).send({ message: 'Anúncio publicado com sucesso no Mercado Livre', listing: newListing });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message || 'Erro ao publicar anúncio' });
    }
  }

  async duplicate(request: FastifyRequest<{ Params: { id: string }, Body: { categoryId: string, useAI?: boolean } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { categoryId, useAI = true } = request.body;
      
      if (!categoryId) {
        return reply.status(400).send({ error: 'categoryId é obrigatório para duplicação' });
      }

      const userId = await this.getUserId(request);
      
      const { data: account } = await supabase.from('mercadolivre_accounts').select('id').eq('user_id', userId).single();
      if (!account) return reply.status(400).send({ error: 'Nenhuma conta do Mercado Livre conectada' });
      
      const validToken = await getValidMLToken(account.id);

      const result = await this.duplicateListingUseCase.execute(userId, id, validToken, account.id, categoryId, useAI);

      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao duplicar anúncio' });
    }
  }

  async bulkPublish(request: FastifyRequest<{ Body: { productIds: string[] } }>, reply: FastifyReply) {
    try {
      const { productIds } = request.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return reply.status(400).send({ error: 'productIds é obrigatório' });
      }

      const userId = await this.getUserId(request);
      
      const { data: account } = await supabase.from('mercadolivre_accounts').select('id').eq('user_id', userId).single();
      if (!account) return reply.status(400).send({ error: 'Nenhuma conta do Mercado Livre conectada' });
      
      const validToken = await getValidMLToken(account.id);

      // Buscar todos os produtos do banco
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('user_id', userId);

      if (prodError || !productsData) {
        throw new Error('Erro ao buscar produtos para publicação');
      }

      const products = productsData.map(row => ({
        id: row.id,
        userId: row.user_id,
        customId: row.custom_id,
        name: row.name,
        productType: row.product_type,
        brand: row.brand,
        sizeMl: row.size_ml,
        perfumeType: row.perfume_type,
        price: Number(row.price),
        quantity: Number(row.quantity),
        gender: row.gender,
        expirationDate: row.expiration_date,
        weight: Number(row.weight),
        ncm: row.ncm,
        sku: row.sku,
        imageUrl: row.image_url,
        imageUrls: row.image_urls,
        condition: row.condition,
        listingTypeId: row.listing_type_id,
        gtin: row.gtin,
        warrantyType: row.warranty_type,
        warrantyTime: row.warranty_time,
        mlCategoryId: row.ml_category_id,
        mlAttributes: row.ml_attributes,
        createdAt: new Date(row.created_at)
      }));

      const results: any[] = [];
      const chunkSize = 10;
      
      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (product) => {
          try {
            // 1. Gerar copy com IA
            const copy = await this.optimizeListingUseCase.execute(product);
            
            // 2. Criar anúncio no ML e salvar localmente
            const listing = await this.createListingUseCase.execute({
              userId,
              productId: product.id,
              accountId: account.id,
              accountToken: validToken,
              title: copy.optimizedTitle,
              description: copy.optimizedDescription,
              price: product.price,
              quantity: product.quantity
            });
            
            return {
              productId: product.id,
              name: product.name,
              success: true,
              listingId: listing.id,
              mlItemId: listing.mlItemId,
              permalink: listing.permalink
            };
          } catch (err: any) {
            return {
              productId: product.id,
              name: product.name,
              success: false,
              error: err.message || 'Erro desconhecido ao publicar anúncio'
            };
          }
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      return reply.send({
        success: true,
        message: 'Processamento de publicação em lote concluído',
        results
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message || 'Erro ao publicar em lote' });
    }
  }

  async linkProduct(request: FastifyRequest<{ Params: { id: string }, Body: { productId: string | null } }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const { id } = request.params;
      const { productId } = request.body;

      const { data: listing } = await supabase.from('listings').select('id, account_id').eq('id', id).single();
      if (!listing) {
        return reply.status(404).send({ error: 'Anúncio não encontrado' });
      }

      const { data: account } = await supabase.from('mercadolivre_accounts').select('id').eq('id', listing.account_id).eq('user_id', userId).single();
      if (!account) {
        return reply.status(403).send({ error: 'Sem permissão para alterar este anúncio' });
      }

      const { error } = await supabase.from('listings').update({ product_id: productId }).eq('id', id);
      if (error) throw error;

      return reply.send({ success: true, message: productId ? 'Anúncio vinculado com sucesso' : 'Anúncio desvinculado com sucesso' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao vincular/desvincular anúncio' });
    }
  }
}
