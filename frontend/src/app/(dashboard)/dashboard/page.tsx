'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, TrendingUp, Package, Activity, Plus, Sparkles, ArrowUpRight } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import Link from 'next/link';
import { SalesOverviewChart } from '@/components/features/dashboard/SalesOverviewChart';

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  created_at?: string;
  date?: string | number | Date;
}

interface DashboardMetrics {
  totalListings?: number;
  activeListings?: number;
  pausedListings?: number;
  totalDuplicatedAI?: number;
  totalProducts?: number;
  activeAds?: number;
  pausedAds?: number;
  syncRate?: number;
  recentActivities: ActivityItem[];
  [key: string]: unknown;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
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
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary"></div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider animate-pulse">Carregando métricas...</span>
        </div>
      </div>
    );
  }

  const metricCards = [
    { 
      label: 'Anúncios Lidos', 
      value: Number(metrics?.totalListings || 0), 
      icon: Package, 
      description: 'Sincronizados com o Mercado Livre',
      badge: 'Total',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    { 
      label: 'Ativos no ML', 
      value: Number(metrics?.activeListings || 0), 
      icon: Play, 
      description: 'Anúncios no ar vendendo agora',
      badge: 'Online',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    { 
      label: 'Pausados', 
      value: Number(metrics?.pausedListings || 0), 
      icon: Pause, 
      description: 'Anúncios inativos ou sem estoque',
      badge: 'Atenção',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    { 
      label: 'Gerados por IA', 
      value: Number(metrics?.totalDuplicatedAI || 0), 
      icon: TrendingUp, 
      description: 'Títulos e descrições otimizados por IA',
      badge: 'AI Powered',
      badgeClass: 'bg-primary/10 text-primary border-primary/20'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-8">
      {/* Top Banner & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Visão geral em tempo real da performance dos seus anúncios.</p>
        </div>
        <Link 
          href="/products/import"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-full font-semibold transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 flex items-center gap-2 text-sm w-fit group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
          Nova Importação
        </Link>
      </div>

      {/* Metrics 4-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((card, idx) => (
          <div 
            key={idx} 
            className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-primary/40 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
          >
            {/* Top accent glow line on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <card.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</h3>
              <div className="text-3xl font-extrabold text-foreground tracking-tight mt-1">{card.value}</div>
            </div>

            <p className="text-[11px] text-muted-foreground/80 mt-4 border-t border-border/30 pt-3 flex items-center justify-between">
              <span>{card.description}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Box */}
        <SalesOverviewChart />

        {/* Recent Activities Feed */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Atividades Recentes</h2>
                <p className="text-xs text-muted-foreground">Ações de automação e IA</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto pr-2 max-h-[360px] scrollbar-hide">
            {metrics?.recentActivities?.map((activity: ActivityItem, index: number) => (
              <div key={activity.id} className="flex gap-3.5 group">
                <div className="flex flex-col items-center mt-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/15 transition-transform group-hover:scale-125 duration-200"></div>
                  {index !== (metrics.recentActivities?.length || 0) - 1 && (
                    <div className="w-px h-full bg-border/50 my-1.5"></div>
                  )}
                </div>
                <div className="pb-2 flex-1">
                  <p className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{activity.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5 uppercase font-bold tracking-wider">
                    {new Date(activity.date || activity.created_at || Date.now()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
            {(!metrics?.recentActivities || metrics.recentActivities.length === 0) && (
              <div className="h-64 flex flex-col items-center justify-center text-center py-10">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhuma atividade recente</p>
                <p className="text-xs text-muted-foreground mt-1">Quando a IA ou sincronização rodarem, os logs aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
