'use client';

import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, Clock, RefreshCw, Sparkles, Box, ShieldAlert } from 'lucide-react';

interface ActionItem {
  id: string;
  action_type: string;
  title: string;
  description?: string;
  status: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface AgentActivityFeedProps {
  actions: ActionItem[];
  loading: boolean;
  onRefresh: () => void;
}

export function AgentActivityFeed({ actions, loading, onRefresh }: AgentActivityFeedProps) {
  const getStatusStyle = (status: string) => {
    if (status === 'IN_PROGRESS') {
      return { icon: <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />, bg: 'bg-purple-500/10 border-purple-500/30' };
    }
    if (status === 'WARNING') {
      return { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, bg: 'bg-amber-500/10 border-amber-500/30' };
    }
    if (status === 'ERROR') {
      return { icon: <ShieldAlert className="w-4 h-4 text-red-500" />, bg: 'bg-red-500/10 border-red-500/30' };
    }
    return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-500/10 border-emerald-500/30' };
  };

  const getActionTypeBadge = (type: string) => {
    switch (type) {
      case 'SEO_GENERATION':
      case 'AD_CREATED':
        return { label: 'IA SEO & Criação', class: 'bg-purple-500/10 text-purple-500' };
      case 'CATALOG_CHECK':
        return { label: 'Diagnóstico Catálogo', class: 'bg-blue-500/10 text-blue-500' };
      case 'REPORT_GENERATED':
        return { label: 'Relatório Emitido', class: 'bg-emerald-500/10 text-emerald-500' };
      case 'CONFIG_UPDATED':
        return { label: 'Configuração', class: 'bg-amber-500/10 text-amber-500' };
      default:
        return { label: type, class: 'bg-muted text-muted-foreground' };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return 'Agora mesmo';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `Há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card/90 border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Feed Ao Vivo de Notificações</h2>
            <p className="text-xs text-muted-foreground">
              Transparência 100% ("Sempre avisando deixando informado"): acompanhe cada decisão e ação da IA em tempo real.
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar Feed'}
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/60 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Activity className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-foreground">O Feed de Ações está vazio</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            À medida que o Agente AI realizar checagens diárias, gerar relatórios ou criar seus anúncios no Mercado Livre, o registro ao vivo aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((act) => {
            const statusStyle = getStatusStyle(act.status);
            const badge = getActionTypeBadge(act.action_type);

            return (
              <div
                key={act.id}
                className="p-4 rounded-2xl border border-border/60 bg-background/60 hover:bg-card hover:border-border transition-all flex items-start gap-4"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${statusStyle.bg}`}>
                  {statusStyle.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground truncate">{act.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(act.created_at)}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  {act.metadata?.created_products && Array.isArray(act.metadata.created_products) && act.metadata.created_products.length > 0 && (
                    <div className="mt-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase">
                        <Box className="w-3.5 h-3.5" /> Anúncios Gerados e Salvos ({act.metadata.created_products.length}):
                      </span>
                      <ul className="space-y-1.5 text-xs pl-1">
                        {act.metadata.created_products.map((cp: any, idx: number) => (
                          <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
                            <div>
                              <span className="font-bold text-foreground block sm:inline">{cp.title || cp.product_name}</span>
                              {cp.product_name && cp.title && cp.product_name !== cp.title && (
                                <span className="text-muted-foreground text-[11px] sm:ml-1.5">({cp.product_name})</span>
                              )}
                            </div>
                            <span className="self-start sm:self-center text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {cp.status || 'Criado'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {act.metadata?.failed_products && Array.isArray(act.metadata.failed_products) && act.metadata.failed_products.length > 0 && (
                    <div className="mt-2.5 bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-2">
                      <span className="text-[11px] font-black text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" /> Erros ou Itens Não Criados ({act.metadata.failed_products.length}):
                      </span>
                      <ul className="space-y-1.5 text-xs pl-1">
                        {act.metadata.failed_products.map((fp: any, idx: number) => (
                          <li key={idx} className="flex flex-col border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
                            <span className="font-bold text-foreground">{fp.product_name || fp.title || 'Produto'}</span>
                            <span className="text-[11px] text-red-500 dark:text-red-400 font-medium">{fp.error || 'Erro na geração'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
