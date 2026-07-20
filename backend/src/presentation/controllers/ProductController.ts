import { FastifyReply, FastifyRequest } from 'fastify';
import { ImportProductsPayloadSchema } from '../../application/dto/ProductDTO';
import { ImportProductsUseCase } from '../../application/useCases/ImportProductsUseCase';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { supabase } from '../../infrastructure/database/supabase';
import { OptimizeListingUseCase } from '../../application/useCases/OptimizeListingUseCase';

function normalizeMlCategoryId(val?: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val !== 'string') return String(val).trim() || undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  const match = trimmed.toUpperCase().match(/(ML[A-Z])-?(\d+)/);
  if (match) {
    return `${match[1]}${match[2]}`;
  }
  if (/^\d+$/.test(trimmed)) {
    return `MLB${trimmed}`;
  }
  return trimmed.toUpperCase();
}

export class ProductController {
  constructor(
    private importProductsUseCase: ImportProductsUseCase,
    private productRepository: SupabaseProductRepository,
    private optimizeListingUseCase: OptimizeListingUseCase
  ) {}

  private async getUserId(request: FastifyRequest): Promise<string> {
    return (request as any).user.id;
  }

  async import(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);

      const parsed = ImportProductsPayloadSchema.safeParse(request.body);
      
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Dados de entrada inválidos',
          details: parsed.error.format()
        });
      }

      const result = await this.importProductsUseCase.execute(userId, parsed.data.products, parsed.data.mode);

      const msgParts = [];
      if (result.updatedCount > 0) msgParts.push(`${result.updatedCount} atualizado(s)`);
      if (result.createdCount > 0) msgParts.push(`${result.createdCount} criado(s)`);
      const message = msgParts.length > 0
        ? `${msgParts.join(' e ')} com sucesso!`
        : 'Processamento de importação concluído!';

      return reply.status(200).send({
        message,
        updatedCount: result.updatedCount,
        createdCount: result.createdCount,
        products: result.products
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro interno ao importar produtos' });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const products = await this.productRepository.listAll(userId);
      return reply.send(products);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao listar produtos' });
    }
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const product = await this.productRepository.getById(request.params.id, userId);
      
      if (!product) {
        return reply.status(404).send({ error: 'Produto não encontrado' });
      }

      return reply.send(product);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar produto' });
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      if (request.body && typeof request.body === 'object' && 'mlCategoryId' in request.body) {
        request.body.mlCategoryId = normalizeMlCategoryId(request.body.mlCategoryId);
      }
      const product = await this.productRepository.update(request.params.id, userId, request.body as any);
      
      if (!product) {
        return reply.status(404).send({ error: 'Produto não encontrado ou sem permissão' });
      }

      return reply.send(product);
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Erro ao atualizar produto';
      return reply.status(500).send({ error: message });
    }
  }

  async create(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      if (request.body && typeof request.body === 'object' && 'mlCategoryId' in request.body) {
        request.body.mlCategoryId = normalizeMlCategoryId(request.body.mlCategoryId);
      }
      
      // Type assertion as the repository handles mapping to database fields
      // In a real scenario we should validate `request.body` using a schema parser (like Zod)
      const product = await this.productRepository.create(userId, request.body as any);
      
      return reply.status(201).send(product);
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Erro ao criar produto';
      return reply.status(500).send({ error: message });
    }
  }

  async generateAdCopy(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const product = await this.productRepository.getById(request.params.id, userId);
      
      if (!product) {
        return reply.status(404).send({ error: 'Produto não encontrado' });
      }

      // Passa os dados do produto para a IA gerar a copy
      const copy = await this.optimizeListingUseCase.execute(product);

      return reply.send({
        originalProduct: product,
        generatedAd: copy
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao gerar cópia do anúncio com IA' });
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      await this.productRepository.delete(request.params.id, userId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao excluir produto' });
    }
  }

  async deleteBulk(request: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
    try {
      const userId = await this.getUserId(request);
      const { ids } = request.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'Nenhum ID fornecido' });
      }

      await this.productRepository.deleteMany(ids, userId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao excluir produtos em massa' });
    }
  }

  async updateBulk(
    request: FastifyRequest<{
      Body: {
        ids: string[];
        price?: number;
        quantity?: number;
        clearImage?: boolean;
        mlCategoryId?: string;
        brand?: string;
        ncm?: string;
        gtin?: string;
        condition?: string;
        listingTypeId?: string;
        warrantyType?: string;
        warrantyTime?: string;
        perfumeType?: string;
        gender?: string;
        sizeMl?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = await this.getUserId(request);
      const {
        ids,
        price,
        quantity,
        clearImage,
        mlCategoryId,
        brand,
        ncm,
        gtin,
        condition,
        listingTypeId,
        warrantyType,
        warrantyTime,
        perfumeType,
        gender,
        sizeMl
      } = request.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'Nenhum ID fornecido' });
      }

      const cleanedMlCategoryId = mlCategoryId !== undefined ? normalizeMlCategoryId(mlCategoryId) : undefined;

      await this.productRepository.updateManyProducts(ids, userId, {
        price,
        quantity,
        clearImage,
        mlCategoryId: cleanedMlCategoryId,
        brand,
        ncm,
        gtin,
        condition,
        listingTypeId,
        warrantyType,
        warrantyTime,
        perfumeType,
        gender,
        sizeMl
      });
      return reply.send({ success: true, message: `${ids.length} produtos atualizados com sucesso` });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar produtos em massa' });
    }
  }
}
