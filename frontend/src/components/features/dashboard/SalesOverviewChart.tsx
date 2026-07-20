'use client';

import React, { useState } from 'react';
import { Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function SalesOverviewChart() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const data30d = [
    { date: '01/07', vendas: 1420, visitas: 4200 },
    { date: '03/07', vendas: 1850, visitas: 4800 },
    { date: '05/07', vendas: 1620, visitas: 4600 },
    { date: '08/07', vendas: 2400, visitas: 5900 },
    { date: '11/07', vendas: 2100, visitas: 5400 },
    { date: '14/07', vendas: 2890, visitas: 6800 },
    { date: '17/07', vendas: 2650, visitas: 6400 },
    { date: '20/07', vendas: 3420, visitas: 7900 },
    { date: '23/07', vendas: 3100, visitas: 7300 },
    { date: '26/07', vendas: 3890, visitas: 8500 },
    { date: '28/07', vendas: 4210, visitas: 9100 },
    { date: '30/07', vendas: 4580, visitas: 9800 },
  ];

  const data7d = data30d.slice(-6);
  const data90d = [
    { date: 'Mai', vendas: 18500, visitas: 45000 },
    { date: 'Jun', vendas: 29400, visitas: 68000 },
    { date: 'Jul', vendas: 48290, visitas: 95000 },
  ];

  const chartData = period === '7d' ? data7d : period === '90d' ? data90d : data30d;

  return (
    <div className="lg:col-span-2 bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between">
      <div>
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Visão Geral de Vendas</h2>
                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  +18.4%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Monitoramento de conversão e receita diária</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 w-fit">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  period === p 
                    ? 'bg-background text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/5 to-transparent border border-border/30">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Receita Estimada</span>
            <div className="text-xl font-extrabold text-foreground mt-0.5">R$ 48.290,00</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Taxa de Conversão</span>
            <div className="text-xl font-extrabold text-foreground mt-0.5">3.8%</div>
          </div>
          <div className="hidden sm:block">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Visitas Totais</span>
            <div className="text-xl font-extrabold text-foreground mt-0.5">95.400</div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066FF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0066FF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(150,150,150,0.6)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="rgba(150,150,150,0.6)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} 
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl">
                        <p className="text-xs font-bold text-muted-foreground mb-1">{label}</p>
                        <p className="text-sm font-extrabold text-primary">
                          Vendas: R$ {Number(payload[0].value).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Visitas: {payload[0].payload.visitas?.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="vendas" 
                stroke="#0066FF" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30 text-xs text-muted-foreground">
        <span>Sincronizado em tempo real com API do Mercado Livre</span>
        <a href="/listings" className="text-primary hover:underline font-semibold flex items-center gap-1 group">
          <span>Ver todos os anúncios</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
