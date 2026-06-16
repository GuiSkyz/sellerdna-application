import { Product } from '../entities/Product';

export class InMemoryProductRepository {
  private static products: Product[] = [];

  async createMany(products: Product[]): Promise<void> {
    InMemoryProductRepository.products.push(...products);
  }

  async findAllByUserId(userId: string): Promise<Product[]> {
    return InMemoryProductRepository.products.filter(p => p.userId === userId);
  }
}
