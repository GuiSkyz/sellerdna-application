import { z } from 'zod';

export const ImportProductSchema = z.object({
  id: z.string().optional(),
  customId: z.string().optional(),
  name: z.string().min(1, "O nome do produto é obrigatório"),
  productType: z.string().optional().default('Perfume'),
  brand: z.string().optional(),
  sizeMl: z.string().optional(),
  perfumeType: z.string().optional(),
  price: z.coerce.number().min(0, "O preço deve ser maior ou igual a zero"),
  quantity: z.coerce.number().min(0, "A quantidade deve ser maior ou igual a zero"),
  gender: z.string().optional(),
  expirationDate: z.string().optional(),
  weight: z.coerce.number().optional(),
  ncm: z.string().optional(),
  sku: z.string().optional(),
  imageUrl: z.string().optional(),
  mlCategoryId: z.string().optional(),
  gtin: z.string().optional(),
  condition: z.string().optional(),
  listingTypeId: z.string().optional(),
  warrantyType: z.string().optional(),
  warrantyTime: z.string().optional(),
});

export const ImportProductsPayloadSchema = z.object({
  products: z.array(ImportProductSchema),
  mode: z.enum(['create', 'update', 'upsert']).optional().default('upsert'),
});

export type ImportProductDTO = z.infer<typeof ImportProductSchema>;
export type ImportProductsPayloadDTO = z.infer<typeof ImportProductsPayloadSchema>;

