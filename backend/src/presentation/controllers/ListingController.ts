import { FastifyReply, FastifyRequest } from 'fastify';
import { SyncUserListingsUseCase } from '../../application/useCases/SyncUserListingsUseCase';
import { CreateListingUseCase } from '../../application/useCases/CreateListingUseCase';
import { DuplicateListingUseCase } from '../../application/useCases/DuplicateListingUseCase';
import { OptimizeListingUseCase } from '../../application/useCases/OptimizeListingUseCase';
import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { GeminiService } from '../../infrastructure/integrations/gemini/GeminiService';
import { supabase } from '../../infrastructure/database/supabase';
import { getValidMLToken } from '../../infrastructure/integrations/mercadolivre/tokenHelper';

export class ListingController {
  private syncUserListingsUseCase: SyncUserListingsUseCase;
  private createListingUseCase: CreateListingUseCase;
  private duplicateListingUseCase: DuplicateListingUseCase;

  constructor() {
    const mlApiService = new MercadoLivreApiService();
    const aiService = new GeminiService();
    
    this.syncUserListingsUseCase = new SyncUserListingsUseCase(mlApiService);
    this.createListingUseCase = new CreateListingUseCase(mlApiService);
    
    const optimizeUseCase = new OptimizeListingUseCase(aiService);
    this.duplicateListingUseCase = new DuplicateListingUseCase(optimizeUseCase, this.createListingUseCase);
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
        .select('*')
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

  async create(request: FastifyRequest<{ Body: { productId: string, categoryId: string } }>, reply: FastifyReply) {
    try {
      const { productId, categoryId } = request.body;
      if (!productId || !categoryId) {
        return reply.status(400).send({ error: 'productId e categoryId são obrigatórios' });
      }

      const userId = await this.getUserId(request);
      
      const { data: account } = await supabase.from('mercadolivre_accounts').select('id').eq('user_id', userId).single();
      if (!account) return reply.status(400).send({ error: 'Nenhuma conta do Mercado Livre conectada' });
      
      const validToken = await getValidMLToken(account.id);

      const newListing = await this.createListingUseCase.execute(userId, productId, validToken, categoryId);

      return reply.status(201).send({ message: 'Anúncio publicado com sucesso no Mercado Livre', listing: newListing });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao publicar anúncio' });
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

      const result = await this.duplicateListingUseCase.execute(userId, id, validToken, categoryId, useAI);

      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao duplicar anúncio' });
    }
  }
}
