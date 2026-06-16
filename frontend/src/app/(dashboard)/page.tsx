'use client';

import React, { useEffect, useState } from 'react';
import { Box, Play, Pause, CheckCircle2, TrendingUp, Package, Activity, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('http://localhost:3333/api/dashboard/metrics');
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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1.5 text-sm">Acompanhe a performance dos seus anúncios importados.</p>
        </div>
        <Link 
          href="/products/import"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          Nova Importação
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Anúncios Lidos', value: metrics?.totalListings || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50/80', border: 'border-blue-100' },
          { label: 'Ativos no ML', value: metrics?.activeListings || 0, icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50/80', border: 'border-emerald-100' },
          { label: 'Pausados', value: metrics?.pausedListings || 0, icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50/80', border: 'border-amber-100' },
          { label: 'Gerados por IA', value: metrics?.totalDuplicatedAI || 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50/80', border: 'border-purple-100' },
        ].map((card, idx) => (
          <div key={idx} className={`bg-white border ${card.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group`}>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-transparent to-black/[0.02] rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4 relative">
              <h3 className="text-sm font-semibold text-zinc-500">{card.label}</h3>
              <div className={`${card.bg} p-2.5 rounded-xl`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-zinc-900 tracking-tight relative">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200/60 rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-zinc-100">
          <div className="p-2 bg-zinc-100 rounded-lg">
            <Activity className="h-5 w-5 text-zinc-600" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Atividades Recentes</h2>
        </div>
        <div className="space-y-6">
          {metrics?.recentActivities?.map((activity: any, index: number) => (
            <div key={activity.id} className="flex gap-4 group">
              <div className="flex flex-col items-center mt-1">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                {index !== (metrics.recentActivities?.length || 0) - 1 && (
                  <div className="w-px h-full bg-zinc-100 my-1 group-hover:bg-blue-100 transition-colors"></div>
                )}
              </div>
              <div className="pb-6">
                <p className="font-semibold text-zinc-900 text-sm">{activity.action}</p>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{activity.description}</p>
                <p className="text-xs text-zinc-400 mt-2 font-medium">
                  {new Date(activity.date).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
          {(!metrics?.recentActivities || metrics.recentActivities.length === 0) && (
            <p className="text-sm text-zinc-500 text-center py-4">Nenhuma atividade recente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
