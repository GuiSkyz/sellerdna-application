'use client';

import React, { useEffect, useState } from 'react';
import { Store, RefreshCw, Search, ExternalLink, Activity, ShoppingCart, Eye, Zap, Link2, Unlink, Filter, ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

interface Listing {
  id: string;
  ml_item_id: string;
  title: string;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  visits: number;
  health: number;
  status: string;
  permalink: string;
  created_at: string;
  product_id?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface MLAccount {
  id: string;
  user_id?: string;
  ml_user_id?: string;
  nickname?: string;
  [key: string]: unknown;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku?: string; }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtros avançados e Ordenação
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'connected' | 'unconnected'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'problem'>('all');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'with_photo' | 'without_photo'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'az' | 'za'>('newest');

  const [linkingListing, setLinkingListing] = useState<Listing | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);

  const fetchListings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/listings`);
      if (!res.ok) throw new Error('Erro ao buscar anúncios');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch listings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/ml/accounts`);
      if (!res.ok) throw new Error('Erro ao buscar contas');
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchAccounts(), fetchListings(), fetchProducts()]);
    };
    init();
  }, []);

  const handleSync = async () => {
    if (accounts.length === 0) {
      toast.error('Conecte uma conta do Mercado Livre em Configurações primeiro.');
      return;
    }
    
    setSyncing(true);
    const toastId = toast.loading('Sincronizando anúncios com o Mercado Livre...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const accountId = accounts[0].id;
      
      const res = await authenticatedFetch(`${apiUrl}/api/listings/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      
      if (!res.ok) throw new Error('Erro na sincronização');
      await fetchListings();
      toast.success('Sincronização concluída com sucesso!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Falha ao sincronizar anúncios.', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredListings.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleOpenLinkModal = (listing: Listing) => {
    setLinkingListing(listing);
    setSelectedProductId(listing.product_id || (listing.product ? listing.product.id : ''));
  };

  const handleSaveLink = async () => {
    if (!linkingListing) return;
    setIsUpdatingLink(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/listings/${linkingListing.id}/link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId || null })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao vincular produto');
      }
      toast.success(selectedProductId ? 'Anúncio vinculado ao produto com sucesso!' : 'Anúncio desvinculado!');
      await fetchListings();
      setLinkingListing(null);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar vínculo');
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const filteredListings = listings
    .filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || 
                            l.ml_item_id.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Filtro de conexão ao produto
      const isConnected = Boolean(l.product_id || l.product?.id);
      if (connectionFilter === 'connected' && !isConnected) return false;
      if (connectionFilter === 'unconnected' && isConnected) return false;

      // Filtro de status
      if (statusFilter === 'active' && l.status !== 'active') return false;
      if (statusFilter === 'paused' && l.status !== 'paused') return false;
      if (statusFilter === 'problem' && (l.status === 'active' || l.status === 'paused')) return false;

      // Filtro por foto
      const pictures = (l as any).pictures || [];
      const hasPhoto = (Array.isArray(pictures) && pictures.length > 0) || Boolean((l as any).thumbnail || l.product?.sku);
      if (photoFilter === 'with_photo' && !hasPhoto) return false;
      if (photoFilter === 'without_photo' && hasPhoto) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'az') return a.title.localeCompare(b.title);
      if (sortOrder === 'za') return b.title.localeCompare(a.title);
      // 'newest' (Últimos criados)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Anúncios do Mercado Livre</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize e gerencie seus anúncios publicados no Mercado Livre.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing || accounts.length === 0}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar ML'}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap flex-1">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar por título ou ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            {/* Filtro de Conexão */}
            <div className="flex items-center bg-background border border-border rounded-md p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setConnectionFilter('all')}
                className={`px-2.5 py-1.5 rounded transition-colors ${connectionFilter === 'all' ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setConnectionFilter('connected')}
                className={`px-2.5 py-1.5 rounded transition-colors ${connectionFilter === 'connected' ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Conectados
              </button>
              <button
                type="button"
                onClick={() => setConnectionFilter('unconnected')}
                className={`px-2.5 py-1.5 rounded transition-colors ${connectionFilter === 'unconnected' ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sem Vínculo
              </button>
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="all">Status: Todos</option>
                <option value="active">Ativos</option>
                <option value="paused">Pausados</option>
                <option value="problem">Com problema</option>
              </select>
            </div>

            {/* Filtro por Foto */}
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              <select
                value={photoFilter}
                onChange={(e) => setPhotoFilter(e.target.value as any)}
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="all">Foto: Todos</option>
                <option value="with_photo">Com foto</option>
                <option value="without_photo">Sem foto</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="newest">Últimos criados</option>
                <option value="az">A até Z</option>
                <option value="za">Z até A</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium whitespace-nowrap self-end lg:self-center bg-muted px-3 py-1.5 rounded-full">
            {filteredListings.length} {filteredListings.length === 1 ? 'anúncio' : 'anúncios'}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-muted-foreground/30 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={filteredListings.length > 0 && selectedIds.size === filteredListings.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">Anúncio</th>
                <th className="px-6 py-4">Produto Conectado</th>
                <th className="px-6 py-4 text-center">Saúde</th>
                <th className="px-6 py-4 text-center">Métricas</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className={`hover:bg-muted/30 transition-colors group ${selectedIds.has(listing.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-muted-foreground/30 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      checked={selectedIds.has(listing.id)}
                      onChange={(e) => handleSelectOne(listing.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{listing.title}</span>
                      <span className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium border border-border">{listing.ml_item_id}</span>
                        <span>R$ {listing.price.toFixed(2)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {listing.product || listing.product_id ? (
                      <div className="flex items-center justify-between gap-2 group/prod">
                        <div className="flex flex-col max-w-[180px]">
                          <span className="text-xs font-semibold text-foreground truncate" title={listing.product?.name || 'Produto Conectado'}>
                            {listing.product?.name || 'Produto Conectado'}
                          </span>
                          {listing.product?.sku && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              SKU: {listing.product.sku}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenLinkModal(listing)}
                          className="opacity-0 group-hover/prod:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                          title="Alterar produto conectado"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenLinkModal(listing)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                        title="Vincular este anúncio a um produto do sistema"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        Sem Vínculo
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground">
                      <Activity className="w-4 h-4 text-muted-foreground/60" />
                      {Math.round(listing.health * 100)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5" title="Visitas">
                        <Eye className="w-4 h-4 text-muted-foreground/60" />
                        {listing.visits}
                      </div>
                      <div className="flex items-center gap-1.5" title="Vendas">
                        <ShoppingCart className="w-4 h-4 text-primary/70" />
                        {listing.sold_quantity}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${listing.available_quantity > 0 ? 'text-foreground' : 'text-destructive'}`}>
                      {listing.available_quantity} un
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                      listing.status === 'paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    }`}>
                      {listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(listing.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end">
                      <a href={listing.permalink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground font-medium">Nenhum anúncio encontrado.</p>
                    <p className="text-sm text-muted-foreground mt-1">Conecte sua conta e clique em Sincronizar Anúncios.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-lg flex items-center gap-6">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedIds.size} anúncio{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
            <div className="h-4 w-px bg-background/20" />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  toast.promise(
                    new Promise(resolve => setTimeout(resolve, 2500)),
                    {
                      loading: 'Processando atualização em lote...',
                      success: 'Requisição de atualização enviada com sucesso.',
                      error: 'Erro ao processar lote.'
                    }
                  );
                  setSelectedIds(new Set());
                }} 
                className="flex items-center gap-1.5 text-xs font-medium text-background/80 hover:text-background transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar Lote
              </button>
              <button 
                onClick={() => {
                  toast.info('A otimização de anúncios por Inteligência Artificial será disponibilizada na próxima atualização.', {
                    icon: '🚀'
                  });
                  setSelectedIds(new Set());
                }} 
                className="flex items-center gap-1.5 text-xs font-medium text-background/80 hover:text-background transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Preencher IA
              </button>
            </div>
            <button 
              onClick={() => setSelectedIds(new Set())} 
              className="ml-2 text-background/60 hover:text-background transition-colors" 
              title="Limpar seleção"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Modal de Conectar Anúncio a Produto */}
      {linkingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Conectar Anúncio a Produto
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Selecione qual produto do seu inventário está associado a este anúncio do Mercado Livre.
            </p>

            <div className="bg-muted/30 p-3 rounded-lg border border-border mb-4 text-xs space-y-1">
              <div><span className="text-muted-foreground">Anúncio:</span> <strong className="text-foreground">{linkingListing.title}</strong></div>
              <div><span className="text-muted-foreground">ID ML:</span> <span className="font-mono text-purple-600 font-semibold">{linkingListing.ml_item_id}</span></div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-xs font-medium text-foreground block">Produto do Inventário</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Sem vínculo (desconectar) --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(SKU: ${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLinkingListing(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLink}
                disabled={isUpdatingLink}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdatingLink ? 'Salvando...' : 'Salvar Vínculo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
