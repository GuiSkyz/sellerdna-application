'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackageSearch, Sparkles, UploadCloud, Search, ExternalLink, Trash2, Edit } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

interface Product {
  id: string;
  name: string;
  productType?: string;
  brand: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku: string;
  customId?: string;
  ncm?: string;
  mlListingsCount?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const res = await authenticatedFetch(`${apiUrl}/api/products`);
        if (!res.ok) throw new Error('Erro ao buscar produtos');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setProducts(products.filter(p => p.id !== id));
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } catch (err) {
      console.error(err);
      alert('Falha ao excluir o produto.');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} produtos?`)) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (!res.ok) throw new Error('Erro ao excluir em massa');
      
      setProducts(products.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert('Falha ao excluir os produtos selecionados.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Meus Produtos</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os produtos importados da sua planilha.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 border border-rose-200/50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Excluindo...' : `Excluir (${selectedIds.length})`}
            </button>
          )}
          <Link 
            href="/products/import"
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Importar Mais
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="text-sm text-zinc-500 font-medium">
            {filteredProducts.length} produtos
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">CUST ID</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Preço (R$)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">NCM</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Anúncios ML</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-zinc-50/50 transition-colors group ${selectedIds.includes(product.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 font-mono">
                    {product.customId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex-shrink-0 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <PackageSearch className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">{product.name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{product.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md text-xs font-medium border border-zinc-200/50">
                      {product.sku || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${product.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {product.quantity} un
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {product.ncm || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {product.mlListingsCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/products/${product.id}/generate-ad`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors border border-purple-200/50"
                        title="Gerar Anúncio com IA"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Gerar Anúncio
                      </Link>
                      <Link 
                        href={`/products/${product.id}/edit`}
                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                        title="Editar Produto"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <PackageSearch className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">Nenhum produto encontrado.</p>
                    <p className="text-sm text-zinc-400 mt-1">Faça uma importação para começar a gerenciar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
