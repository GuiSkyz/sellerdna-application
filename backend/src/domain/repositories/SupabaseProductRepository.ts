import { Product } from '../entities/Product';
import { supabase } from '../../infrastructure/database/supabase';

export class SupabaseProductRepository {
  async createMany(products: Product[]): Promise<void> {
    const { error } = await supabase.from('products').insert(
      products.map(p => ({
        id: p.id,
        user_id: p.userId,
        name: p.name,
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
      name: row.name,
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
      createdAt: new Date(row.created_at)
    }));
  }
}
