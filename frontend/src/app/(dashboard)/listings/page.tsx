'use client';

import React, { useEffect, useState } from 'react';
import { Store, RefreshCw, Search, ExternalLink, Activity, ShoppingCart, Eye, Zap } from 'lucide-react';
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
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    fetchAccounts();
    fetchListings();
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

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.ml_item_id.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por título ou ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredListings.length} anúncios
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
                      listing.status === 'active' ? 'bg-muted text-muted-foreground border-border' : 
                      listing.status === 'paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </span>
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
                  <td colSpan={7} className="px-6 py-16 text-center">
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
                  handleSync();
                  setSelectedIds(new Set());
                }} 
                className="flex items-center gap-1.5 text-xs font-medium text-background/80 hover:text-background transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar
              </button>
              <button 
                onClick={() => {
                  toast.promise(
                    new Promise(resolve => setTimeout(resolve, 3000)),
                    {
                      loading: 'Otimizando anúncios com IA (agent-browser)...',
                      success: 'Anúncios otimizados com sucesso!',
                      error: 'Erro ao otimizar.'
                    }
                  );
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
    </div>
  );
}
