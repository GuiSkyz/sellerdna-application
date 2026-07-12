import { Product } from '../entities/Product';
import { supabase } from '../../infrastructure/database/supabase';

const formatImageUrl = (url: string | undefined): string | undefined => {
  if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
  const trimmed = url.trim();

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return formatImageUrl(parsed[0]);
      }
    } catch {}
  }

  const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|thumbnail\?id=)([-_a-zA-Z0-9]{20,})/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1000`;
  }

  return trimmed;
};

const getPrimaryImageUrl = (imageUrl: any, imageUrls: any): string | undefined => {
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    const formatted = formatImageUrl(imageUrl);
    if (formatted) return formatted;
  }
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    for (const item of imageUrls) {
      const formatted = formatImageUrl(item);
      if (formatted) return formatted;
    }
  }
  if (imageUrls && typeof imageUrls === 'string' && imageUrls.trim() !== '') {
    try {
      const parsed = JSON.parse(imageUrls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          const formatted = formatImageUrl(item);
          if (formatted) return formatted;
        }
      }
    } catch {}
  }
  return undefined;
};

export class SupabaseProductRepository {
  async createMany(products: Product[]): Promise<void> {
    const { error } = await supabase.from('products').insert(
      products.map(p => ({
        id: p.id,
        user_id: p.userId,
        custom_id: p.customId,
        name: p.name,
        product_type: p.productType,
        brand: p.brand,
        size_ml: p.sizeMl,
        perfume_type: p.perfumeType,
        price: p.price,
        quantity: p.quantity,
        gender: p.gender,
        expiration_date: p.expirationDate,
        weight: p.weight,
        ncm: p.ncm,
        sku: p.sku,
        image_url: p.imageUrl,
        image_urls: p.imageUrls,
        condition: p.condition,
        listing_type_id: p.listingTypeId,
        gtin: p.gtin,
        warranty_type: p.warrantyType,
        warranty_time: p.warrantyTime,
        ml_category_id: p.mlCategoryId,
        ml_attributes: p.mlAttributes,
        created_at: p.createdAt.toISOString()
      }))
    );

    if (error) {
      console.error('Erro ao salvar produtos no Supabase:', error);
      throw new Error('Falha ao salvar produtos no banco de dados.');
    }
  }

  async listAll(userId?: string): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar produtos do Supabase:', error);
      throw new Error('Falha ao listar produtos do banco de dados.');
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      customId: row.custom_id,
      name: row.name,
      productType: row.product_type,
      brand: row.brand,
      sizeMl: row.size_ml,
      perfumeType: row.perfume_type,
      price: Number(row.price),
      quantity: Number(row.quantity),
      gender: row.gender,
      expirationDate: row.expiration_date,
      weight: Number(row.weight),
      ncm: row.ncm,
      sku: row.sku,
      imageUrl: getPrimaryImageUrl(row.image_url, row.image_urls),
      imageUrls: row.image_urls,
      condition: row.condition,
      listingTypeId: row.listing_type_id,
      gtin: row.gtin,
      warrantyType: row.warranty_type,
      warrantyTime: row.warranty_time,
      mlCategoryId: row.ml_category_id,
      mlAttributes: row.ml_attributes,
      createdAt: new Date(row.created_at)
    }));
  }

  async getById(id: string, userId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      customId: data.custom_id,
      name: data.name,
      productType: data.product_type,
      brand: data.brand,
      sizeMl: data.size_ml,
      perfumeType: data.perfume_type,
      price: Number(data.price),
      quantity: Number(data.quantity),
      gender: data.gender,
      expirationDate: data.expiration_date,
      weight: Number(data.weight),
      ncm: data.ncm,
      sku: data.sku,
      imageUrl: getPrimaryImageUrl(data.image_url, data.image_urls),
      imageUrls: data.image_urls,
      condition: data.condition,
      listingTypeId: data.listing_type_id,
      gtin: data.gtin,
      warrantyType: data.warranty_type,
      warrantyTime: data.warranty_time,
      mlCategoryId: data.ml_category_id,
      mlAttributes: data.ml_attributes,
      createdAt: new Date(data.created_at)
    };
  }

  async update(id: string, userId: string, updateData: Partial<Product>): Promise<Product | null> {
    const mapToSnakeCase: any = {};
    if (updateData.name !== undefined) mapToSnakeCase.name = updateData.name;
    if (updateData.productType !== undefined) mapToSnakeCase.product_type = updateData.productType;
    if (updateData.brand !== undefined) mapToSnakeCase.brand = updateData.brand;
    if (updateData.sizeMl !== undefined) mapToSnakeCase.size_ml = updateData.sizeMl;
    if (updateData.perfumeType !== undefined) mapToSnakeCase.perfume_type = updateData.perfumeType;
    if (updateData.price !== undefined) mapToSnakeCase.price = updateData.price;
    if (updateData.quantity !== undefined) mapToSnakeCase.quantity = updateData.quantity;
    if (updateData.gender !== undefined) mapToSnakeCase.gender = updateData.gender;
    if (updateData.expirationDate !== undefined) mapToSnakeCase.expiration_date = updateData.expirationDate;
    if (updateData.weight !== undefined) mapToSnakeCase.weight = updateData.weight;
    if (updateData.ncm !== undefined) mapToSnakeCase.ncm = updateData.ncm;
    if (updateData.sku !== undefined) mapToSnakeCase.sku = updateData.sku;
    if (updateData.imageUrl !== undefined) mapToSnakeCase.image_url = updateData.imageUrl;
    if (updateData.imageUrls !== undefined) mapToSnakeCase.image_urls = updateData.imageUrls;
    if (updateData.condition !== undefined) mapToSnakeCase.condition = updateData.condition;
    if (updateData.listingTypeId !== undefined) mapToSnakeCase.listing_type_id = updateData.listingTypeId;
    if (updateData.gtin !== undefined) mapToSnakeCase.gtin = updateData.gtin;
    if (updateData.warrantyType !== undefined) mapToSnakeCase.warranty_type = updateData.warrantyType;
    if (updateData.warrantyTime !== undefined) mapToSnakeCase.warranty_time = updateData.warrantyTime;
    if (updateData.mlCategoryId !== undefined) mapToSnakeCase.ml_category_id = updateData.mlCategoryId;
    if (updateData.mlAttributes !== undefined) mapToSnakeCase.ml_attributes = updateData.mlAttributes;
    if (updateData.customId !== undefined) mapToSnakeCase.custom_id = updateData.customId;
    if (updateData.shippingMode !== undefined) mapToSnakeCase.shipping_mode = updateData.shippingMode;

    const { data, error } = await supabase
      .from('products')
      .update(mapToSnakeCase)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao atualizar produto no Supabase:', error);
      throw new Error('Falha ao atualizar produto no banco de dados.');
    }

    return this.getById(id, userId);
  }

  async updateManyProducts(
    ids: string[],
    userId: string,
    updateData: {
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
    }
  ): Promise<void> {
    const mapToSnakeCase: any = {};
    if (updateData.price !== undefined) mapToSnakeCase.price = updateData.price;
    if (updateData.quantity !== undefined) mapToSnakeCase.quantity = updateData.quantity;
    if (updateData.mlCategoryId !== undefined) mapToSnakeCase.ml_category_id = updateData.mlCategoryId;
    if (updateData.brand !== undefined) mapToSnakeCase.brand = updateData.brand;
    if (updateData.ncm !== undefined) mapToSnakeCase.ncm = updateData.ncm;
    if (updateData.gtin !== undefined) mapToSnakeCase.gtin = updateData.gtin;
    if (updateData.condition !== undefined) mapToSnakeCase.condition = updateData.condition;
    if (updateData.listingTypeId !== undefined) mapToSnakeCase.listing_type_id = updateData.listingTypeId;
    if (updateData.warrantyType !== undefined) mapToSnakeCase.warranty_type = updateData.warrantyType;
    if (updateData.warrantyTime !== undefined) mapToSnakeCase.warranty_time = updateData.warrantyTime;
    if (updateData.perfumeType !== undefined) mapToSnakeCase.perfume_type = updateData.perfumeType;
    if (updateData.gender !== undefined) mapToSnakeCase.gender = updateData.gender;
    if (updateData.sizeMl !== undefined) mapToSnakeCase.size_ml = updateData.sizeMl;
    if (updateData.clearImage) {
      mapToSnakeCase.image_url = null;
      mapToSnakeCase.image_urls = [];
    }

    if (Object.keys(mapToSnakeCase).length === 0) return;

    const { error } = await supabase
      .from('products')
      .update(mapToSnakeCase)
      .in('id', ids)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao atualizar produtos em massa no Supabase:', error);
      throw new Error('Falha ao atualizar produtos em massa no banco de dados.');
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir produto no Supabase:', error);
      throw new Error('Falha ao excluir produto.');
    }
  }

  async deleteMany(ids: string[], userId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir produtos em massa no Supabase:', error);
      throw new Error('Falha ao excluir produtos em massa.');
    }
  }

  async create(userId: string, productData: Partial<Product>): Promise<Product> {
    const mapToSnakeCase: any = {
      user_id: userId,
      custom_id: productData.customId,
      name: productData.name,
      product_type: productData.productType,
      brand: productData.brand,
      price: productData.price,
      quantity: productData.quantity,
      size_ml: productData.sizeMl,
      perfume_type: productData.perfumeType,
      gender: productData.gender,
      expiration_date: productData.expirationDate,
      weight: productData.weight,
      ncm: productData.ncm,
      sku: productData.sku,
      image_url: productData.imageUrl,
      image_urls: productData.imageUrls,
      condition: productData.condition,
      listing_type_id: productData.listingTypeId,
      gtin: productData.gtin,
      warranty_type: productData.warrantyType,
      warranty_time: productData.warrantyTime,
      ml_category_id: productData.mlCategoryId,
      ml_attributes: productData.mlAttributes,
    };

    const response = await supabase
      .from('products')
      .insert(mapToSnakeCase)
      .select()
      .single();

    const error = response.error;
    const data: any = response.data;

    if (error || !data) {
      console.error('Erro ao criar produto no Supabase:', error);
      throw new Error('Falha ao criar produto no banco de dados.');
    }

    return {
      id: data.id,
      userId: data.user_id,
      customId: data.custom_id,
      name: data.name,
      productType: data.product_type,
      brand: data.brand,
      sizeMl: data.size_ml,
      perfumeType: data.perfume_type,
      price: Number(data.price),
      quantity: Number(data.quantity),
      gender: data.gender,
      expirationDate: data.expiration_date,
      weight: Number(data.weight),
      ncm: data.ncm,
      sku: data.sku,
      imageUrl: data.image_url,
      imageUrls: data.image_urls,
      condition: data.condition,
      listingTypeId: data.listing_type_id,
      gtin: data.gtin,
      warrantyType: data.warranty_type,
      warrantyTime: data.warranty_time,
      mlCategoryId: data.ml_category_id,
      mlAttributes: data.ml_attributes,
      createdAt: new Date(data.created_at)
    };
  }
}
