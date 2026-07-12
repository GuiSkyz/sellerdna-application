import { ImportProductDTO } from '../dto/ProductDTO';
import { Product } from '../../domain/entities/Product';
import { SupabaseProductRepository } from '../../domain/repositories/SupabaseProductRepository';
import { randomUUID } from 'crypto';

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

export interface ImportProductsResult {
  updatedCount: number;
  createdCount: number;
  products: Product[];
}

export class ImportProductsUseCase {
  constructor(private productRepository: SupabaseProductRepository) {}

  async execute(
    userId: string,
    productsDto: ImportProductDTO[],
    mode: 'create' | 'update' | 'upsert' = 'upsert'
  ): Promise<ImportProductsResult> {
    const existingProducts = await this.productRepository.listAll(userId);

    const existingById = new Map<string, Product>();
    const existingBySku = new Map<string, Product>();
    const existingByCustomId = new Map<string, Product>();

    for (const p of existingProducts) {
      if (p.id) existingById.set(p.id.trim(), p);
      if (p.sku && p.sku.trim()) existingBySku.set(p.sku.trim().toLowerCase(), p);
      if (p.customId && p.customId.trim()) existingByCustomId.set(p.customId.trim().toLowerCase(), p);
    }

    const updatedProducts: Product[] = [];
    const newProductsToCreate: Product[] = [];

    for (const dto of productsDto) {
      const cleanedMlCategoryId = dto.mlCategoryId ? normalizeMlCategoryId(dto.mlCategoryId) : undefined;

      let matched: Product | undefined;
      if (dto.id && dto.id.trim()) {
        matched = existingById.get(dto.id.trim());
      }
      if (!matched && dto.sku && dto.sku.trim()) {
        matched = existingBySku.get(dto.sku.trim().toLowerCase());
      }
      if (!matched && dto.customId && dto.customId.trim()) {
        matched = existingByCustomId.get(dto.customId.trim().toLowerCase());
      }

      if (matched && (mode === 'update' || mode === 'upsert')) {
        const updated = await this.productRepository.update(matched.id, userId, {
          name: dto.name || matched.name,
          productType: dto.productType !== undefined && dto.productType !== '' ? dto.productType : matched.productType,
          brand: dto.brand !== undefined ? dto.brand : matched.brand,
          sizeMl: dto.sizeMl !== undefined ? dto.sizeMl : matched.sizeMl,
          perfumeType: dto.perfumeType !== undefined ? dto.perfumeType : matched.perfumeType,
          price: dto.price !== undefined ? dto.price : matched.price,
          quantity: dto.quantity !== undefined ? dto.quantity : matched.quantity,
          gender: dto.gender !== undefined ? dto.gender : matched.gender,
          expirationDate: dto.expirationDate !== undefined ? dto.expirationDate : matched.expirationDate,
          weight: dto.weight !== undefined ? dto.weight : matched.weight,
          ncm: dto.ncm !== undefined ? dto.ncm : matched.ncm,
          sku: dto.sku !== undefined && dto.sku !== '' ? dto.sku : matched.sku,
          customId: dto.customId !== undefined && dto.customId !== '' ? dto.customId : matched.customId,
          imageUrl: dto.imageUrl !== undefined && dto.imageUrl !== '' ? dto.imageUrl : matched.imageUrl,
          mlCategoryId: cleanedMlCategoryId !== undefined ? cleanedMlCategoryId : matched.mlCategoryId,
          gtin: dto.gtin !== undefined ? dto.gtin : matched.gtin,
          condition: dto.condition !== undefined ? dto.condition : matched.condition,
          listingTypeId: dto.listingTypeId !== undefined ? dto.listingTypeId : matched.listingTypeId,
          warrantyType: dto.warrantyType !== undefined ? dto.warrantyType : matched.warrantyType,
          warrantyTime: dto.warrantyTime !== undefined ? dto.warrantyTime : matched.warrantyTime,
        });

        if (updated) {
          updatedProducts.push(updated);
        }
      } else if (!matched && (mode === 'create' || mode === 'upsert')) {
        const isUuid = dto.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.id.trim());
        newProductsToCreate.push({
          id: isUuid ? dto.id!.trim() : randomUUID(),
          userId,
          customId: dto.customId || undefined,
          name: dto.name,
          productType: dto.productType || 'Perfume',
          brand: dto.brand || undefined,
          sizeMl: dto.sizeMl || undefined,
          perfumeType: dto.perfumeType || undefined,
          price: dto.price,
          quantity: dto.quantity,
          gender: dto.gender || undefined,
          expirationDate: dto.expirationDate || undefined,
          weight: dto.weight || undefined,
          ncm: dto.ncm || undefined,
          sku: dto.sku || undefined,
          imageUrl: dto.imageUrl === '' ? undefined : dto.imageUrl,
          mlCategoryId: cleanedMlCategoryId,
          gtin: dto.gtin || undefined,
          condition: dto.condition || 'new',
          listingTypeId: dto.listingTypeId || 'gold_special',
          warrantyType: dto.warrantyType || 'Garantia do vendedor',
          warrantyTime: dto.warrantyTime || '30 dias',
          createdAt: new Date(),
        });
      }
    }

    if (newProductsToCreate.length > 0) {
      await this.productRepository.createMany(newProductsToCreate);
    }

    return {
      updatedCount: updatedProducts.length,
      createdCount: newProductsToCreate.length,
      products: [...updatedProducts, ...newProductsToCreate],
    };
  }
}

