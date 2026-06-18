export interface Product {
  id: string;
  userId: string;
  customId?: string;
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
  condition?: string;
  listingTypeId?: string;
  gtin?: string;
  warrantyType?: string;
  warrantyTime?: string;
  createdAt: Date;
}
