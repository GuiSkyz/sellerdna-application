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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData = data.map(d => ({
          id: d.id,
          name: d.name,
          productType: d.product_type,
          brand: d.brand,
          price: Number(d.price),
          quantity: Number(d.quantity),
          imageUrl: d.image_url,
          sku: d.sku,
          customId: d.custom_id,
          ncm: d.ncm,
        }));
        
        setProducts(mappedData);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
    // Selects only the ones currently visible if they aren't all selected
    const visibleIds = paginatedProducts.map(p => p.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
    
    if (allVisibleSelected) {
      setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)));
    } else {
      const newSelections = visibleIds.filter(id => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...newSelections]);
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
            <>
              <button 
                onClick={async () => {
                  if (!confirm(`Sincronizar fotos para ${selectedIds.length} produtos via Google Drive?`)) return;
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
                  let imported = 0;
                  
                  // Executa importação um por um (MVP)
                  for (const id of selectedIds) {
                    try {
                      await authenticatedFetch(`${apiUrl}/api/gdrive/import-photos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: id })
                      });
                      imported++;
                    } catch (e) {
                      console.error(`Falha ao importar foto do produto ${id}`, e);
                    }
                  }
                  alert(`Importação finalizada! ${imported} fotos importadas com sucesso.`);
                  window.location.reload();
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 border border-blue-200/50"
              >
                <UploadCloud className="w-4 h-4" />
                Buscar Fotos (Drive)
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 border border-rose-200/50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Excluindo...' : `Excluir (${selectedIds.length})`}
              </button>
            </>
          )}
          <Link 
            href="/products/create"
            className="bg-white hover:bg-zinc-50 text-zinc-700 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 border border-zinc-200"
          >
            <Package className="w-4 h-4" />
            Novo Produto
          </Link>
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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
                    checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">CUST ID</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">SKU</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Preço (R$)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">NCM</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center whitespace-nowrap">Anúncios ML</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedProducts.map((product) => (
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
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <PackageSearch className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">Nenhum produto encontrado.</p>
                    <p className="text-sm text-zinc-400 mt-1">Faça uma importação para começar a gerenciar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <span className="text-sm text-zinc-500">
              Mostrando <span className="font-medium text-zinc-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-zinc-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="font-medium text-zinc-900">{filteredProducts.length}</span> resultados
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
