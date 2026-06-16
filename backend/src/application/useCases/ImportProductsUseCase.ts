import { ImportProductDTO } from '../dto/ProductDTO';
import { Product } from '../../domain/entities/Product';
import { InMemoryProductRepository } from '../../domain/repositories/InMemoryProductRepository';
import { randomUUID } from 'crypto';

export class ImportProductsUseCase {
  constructor(private productRepository: InMemoryProductRepository) {}

  async execute(userId: string, productsDto: ImportProductDTO[]): Promise<Product[]> {
    const products: Product[] = productsDto.map(dto => ({
      id: randomUUID(),
      userId,
      name: dto.name,
      brand: dto.brand,
      sizeMl: dto.sizeMl,
      perfumeType: dto.perfumeType,
      price: dto.price,
      quantity: dto.quantity,
      gender: dto.gender,
      expirationDate: dto.expirationDate,
      weight: dto.weight,
      ncm: dto.ncm,
      sku: dto.sku,
      imageUrl: dto.imageUrl === '' ? undefined : dto.imageUrl,
      createdAt: new Date(),
    }));

    await this.productRepository.createMany(products);

    return products;
  }
}
