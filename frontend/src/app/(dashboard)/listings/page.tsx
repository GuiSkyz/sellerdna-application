'use client';

import React, { useEffect, useState } from 'react';
import { Store, RefreshCw, Search, ExternalLink, Activity, ShoppingCart, Eye } from 'lucide-react';
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
      alert('Conecte uma conta do Mercado Livre em Configurações primeiro.');
      return;
    }
    
    setSyncing(true);
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
      alert('Sincronização concluída com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Falha ao sincronizar anúncios.');
    } finally {
      setSyncing(false);
    }
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
                <tr key={listing.id} className="hover:bg-muted/30 transition-colors group">
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
                      <Activity className={`w-4 h-4 ${listing.health >= 0.8 ? 'text-emerald-500' : listing.health >= 0.5 ? 'text-amber-500' : 'text-destructive'}`} />
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
                    <span className={`text-sm font-medium ${listing.available_quantity > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                      {listing.available_quantity} un
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                      listing.status === 'paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <a href={listing.permalink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
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
    </div>
  );
}
