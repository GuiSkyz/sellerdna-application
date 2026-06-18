import { Product } from '../entities/Product';
import { supabase } from '../../infrastructure/database/supabase';

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

  async listAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

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
      imageUrl: row.image_url,
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
      imageUrl: data.image_url,
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
    if (updateData.condition !== undefined) mapToSnakeCase.condition = updateData.condition;
    if (updateData.listingTypeId !== undefined) mapToSnakeCase.listing_type_id = updateData.listingTypeId;
    if (updateData.gtin !== undefined) mapToSnakeCase.gtin = updateData.gtin;
    if (updateData.warrantyType !== undefined) mapToSnakeCase.warranty_type = updateData.warrantyType;
    if (updateData.warrantyTime !== undefined) mapToSnakeCase.warranty_time = updateData.warrantyTime;
    if (updateData.mlCategoryId !== undefined) mapToSnakeCase.ml_category_id = updateData.mlCategoryId;
    if (updateData.mlAttributes !== undefined) mapToSnakeCase.ml_attributes = updateData.mlAttributes;

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
      createdAt: new Date(data.created_at)
    };
  }
}
