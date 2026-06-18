'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, TrendingUp, Package, Activity, Plus } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const res = await authenticatedFetch(`${apiUrl}/api/dashboard/metrics`);
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visão geral da performance dos seus anúncios.</p>
        </div>
        <Link 
          href="/products/import"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors text-sm flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nova Importação
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Anúncios Lidos', value: metrics?.totalListings || 0, icon: Package },
          { label: 'Ativos no ML', value: metrics?.activeListings || 0, icon: Play },
          { label: 'Pausados', value: metrics?.pausedListings || 0, icon: Pause },
          { label: 'Gerados por IA', value: metrics?.totalDuplicatedAI || 0, icon: TrendingUp },
        ].map((card, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">{card.label}</h3>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-semibold text-foreground tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Visão Geral de Vendas</h2>
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">Gráfico de vendas será renderizado aqui.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-semibold text-foreground">Atividades Recentes</h2>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {metrics?.recentActivities?.map((activity: any, index: number) => (
              <div key={activity.id} className="flex gap-4 group">
                <div className="flex flex-col items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                  {index !== (metrics.recentActivities?.length || 0) - 1 && (
                    <div className="w-px h-full bg-border my-2"></div>
                  )}
                </div>
                <div className="pb-2">
                  <p className="font-medium text-foreground text-sm leading-none">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{activity.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5 uppercase font-medium tracking-wider">
                    {new Date(activity.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
            {(!metrics?.recentActivities || metrics.recentActivities.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
