'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Package, Tag, Box, Palette } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    productType: 'Perfume',
    brand: '',
    price: 0,
    quantity: 0,
    sku: '',
    ncm: '',
    weight: 0,
    imageUrl: '',
    // Perfume specific:
    sizeMl: '',
    perfumeType: '',
    gender: '',
    expirationDate: ''
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const res = await authenticatedFetch(`${apiUrl}/api/products/${params.id}`);
        if (!res.ok) throw new Error('Falha ao carregar produto');
        const data = await res.json();
        
        setFormData({
          name: data.name || '',
          productType: data.productType || 'Perfume',
          brand: data.brand || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          sku: data.sku || '',
          ncm: data.ncm || '',
          weight: data.weight || 0,
          imageUrl: data.imageUrl || '',
          sizeMl: data.sizeMl || '',
          perfumeType: data.perfumeType || '',
          gender: data.gender || '',
          expirationDate: data.expirationDate || ''
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'weight' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      const payload = { ...formData };
      if (payload.productType !== 'Perfume') {
        payload.sizeMl = '';
        payload.perfumeType = '';
        payload.gender = '';
        payload.expirationDate = '';
      }

      const res = await authenticatedFetch(`${apiUrl}/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Erro ao salvar produto');
      
      router.push('/products');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const isPerfume = formData.productType === 'Perfume';

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Editar Produto</h1>
            <p className="text-sm text-zinc-500 mt-1">Modifique os atributos do produto no sistema</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Informações Principais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Nome do Produto *</label>
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Tipo de Produto *</label>
              <select 
                required
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Perfume">Perfume / Cosmético</option>
                <option value="Outro">Outro Produto Geral</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Marca</label>
              <input 
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {isPerfume && (
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-6 border-l-4 border-l-purple-500">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              Atributos de Perfume
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Tamanho (ML)</label>
                <input 
                  name="sizeMl"
                  value={formData.sizeMl}
                  onChange={handleChange}
                  placeholder="Ex: 100ml"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Gênero</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Unissex">Unissex</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Tipo de Perfume</label>
                <input 
                  name="perfumeType"
                  value={formData.perfumeType}
                  onChange={handleChange}
                  placeholder="Ex: Eau de Parfum"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Validade</label>
                <input 
                  name="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-500" />
            Preço e Estoque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Preço de Venda (R$) *</label>
              <input 
                required
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Quantidade em Estoque *</label>
              <input 
                required
                type="number"
                min="0"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-500" />
            Logística e Identificação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">SKU (Código)</label>
              <input 
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">NCM</label>
              <input 
                name="ncm"
                value={formData.ncm}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Peso (kg)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link 
            href="/products"
            className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
