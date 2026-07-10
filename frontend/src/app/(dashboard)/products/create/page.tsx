'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Package, Tag, Box, Palette } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { MLDynamicAttributes } from '@/components/MLDynamicAttributes';

export default function CreateProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    productType: 'Perfume',
    brand: '',
    price: 0 as number | string,
    quantity: 0 as number | string,
    sku: '',
    ncm: '',
    weight: 0 as number | string,
    imageUrl: '',
    sizeMl: '',
    perfumeType: '',
    gender: '',
    expirationDate: '',
    condition: 'Novo',
    listingTypeId: 'gold_special',
    gtin: '',
    warrantyType: 'Garantia do vendedor',
    warrantyTime: '30 dias',
    mlCategoryId: '',
    mlCategoryName: '',
    mlAttributes: {} as Record<string, unknown>
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let finalValue: string | number = value;
    if (name === 'price' || name === 'quantity' || name === 'weight') {
      const normalizedStr = value.replace(',', '.');
      finalValue = normalizedStr === '' ? '' : Number(normalizedStr);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
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
      // Preparar os atributos adicionais no payload (se for enviar para o ML na mesma hora)
      // Mas pro banco, a gente mapeia como propriedades normais do produto no backend

      const res = await authenticatedFetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar produto');
      }
      
      router.push('/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
      setSaving(false);
    }
  };

  const isPerfume = formData.productType === 'Perfume';

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Novo Produto</h1>
            <p className="text-sm text-muted-foreground mt-1">Crie um novo produto manualmente</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Informações Principais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome do Produto *</label>
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo de Produto *</label>
              <select 
                required
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
              >
                <option value="Perfume">Perfume / Cosmético</option>
                <option value="Outro">Outro Produto Geral</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Marca</label>
              <input 
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        {isPerfume && (
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              Atributos de Perfume
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tamanho (ML)</label>
                <input 
                  name="sizeMl"
                  value={formData.sizeMl}
                  onChange={handleChange}
                  placeholder="Ex: 100ml"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Gênero</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-foreground"
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Unissex">Unissex</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo de Perfume</label>
                <input 
                  name="perfumeType"
                  value={formData.perfumeType}
                  onChange={handleChange}
                  placeholder="Ex: Eau de Parfum"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Validade</label>
                <input 
                  name="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-foreground"
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-500" />
            Preço e Estoque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preço de Venda (R$) *</label>
              <input 
                required
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantidade em Estoque *</label>
              <input 
                required
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-500" />
            Logística e Identificação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">SKU (Código)</label>
              <div className="flex items-center gap-2">
                <input 
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.name) return;
                    const generatedSku = formData.name
                      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    
                    setFormData(prev => ({ ...prev, sku: generatedSku.toUpperCase() }));
                  }}
                  className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-xs font-semibold transition-colors whitespace-nowrap"
                  title="Gerar SKU com base no Título"
                >
                  Gerar
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">NCM</label>
              <input 
                name="ncm"
                value={formData.ncm}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Peso (kg)</label>
              <input 
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center font-bold text-blue-600 bg-blue-100 rounded-full text-[10px]">ML</span>
            Integração Mercado Livre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Condição</label>
              <select 
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
              >
                <option value="Novo">Novo</option>
                <option value="Usado">Usado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo de Anúncio</label>
              <select 
                name="listingTypeId"
                value={formData.listingTypeId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
              >
                <option value="gold_special">Clássico (gold_special)</option>
                <option value="gold_pro">Premium (gold_pro)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Código de Barras (GTIN/EAN)</label>
              <input 
                name="gtin"
                value={formData.gtin}
                onChange={handleChange}
                placeholder="Ex: 7891010101010"
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo de Garantia</label>
              <select 
                name="warrantyType"
                value={formData.warrantyType}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
              >
                <option value="Garantia do vendedor">Garantia do vendedor</option>
                <option value="Garantia de fábrica">Garantia de fábrica</option>
                <option value="Sem garantia">Sem garantia</option>
              </select>
            </div>
            {formData.warrantyType !== 'Sem garantia' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tempo de Garantia</label>
                <input 
                  name="warrantyTime"
                  value={formData.warrantyTime}
                  onChange={handleChange}
                  placeholder="Ex: 30 dias, 3 meses"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t border-border pt-6">
            <MLDynamicAttributes
              title={formData.name}
              categoryId={formData.mlCategoryId}
              categoryName={formData.mlCategoryName}
              attributesData={formData.mlAttributes}
              onCategorySelected={(id, name) => setFormData(prev => ({ ...prev, mlCategoryId: id, mlCategoryName: name }))}
              onAttributeChange={(key, value) => setFormData(prev => ({ 
                ...prev, 
                mlAttributes: { ...prev.mlAttributes, [key]: value } 
              }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link 
            href="/products"
            className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-md font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Criar Produto
          </button>
        </div>
      </form>
    </div>
  );
}
