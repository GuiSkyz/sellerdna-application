import { z } from 'zod';

export const ImportProductSchema = z.object({
  name: z.string().min(1, "O nome do produto é obrigatório"),
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
  imageUrl: z.string().url("A URL da imagem deve ser válida").optional().or(z.literal('')),
});

export const ImportProductsPayloadSchema = z.object({
  products: z.array(ImportProductSchema)
});

export type ImportProductDTO = z.infer<typeof ImportProductSchema>;
export type ImportProductsPayloadDTO = z.infer<typeof ImportProductsPayloadSchema>;
