'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackageSearch, Sparkles, UploadCloud, Search, Trash2, Edit, Package, ExternalLink } from 'lucide-react';
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

  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkMlCategoryId, setBulkMlCategoryId] = useState('');
  const [updatePriceChecked, setUpdatePriceChecked] = useState(false);
  const [updateQuantityChecked, setUpdateQuantityChecked] = useState(false);
  const [updateMlCategoryIdChecked, setUpdateMlCategoryIdChecked] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);

  const [isBulkPublishOpen, setIsBulkPublishOpen] = useState(false);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [bulkPublishProgress, setBulkPublishProgress] = useState('');
  const [bulkPublishResults, setBulkPublishResults] = useState<any[] | null>(null);

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

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatePriceChecked && !updateQuantityChecked && !updateMlCategoryIdChecked) {
      alert('Selecione pelo menos um campo para atualizar.');
      return;
    }
    
    setIsBulkEditing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const payload: any = { ids: selectedIds };
      if (updatePriceChecked) payload.price = Number(bulkPrice);
      if (updateQuantityChecked) payload.quantity = Number(bulkQuantity);
      if (updateMlCategoryIdChecked) payload.mlCategoryId = bulkMlCategoryId;

      const res = await authenticatedFetch(`${apiUrl}/api/products/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao atualizar em massa');
      
      alert('Produtos atualizados com sucesso!');
      setIsBulkEditOpen(false);
      setSelectedIds([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Falha ao atualizar os produtos.');
    } finally {
      setIsBulkEditing(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length > 10) {
      alert('Atenção: A limitação atual de lote de publicação com IA é de no máximo 10 produtos por vez para evitar instabilidades.');
      return;
    }

    setIsBulkPublishOpen(true);
    setIsBulkPublishing(true);
    setBulkPublishProgress('Iniciando publicação em lote...');
    setBulkPublishResults(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      setBulkPublishProgress('IA gerando títulos e descrições com dados oficiais dos perfumes... (Lote de até 10 anúncios)');
      
      const res = await authenticatedFetch(`${apiUrl}/api/listings/bulk-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na publicação em lote');
      
      setBulkPublishResults(data.results || []);
      setBulkPublishProgress('Concluído!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Falha na publicação em lote.');
      setIsBulkPublishOpen(false);
    } finally {
      setIsBulkPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Meus Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os produtos importados da sua planilha.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={() => setIsBulkEditOpen(true)}
                className="bg-secondary hover:bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar em Massa
              </button>
              <button 
                onClick={handleBulkPublish}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Publicar com IA ({selectedIds.length})
              </button>
              <button 
                onClick={async () => {
                  if (!confirm(`Sincronizar fotos para ${selectedIds.length} produtos via Google Drive?`)) return;
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
                  let imported = 0;
                  
                  for (const id of selectedIds) {
                    try {
                      const res = await authenticatedFetch(`${apiUrl}/api/gdrive/fetch-images`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: id })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Falha desconhecida');
                      imported++;
                    } catch (e: any) {
                      console.error(`Falha ao importar foto do produto ${id}`, e);
                      alert(`Erro ao importar fotos do produto ID ${id}: ${e.message}`);
                    }
                  }
                  if (imported > 0) {
                    alert(`Importação finalizada! ${imported} fotos importadas com sucesso.`);
                    window.location.reload();
                  }
                }}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-md text-sm font-medium transition-colors border border-primary/20 flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Buscar Fotos (Drive)
              </button>
              <button 
                onClick={async () => {
                  if (!confirm(`Tem certeza que deseja remover as fotos de ${selectedIds.length} produtos?`)) return;
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
                    const res = await authenticatedFetch(`${apiUrl}/api/products/bulk-update`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ids: selectedIds, clearImage: true })
                    });
                    if (!res.ok) throw new Error('Erro ao limpar fotos');
                    alert(`Fotos removidas de ${selectedIds.length} produtos.`);
                    window.location.reload();
                  } catch (e: any) {
                    alert(`Erro ao remover fotos: ${e.message}`);
                  }
                }}
                className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-orange-500/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Fotos
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-md text-sm font-medium transition-colors border border-destructive/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Excluindo...' : `Excluir (${selectedIds.length})`}
              </button>
            </>
          )}
          <Link 
            href="/products/create"
            className="bg-card hover:bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Novo Produto
          </Link>
          <Link 
            href="/products/import"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Importar
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredProducts.length} produtos
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="px-6 py-4 whitespace-nowrap">CUST ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Produto</th>
                <th className="px-6 py-4 whitespace-nowrap">SKU</th>
                <th className="px-6 py-4 whitespace-nowrap">Preço</th>
                <th className="px-6 py-4 whitespace-nowrap">Estoque</th>
                <th className="px-6 py-4 whitespace-nowrap">NCM</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Anúncios ML</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-muted/30 transition-colors group ${selectedIds.includes(product.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer h-4 w-4"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                    {product.customId || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 min-w-[250px]">
                      <div className="h-10 w-10 flex-shrink-0 bg-muted rounded-md border border-border flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <PackageSearch className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{product.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium border border-border">
                      {product.sku || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${product.quantity > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                      {product.quantity} un
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {product.ncm || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                      {product.mlListingsCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/products/${product.id}/generate-ad`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition-colors border border-primary/20"
                        title="Gerar Anúncio com IA"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        IA
                      </Link>
                      <Link 
                        href={`/products/${product.id}/edit`}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Editar Produto"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
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
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <PackageSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground font-medium">Nenhum produto encontrado.</p>
                    <p className="text-sm text-muted-foreground mt-1">Faça uma importação para começar a gerenciar seu catálogo.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="font-medium text-foreground">{filteredProducts.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edição em Massa */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edição em Massa ({selectedIds.length} selecionados)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Selecione quais campos deseja alterar em todos os produtos marcados. Os campos não marcados permanecerão inalterados.
            </p>
            
            <form onSubmit={handleBulkUpdate} className="space-y-6">
              {/* Preço */}
              <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/10">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
                  <input 
                    type="checkbox" 
                    checked={updatePriceChecked} 
                    onChange={(e) => setUpdatePriceChecked(e.target.checked)} 
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer h-4 w-4"
                  />
                  <span>Alterar Preço de Venda (R$)</span>
                </label>
                {updatePriceChecked && (
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Ex: 149.90"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                  />
                )}
              </div>

              {/* Estoque */}
              <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/10">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
                  <input 
                    type="checkbox" 
                    checked={updateQuantityChecked} 
                    onChange={(e) => setUpdateQuantityChecked(e.target.checked)} 
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer h-4 w-4"
                  />
                  <span>Alterar Quantidade em Estoque</span>
                </label>
                {updateQuantityChecked && (
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(e.target.value)}
                    placeholder="Ex: 15"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                  />
                )}
              </div>

              {/* Categoria ML */}
              <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/10">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
                  <input 
                    type="checkbox" 
                    checked={updateMlCategoryIdChecked} 
                    onChange={(e) => setUpdateMlCategoryIdChecked(e.target.checked)} 
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer h-4 w-4"
                  />
                  <span>Vincular Categoria Mercado Livre</span>
                </label>
                {updateMlCategoryIdChecked && (
                  <input 
                    type="text" 
                    required
                    value={bulkMlCategoryId}
                    onChange={(e) => setBulkMlCategoryId(e.target.value)}
                    placeholder="Ex: MLB1271 (Para Perfumes)"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono uppercase"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsBulkEditOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isBulkEditing || (!updatePriceChecked && !updateQuantityChecked && !updateMlCategoryIdChecked)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isBulkEditing ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></span> : null}
                  {isBulkEditing ? 'Salvando...' : 'Aplicar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Publicação em Massa */}
      {isBulkPublishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Publicação em Massa ({selectedIds.length} selecionados)
            </h3>
            
            {isBulkPublishing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <span className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></span>
                <p className="text-sm font-medium text-foreground text-center px-6">
                  {bulkPublishProgress}
                </p>
                <p className="text-xs text-muted-foreground">
                  A IA do SellerDNA está gerando títulos SEO e descrições baseadas nas características reais de cada perfume.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <p className="text-sm text-muted-foreground mb-4">
                  O processo de publicação em lote foi concluído. Veja os resultados abaixo:
                </p>
                
                <div className="flex-1 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-muted/10 mb-6 max-h-[50vh]">
                  {bulkPublishResults?.map((res, index) => (
                    <div key={index} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground line-clamp-1">{res.name}</span>
                        {res.success ? (
                          <span className="text-xs text-muted-foreground font-mono mt-0.5">ID: {res.mlItemId}</span>
                        ) : (
                          <span className="text-xs text-destructive mt-0.5 break-words">{res.error}</span>
                        )}
                      </div>
                      
                      <div>
                        {res.success ? (
                          <a 
                            href={res.permalink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                          >
                            Ver Anúncio <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-md text-xs font-semibold">
                            Falhou
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsBulkPublishOpen(false);
                      setSelectedIds([]);
                      window.location.reload();
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
                  >
                    Concluir e Recarregar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
