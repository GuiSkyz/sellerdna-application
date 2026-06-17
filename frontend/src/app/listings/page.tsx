'use client';

import React, { useEffect, useState } from 'react';
import { Store, RefreshCw, Search, ExternalLink, Activity, ShoppingCart, Eye } from 'lucide-react';

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
      const res = await fetch(`${apiUrl}/api/listings`);
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
      const res = await fetch(`${apiUrl}/api/ml/accounts`);
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
      // Por simplicidade neste MVP, sincroniza a primeira conta conectada
      const accountId = accounts[0].id;
      
      const res = await fetch(`${apiUrl}/api/listings/sync`, {
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
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Anúncios do Mercado Livre</h1>
          <p className="text-sm text-zinc-500 mt-1">Visualize e gerencie seus anúncios publicados no Mercado Livre.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing || accounts.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Anúncios do ML'}
        </button>
      </div>

      <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar por título ou ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="text-sm text-zinc-500 font-medium">
            {filteredListings.length} anúncios
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Anúncio</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Saúde</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Métricas</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-2">{listing.title}</span>
                      <span className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-[10px] font-medium border border-zinc-200">{listing.ml_item_id}</span>
                        • R$ {listing.price.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                      <Activity className={`w-4 h-4 ${listing.health >= 0.8 ? 'text-emerald-500' : listing.health >= 0.5 ? 'text-amber-500' : 'text-rose-500'}`} />
                      {Math.round(listing.health * 100)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4 text-xs font-medium text-zinc-600">
                      <div className="flex items-center gap-1.5" title="Visitas">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        {listing.visits}
                      </div>
                      <div className="flex items-center gap-1.5" title="Vendas">
                        <ShoppingCart className="w-4 h-4 text-blue-400" />
                        {listing.sold_quantity}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${listing.available_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {listing.available_quantity} un
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                      listing.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 
                      listing.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                      'bg-zinc-100 text-zinc-600 border-zinc-200/50'
                    }`}>
                      {listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <a href={listing.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">Nenhum anúncio encontrado.</p>
                    <p className="text-sm text-zinc-400 mt-1">Conecte sua conta e clique em Sincronizar Anúncios.</p>
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
