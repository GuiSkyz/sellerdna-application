export interface Product {
  id: string;
  userId: string;
  name: string;
  productType?: string;
  brand?: string;
  sizeMl?: string;
  perfumeType?: string;
  price: number;
  quantity: number;
  gender?: string;
  expirationDate?: string;
  weight?: number;
  ncm?: string;
  sku?: string;
  imageUrl?: string;
  createdAt: Date;
}
