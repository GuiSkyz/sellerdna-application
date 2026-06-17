import { FastifyReply, FastifyRequest } from 'fastify';
import { SyncUserListingsUseCase } from '../../application/useCases/SyncUserListingsUseCase';
import { CreateListingUseCase } from '../../application/useCases/CreateListingUseCase';
import { DuplicateListingUseCase } from '../../application/useCases/DuplicateListingUseCase';
import { OptimizeListingUseCase } from '../../application/useCases/OptimizeListingUseCase';
import { MercadoLivreApiService } from '../../infrastructure/integrations/mercadolivre/MercadoLivreApiService';
import { GeminiService } from '../../infrastructure/integrations/gemini/GeminiService';
import { supabase } from '../../infrastructure/database/supabase';

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

  private async getUserId(): Promise<string> {
    let { data: users } = await supabase.from('users').select('id').limit(1);
    let userId = users?.[0]?.id;
    if (!userId) throw new Error('User not found');
    return userId;
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId();
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

      // Fetch ML User ID and Token
      const { data: account } = await supabase.from('mercadolivre_accounts').select('ml_user_id').eq('id', accountId).single();
      const { data: token } = await supabase.from('mercadolivre_tokens').select('access_token').eq('account_id', accountId).single();

      if (!account || !token) {
        return reply.status(400).send({ error: 'Conta não encontrada ou não autenticada' });
      }

      const listings = await this.syncUserListingsUseCase.execute(accountId, account.ml_user_id, token.access_token);

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

      // Mock Data (will come from Auth context)
      const userId = 'user-123';
      const mlToken = 'APP_USR-123456789-mock-token'; // The user's active access_token

      const newListing = await this.createListingUseCase.execute(userId, productId, mlToken, categoryId);

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

      const userId = 'user-123';
      const mlToken = 'APP_USR-123456789-mock-token';

      const result = await this.duplicateListingUseCase.execute(userId, id, mlToken, categoryId, useAI);

      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao duplicar anúncio' });
    }
  }
}
