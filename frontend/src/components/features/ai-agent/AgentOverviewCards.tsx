'use client';

import React from 'react';
import { Bot, Sparkles, CheckCircle2, TrendingUp, Clock, AlertCircle, Play, ShieldCheck } from 'lucide-react';

interface AgentOverviewProps {
  health: {
    total_products?: number;
    listed_products?: number;
    unlisted_products?: number;
    seo_score_avg?: number;
    time_saved_hours?: number;
    recent_actions_count?: number;
    reports_count?: number;
    status?: string;
  } | null;
  config: {
    status?: string;
    weekly_target_ads?: number;
    auto_publish_mode?: string;
  } | null;
  onRunNow: () => void;
  onGenerateAudit: () => void;
  running: boolean;
}

export function AgentOverviewCards({ health, config, onRunNow, onGenerateAudit, running }: AgentOverviewProps) {
  const isAgentActive = config?.status !== 'PAUSED';
  const total = health?.total_products || 0;
  const listed = health?.listed_products || 0;
  const unlisted = health?.unlisted_products || 0;
  const coveragePercent = total > 0 ? Math.round((listed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner do Agente AI */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-card to-card border border-purple-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 flex-shrink-0 animate-bounce-subtle">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                  SELLER DNA <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">AGENT</span>
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                  isAgentActive 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 dark:text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30 dark:text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  {isAgentActive ? 'Ativo & Monitorando 24/7' : 'Pausado'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
                O Agente Operacional Autônomo monitora seu inventário, audita SEO de anúncios e executa a criação em massa toda semana, enviando relatórios e notificações ao vivo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onGenerateAudit}
              disabled={running}
              className="px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-foreground font-semibold text-sm flex items-center gap-2 transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              Auditar Agora
            </button>
            <button
              onClick={onRunNow}
              disabled={running}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${running ? 'animate-spin' : 'animate-pulse'}`} />
              {running ? 'Gerando Anúncios...' : 'Rodar Criação Semanal Agora'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs do Agente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cobertura de Anúncios */}
        <div className="bg-card/90 border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cobertura de Anúncios</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-foreground">{listed} <span className="text-sm font-normal text-muted-foreground">/ {total}</span></h3>
            <span className="text-sm font-extrabold text-primary">{coveragePercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${coveragePercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            {unlisted} produtos aguardando criação
          </p>
        </div>

        {/* Card 2: Meta Semanal Programada */}
        <div className="bg-card/90 border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cadência Semanal</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-foreground">{config?.weekly_target_ads || 15} <span className="text-xs font-medium text-muted-foreground">anúncios / sem</span></h3>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-500">
              {config?.auto_publish_mode === 'PUBLISH' ? 'Publicar' : 'Rascunho'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            A IA cria títulos SEO (até 55 caracteres) e descrições sem clichês automaticamente.
          </p>
        </div>

        {/* Card 3: SEO Quality Index */}
        <div className="bg-card/90 border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Índice SEO da Loja</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-emerald-500">{health?.seo_score_avg || 94}/100</h3>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Otimizado</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Auditoria contínua de palavras-chave, marca e especificações.
          </p>
        </div>

        {/* Card 4: Economia de Trabalho */}
        <div className="bg-card/90 border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempo Economizado</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-foreground">{health?.time_saved_hours || 0} <span className="text-sm font-normal text-muted-foreground">horas</span></h3>
            <span className="text-xs font-bold text-indigo-500">100% Autônomo</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Cálculo baseado em tempo humano médio (15 min/anúncio completo).
          </p>
        </div>
      </div>
    </div>
  );
}
