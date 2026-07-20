export interface MLListingSummary {
  id: string;
  mlItemId: string;
  title: string;
  price: number;
  availableQuantity: number;
  status: string;
  permalink?: string;
  createdAt?: string;
}

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
  imageUrls?: string[];
  condition?: string;
  listingTypeId?: string;
  gtin?: string;
  warrantyType?: string;
  warrantyTime?: string;
  mlCategoryId?: string;
  mlAttributes?: Record<string, any>;
  shippingMode?: string;
  mlListingsCount?: number;
  mlListings?: MLListingSummary[];
  createdAt: Date;
}
